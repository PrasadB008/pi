import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, e.g. TODO or FIXME. */
	tag: string;
	/** Text following the marker. */
	text: string;
}

export interface FindTodosOptions {
	/** Maximum number of items to return. Default 500. */
	maxItems?: number;
	/** Files larger than this many bytes are skipped. Default 1 MB. */
	maxFileSize?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]);
const TODO_PATTERN = /\b(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/;

function isBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 8000).includes(0);
}

/** Scan a directory tree for TODO and FIXME comments. Results are sorted by file, then line. */
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
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (items.length >= maxItems) return;
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			let content: Buffer;
			try {
				if (fs.statSync(fullPath).size > maxFileSize) continue;
				content = fs.readFileSync(fullPath);
			} catch {
				continue;
			}
			if (isBinary(content)) continue;
			const relative = path.relative(root, fullPath).split(path.sep).join("/");
			const lines = content.toString("utf-8").split(/\r?\n/);
			for (let i = 0; i < lines.length && items.length < maxItems; i++) {
				const match = TODO_PATTERN.exec(lines[i]);
				if (match) items.push({ file: relative, line: i + 1, tag: match[1], text: match[2].trim() });
			}
		}
	};

	walk(root);
	return items;
}

/** Format items as Markdown grouped by file. */
export function formatTodos(items: TodoItem[], limit?: number): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((i) => `- \`${i.line}\` **${i.tag}** ${i.text}`.trimEnd());
		sections.push(`### ${file}\n\n${rows.join("\n")}`);
	}
	const suffix = limit !== undefined && items.length >= limit ? `\n\nShowing the first ${limit} matches.` : "";
	return `${items.length} outstanding item${items.length === 1 ? "" : "s"}\n\n${sections.join("\n\n")}${suffix}`;
}
