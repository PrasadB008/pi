import type { Dirent } from "node:fs";
import { open, readdir } from "node:fs/promises";
import * as path from "node:path";

export interface TodoItem {
	/** Path relative to the scanned root, using forward slashes. */
	file: string;
	/** 1-based line number. */
	line: number;
	tag: "TODO" | "FIXME";
	/** The trimmed source line containing the tag. */
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** True when scanning stopped because the item cap was reached. */
	truncated: boolean;
}

export const TODO_SKIPPED_DIRECTORIES: ReadonlySet<string> = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	"coverage",
]);
export const TODO_MAX_FILE_BYTES = 1024 * 1024;
export const TODO_MAX_ITEMS = 500;
const TODO_MAX_TEXT_LENGTH = 200;
const BINARY_SNIFF_BYTES = 8000;
const TODO_PATTERN = /\b(TODO|FIXME)\b/;

async function readTextFile(filePath: string): Promise<string | undefined> {
	const handle = await open(filePath, "r");
	try {
		const stats = await handle.stat();
		if (!stats.isFile() || stats.size > TODO_MAX_FILE_BYTES) return undefined;
		const buffer = await handle.readFile();
		if (buffer.subarray(0, BINARY_SNIFF_BYTES).includes(0)) return undefined;
		return buffer.toString("utf8");
	} finally {
		await handle.close();
	}
}

/**
 * Scan a directory tree for whole-word TODO and FIXME comments.
 * Skips common generated directories, symlinks, binary files and files over 1 MB.
 * Results are ordered by path, then line, and capped at `maxItems`.
 */
export async function scanTodos(root: string, maxItems: number = TODO_MAX_ITEMS): Promise<TodoScanResult> {
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = async (directory: string): Promise<void> => {
		let entries: Dirent[];
		try {
			entries = await readdir(directory, { withFileTypes: true });
		} catch {
			return;
		}
		entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

		for (const entry of entries) {
			if (truncated) return;
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!TODO_SKIPPED_DIRECTORIES.has(entry.name)) await walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;

			let content: string | undefined;
			try {
				content = await readTextFile(fullPath);
			} catch {
				continue;
			}
			if (content === undefined) continue;

			const relative = path.relative(root, fullPath).split(path.sep).join("/");
			const lines = content.split(/\r?\n/);
			for (let index = 0; index < lines.length; index++) {
				const match = TODO_PATTERN.exec(lines[index]);
				if (!match) continue;
				if (items.length >= maxItems) {
					truncated = true;
					return;
				}
				items.push({
					file: relative,
					line: index + 1,
					tag: match[1] as TodoItem["tag"],
					text: lines[index].trim().slice(0, TODO_MAX_TEXT_LENGTH),
				});
			}
		}
	};

	await walk(root);
	return { items, truncated };
}

/** Format scan results as Markdown grouped by file. */
export function formatTodos(result: TodoScanResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";

	const sections: string[] = [];
	let currentFile: string | undefined;
	let current: string[] = [];
	const flush = () => {
		if (currentFile !== undefined) sections.push(`**${currentFile}**\n${current.join("\n")}`);
	};
	for (const item of result.items) {
		if (item.file !== currentFile) {
			flush();
			currentFile = item.file;
			current = [];
		}
		current.push(`- line ${item.line}: ${item.text}`);
	}
	flush();

	const fileCount = new Set(result.items.map((item) => item.file)).size;
	const summary = `${result.items.length}${result.truncated ? "+" : ""} outstanding in ${fileCount} file${fileCount === 1 ? "" : "s"}`;
	const footer = result.truncated ? `\n\nShowing the first ${result.items.length} items; more were found.` : "";
	return `${summary}\n\n${sections.join("\n\n")}${footer}`;
}
