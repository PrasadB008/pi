import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found in the comment, upper-cased (TODO or FIXME). */
	tag: string;
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because maxResults was reached. */
	truncated: boolean;
}

export interface ScanTodosOptions {
	maxResults?: number;
	maxFileBytes?: number;
}

const DEFAULT_MAX_RESULTS = 200;
const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
const IGNORED_DIRS = new Set(["node_modules", "dist", "build", "coverage", "out", "target", "vendor"]);
// A TODO/FIXME marker that follows a comment opener (//, #, /*, *, <!--, --).
const TODO_PATTERN = /(?:\/\/|#|\/\*|^\s*\*|<!--|--)\s*(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/i;

function isBinary(buffer: Buffer): boolean {
	return buffer.includes(0);
}

/** Scan a directory tree for TODO and FIXME comments. Skips dot-directories and common build output. */
export function scanTodos(root: string, options: ScanTodosOptions = {}): TodoScanResult {
	const maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
	const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;
	const items: TodoItem[] = [];
	let truncated = false;

	const visit = (dir: string): void => {
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
				if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
				visit(fullPath);
			} else if (entry.isFile()) {
				scanFile(fullPath);
			}
		}
	};

	const scanFile = (filePath: string): void => {
		let buffer: Buffer;
		try {
			if (fs.statSync(filePath).size > maxFileBytes) return;
			buffer = fs.readFileSync(filePath);
		} catch {
			return;
		}
		if (isBinary(buffer)) return;
		const relative = path.relative(root, filePath).split(path.sep).join("/");
		const lines = buffer.toString("utf8").split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const match = TODO_PATTERN.exec(lines[i]);
			if (!match) continue;
			if (items.length >= maxResults) {
				truncated = true;
				return;
			}
			items.push({ file: relative, line: i + 1, tag: match[1].toUpperCase(), text: match[2].trim() });
		}
	};

	visit(root);
	return { items, truncated };
}

/** Format scan results as plain text grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	let currentFile = "";
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile) lines.push("");
			currentFile = item.file;
			lines.push(item.file);
		}
		const text = item.text ? ` ${item.text}` : "";
		lines.push(`  ${item.line}: ${item.tag}${text}`);
	}
	const count = result.items.length;
	const summary = result.truncated
		? `Showing first ${count} items (more exist).`
		: `${count} item${count === 1 ? "" : "s"}.`;
	lines.push("", summary);
	return lines.join("\n");
}
