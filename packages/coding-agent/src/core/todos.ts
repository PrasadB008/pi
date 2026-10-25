import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker that matched, upper-cased (TODO, FIXME, HACK or XXX). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface FindTodosOptions {
	/** Stop scanning after this many items. Default 500. */
	maxItems?: number;
	/** Skip files larger than this many bytes. Default 1 MB. */
	maxFileSize?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]);

// A marker only counts inside a comment: after //, #, /*, *, <!-- or --.
const TODO_PATTERN = /(?:\/\/|#|\/\*|\*|<!--|--)\s*(TODO|FIXME|HACK|XXX)\b[:(\s-]*(.*)$/i;

function looksBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 1024).includes(0);
}

/** Extract TODO items from file content. Exported for tests. */
export function parseTodos(content: string, file: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const match = TODO_PATTERN.exec(lines[i]);
		if (!match) continue;
		const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
		items.push({ file, line: i + 1, tag: match[1].toUpperCase(), text });
	}
	return items;
}

/** Walk `root` and collect TODO-style comments, in path order. */
export function findTodos(root: string, options: FindTodosOptions = {}): TodoItem[] {
	const maxItems = options.maxItems ?? 500;
	const maxFileSize = options.maxFileSize ?? 1024 * 1024;
	const items: TodoItem[] = [];

	const walk = (dir: string): void => {
		if (items.length >= maxItems) return;
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
		for (const entry of entries) {
			if (items.length >= maxItems) return;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
				continue;
			}
			if (!entry.isFile()) continue;
			try {
				if (fs.statSync(full).size > maxFileSize) continue;
				const buffer = fs.readFileSync(full);
				if (looksBinary(buffer)) continue;
				const rel = path.relative(root, full).split(path.sep).join("/");
				for (const item of parseTodos(buffer.toString("utf-8"), rel)) {
					if (items.length >= maxItems) break;
					items.push(item);
				}
			} catch {
				// Unreadable file: skip.
			}
		}
	};

	walk(root);
	return items;
}

/** Format items as Markdown grouped by file. */
export function formatTodos(items: TodoItem[], truncated: boolean): string {
	if (items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let current: string | undefined;
	for (const item of items) {
		if (item.file !== current) {
			if (current !== undefined) lines.push("");
			lines.push(`**${item.file}**`);
			current = item.file;
		}
		lines.push(`- L${item.line} ${item.tag}${item.text ? `: ${item.text}` : ""}`);
	}
	if (truncated) lines.push("", `Showing the first ${items.length} items.`);
	return lines.join("\n");
}
