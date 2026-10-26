/**
 * Find outstanding TODO/FIXME comments in a project, for the /todos slash command.
 */

import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { execCommand } from "./exec.ts";

export interface TodoItem {
	file: string;
	line: number;
	text: string;
}

const TODO_PATTERN = /\b(TODO|FIXME)\b/;
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_LINE_LENGTH = 200;

/**
 * Scan tracked and untracked (but not gitignored) files under cwd for TODO and FIXME markers.
 * Binary files and files larger than 1 MB are skipped. Returns null when cwd is not a git repository.
 */
export async function findTodos(cwd: string): Promise<TodoItem[] | null> {
	const listing = await execCommand("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], cwd, {
		timeout: 10000,
	});
	if (listing.code !== 0) return null;

	const files = [...new Set(listing.stdout.split("\0").filter((file) => file.length > 0))].sort();
	const items: TodoItem[] = [];

	for (const file of files) {
		const fullPath = join(cwd, file);
		try {
			const info = await stat(fullPath);
			if (!info.isFile() || info.size > MAX_FILE_SIZE) continue;
			const content = await readFile(fullPath, "utf-8");
			if (content.includes("\0")) continue;
			const lines = content.split(/\r?\n/);
			for (let i = 0; i < lines.length; i++) {
				if (TODO_PATTERN.test(lines[i])) {
					items.push({ file, line: i + 1, text: lines[i].trim().slice(0, MAX_LINE_LENGTH) });
				}
			}
		} catch {
			// Unreadable or removed file (e.g. deleted but still listed): skip it.
		}
	}

	return items;
}

/** Format TODO items as Markdown, grouped by file with line numbers. */
export function formatTodosMarkdown(items: TodoItem[]): string {
	if (items.length === 0) return "No outstanding TODO or FIXME comments found.";

	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const group = byFile.get(item.file);
		if (group) group.push(item);
		else byFile.set(item.file, [item]);
	}

	const sections: string[] = [`${items.length} outstanding in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`];
	for (const [file, group] of byFile) {
		const rows = group.map((item) => `- \`${item.line}\`: ${item.text.replace(/`/g, "'")}`);
		sections.push(`**${file}**\n${rows.join("\n")}`);
	}
	return sections.join("\n\n");
}
