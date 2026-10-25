import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found, upper case (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems or maxFiles was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFiles?: number;
	maxFileSize?: number;
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
	"__pycache__",
]);

// Marker must follow a comment opener (//, #, /*, *, --, <!--, ;) so prose and identifiers such as "todos" do not match.
const TODO_PATTERN = /(?:\/\/|\/\*|#|--|<!--|;|^\s*\*)\s*(TODO|FIXME)\b(?:\([^)]*\))?[:\s]*(.*)$/;

/** Parse a single line; returns undefined when it holds no TODO comment. */
export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag: match[1].toUpperCase(), text };
}

/** Scan the files under root for TODO and FIXME comments. */
export function scanTodos(root: string, options: TodoScanOptions = {}): TodoScanResult {
	const maxItems = options.maxItems ?? 500;
	const maxFiles = options.maxFiles ?? 20000;
	const maxFileSize = options.maxFileSize ?? 1024 * 1024;
	const items: TodoItem[] = [];
	let filesSeen = 0;
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
				continue;
			}
			if (!entry.isFile()) continue;
			if (++filesSeen > maxFiles) {
				truncated = true;
				return;
			}
			let content: string;
			try {
				if (fs.statSync(full).size > maxFileSize) continue;
				content = fs.readFileSync(full, "utf-8");
			} catch {
				continue;
			}
			if (content.includes("\0")) continue;
			const lines = content.split("\n");
			for (let i = 0; i < lines.length; i++) {
				const parsed = parseTodoLine(lines[i]);
				if (!parsed) continue;
				if (items.length >= maxItems) {
					truncated = true;
					return;
				}
				items.push({
					file: path.relative(root, full).split(path.sep).join("/"),
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

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const parts: string[] = [];
	for (const [file, list] of byFile) {
		parts.push(`**${file}**`);
		for (const item of list) {
			parts.push(`- L${item.line} ${item.tag}${item.text ? `: ${item.text}` : ""}`);
		}
		parts.push("");
	}
	const summary = `${result.items.length} item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (truncated)" : ""}`;
	return `${summary}\n\n${parts.join("\n")}`.trimEnd();
}
