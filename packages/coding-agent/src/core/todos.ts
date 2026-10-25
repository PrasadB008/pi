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

export interface FindTodosResult {
	items: TodoItem[];
	/** True when scanning stopped at maxResults. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxResults?: number;
	maxFileSize?: number;
}

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const DEFAULT_MAX_RESULTS = 200;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;

// Matches TODO as a whole word inside a line comment or block comment start.
const TODO_PATTERN = /(?:\/\/|\/\*|#|--|<!--|^\s*\*)[^\n]*?\bTODO\b(?:\([^)]*\))?[:\s-]*(.*)$/;

export function parseTodoLine(line: string): string | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	return match[1].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
}

/** Scan text files under root for TODO comments. Skips VCS, dependency and build directories. */
export async function findTodos(root: string, options: FindTodosOptions = {}): Promise<FindTodosResult> {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const items: TodoItem[] = [];
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		let entries = await readdir(dir, { withFileTypes: true }).catch(() => undefined);
		if (!entries) return;
		entries = entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!SKIP_DIRS.has(entry.name)) await walk(full);
				continue;
			}
			if (!entry.isFile()) continue;
			const info = await stat(full).catch(() => undefined);
			if (!info || info.size > maxFileSize) continue;
			const content = await readFile(full, "utf8").catch(() => undefined);
			if (content === undefined || content.includes("\0")) continue;
			const lines = content.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const text = parseTodoLine(lines[i]);
				if (text === undefined) continue;
				if (items.length >= maxResults) {
					truncated = true;
					return;
				}
				items.push({ file: relative(root, full).split("\\").join("/"), line: i + 1, text });
			}
		}
	}

	await walk(root);
	return { items, truncated };
}

export function formatTodos(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines = result.items.map((item) => `- \`${item.file}:${item.line}\` ${item.text}`.trimEnd());
	if (result.truncated) lines.push("", `Showing the first ${result.items.length} results.`);
	return lines.join("\n");
}
