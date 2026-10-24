import { type Dirent, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper case (TODO or FIXME). */
	tag: string;
	/** Text after the marker. */
	text: string;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_BYTES = 512 * 1024;
const DEFAULT_MAX_ITEMS = 200;
const TODO_PATTERN = /\b(TODO|FIXME)\b:?\s*(.*)$/;

/**
 * Scan a directory tree for TODO and FIXME markers inside comments.
 * Skips common build/vendor directories, large files and binary files.
 * Stops after maxItems matches.
 */
export function findTodos(root: string, maxItems = DEFAULT_MAX_ITEMS): TodoItem[] {
	const items: TodoItem[] = [];

	const walk = (dir: string): void => {
		if (items.length >= maxItems) return;
		let entries: Dirent[];
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (items.length >= maxItems) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
			} else if (entry.isFile()) {
				scanFile(fullPath);
			}
		}
	};

	const scanFile = (path: string): void => {
		let content: string;
		try {
			if (statSync(path).size > MAX_FILE_BYTES) return;
			content = readFileSync(path, "utf-8");
		} catch {
			return;
		}
		if (content.includes("\0")) return;
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length && items.length < maxItems; i++) {
			const line = lines[i];
			const commentStart = findCommentStart(line);
			if (commentStart === -1) continue;
			const match = TODO_PATTERN.exec(line.slice(commentStart));
			if (!match) continue;
			items.push({
				file: relative(root, path).split("\\").join("/"),
				line: i + 1,
				tag: match[1],
				text: match[2].replace(/\*\/\s*$/, "").trim(),
			});
		}
	};

	walk(root);
	return items;
}

/** Index of the first comment marker (//, #, /*, *, --, <!--) in a line, or -1. */
function findCommentStart(line: string): number {
	const match = /(\/\/|\/\*|<!--|(?:^|\s)#|^\s*\*|(?:^|\s)--\s)/.exec(line);
	return match ? match.index : -1;
}

/** Format todo items as Markdown grouped by file. */
export function formatTodos(items: TodoItem[], maxItems = DEFAULT_MAX_ITEMS): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- L${item.line} **${item.tag}** ${item.text}`.trimEnd());
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	const summary = `${items.length} item${items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`;
	const truncated = items.length >= maxItems ? ` (limited to the first ${maxItems})` : "";
	return `${summary}${truncated}\n\n${sections.join("\n\n")}`;
}
