import { execFile } from "node:child_process";

export interface TodoItem {
	file: string;
	line: number;
	kind: "TODO" | "FIXME";
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** Set when the scan could not run (for example, cwd is not a git repository). */
	error?: string;
}

const GIT_GREP_LINE = /^(.*?):(\d+):(.*)$/;
const MARKER = /\b(TODO|FIXME)\b/;

/** Parse `git grep -n` output ("path:line:text") into TODO items. */
export function parseTodoLines(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const rawLine of output.split("\n")) {
		const match = GIT_GREP_LINE.exec(rawLine);
		if (!match) continue;
		const marker = MARKER.exec(match[3]);
		if (!marker) continue;
		items.push({
			file: match[1],
			line: Number(match[2]),
			kind: marker[1] as TodoItem["kind"],
			text: match[3].trim(),
		});
	}
	return items;
}

/**
 * Find TODO and FIXME comments in tracked and untracked files under cwd.
 * Uses git grep so files ignored by .gitignore are skipped.
 */
export function scanTodos(cwd: string): Promise<TodoScanResult> {
	return new Promise((resolve) => {
		execFile(
			"git",
			["grep", "-n", "-I", "-w", "--untracked", "--exclude-standard", "-e", "TODO", "-e", "FIXME"],
			{ cwd, maxBuffer: 16 * 1024 * 1024 },
			(error, stdout, stderr) => {
				if (error) {
					// git grep exits with 1 when nothing matches.
					if ((error as NodeJS.ErrnoException & { code?: number | string }).code === 1) {
						resolve({ items: [] });
						return;
					}
					const message = stderr.trim() || error.message;
					resolve({ items: [], error: `Could not scan for TODOs: ${message}` });
					return;
				}
				resolve({ items: parseTodoLines(stdout) });
			},
		);
	});
}

/** Group items by file, preserving first-seen file order. */
export function groupTodosByFile(items: TodoItem[]): Map<string, TodoItem[]> {
	const groups = new Map<string, TodoItem[]>();
	for (const item of items) {
		const group = groups.get(item.file);
		if (group) group.push(item);
		else groups.set(item.file, [item]);
	}
	return groups;
}
