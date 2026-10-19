import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker that matched, e.g. "TODO" or "FIXME". */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface TodoScanOptions {
	/** Maximum number of items to return. Default 500. */
	maxItems?: number;
	/** Files larger than this many bytes are skipped. Default 1 MB. */
	maxFileSize?: number;
}

const IGNORED_DIRS = new Set([
	".git",
	"node_modules",
	"dist",
	"build",
	"coverage",
	".next",
	".turbo",
	".cache",
	"target",
	"vendor",
]);

// A marker counts only when it follows a comment opener, so strings such as
// `const label = "TODO"` and identifiers such as `todoList` are not reported.
const TODO_PATTERN = /(?:\/\/|\/\*+|#|--|<!--|^\s*\*)\s*(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/;

function isBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 8000).includes(0);
}

/** Scan files under root for TODO and FIXME comments. */
export function scanTodos(root: string, options: TodoScanOptions = {}): TodoScanResult {
	const maxItems = options.maxItems ?? 500;
	const maxFileSize = options.maxFileSize ?? 1024 * 1024;
	const items: TodoItem[] = [];
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
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			if (!scanFile(fullPath)) return;
		}
	};

	// Returns false once the item limit is reached.
	const scanFile = (filePath: string): boolean => {
		let buffer: Buffer;
		try {
			if (fs.statSync(filePath).size > maxFileSize) return true;
			buffer = fs.readFileSync(filePath);
		} catch {
			return true;
		}
		if (isBinary(buffer)) return true;

		const relative = path.relative(root, filePath).split(path.sep).join("/");
		const lines = buffer.toString("utf-8").split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return false;
			}
			items.push({ file: relative, line: i + 1, tag: match[1], text: match[2].replace(/\s*\*\/\s*$/, "").trim() });
		}
		return true;
	};

	walk(root);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
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
		const rows = list.map((item) => `- L${item.line} ${item.tag}${item.text ? `: ${item.text}` : ""}`);
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}

	const count = result.items.length;
	const summary = result.truncated
		? `Showing the first ${count} items (limit reached).`
		: `${count} item${count === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}.`;
	return `${sections.join("\n\n")}\n\n${summary}`;
}
