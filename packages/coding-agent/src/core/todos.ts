import { type Dirent, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	kind: "TODO" | "FIXME";
	/** Trimmed text of the line. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more matches existed than `maxItems`. */
	truncated: boolean;
}

export const MAX_TODO_ITEMS = 500;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_LINE_DISPLAY = 200;

const SKIPPED_DIRS = new Set([
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

const TODO_PATTERN = /\b(TODO|FIXME)\b/;

function isBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 8000).includes(0);
}

/**
 * Scan a directory tree for TODO and FIXME comments.
 * Skips common build/dependency directories, files over 1 MB and binary files.
 * Results are sorted by file path, then line number.
 */
export function findTodos(root: string, maxItems: number = MAX_TODO_ITEMS): TodoScanResult {
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = (dir: string): void => {
		if (truncated) return;
		let entries: Dirent[];
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!SKIPPED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			scanFile(fullPath);
		}
	};

	const scanFile = (fullPath: string): void => {
		let buffer: Buffer;
		try {
			if (statSync(fullPath).size > MAX_FILE_BYTES) return;
			buffer = readFileSync(fullPath);
		} catch {
			return;
		}
		if (isBinary(buffer)) return;
		const lines = buffer.toString("utf-8").split(/\r?\n/);
		const file = relative(root, fullPath).split("\\").join("/");
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			const trimmed = lines[i].trim();
			items.push({
				file,
				line: i + 1,
				kind: match[1] as TodoItem["kind"],
				text: trimmed.length > MAX_LINE_DISPLAY ? `${trimmed.slice(0, MAX_LINE_DISPLAY)}...` : trimmed,
			});
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
	const sections: string[] = [];
	for (const [file, list] of byFile) {
		const rows = list.map((item) => `- L${item.line}: \`${item.text.replaceAll("`", "'")}\``);
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	const summary = `${result.items.length} item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`;
	const note = result.truncated ? `\n\nShowing the first ${result.items.length} matches; more exist.` : "";
	return `${summary}\n\n${sections.join("\n\n")}${note}`;
}
