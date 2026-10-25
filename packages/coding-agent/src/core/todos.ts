import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper-cased (TODO, FIXME, ...). */
	tag: string;
	/** Text following the marker. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxItems?: number;
	maxFileSize?: number;
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
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;

const TODO_PATTERN = /\b(TODO|FIXME)\b[:(]?\s*(.*)$/;
const COMMENT_PATTERN = /(\/\/|\/\*|^\s*\*|#|--|<!--|;)/;

/** Parse a single line; returns the TODO marker and text when it appears inside a comment. */
export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const before = line.slice(0, match.index);
	if (!COMMENT_PATTERN.test(before)) return undefined;
	const text = match[2]
		.replace(/^\)\s*:?\s*/, "")
		.replace(/\s*(\*\/|-->)\s*$/, "")
		.trim();
	return { tag: match[1], text };
}

/** Recursively scan a directory for TODO/FIXME comments in text files. */
export function findTodos(root: string, options: FindTodosOptions = {}): FindTodosResult {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			let content: string;
			try {
				if (fs.statSync(fullPath).size > maxFileSize) continue;
				content = fs.readFileSync(fullPath, "utf-8");
			} catch {
				continue;
			}
			if (content.includes("\0")) continue;
			const lines = content.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const parsed = parseTodoLine(lines[i]);
				if (!parsed) continue;
				if (items.length >= maxItems) {
					truncated = true;
					return;
				}
				items.push({
					file: path.relative(root, fullPath).split(path.sep).join("/"),
					line: i + 1,
					tag: parsed.tag,
					text: parsed.text,
				});
			}
		}
	};

	walk(root);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`);
			currentFile = item.file;
		}
		lines.push(`- ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
	}
	if (result.truncated) {
		lines.push("", `Showing the first ${result.items.length} matches.`);
	}
	return lines.join("\n");
}
