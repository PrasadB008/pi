import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TodoItem {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker that matched, e.g. TODO or FIXME. */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Maximum number of items to return. Default 500. */
	maxItems?: number;
	/** Files larger than this many bytes are skipped. Default 1 MiB. */
	maxFileBytes?: number;
}

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const SKIPPED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".venv"]);

// Marker must be a whole word inside a comment-like context: after //, #, /*, *, --, ; or <!--.
const TODO_PATTERN = /(?:\/\/|\/\*|#|--|;|<!--|^\s*\*)\s*.*?\b(TODO|FIXME)\b[\s:(-]*(.*)$/;

/** Extract a TODO item from a single line, or undefined if the line has none. */
export function matchTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag: match[1], text };
}

async function listWithGit(cwd: string): Promise<string[] | undefined> {
	try {
		const { stdout } = await execFileAsync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
			cwd,
			maxBuffer: 64 * 1024 * 1024,
		});
		return stdout.split("\0").filter((entry) => entry.length > 0);
	} catch {
		return undefined;
	}
}

async function listWithWalk(root: string): Promise<string[]> {
	const files: string[] = [];
	const visit = async (dir: string): Promise<void> => {
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRS.has(entry.name)) await visit(join(dir, entry.name));
			} else if (entry.isFile()) {
				files.push(relative(root, join(dir, entry.name)));
			}
		}
	};
	await visit(root);
	return files;
}

/**
 * Find TODO and FIXME comments in the files under cwd. Uses `git ls-files` (respecting .gitignore)
 * when cwd is inside a git repository, otherwise walks the directory tree.
 */
export async function scanTodos(cwd: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const files = (await listWithGit(cwd)) ?? (await listWithWalk(cwd));
	const items: TodoItem[] = [];

	for (const file of files.map((f) => f.split("\\").join("/")).sort()) {
		const absolute = join(cwd, file);
		let content: string;
		try {
			const info = await stat(absolute);
			if (!info.isFile() || info.size > maxFileBytes) continue;
			content = await readFile(absolute, "utf8");
		} catch {
			continue;
		}
		if (content.includes("\0")) continue;

		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const found = matchTodoLine(lines[i]);
			if (!found) continue;
			if (items.length >= maxItems) return { items, truncated: true };
			items.push({ file, line: i + 1, tag: found.tag, text: found.text });
		}
	}
	return { items, truncated: false };
}

/** Render scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const group = byFile.get(item.file);
		if (group) group.push(item);
		else byFile.set(item.file, [item]);
	}
	const lines: string[] = [`${result.items.length}${result.truncated ? "+" : ""} TODO comment(s)`, ""];
	for (const [file, items] of byFile) {
		lines.push(`**${file}**`);
		for (const item of items) {
			lines.push(`- ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
		}
		lines.push("");
	}
	if (result.truncated) lines.push("Results truncated.");
	return lines.join("\n").trimEnd();
}
