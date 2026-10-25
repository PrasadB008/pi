import { execFile } from "node:child_process";

export interface TodoComment {
	file: string;
	line: number;
	tag: string;
	text: string;
}

const TODO_PATTERN = "\\b(TODO|FIXME|HACK|XXX)\\b";
const TODO_REGEX = new RegExp(TODO_PATTERN);
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

/**
 * Parse `git grep -n -I` output ("path:line:content") into TODO comments.
 * Lines that do not match the expected shape are ignored.
 */
export function parseTodoGrepOutput(output: string): TodoComment[] {
	const results: TodoComment[] = [];
	for (const rawLine of output.split("\n")) {
		const match = /^(.+?):(\d+):(.*)$/.exec(rawLine);
		if (!match) continue;
		const tagMatch = TODO_REGEX.exec(match[3]);
		if (!tagMatch) continue;
		const text = match[3]
			.slice(tagMatch.index + tagMatch[0].length)
			.replace(/^[\s:(\-]+/, "")
			.replace(/\s*(\*\/|-->)\s*$/, "")
			.trim();
		results.push({ file: match[1], line: Number(match[2]), tag: tagMatch[1], text });
	}
	return results;
}

/**
 * Find TODO/FIXME/HACK/XXX markers in tracked and untracked, non-ignored text files under cwd.
 * Uses `git grep`, so it requires cwd to be inside a git work tree.
 */
export function findTodoComments(cwd: string): Promise<TodoComment[]> {
	return new Promise((resolve, reject) => {
		execFile(
			"git",
			["grep", "-n", "-I", "--untracked", "-E", TODO_PATTERN, "--", "."],
			{ cwd, maxBuffer: MAX_OUTPUT_BYTES },
			(error, stdout, stderr) => {
				if (error) {
					// git grep exits with 1 when nothing matched
					if (typeof error.code === "number" && error.code === 1 && !stderr) {
						resolve([]);
						return;
					}
					reject(new Error(stderr.trim() || error.message));
					return;
				}
				resolve(parseTodoGrepOutput(stdout));
			},
		);
	});
}

/** Format TODO comments as Markdown grouped by file. */
export function formatTodoComments(todos: TodoComment[]): string {
	if (todos.length === 0) return "No TODO comments found.";
	const byFile = new Map<string, TodoComment[]>();
	for (const todo of todos) {
		const list = byFile.get(todo.file);
		if (list) list.push(todo);
		else byFile.set(todo.file, [todo]);
	}
	const sections: string[] = [`${todos.length} TODO comment(s) in ${byFile.size} file(s)`];
	for (const [file, items] of byFile) {
		const lines = items.map((t) => `- \`${t.line}\` **${t.tag}** ${t.text}`.trimEnd());
		sections.push(`**${file}**\n${lines.join("\n")}`);
	}
	return sections.join("\n\n");
}
