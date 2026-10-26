import { type Dirent, promises as fs } from "node:fs";
import * as path from "node:path";

export type TodoTag = "TODO" | "FIXME";

export interface TodoItem {
	/** Path relative to the scan root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	tag: TodoTag;
	/** Text after the tag, trimmed. May be empty. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when a scan limit (items or files) stopped the search early. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxItems?: number;
	maxFiles?: number;
	maxFileBytes?: number;
}

const SKIPPED_DIRECTORIES = new Set([
	".git",
	".hg",
	".svn",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".cache",
	"target",
	"vendor",
]);

// A tag only counts when it directly follows a comment token, so prose such as "list all todos" is ignored.
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--)\s*(TODO|FIXME)\b[:(\s-]*(.*)$/;

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILES = 20000;
const DEFAULT_MAX_FILE_BYTES = 512 * 1024;

export function parseTodoLine(line: string): { tag: TodoTag; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const tag = match[1] as TodoTag;
	const text = (match[2] ?? "").replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag, text };
}

/** Scan a directory tree for TODO and FIXME comments. Skips dot-directories, build output and binary files. */
export async function findTodos(root: string, options: FindTodosOptions = {}): Promise<FindTodosResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const items: TodoItem[] = [];
	let filesSeen = 0;
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
				await walk(fullPath);
			} else if (entry.isFile()) {
				if (filesSeen >= maxFiles) {
					truncated = true;
					return;
				}
				filesSeen++;
				await scanFile(fullPath);
			}
		}
	}

	async function scanFile(fullPath: string): Promise<void> {
		let content: string;
		try {
			const stat = await fs.stat(fullPath);
			if (stat.size > maxFileBytes) return;
			content = await fs.readFile(fullPath, "utf8");
		} catch {
			return;
		}
		if (content.includes("\0")) return;
		const relative = path.relative(root, fullPath).split(path.sep).join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTodoLine(lines[i] ?? "");
			if (!parsed) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			items.push({ file: relative, line: i + 1, ...parsed });
		}
	}

	await walk(root);
	return { items, truncated };
}
