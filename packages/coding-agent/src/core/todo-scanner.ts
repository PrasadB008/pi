import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found (TODO, FIXME, HACK or XXX). */
	tag: string;
	/** Text after the marker. */
	text: string;
}

export interface ScanTodosOptions {
	/** Maximum number of items to collect. Default 500. */
	limit?: number;
	/** Files larger than this many bytes are skipped. Default 1 MB. */
	maxFileSize?: number;
}

const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"coverage",
	".next",
	".cache",
	".venv",
	"target",
]);

// Marker must follow a comment opener so plain strings like "TODO list" are not matched.
const TODO_PATTERN = /(?:\/\/|\/\*|#|--|<!--|^\s*\*)\s*(TODO|FIXME|HACK|XXX)\b[:(]?\s*(.*)$/;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(\*\/|-->)\s*$/, "").trim();
	return { tag: match[1], text };
}

/** Scan a directory tree for TODO-style comments. */
export async function scanTodos(root: string, options: ScanTodosOptions = {}): Promise<TodoItem[]> {
	const limit = options.limit ?? 500;
	const maxFileSize = options.maxFileSize ?? 1024 * 1024;
	const items: TodoItem[] = [];

	async function walk(dir: string): Promise<void> {
		if (items.length >= limit) return;
		let entries;
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (items.length >= limit) return;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) await walk(full);
			} else if (entry.isFile()) {
				await scanFile(full);
			}
		}
	}

	async function scanFile(path: string): Promise<void> {
		try {
			const info = await stat(path);
			if (info.size > maxFileSize) return;
			const buffer = await readFile(path);
			if (buffer.includes(0)) return;
			const lines = buffer.toString("utf8").split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const parsed = parseTodoLine(lines[i]);
				if (!parsed) continue;
				items.push({
					file: relative(root, path).split("\\").join("/"),
					line: i + 1,
					tag: parsed.tag,
					text: parsed.text,
				});
				if (items.length >= limit) return;
			}
		} catch {
			// Unreadable file: skip.
		}
	}

	await walk(root);
	return items;
}

/** Format scan results as plain text grouped by file. */
export function formatTodos(items: TodoItem[], limit = 500): string {
	if (items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(item.file);
			currentFile = item.file;
		}
		lines.push(`  ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
	}
	const header = `${items.length} TODO comment${items.length === 1 ? "" : "s"}${items.length >= limit ? " (limit reached)" : ""}`;
	return `${header}\n\n${lines.join("\n")}`;
}
