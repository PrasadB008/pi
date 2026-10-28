import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface TodoItem {
	tag: "TODO" | "FIXME";
	line: number;
	text: string;
}

export interface TodoFileResult {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	items: TodoItem[];
}

export interface ScanTodosOptions {
	/** Maximum file size to read, in bytes. Default: 1 MB. */
	maxFileSize?: number;
}

const SKIPPED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "out", "coverage", ".next", ".cache"]);
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;
const BINARY_SNIFF_BYTES = 8000;

// A comment marker directly followed by TODO or FIXME, optionally with an
// owner tag such as FIXME(bob). Plain prose like "a todo list" does not match.
const TODO_PATTERN = /(?:\/\/|\/\*+|^\s*\*|#|<!--|--|;)\s*(TODO|FIXME)\b(?:\([^)]*\))?[:\s-]*(.*)$/;

/** Returns the TODO/FIXME comment on one line, or undefined. */
export function matchTodoLine(line: string, lineNumber: number): TodoItem | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
	return { tag: match[1] as TodoItem["tag"], line: lineNumber, text };
}

/** Finds TODO/FIXME items in file content. */
export function findTodosInContent(content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const item = matchTodoLine(lines[i], i + 1);
		if (item) items.push(item);
	}
	return items;
}

function walk(root: string, dir: string, maxFileSize: number, results: TodoFileResult[]): void {
	let names: string[];
	try {
		names = readdirSync(dir).sort();
	} catch {
		return;
	}
	for (const name of names) {
		const fullPath = join(dir, name);
		let stats: ReturnType<typeof statSync>;
		try {
			// statSync follows symlinks; broken links throw and are skipped.
			stats = statSync(fullPath);
		} catch {
			continue;
		}
		if (stats.isDirectory()) {
			if (!SKIPPED_DIRECTORIES.has(name)) walk(root, fullPath, maxFileSize, results);
			continue;
		}
		if (!stats.isFile() || stats.size > maxFileSize) continue;
		let buffer: Buffer;
		try {
			buffer = readFileSync(fullPath);
		} catch {
			continue;
		}
		if (buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0)) continue;
		const items = findTodosInContent(buffer.toString("utf-8"));
		if (items.length > 0) {
			results.push({
				file: fullPath
					.slice(root.length + 1)
					.split("\\")
					.join("/"),
				items,
			});
		}
	}
}

/**
 * Scans a directory tree for TODO and FIXME comments.
 * Skips .git, node_modules and common build directories, binary files and
 * files over the size limit. Does not read .gitignore. Results are ordered by path.
 */
export function scanTodos(root: string, options: ScanTodosOptions = {}): TodoFileResult[] {
	const results: TodoFileResult[] = [];
	walk(root, root, options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE, results);
	return results;
}

/** Formats scan results as plain text, grouped by file with line numbers. */
export function formatTodoResults(results: TodoFileResult[]): string {
	if (results.length === 0) return "No TODO or FIXME comments found.";
	const total = results.reduce((sum, file) => sum + file.items.length, 0);
	const blocks = results.map((file) => {
		const rows = file.items.map((item) => `  ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
		return `${file.file}\n${rows.join("\n")}`;
	});
	const header = `${total} ${total === 1 ? "item" : "items"} in ${results.length} ${results.length === 1 ? "file" : "files"}`;
	return `${header}\n\n${blocks.join("\n\n")}`;
}
