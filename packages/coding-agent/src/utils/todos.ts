import { spawnProcess } from "./child-process.ts";

export interface TodoComment {
	file: string;
	line: number;
	/** Marker found in the comment, e.g. "TODO" or "FIXME". */
	tag: string;
	/** Trimmed source line containing the marker. */
	text: string;
}

const TODO_PATTERN = "\\b(TODO|FIXME)\\b";
const TODO_TAG_REGEX = /\b(TODO|FIXME)\b/;
const GREP_LINE_REGEX = /^(.+?):(\d+):(.*)$/;
const MAX_LINE_LENGTH = 200;

/** Parse `git grep -n` output into TODO entries. Lines that do not match the format are skipped. */
export function parseTodoGrepOutput(output: string): TodoComment[] {
	const todos: TodoComment[] = [];
	for (const rawLine of output.split("\n")) {
		const match = GREP_LINE_REGEX.exec(rawLine);
		if (!match) continue;
		const text = (match[3] ?? "").trim();
		const tag = TODO_TAG_REGEX.exec(text)?.[1];
		if (!tag) continue;
		todos.push({
			file: match[1] ?? "",
			line: Number(match[2]),
			tag,
			text: text.length > MAX_LINE_LENGTH ? `${text.slice(0, MAX_LINE_LENGTH)}...` : text,
		});
	}
	return todos;
}

/**
 * Find TODO and FIXME comments under cwd. Uses `git grep --no-index --exclude-standard`, so .gitignore is
 * respected, binary files are skipped, and it also works outside a git repository.
 */
export async function findTodoComments(cwd: string): Promise<TodoComment[]> {
	const child = spawnProcess(
		"git",
		["grep", "--no-index", "--exclude-standard", "-I", "-n", "--no-color", "-E", TODO_PATTERN],
		{ cwd, stdio: ["ignore", "pipe", "pipe"] },
	);
	let stdout = "";
	let stderr = "";
	child.stdout.setEncoding("utf-8");
	child.stderr.setEncoding("utf-8");
	child.stdout.on("data", (chunk: string) => {
		stdout += chunk;
	});
	child.stderr.on("data", (chunk: string) => {
		stderr += chunk;
	});

	const exitCode = await new Promise<number | null>((resolve, reject) => {
		child.once("error", reject);
		child.once("close", resolve);
	});

	// git grep exits 1 when nothing matches.
	if (exitCode !== 0 && exitCode !== 1) {
		throw new Error(stderr.trim() || `git grep exited with code ${exitCode}`);
	}
	return parseTodoGrepOutput(stdout);
}

/** Render TODO entries grouped by file as Markdown. */
export function formatTodoComments(todos: TodoComment[], maxItems = 200): string {
	if (todos.length === 0) return "No TODO or FIXME comments found.";

	const shown = todos.slice(0, maxItems);
	const byFile = new Map<string, TodoComment[]>();
	for (const todo of shown) {
		const list = byFile.get(todo.file);
		if (list) list.push(todo);
		else byFile.set(todo.file, [todo]);
	}

	const sections: string[] = [];
	for (const [file, items] of byFile) {
		const lines = items.map((item) => `- \`${file}:${item.line}\` ${item.text.replace(/`/g, "'")}`);
		sections.push(`**${file}**\n\n${lines.join("\n")}`);
	}

	const header = `${todos.length} outstanding item${todos.length === 1 ? "" : "s"}`;
	const footer = todos.length > shown.length ? `\n\n...and ${todos.length - shown.length} more not shown.` : "";
	return `${header}\n\n${sections.join("\n\n")}${footer}`;
}
