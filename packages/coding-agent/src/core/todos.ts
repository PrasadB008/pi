import { execCommand } from "./exec.ts";

export interface TodoItem {
	file: string;
	line: number;
	tag: string;
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	error?: string;
}

const TODO_TAG_PATTERN = /\b(TODO|FIXME)\b/;
const MAX_LINE_LENGTH = 200;
const SCAN_TIMEOUT_MS = 15000;

/** Parse `git grep -n` output ("path:line:text") into todo items. */
export function parseTodoLines(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const raw of output.split("\n")) {
		const match = /^(.+?):(\d+):(.*)$/.exec(raw);
		if (!match) continue;
		const tag = TODO_TAG_PATTERN.exec(match[3]);
		if (!tag) continue;
		let text = match[3].trim();
		if (text.length > MAX_LINE_LENGTH) text = `${text.slice(0, MAX_LINE_LENGTH)}...`;
		items.push({ file: match[1], line: Number(match[2]), tag: tag[1], text });
	}
	return items;
}

/**
 * Find TODO and FIXME comments in the working tree of a git repository.
 * Uses `git grep`, so ignored and binary files are skipped; untracked files are included.
 */
export async function findTodos(cwd: string): Promise<TodoScanResult> {
	const result = await execCommand(
		"git",
		["grep", "-n", "-I", "-w", "--untracked", "-E", "TODO|FIXME", "--", "."],
		cwd,
		{ timeout: SCAN_TIMEOUT_MS },
	);
	if (result.killed) return { items: [], error: "Timed out while scanning for TODOs." };
	// git grep exits 1 when nothing matches; other non-zero codes are failures (e.g. not a git repository).
	if (result.code !== 0 && result.code !== 1) {
		const reason = result.stderr.trim().split("\n")[0] || "git grep failed";
		return { items: [], error: `Could not scan for TODOs: ${reason}` };
	}
	return { items: parseTodoLines(result.stdout) };
}

/** Render todo items as markdown grouped by file. */
export function formatTodosMarkdown(items: TodoItem[]): string {
	if (items.length === 0) return "No TODO or FIXME comments found.";
	const byFile = new Map<string, TodoItem[]>();
	for (const item of items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const sections: string[] = [`${items.length} outstanding in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`];
	for (const [file, list] of byFile) {
		const lines = list.map((item) => `- \`${item.line}\` ${item.text.replace(/`/g, "'")}`);
		sections.push(`**${file}**\n${lines.join("\n")}`);
	}
	return sections.join("\n\n");
}
