import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface TodoItem {
	line: number;
	tag: "TODO" | "FIXME";
	text: string;
}

export interface TodoFileResult {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	items: TodoItem[];
}

export interface TodoScanResult {
	files: TodoFileResult[];
	totalItems: number;
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileSize?: number;
}

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;
const BINARY_SNIFF_BYTES = 8000;

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);

/** A TODO/FIXME tag counts only when a comment marker appears before it on the same line. */
const TODO_PATTERN = /(?:\/\/|\/\*|^\s*\*|#|--|<!--|;)[^\n]*?\b(TODO|FIXME)\b[:(]?\s*(.*)$/;

/** Extract TODO/FIXME items from file content. */
export function findTodosInText(content: string): TodoItem[] {
	const items: TodoItem[] = [];
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const match = TODO_PATTERN.exec(lines[i]);
		if (!match) continue;
		const text = match[2].replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
		items.push({ line: i + 1, tag: match[1] as TodoItem["tag"], text });
	}
	return items;
}

/** Scan a directory tree for TODO and FIXME comments, grouped by file. */
export async function scanTodos(root: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const files: TodoFileResult[] = [];
	let totalItems = 0;
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = await readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRECTORIES.has(entry.name)) await walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			let content: string;
			try {
				const info = await stat(fullPath);
				if (info.size > maxFileSize) continue;
				const buffer = await readFile(fullPath);
				if (buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0)) continue;
				content = buffer.toString("utf8");
			} catch {
				continue;
			}
			const items = findTodosInText(content);
			if (items.length === 0) continue;
			const remaining = maxItems - totalItems;
			if (remaining <= 0) {
				truncated = true;
				return;
			}
			const kept = items.slice(0, remaining);
			files.push({ file: relative(root, fullPath).split("\\").join("/"), items: kept });
			totalItems += kept.length;
			if (kept.length < items.length) truncated = true;
		}
	}

	await walk(root);
	return { files, totalItems, truncated };
}

/** Render scan results as Markdown grouped by file. */
export function formatTodosMarkdown(result: TodoScanResult): string {
	if (result.files.length === 0) return "No TODO or FIXME comments found.";
	const sections = result.files.map((file) => {
		const lines = file.items.map((item) => `- \`${file.file}:${item.line}\` **${item.tag}** ${item.text}`.trimEnd());
		return `**${file.file}**\n\n${lines.join("\n")}`;
	});
	const summary = `${result.totalItems} item${result.totalItems === 1 ? "" : "s"} in ${result.files.length} file${result.files.length === 1 ? "" : "s"}`;
	const note = result.truncated ? "\n\nResults truncated; showing the first matches only." : "";
	return `${summary}\n\n${sections.join("\n\n")}${note}`;
}
