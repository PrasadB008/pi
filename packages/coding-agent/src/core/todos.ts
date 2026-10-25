import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper-cased (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker. */
	text: string;
}

const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".turbo",
	".cache",
	"target",
	"vendor",
]);

const MAX_FILE_SIZE = 512 * 1024;
const MAX_FILES = 20000;
const TODO_PATTERN = /\b(TODO|FIXME)\b(?:\([^)]*\))?[:\s-]*(.*)$/;

/**
 * Scan a directory tree for TODO and FIXME comments.
 * Skips common dependency/build directories, large files and binary files.
 */
export function findTodos(root: string): TodoItem[] {
	const items: TodoItem[] = [];
	let fileCount = 0;

	const walk = (dir: string): void => {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (fileCount >= MAX_FILES) return;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
			} else if (entry.isFile()) {
				fileCount++;
				scanFile(full);
			}
		}
	};

	const scanFile = (full: string): void => {
		let content: string;
		try {
			if (statSync(full).size > MAX_FILE_SIZE) return;
			content = readFileSync(full, "utf-8");
		} catch {
			return;
		}
		if (content.includes("\0")) return;
		const file = relative(root, full).split("\\").join("/");
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (match) {
				items.push({ file, line: i + 1, tag: match[1], text: match[2].trim() });
			}
		}
	};

	walk(root);
	return items;
}

/** Format TODO items as Markdown grouped by file. */
export function formatTodos(items: TodoItem[]): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const sections: string[] = [`${items.length} outstanding item${items.length === 1 ? "" : "s"}`];
	for (const [file, list] of byFile) {
		const rows = list.map((i) => `- \`${i.line}\` **${i.tag}** ${i.text}`.trimEnd());
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	return sections.join("\n\n");
}
