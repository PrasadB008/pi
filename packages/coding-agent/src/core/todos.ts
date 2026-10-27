import { execFile } from "node:child_process";

export interface TodoItem {
	file: string;
	line: number;
	tag: "TODO" | "FIXME";
	text: string;
}

const TODO_PATTERN = /\b(TODO|FIXME)\b(?:\([^)]*\))?:?\s*(.*)$/;
const MAX_BUFFER = 32 * 1024 * 1024;

/** Parse `git grep -n` output ("file:line:content") into todo items. */
export function parseTodoLines(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const raw of output.split("\n")) {
		const match = /^(.+?):(\d+):(.*)$/.exec(raw);
		if (!match) continue;
		const found = TODO_PATTERN.exec(match[3]);
		if (!found) continue;
		items.push({
			file: match[1],
			line: Number(match[2]),
			tag: found[1] as TodoItem["tag"],
			text: found[2].replace(/\s*(\*\/|-->)\s*$/, "").trim(),
		});
	}
	return items;
}

/** Plain-text report grouped by file, with line numbers and counts. */
export function formatTodos(items: TodoItem[]): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file) ?? [];
		list.push(item);
		byFile.set(item.file, list);
	}
	const lines = [`${items.length} outstanding in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`];
	for (const [file, list] of byFile) {
		lines.push("", `${file} (${list.length})`);
		for (const item of list) {
			lines.push(`  ${item.line}: ${item.tag}${item.text ? ` ${item.text}` : ""}`);
		}
	}
	return lines.join("\n");
}

/**
 * Find TODO/FIXME comments under cwd using git grep, which skips ignored and
 * binary files. Rejects when cwd is not inside a git repository.
 */
export function findTodos(cwd: string): Promise<TodoItem[]> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["grep", "-n", "-I", "-E", "--untracked", "--exclude-standard", "-e", "\\b(TODO|FIXME)\\b", "--", "."],
			{ cwd, maxBuffer: MAX_BUFFER },
			(error, stdout) => {
				if (error) {
					// git grep exits 1 when nothing matched.
					if ((error as NodeJS.ErrnoException & { code?: number | string }).code === 1) {
						resolve([]);
						return;
					}
					reject(new Error("Could not scan for TODOs: not a git repository or git is unavailable."));
					return;
				}
				resolve(parseTodoLines(stdout));
			},
		);
	});
}
