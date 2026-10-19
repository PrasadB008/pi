import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, e.g. TODO or FIXME. */
	tag: string;
	/** Comment text after the marker. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileBytes?: number;
}

const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"coverage",
	".next",
	".venv",
	"venv",
	"__pycache__",
	"target",
]);

const DEFAULT_MAX_ITEMS = 200;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

// Marker must follow a comment opener (//, #, /*, *, --, <!--, ;) so prose and identifiers do not match.
const TODO_PATTERN = /(?:\/\/|\/\*|<!--|#|--|;|^\s*\*)\s*(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/;

/** Extract a TODO item from one line, or undefined if the line has none. */
export function matchTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag: match[1], text };
}

/** Scan text files under root for TODO and FIXME comments. */
export async function scanTodos(root: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const items: TodoItem[] = [];
	let truncated = false;

	async function walk(dir: string, relDir: string): Promise<void> {
		let entries: Dirent[];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
			if (entry.isDirectory()) {
				if (IGNORED_DIRS.has(entry.name)) continue;
				await walk(join(dir, entry.name), rel);
			} else if (entry.isFile()) {
				let content: string;
				try {
					const buffer = await readFile(join(dir, entry.name));
					if (buffer.length > maxFileBytes || buffer.includes(0)) continue;
					content = buffer.toString("utf-8");
				} catch {
					continue;
				}
				const lines = content.split("\n");
				for (let i = 0; i < lines.length; i++) {
					const found = matchTodoLine(lines[i]);
					if (!found) continue;
					if (items.length >= maxItems) {
						truncated = true;
						return;
					}
					items.push({ file: rel, line: i + 1, ...found });
				}
			}
		}
	}

	await walk(root, "");
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`);
			currentFile = item.file;
		}
		const label = item.tag === "TODO" ? "" : `${item.tag}: `;
		lines.push(`- L${item.line}: ${label}${item.text || "(no description)"}`);
	}
	if (result.truncated) {
		lines.push("", `Showing the first ${result.items.length} items.`);
	}
	return lines.join("\n");
}
