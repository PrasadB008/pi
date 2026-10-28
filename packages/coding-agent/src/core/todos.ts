import { execFile } from "node:child_process";

export const MAX_TODO_MATCHES = 200;
const MAX_TODO_TEXT_LENGTH = 200;
const TODO_PATTERN = "\\b(TODO|FIXME)\\b";

export interface TodoMatch {
	file: string;
	line: number;
	text: string;
}

export interface TodoSearchResult {
	matches: TodoMatch[];
	/** True when more than MAX_TODO_MATCHES comments exist and the list was cut. */
	truncated: boolean;
}

/**
 * Parse `git grep -n` output ("path:line:text" per line) into matches, capped at `limit`.
 */
export function parseTodoOutput(output: string, limit: number = MAX_TODO_MATCHES): TodoSearchResult {
	const matches: TodoMatch[] = [];
	let truncated = false;
	for (const rawLine of output.split("\n")) {
		const parsed = /^(.+?):(\d+):(.*)$/.exec(rawLine);
		if (!parsed) continue;
		if (matches.length >= limit) {
			truncated = true;
			break;
		}
		const text = parsed[3].trim();
		matches.push({
			file: parsed[1],
			line: Number(parsed[2]),
			text: text.length > MAX_TODO_TEXT_LENGTH ? `${text.slice(0, MAX_TODO_TEXT_LENGTH)}...` : text,
		});
	}
	return { matches, truncated };
}

/** Group matches by file, preserving the order in which files first appear. */
export function groupTodosByFile(matches: TodoMatch[]): Map<string, TodoMatch[]> {
	const groups = new Map<string, TodoMatch[]>();
	for (const match of matches) {
		const group = groups.get(match.file);
		if (group) group.push(match);
		else groups.set(match.file, [match]);
	}
	return groups;
}

/**
 * Find TODO and FIXME comments in tracked files and in untracked files that are not git-ignored.
 * Throws when `cwd` is not inside a git repository or git is unavailable.
 */
export function findTodos(cwd: string): Promise<TodoSearchResult> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["grep", "-n", "-I", "-E", "--untracked", "--no-color", "-e", TODO_PATTERN],
			{ cwd, maxBuffer: 64 * 1024 * 1024 },
			(error, stdout, stderr) => {
				if (error) {
					// git grep exits with 1 when nothing matched
					if (typeof error.code === "number" && error.code === 1) {
						resolve({ matches: [], truncated: false });
						return;
					}
					reject(new Error(stderr.trim() || error.message));
					return;
				}
				resolve(parseTodoOutput(stdout));
			},
		);
	});
}
