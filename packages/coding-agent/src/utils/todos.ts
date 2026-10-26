import * as fs from "node:fs";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Marker found in the comment (TODO or FIXME). */
	tag: "TODO" | "FIXME";
	/** Text after the marker, trimmed. */
	text: string;
}

export interface ScanTodosResult {
	items: TodoItem[];
	/** True when scanning stopped early because maxItems was reached. */
	truncated: boolean;
}

export interface ScanTodosOptions {
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
	".turbo",
	".cache",
	"target",
	"vendor",
]);

const DEFAULT_MAX_ITEMS = 500;
const DEFAULT_MAX_FILE_SIZE = 512 * 1024;

// Marker must follow a comment opener (//, #, /*, *, --, <!--, ;) so prose and string literals are mostly ignored.
const TODO_PATTERN = /(?:\/\/|\/\*|^\s*\*|#|--|<!--|;)\s*(TODO|FIXME)\b(?:\([^)]*\))?[:\s-]*(.*)$/;

function looksBinary(buffer: Buffer): boolean {
	return buffer.subarray(0, 8000).includes(0);
}

/** Find TODO/FIXME comments under rootDir. Skips common build/vendor directories, large files and binaries. */
export function scanTodos(rootDir: string, options: ScanTodosOptions = {}): ScanTodosResult {
	const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS;
	const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
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
				if (!SKIPPED_DIRS.has(entry.name)) walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;

			let buffer: Buffer;
			try {
				if (fs.statSync(fullPath).size > maxFileSize) continue;
				buffer = fs.readFileSync(fullPath);
			} catch {
				continue;
			}
			if (looksBinary(buffer)) continue;

			const relative = path.relative(rootDir, fullPath).split(path.sep).join("/");
			const lines = buffer.toString("utf8").split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const match = TODO_PATTERN.exec(lines[i] ?? "");
				if (!match) continue;
				if (items.length >= maxItems) {
					truncated = true;
					return;
				}
				items.push({
					file: relative,
					line: i + 1,
					tag: match[1] as TodoItem["tag"],
					text: (match[2] ?? "").replace(/\*\/\s*$|-->\s*$/, "").trim(),
				});
			}
		}
	};

	walk(rootDir);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: ScanTodosResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";

	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}

	const parts: string[] = [];
	for (const [file, list] of byFile) {
		const lines = list.map((item) => `- L${item.line} **${item.tag}** ${item.text || "(no description)"}`);
		parts.push(`### ${file}\n\n${lines.join("\n")}`);
	}

	const summary = `${result.items.length} outstanding item${result.items.length === 1 ? "" : "s"} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}${result.truncated ? " (results truncated)" : ""}`;
	return `${summary}\n\n${parts.join("\n\n")}`;
}
