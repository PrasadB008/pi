/**
 * Scan a repository for outstanding TODO and FIXME comments.
 *
 * Uses `git grep` so that .gitignore is respected and untracked (but not ignored) files are included.
 */

import { execCommand } from "./exec.ts";

export const MAX_TODO_MATCHES = 200;
const MAX_TODO_TEXT_LENGTH = 160;
const TODO_TIMEOUT_MS = 15000;

export interface TodoMatch {
	file: string;
	line: number;
	text: string;
}

export interface TodoScanResult {
	/** Matches, capped at MAX_TODO_MATCHES, in git grep order (sorted by path, then line). */
	matches: TodoMatch[];
	/** Number of matches found before the cap was applied. */
	total: number;
}

/**
 * Parse `git grep -n` output ("path:line:text" per line).
 */
export function parseTodoOutput(stdout: string): TodoMatch[] {
	const matches: TodoMatch[] = [];
	for (const rawLine of stdout.split("\n")) {
		const parsed = /^(.+?):(\d+):(.*)$/.exec(rawLine);
		if (!parsed) continue;
		let text = parsed[3].trim();
		if (text.length > MAX_TODO_TEXT_LENGTH) {
			text = `${text.slice(0, MAX_TODO_TEXT_LENGTH - 3)}...`;
		}
		matches.push({ file: parsed[1], line: Number(parsed[2]), text });
	}
	return matches;
}

/**
 * Find TODO and FIXME markers in tracked and untracked, non-ignored files under cwd.
 * Throws if cwd is not inside a git repository or git is unavailable.
 */
export async function findTodos(cwd: string, signal?: AbortSignal): Promise<TodoScanResult> {
	const result = await execCommand(
		"git",
		["grep", "-n", "-I", "-E", "--untracked", "--exclude-standard", "-e", "\\b(TODO|FIXME)\\b"],
		cwd,
		{ signal, timeout: TODO_TIMEOUT_MS },
	);
	if (result.killed) {
		throw new Error("Timed out while scanning for TODOs");
	}
	// git grep exits with 1 when nothing matched
	if (result.code !== 0 && result.code !== 1) {
		throw new Error(result.stderr.trim() || "git grep failed (is this a git repository?)");
	}
	const all = parseTodoOutput(result.stdout);
	return { matches: all.slice(0, MAX_TODO_MATCHES), total: all.length };
}

/**
 * Format a scan result as plain text grouped by file.
 */
export function formatTodos(result: TodoScanResult): string {
	if (result.total === 0) {
		return "No TODO or FIXME comments found.";
	}
	const lines: string[] = [];
	let currentFile: string | undefined;
	for (const match of result.matches) {
		if (match.file !== currentFile) {
			if (currentFile !== undefined) lines.push("");
			lines.push(match.file);
			currentFile = match.file;
		}
		lines.push(`  ${match.line}: ${match.text}`);
	}
	lines.push("");
	if (result.total > result.matches.length) {
		lines.push(`Showing first ${result.matches.length} of ${result.total} matches.`);
	} else {
		lines.push(`${result.total} ${result.total === 1 ? "match" : "matches"}.`);
	}
	return lines.join("\n");
}
