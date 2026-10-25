import { execFile } from "node:child_process";

export interface TodoItem {
	file: string;
	line: number;
	text: string;
}

const TODO_PATTERN = "\\b(TODO|FIXME)\\b";
const MAX_BUFFER = 16 * 1024 * 1024;

/**
 * Parse `git grep -n -z` output into todo items.
 * With -z, each record is `path\0line\0text`, records separated by newline.
 */
export function parseGitGrepOutput(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const record of output.split("\n")) {
		if (!record) continue;
		const first = record.indexOf("\0");
		const second = first === -1 ? -1 : record.indexOf("\0", first + 1);
		if (first === -1 || second === -1) continue;
		const line = Number.parseInt(record.slice(first + 1, second), 10);
		if (!Number.isFinite(line)) continue;
		items.push({ file: record.slice(0, first), line, text: record.slice(second + 1).trim() });
	}
	return items;
}

/**
 * Find TODO and FIXME comments under cwd. Uses `git grep --no-index --exclude-standard`, so it works
 * inside and outside git repositories, skips binary files, and respects .gitignore.
 */
export function findTodos(cwd: string): Promise<TodoItem[]> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["grep", "-n", "-z", "-I", "--no-index", "--exclude-standard", "-E", TODO_PATTERN],
			{ cwd, maxBuffer: MAX_BUFFER, encoding: "utf-8" },
			(error, stdout) => {
				if (error) {
					// git grep exits with 1 when nothing matched
					if ((error as NodeJS.ErrnoException & { code?: number | string }).code === 1) {
						resolve([]);
						return;
					}
					reject(error);
					return;
				}
				resolve(parseGitGrepOutput(stdout));
			},
		);
	});
}

/** Format todo items as markdown grouped by file, capped at maxItems. */
export function formatTodos(items: TodoItem[], maxItems = 200): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const shown = items.slice(0, maxItems);
	const byFile = new Map<string, TodoItem[]>();
	for (const item of shown) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const lines = [`${items.length} TODO/FIXME comment${items.length === 1 ? "" : "s"}`, "", "```"];
	for (const [file, list] of byFile) {
		lines.push(file);
		for (const item of list) lines.push(`  ${item.line}: ${item.text}`);
	}
	lines.push("```");
	if (items.length > shown.length) {
		lines.push("", `Showing the first ${shown.length} of ${items.length}.`);
	}
	return lines.join("\n");
}
