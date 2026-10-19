import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker that matched (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_LINE_LENGTH = 2000;
const TODO_PATTERN = /(?:\/\/|\/\*|#|--|;|<!--|\*)\s*(TODO|FIXME)\b[\s:(-]*(.*)$/;

/** Parse one line for a TODO/FIXME comment. Returns undefined when the line has none. */
export function matchTodoLine(line: string): { tag: string; text: string } | undefined {
	if (line.length > MAX_LINE_LENGTH) return undefined;
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
	return { tag: match[1], text };
}

function looksBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 8000).includes(0);
}

/** Recursively scan `root` for TODO/FIXME comments. Skips VCS, dependency and build directories. */
export function scanTodos(root: string, limit = 500): { items: TodoItem[]; truncated: boolean } {
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
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
				continue;
			}
			if (!entry.isFile()) continue;
			let buffer: Buffer;
			try {
				if (fs.statSync(full).size > MAX_FILE_BYTES) continue;
				buffer = fs.readFileSync(full);
			} catch {
				continue;
			}
			if (looksBinary(buffer)) continue;
			const lines = buffer.toString("utf-8").split("\n");
			for (let i = 0; i < lines.length; i++) {
				const found = matchTodoLine(lines[i]);
				if (!found) continue;
				if (items.length >= limit) {
					truncated = true;
					return;
				}
				items.push({
					file: path.relative(root, full).split(path.sep).join("/"),
					line: i + 1,
					tag: found.tag,
					text: found.text,
				});
			}
		}
	};

	walk(root);
	return { items, truncated };
}

/** Format scan results as plain text grouped by file. */
export function formatTodos(items: readonly TodoItem[], truncated: boolean): string {
	if (items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of items) {
		if (item.file !== currentFile) {
			currentFile = item.file;
			lines.push(item.file);
		}
		const text = item.text ? ` ${item.text}` : "";
		lines.push(`  ${item.line}: ${item.tag}${text}`);
	}
	lines.push("");
	lines.push(`${items.length} item${items.length === 1 ? "" : "s"}${truncated ? " (truncated)" : ""}`);
	return lines.join("\n");
}
