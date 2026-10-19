import { type Dirent, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoComment {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found (TODO, FIXME, ...), upper case. */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface ScanTodosOptions {
	/** Maximum number of results to return. Default 200. */
	limit?: number;
	/** Maximum file size in bytes to scan. Default 512 KiB. */
	maxFileSize?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache", "target"]);

// A marker must follow a comment opener so that identifiers or strings like "todoList" are not matched.
const TODO_PATTERN = /(?:\/\/|\/\*+|#|--|;|<!--|^\s*\*)\s*(TODO|FIXME)\b[:(\s-]*(.*)$/i;

function looksBinary(content: string): boolean {
	return content.includes("\u0000");
}

export function scanTodos(root: string, options: ScanTodosOptions = {}): TodoComment[] {
	const limit = options.limit ?? 200;
	const maxFileSize = options.maxFileSize ?? 512 * 1024;
	const results: TodoComment[] = [];

	const walk = (dir: string): void => {
		if (results.length >= limit) return;
		let entries: Dirent[];
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (results.length >= limit) return;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
			} else if (entry.isFile()) {
				scanFile(full);
			}
		}
	};

	const scanFile = (file: string): void => {
		let content: string;
		try {
			if (statSync(file).size > maxFileSize) return;
			content = readFileSync(file, "utf-8");
		} catch {
			return;
		}
		if (looksBinary(content)) return;
		const rel = relative(root, file).split("\\").join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			results.push({ file: rel, line: i + 1, tag: match[1].toUpperCase(), text: match[2].trim() });
			if (results.length >= limit) return;
		}
	};

	walk(root);
	return results;
}

export function formatTodos(todos: TodoComment[], limit = 200): string {
	if (todos.length === 0) return "No TODO comments found.";
	const lines = todos.map((t) => `${t.file}:${t.line}  ${t.tag}${t.text ? `: ${t.text}` : ""}`);
	const header = `${todos.length} TODO comment${todos.length === 1 ? "" : "s"}${todos.length >= limit ? ` (limit ${limit} reached)` : ""}`;
	return `${header}\n${lines.join("\n")}`;
}
