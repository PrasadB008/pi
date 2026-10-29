import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";

export const MAX_TODO_ITEMS = 500;
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 200;
const TODO_PATTERN = /\b(TODO|FIXME)\b/;

const SKIPPED_DIRECTORIES = new Set([
	".git",
	".hg",
	".svn",
	"node_modules",
	"dist",
	"build",
	"out",
	"coverage",
	".next",
	".nuxt",
	".turbo",
	".cache",
	".venv",
	"venv",
	"__pycache__",
	"target",
	"vendor",
]);

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	/** Trimmed line text. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when more than MAX_TODO_ITEMS matches exist and the rest were dropped. */
	truncated: boolean;
}

class LimitReached extends Error {}

async function walk(root: string, directory: string, items: TodoItem[]): Promise<void> {
	const entries = await readdir(directory, { withFileTypes: true });
	entries.sort((a, b) => a.name.localeCompare(b.name));
	for (const entry of entries) {
		const fullPath = join(directory, entry.name);
		if (entry.isDirectory()) {
			if (!SKIPPED_DIRECTORIES.has(entry.name)) {
				await walk(root, fullPath, items);
			}
			continue;
		}
		if (!entry.isFile()) continue;
		await scanFile(root, fullPath, items);
	}
}

async function scanFile(root: string, filePath: string, items: TodoItem[]): Promise<void> {
	let content: string;
	try {
		const info = await stat(filePath);
		if (info.size > MAX_FILE_BYTES) return;
		content = await readFile(filePath, "utf8");
	} catch {
		return;
	}
	if (content.includes("\0")) return;

	const file = relative(root, filePath).split(sep).join("/");
	const lines = content.split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		if (!TODO_PATTERN.test(lines[i])) continue;
		if (items.length >= MAX_TODO_ITEMS) throw new LimitReached();
		const text = lines[i].trim();
		items.push({
			file,
			line: i + 1,
			text: text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}...` : text,
		});
	}
}

/**
 * Scan a directory tree for whole-word TODO and FIXME markers.
 * Skips common dependency and build directories, binary files and files over 1 MB.
 */
export async function scanTodos(root: string): Promise<TodoScanResult> {
	const items: TodoItem[] = [];
	try {
		await walk(root, root, items);
	} catch (error) {
		if (!(error instanceof LimitReached)) throw error;
		return { items, truncated: true };
	}
	return { items, truncated: false };
}

/** Format scan results as Markdown, grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";

	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(`**${item.file}**`);
			currentFile = item.file;
		}
		lines.push(`- line ${item.line}: ${item.text}`);
	}

	const fileCount = new Set(result.items.map((item) => item.file)).size;
	const summary = result.truncated
		? `Showing the first ${result.items.length} matches (limit reached).`
		: `${result.items.length} match${result.items.length === 1 ? "" : "es"} in ${fileCount} file${fileCount === 1 ? "" : "s"}.`;
	return `${summary}\n\n${lines.join("\n")}`;
}
