import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found (TODO, FIXME, ...). */
	tag: string;
	/** Text after the marker, trimmed. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because maxItems was reached. */
	truncated: boolean;
}

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_BYTES = 512 * 1024;
const MAX_LINE_LENGTH = 500;
// Marker must follow a comment opener (//, #, /*, *, --, <!--, ;) so prose and identifiers are not matched.
const TODO_PATTERN = /(?:\/\/|\/\*|\*|#|--|<!--|;)\s*(TODO|FIXME)\b[:(\s-]*(.*)$/;

export function parseTodoLine(line: string): { tag: string; text: string } | undefined {
	if (line.length > MAX_LINE_LENGTH) return undefined;
	const match = TODO_PATTERN.exec(line);
	if (!match) return undefined;
	const text = match[2].replace(/\*\/\s*$|-->\s*$/, "").trim();
	return { tag: match[1], text };
}

function looksBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 1024).includes(0);
}

/** Recursively scan a directory for TODO/FIXME comments. Skips VCS, dependency and build dirs. */
export function scanTodos(root: string, maxItems = 200): TodoScanResult {
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
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRS.has(entry.name)) walk(full);
			} else if (entry.isFile()) {
				scanFile(full);
			}
		}
	};

	const scanFile = (file: string): void => {
		let buffer: Buffer;
		try {
			if (fs.statSync(file).size > MAX_FILE_BYTES) return;
			buffer = fs.readFileSync(file);
		} catch {
			return;
		}
		if (looksBinary(buffer)) return;
		const lines = buffer.toString("utf-8").split(/\r?\n/);
		for (let i = 0; i < lines.length; i++) {
			const parsed = parseTodoLine(lines[i]);
			if (!parsed) continue;
			if (items.length >= maxItems) {
				truncated = true;
				return;
			}
			items.push({ file: path.relative(root, file).split(path.sep).join("/"), line: i + 1, ...parsed });
		}
	};

	walk(root);
	return { items, truncated };
}

export function formatTodoMarkdown(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO comments found.";
	const lines = result.items.map((i) => `- \`${i.file}:${i.line}\` **${i.tag}** ${i.text}`.trimEnd());
	if (result.truncated) lines.push("", `Showing the first ${result.items.length} matches.`);
	return lines.join("\n");
}
