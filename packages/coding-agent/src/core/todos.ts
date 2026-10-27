import { execCommand } from "./exec.ts";

export interface TodoItem {
	file: string;
	line: number;
	kind: "TODO" | "FIXME";
	text: string;
}

export interface TodoScanResult {
	items: TodoItem[];
	/** Total number of matches found, before applying the limit. */
	total: number;
	/** Set when the scan could not run (for example, not a git repository). */
	error?: string;
}

export const DEFAULT_TODO_LIMIT = 200;

const TODO_MARKER = /\b(TODO|FIXME)\b[:\s-]*(.*)$/;

/**
 * Parse `git grep -n` output ("path:line:text") into todo items.
 */
export function parseTodoGrepOutput(output: string): TodoItem[] {
	const items: TodoItem[] = [];
	for (const rawLine of output.split("\n")) {
		const match = /^(.+?):(\d+):(.*)$/.exec(rawLine);
		if (!match) continue;
		const marker = TODO_MARKER.exec(match[3]);
		if (!marker) continue;
		items.push({
			file: match[1],
			line: Number(match[2]),
			kind: marker[1] as TodoItem["kind"],
			text: marker[2].trim(),
		});
	}
	return items;
}

/**
 * Find TODO and FIXME comments in tracked and untracked (non-ignored) files under cwd.
 */
export async function findTodos(cwd: string, limit: number = DEFAULT_TODO_LIMIT): Promise<TodoScanResult> {
	const result = await execCommand(
		"git",
		["grep", "-n", "-I", "--untracked", "-w", "-e", "TODO", "-e", "FIXME"],
		cwd,
		{ timeout: 15000 },
	);
	// git grep exits with 1 when nothing matches.
	if (result.code === 1 && !result.stderr.trim()) {
		return { items: [], total: 0 };
	}
	if (result.code !== 0) {
		const message = result.killed ? "git grep timed out" : result.stderr.trim() || "git grep failed";
		return { items: [], total: 0, error: message };
	}
	const all = parseTodoGrepOutput(result.stdout);
	return { items: all.slice(0, limit), total: all.length };
}

/**
 * Format todo items grouped by file, in plain text.
 */
export function formatTodos(result: TodoScanResult): string {
	if (result.error) {
		return `Could not scan for TODOs: ${result.error}`;
	}
	if (result.total === 0) {
		return "No TODO or FIXME comments found.";
	}
	const byFile = new Map<string, TodoItem[]>();
	for (const item of result.items) {
		const list = byFile.get(item.file);
		if (list) list.push(item);
		else byFile.set(item.file, [item]);
	}
	const lines: string[] = [`TODOs (${result.total} in ${byFile.size} file${byFile.size === 1 ? "" : "s"} shown)`, ""];
	for (const [file, items] of byFile) {
		lines.push(file);
		for (const item of items) {
			const label = item.kind === "FIXME" ? "FIXME " : "";
			lines.push(`  ${item.line}: ${label}${item.text || "(no description)"}`);
		}
		lines.push("");
	}
	if (result.total > result.items.length) {
		lines.push(`Showing first ${result.items.length} of ${result.total} matches.`);
	}
	return lines.join("\n").trimEnd();
}
