import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TodoItem {
	/** Path relative to the scanned directory, with forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Comment text after the TODO marker, trimmed. May be empty. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped at maxItems. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileBytes?: number;
}

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const SKIPPED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"]);
const TODO_PATTERN = /\bTODO\b(?:\([^)]*\))?\s*[:-]?\s*(.*)$/;

/** Extract a TODO from one line, or undefined. Matches only the uppercase marker. */
export function parseTodoLine(line: string): string | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	return match[1].replace(/\s*(\*\/|-->)\s*$/, "").trim();
}

async function listWithGit(cwd: string): Promise<string[] | undefined> {
	try {
		const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			maxBuffer: 64 * 1024 * 1024,
		});
		return stdout.split("\0").filter((file) => file.length > 0);
	} catch {
		return undefined;
	}
}

async function listWithWalk(cwd: string, dir = ""): Promise<string[]> {
	const files: string[] = [];
	let entries;
	try {
		entries = await readdir(path.join(cwd, dir), { withFileTypes: true });
	} catch {
		return files;
	}
	for (const entry of entries) {
		const rel = dir ? `${dir}/${entry.name}` : entry.name;
		if (entry.isDirectory()) {
			if (!SKIPPED_DIRS.has(entry.name)) files.push(...(await listWithWalk(cwd, rel)));
		} else if (entry.isFile()) {
			files.push(rel);
		}
	}
	return files;
}

/**
 * Find TODO comments under cwd. Uses git (tracked and untracked, ignoring
 * gitignored files) when cwd is in a git repository, otherwise walks the tree.
 * Binary and oversized files are skipped.
 */
export async function findTodos(cwd: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const files = ((await listWithGit(cwd)) ?? (await listWithWalk(cwd))).sort();
	const items: TodoItem[] = [];

	for (const file of files) {
		let content: string;
		try {
			const fullPath = path.join(cwd, file);
			const info = await stat(fullPath);
			if (!info.isFile() || info.size > maxFileBytes) continue;
			const buffer = await readFile(fullPath);
			if (buffer.includes(0)) continue;
			content = buffer.toString("utf-8");
		} catch {
			continue;
		}
		if (!content.includes("TODO")) continue;

		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const text = parseTodoLine(lines[i]);
			if (text === undefined) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({ file: file.split(path.sep).join("/"), line: i + 1, text });
		}
	}
	return { items, truncated: false };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const sections: string[] = [];
	for (const [file, items] of byFile) {
		const rows = items.map((item) => `- \`${item.line}\` ${item.text || "(no description)"}`);
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	const count = result.items.length;
	const summary = `${count}${result.truncated ? "+" : ""} TODO${count === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (showing first results only)" : ""}`;
	return `${summary}\n\n${sections.join("\n\n")}`;
}
