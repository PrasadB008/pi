/**
 * Find outstanding TODO and FIXME comments in the current project.
 */

import { execCommand } from "./exec.ts";

/** Maximum number of matches returned. Extra matches are only counted. */
export const MAX_TODO_MATCHES = 200;

const TODO_PATTERN = "\\b(TODO|FIXME)\\b";
const GREP_LINE = /^(.+?):(\d+):(.*)$/;

export interface TodoMatch {
	file: string;
	line: number;
	text: string;
}

export interface TodoResult {
	matches: TodoMatch[];
	/** Total matches found, including the ones dropped by the cap. */
	total: number;
}

/** Parse `git grep -n` output ("path:line:text" per line). */
export function parseGitGrepOutput(output: string, limit: number = MAX_TODO_MATCHES): TodoResult {
	const matches: TodoMatch[] = [];
	let total = 0;
	for (const rawLine of output.split("\n")) {
		const parsed = GREP_LINE.exec(rawLine);
		if (!parsed) continue;
		total++;
		if (matches.length < limit) {
			matches.push({ file: parsed[1], line: Number(parsed[2]), text: parsed[3].trim() });
		}
	}
	return { matches, total };
}

/**
 * Search tracked files and new, non-ignored files for TODO and FIXME.
 * Throws when `cwd` is not inside a git repository.
 */
export async function findTodos(cwd: string, signal?: AbortSignal): Promise<TodoResult> {
	const result = await execCommand(
		"git",
		["grep", "-n", "-I", "--untracked", "-E", TODO_PATTERN, "--", "."],
		cwd,
		{ signal, timeout: 30000 },
	);
	// git grep exits with 1 when nothing matched.
	if (result.code === 1 && !result.stderr.trim()) return { matches: [], total: 0 };
	if (result.code !== 0) {
		throw new Error(result.stderr.trim() || "git grep failed (is this a git repository?)");
	}
	return parseGitGrepOutput(result.stdout);
}

/** Render matches as Markdown grouped by file, with line numbers. */
export function formatTodosMarkdown(result: TodoResult): string {
	if (result.total === 0) return "No TODO or FIXME comments found.";

	const byFile = new Map<string, TodoMatch[]>();
	for (const match of result.matches) {
		const list = byFile.get(match.file);
		if (list) list.push(match);
		else byFile.set(match.file, [match]);
	}

	const lines: string[] = [];
	for (const [file, matches] of byFile) {
		lines.push(`**${file}**`, "");
		for (const match of matches) lines.push(`- \`${match.line}\`: ${match.text.replace(/`/g, "'")}`);
		lines.push("");
	}

	const shown = result.matches.length;
	lines.push(
		result.total > shown
			? `Showing first ${shown} of ${result.total} matches.`
			: `${result.total} match${result.total === 1 ? "" : "es"}.`,
	);
	return lines.join("\n");
}
