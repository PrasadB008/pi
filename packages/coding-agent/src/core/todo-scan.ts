import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface TodoComment {
	/** Path relative to the scanned directory, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	tag: "TODO" | "FIXME";
	text: string;
}

export interface TodoScanResult {
	items: TodoComment[];
	/** True when scanning stopped because maxResults was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxResults?: number;
	maxFileSize?: number;
}

const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", "dist", "build", "coverage", ".next", ".cache"]);
const DEFAULT_MAX_RESULTS = 200;
const DEFAULT_MAX_FILE_SIZE = 512 * 1024;
const TODO_PATTERN = /\b(TODO|FIXME)\b[:(]?\s*(.*)$/;

/**
 * Scan a directory tree for TODO and FIXME comments. Skips dependency and build
 * directories, binary files (containing NUL bytes) and files above maxFileSize.
 */
export async function scanTodoComments(rootDir: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const items: TodoComment[] = [];
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRECTORIES.has(entry.name)) await walk(fullPath);
			} else if (entry.isFile()) {
				await scanFile(fullPath);
			}
		}
	}

	async function scanFile(path: string): Promise<void> {
		let content: string;
		try {
			if ((await stat(path)).size > maxFileSize) return;
			content = await readFile(path, "utf-8");
		} catch {
			return;
		}
		if (content.includes("\0")) return;
		const file = relative(rootDir, path).split("\\").join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			if (items.length >= maxResults) {
				truncated = true;
				return;
			}
			items.push({ file, line: i + 1, tag: match[1] as TodoComment["tag"], text: match[2].trim() });
		}
	}

	await walk(rootDir);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodoComments(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`);
			currentFile = item.file;
		}
		lines.push(`- ${item.line}: ${item.tag} ${item.text}`.trimEnd());
	}
	if (result.truncated) lines.push("", `Showing the first ${result.items.length} results.`);
	return lines.join("\n");
}
