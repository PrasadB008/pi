import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

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
	/** True when scanning stopped because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	maxItems?: number;
	maxFileSize?: number;
}

const SKIPPED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".venv",
	"venv",
	"__pycache__",
	"target",
]);

const DEFAULT_MAX_ITEMS = 200;
const DEFAULT_MAX_FILE_SIZE = 1024 * 1024;

/** Matches a marker that appears after a comment opener: //, #, /*, *, --, <!--, ;. */
const TODO_PATTERN = /(?:\/\/|\/\*|<!--|#|--|;|^\s*\*)\s*(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/i;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\s*(\*\/|-->)\s*$/, "").trim();
	return { tag: match[1].toUpperCase(), text };
}

/** Scan files under root for TODO and FIXME comments. Results are sorted by file, then line. */
export function scanTodos(root: string, options: TodoScanOptions = {}): TodoScanResult {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let names: string[];
		try {
			names = readdirSync(dir).sort();
		} catch {
			return;
		}
		for (const name of names) {
			if (truncated) return;
			const full = join(dir, name);
			let stats: ReturnType<typeof statSync>;
			try {
				stats = statSync(full);
			} catch {
				continue;
			}
			if (stats.isDirectory()) {
				if (!SKIPPED_DIRS.has(name)) walk(full);
				continue;
			}
			if (!stats.isFile() || stats.size > maxFileSize) continue;
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
				items.push({ file: relative(root, full).split("\\").join("/"), line: i + 1, ...parsed });
			}
		}
	};

	walk(root);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`, "");
			currentFile = item.file;
		}
		const text = item.text ? ` ${item.text}` : "";
		lines.push(`- ${item.line}: ${item.tag}${text}`);
	}
	const count = result.items.length;
	lines.push(
		"",
		`${count}${result.truncated ? "+" : ""} item${count === 1 ? "" : "s"}${result.truncated ? " (truncated)" : ""}`,
	);
	return lines.join("\n");
}
