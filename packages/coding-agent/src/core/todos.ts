import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper-cased (TODO, FIXME, HACK, XXX). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface FindTodosResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface FindTodosOptions {
	maxItems?: number;
	maxFileBytes?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "out", "coverage", ".next", ".cache"]);
const DEFAULT_MAX_ITEMS = 200;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

// Marker must follow a comment opener so prose and string literals mentioning "todo" are skipped.
const TODO_PATTERN = /(?:\/\/|\/\*+|#|--|<!--|;|^\s*\*)\s*(TODO|FIXME|HACK|XXX)\b[:(\s-]*(.*)$/i;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag: match[1].toUpperCase(), text };
}

/** Scan text files under root for TODO-style comments. Skips VCS/build dirs, binary and large files. */
export function findTodos(root: string, options: FindTodosOptions = {}): FindTodosResult {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries: string[];
		try {
			entries = readdirSync(dir).sort();
		} catch {
			return;
		}
		for (const name of entries) {
			if (truncated) return;
			const full = join(dir, name);
			let stats: ReturnType<typeof statSync>;
			try {
				stats = statSync(full);
			} catch {
				continue;
			}
			if (stats.isDirectory()) {
				if (!IGNORED_DIRS.has(name)) walk(full);
				continue;
			}
			if (!stats.isFile() || stats.size > maxFileBytes) continue;
			let content: string;
			try {
				content = readFileSync(full, "utf-8");
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
					file: relative(root, full).split("\\").join("/"),
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

export function formatTodos(result: FindTodosResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines = result.items.map((item) => {
		const text = item.text ? ` ${item.text}` : "";
		return `- \`${item.file}:${item.line}\` **${item.tag}**${text}`;
	});
	if (result.truncated) lines.push("", `Showing the first ${result.items.length} results.`);
	return lines.join("\n");
}
