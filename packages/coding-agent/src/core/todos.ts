import { execFile } from "node:child_process";

export const MAX_TODO_MATCHES = 200;

export interface TodoMatch {
	file: string;
	line: number;
	marker: "TODO" | "FIXME";
	text: string;
}

export interface TodoScanResult {
	matches: TodoMatch[];
	/** True when more than MAX_TODO_MATCHES comments exist and the list was cut. */
	truncated: boolean;
}

const MARKER_PATTERN = "\\b(TODO|FIXME)\\b";
const LINE_PATTERN = /^(.+?):(\d+):(.*)$/;
const MARKER_REGEX = /\b(TODO|FIXME)\b/;

/** Parse `git grep -n` output ("path:line:text") into matches. */
export function parseTodoOutput(output: string): TodoMatch[] {
	const matches: TodoMatch[] = [];
	for (const raw of output.split("\n")) {
		const parsed = LINE_PATTERN.exec(raw);
		if (!parsed) continue;
		const marker = MARKER_REGEX.exec(parsed[3]);
		if (!marker) continue;
		matches.push({
			file: parsed[1],
			line: Number.parseInt(parsed[2], 10),
			marker: marker[1] as TodoMatch["marker"],
			text: parsed[3].trim(),
		});
	}
	return matches;
}

/**
 * Find TODO and FIXME comments in tracked and untracked (but not git-ignored) files under cwd.
 * Throws if cwd is not inside a git repository or git is unavailable.
 */
export function findTodos(cwd: string): Promise<TodoScanResult> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["grep", "-n", "-I", "-E", "--untracked", "--exclude-standard", "-e", MARKER_PATTERN],
			{ cwd, maxBuffer: 64 * 1024 * 1024 },
			(error, stdout, stderr) => {
				if (error) {
					// git grep exits with 1 when nothing matched.
					if ((error as NodeJS.ErrnoException & { code?: number | string }).code === 1) {
						resolve({ matches: [], truncated: false });
						return;
					}
					const detail = stderr.trim() || error.message;
					reject(new Error(detail));
					return;
				}
				const all = parseTodoOutput(stdout);
				resolve({ matches: all.slice(0, MAX_TODO_MATCHES), truncated: all.length > MAX_TODO_MATCHES });
			},
		);
	});
}

/** Format matches grouped by file, one "line: text" row per match. */
export function formatTodos(result: TodoScanResult): string {
	if (result.matches.length === 0) return "No TODO or FIXME comments found.";

	const byFile = new Map<string, TodoMatch[]>();
	for (const match of result.matches) {
		const list = byFile.get(match.file);
		if (list) list.push(match);
		else byFile.set(match.file, [match]);
	}

	const lines: string[] = [];
	for (const [file, matches] of byFile) {
		lines.push(file);
		for (const match of matches) {
			lines.push(`  ${match.line}: ${match.text}`);
		}
	}
	const count = result.matches.length;
	const summary = result.truncated
		? `Showing the first ${MAX_TODO_MATCHES} matches; more exist.`
		: `${count} ${count === 1 ? "match" : "matches"} in ${byFile.size} ${byFile.size === 1 ? "file" : "files"}.`;
	lines.push("", summary);
	return lines.join("\n");
}
