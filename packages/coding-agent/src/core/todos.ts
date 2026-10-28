import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface TodoItem {
	/** Path relative to the searched root, using forward slashes. */
	file: string;
	line: number;
	tag: "TODO" | "FIXME";
	text: string;
}

export interface TodoSearchResult {
	items: TodoItem[];
	/** True when the item cap was hit and further matches were not collected. */
	truncated: boolean;
}

const IGNORED_DIRECTORIES = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo"]);
const MAX_FILE_SIZE_BYTES = 1024 * 1024;
export const MAX_TODO_ITEMS = 200;

// Matches TODO/FIXME only inside a comment (after //, #, /*, *, --, or <!--).
const TODO_PATTERN = /(?:\/\/|\/\*|^\s*\*|#|--|<!--)\s*.*?\b(TODO|FIXME)\b:?\s*(.*)$/;

/** Find TODO and FIXME comments under `root`, in stable path order, capped at `limit` items. */
export async function findTodos(root: string, limit: number = MAX_TODO_ITEMS): Promise<TodoSearchResult> {
	const items: TodoItem[] = [];
	let truncated = false;

	const walk = async (directory: string): Promise<void> => {
		const entries = await readdir(directory, { withFileTypes: true });
		entries.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (truncated) return;
			const fullPath = join(directory, entry.name);
			if (entry.isDirectory()) {
				if (!IGNORED_DIRECTORIES.has(entry.name)) await walk(fullPath);
				continue;
			}
			if (!entry.isFile()) continue;
			const info = await stat(fullPath);
			if (info.size > MAX_FILE_SIZE_BYTES) continue;
			const content = await readFile(fullPath, "utf8");
			// Skip binary files.
			if (content.includes("\0")) continue;
			const lines = content.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				const match = TODO_PATTERN.exec(lines[i]);
				if (!match) continue;
				if (items.length >= limit) {
					truncated = true;
					return;
				}
				items.push({
					file: relative(root, fullPath).split("\\").join("/"),
					line: i + 1,
					tag: match[1] as TodoItem["tag"],
					text: match[2].replace(/\*\/\s*$|-->\s*$/, "").trim(),
				});
			}
		}
	};

	await walk(root);
	return { items, truncated };
}

/** Format search results as plain text grouped by file. */
export function formatTodos(result: TodoSearchResult): string {
	if (result.items.length === 0) return "No TODO or FIXME comments found.";
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const item of result.items) {
		if (item.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(item.file);
			currentFile = item.file;
		}
		lines.push(`  ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
	}
	if (result.truncated) {
		lines.push("", `Showing the first ${result.items.length} matches; more were not listed.`);
	}
	return lines.join("\n");
}
