import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker: TODO or FIXME. */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Maximum number of items to return. Default 500. */
	maxItems?: number;
	/** Files larger than this many bytes are skipped. Default 1 MB. */
	maxFileBytes?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".venv", "target"]);

// Matches a TODO/FIXME marker that follows a comment opener (//, #, /*, *, --, <!--, ;, %).
// The marker must be upper-case; an optional "(owner)" and ":" may follow it.
const TODO_PATTERN = /(?:\/\/|\/\*+|\*|#|--|<!--|;|%)\s*(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/;

function isBinary(buffer: Buffer): boolean {
	const length = Math.min(buffer.length, 8000);
	for (let i = 0; i < length; i++) {
		if (buffer[i] === 0) return true;
	}
	return false;
}

/** Parse one line. Returns undefined when it has no TODO comment. */
export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
	return { tag: match[1], text };
}

/** Recursively scan `root` for TODO and FIXME comments. Skips VCS, dependency and build directories. */
export function scanTodos(root: string, options: TodoScanOptions = {}): TodoScanResult {
	const maxItems = options.maxItems ?? 500;
	const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			let buffer: Buffer;
			try {
				if (statSync(fullPath).size > maxFileBytes) continue;
				buffer = readFileSync(fullPath);
			} catch {
				continue;
			}
			if (isBinary(buffer)) continue;
			const lines = buffer.toString("utf-8").split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const parsed = parseTodoLine(lines[i]);
				if (!parsed) continue;
				if (items.length >= maxItems) {
					truncated = true;
					return;
				}
				items.push({ file: relative(root, fullPath).split("\\").join("/"), line: i + 1, ...parsed });
			}
		}
	};

	walk(root);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodosMarkdown(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`, "");
			currentFile = item.file;
		}
		const text = item.text ? ` ${item.text}` : "";
		lines.push(`- \`${item.line}\` ${item.tag}${text}`);
	}
	if (result.truncated) lines.push("", `Showing the first ${result.items.length} items.`);
	return lines.join("\n");
}
