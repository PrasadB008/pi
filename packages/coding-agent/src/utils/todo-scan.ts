import { execFile } from "node:child_process";
import { type Dirent, promises as fs } from "node:fs";
import path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned directory, with forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found (TODO, FIXME, ...). */
	tag: string;
	/** Text following the marker. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more than `maxItems` matches were found and the list was cut. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileBytes?: number;
}

const DEFAULT_MAX_ITEMS = 200;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".venv", "target"]);
// Marker must be inside a comment-like context: preceded by //, #, /*, *, --, ;, <!-- or %.
const TODO_RE = /(?:\/\/|#|\/\*|\*|--|;|<!--|%)\s*(TODO|FIXME)\b[:(]?\s*(.*)$/;

function execGit(cwd: string, args: string[]): Promise<string | undefined> {
	return new Promise((resolve) => {
		execFile("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (error, stdout) => {
			resolve(error ? undefined : stdout);
		});
	});
}

async function listFilesWithGit(cwd: string): Promise<string[] | undefined> {
	const output = await execGit(cwd, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
	if (output === undefined) return undefined;
	return output.split("\0").filter((entry) => entry.length > 0);
}

async function listFilesByWalking(root: string): Promise<string[]> {
	const files: string[] = [];
	async function walk(dir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) await walk(full);
			} else if (entry.isFile()) {
				files.push(path.relative(root, full));
			}
		}
	}
	await walk(root);
	return files;
}

/** Extract a TODO/FIXME marker from one line, or undefined when there is none. */
export function matchTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_RE.exec(line);
	if (!match) return undefined;
	return { tag: match[1], text: match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim() };
}

/** Find TODO and FIXME comments in the files of a directory, respecting .gitignore when inside a git repo. */
export async function scanTodos(cwd: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const files = (await listFilesWithGit(cwd)) ?? (await listFilesByWalking(cwd));
	const items: TodoItem[] = [];

	for (const relative of files.slice().sort()) {
		const segments = relative.split(/[\\/]/);
		if (segments.some((segment) => IGNORED_DIRS.has(segment))) continue;
		const full = path.join(cwd, relative);
		let content: string;
		try {
			const stat = await fs.stat(full);
			if (!stat.isFile() || stat.size > maxFileBytes) continue;
			content = await fs.readFile(full, "utf8");
		} catch {
			continue;
		}
		if (content.includes("\0")) continue;

		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const found = matchTodoLine(lines[i]);
			if (!found) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({ file: segments.join("/"), line: i + 1, tag: found.tag, text: found.text });
		}
	}
	return { items, truncated: false };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodoMarkdown(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- L${item.line} **${item.tag}**${item.text ? `: ${item.text}` : ""}`);
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	const footer = result.truncated ? `\n\nShowing the first ${result.items.length} matches.` : "";
	return `${sections.join("\n\n")}\n\n${result.items.length} item(s)${footer}`;
}
