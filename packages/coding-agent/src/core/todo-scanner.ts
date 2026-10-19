import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Text after the TODO marker, trimmed. May be empty. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because maxResults was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Stop after this many items. Default 500. */
	maxResults?: number;
	/** Skip files larger than this many bytes. Default 1 MiB. */
	maxFileSize?: number;
}

const IGNORED_DIRECTORIES = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".turbo",
	".cache",
]);

const DEFAULT_MAX_RESULTS = 500;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;

// A TODO marker directly after a comment opener: //, /*, *, #, --, <!--
// Optionally followed by "(owner)" and/or ":".
const TODO_PATTERN = /(?:\/\/|\/\*+|<!--|#|--|^\s*\*)\s*TODO\b(?:\([^)]*\))?:?\s*(.*)$/;

/** Returns the TODO text if the line contains a TODO comment, otherwise undefined. */
export function matchTodoLine(line: string): string | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	return match[1].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
}

/** Recursively scans text files under rootDir for TODO comments. Results are sorted by file, then line. */
export async function scanTodos(rootDir: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const items: TodoItem[] = [];
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
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

	async function scanFile(filePath: string): Promise<void> {
		let content: string;
		try {
			const info = await stat(filePath);
			if (info.size > maxFileSize) return;
			const buffer = await readFile(filePath);
			if (buffer.includes(0)) return;
			content = buffer.toString("utf8");
		} catch {
			return;
		}
		const file = relative(rootDir, filePath).split("\\").join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const text = matchTodoLine(lines[i]);
			if (text === undefined) continue;
			if (items.length >= maxResults) {
				truncated = true;
				return;
			}
			items.push({ file, line: i + 1, text });
		}
	}

	await walk(rootDir);
	return { items, truncated };
}

/** Formats scan results as plain text lines: "file:line  text". */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found";
	const lines = result.items.map((item) => `${item.file}:${item.line}${item.text ? `  ${item.text}` : ""}`);
	if (result.truncated) lines.push(`(showing first ${result.items.length}; more TODOs not shown)`);
	return lines.join("\n");
}
