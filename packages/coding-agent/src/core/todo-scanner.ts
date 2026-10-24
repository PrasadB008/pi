import { type Dirent, promises as fs } from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper-cased (TODO, FIXME, ...). */
	tag: string;
	/** Text following the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Stop after this many items. Default 500. */
	maxItems?: number;
	/** Skip files larger than this many bytes. Default 1 MB. */
	maxFileBytes?: number;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".cache"]);

// Marker must be a whole word, preceded by a comment-like context to avoid matching prose
// such as "todos" or a variable named `todo`. Only upper-case markers count.
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;|%)\s*(TODO|FIXME|XXX|HACK)\b[\s:(-]*(.*)$/;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = (match[2] ?? "").replace(/\s*(?:\*\/|-->)\s*$/, "").trim();
	return { tag: match[1], text };
}

/** Scan a directory tree for TODO-style comments. Skips VCS/build directories, binary and large files. */
export async function scanTodos(root: string, options: TodoScanOptions = {}): Promise<TodoScanResult> {
	const maxItems = options.maxItems ?? 500;
	const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
	const items: TodoItem[] = [];
	let truncated = false;

	async function walk(dir: string): Promise<void> {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = await fs.readdir(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) await walk(full);
			} else if (entry.isFile()) {
				await scanFile(full);
			}
		}
	}

	async function scanFile(file: string): Promise<void> {
		let content: string;
		try {
			const stat = await fs.stat(file);
			if (stat.size > maxFileBytes) return;
			const buffer = await fs.readFile(file);
			if (buffer.includes(0)) return;
			content = buffer.toString("utf-8");
		} catch {
			return;
		}
		const lines = content.split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTodoLine(lines[i]);
			if (!parsed) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			items.push({
				file: path.relative(root, file).split(path.sep).join("/"),
				line: i + 1,
				tag: parsed.tag,
				text: parsed.text,
			});
		}
	}

	await walk(root);
	return { items, truncated };
}

/** Format scan results as markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((i) => `- \`${i.line}\` **${i.tag}** ${i.text}`.trimEnd());
		sections.push(`### ${file}\n\n${rows.join("\n")}`);
	}
	const summary = `${result.items.length} item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (truncated)" : ""}`;
	return `${summary}\n\n${sections.join("\n\n")}`;
}
