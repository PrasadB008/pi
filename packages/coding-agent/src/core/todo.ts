import type { SessionEntry } from "./session-manager.ts";

/** customType of the session entries that store the todo list. */
export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommand =
	| { type: "list" }
	| { type: "add"; text: string }
	| { type: "done"; index: number }
	| { type: "remove"; index: number }
	| { type: "clear" }
	| { type: "invalid"; message: string };

const TODO_USAGE = "Usage: /todo [<text> | done <n> | remove <n> | clear]";

/** Parse the argument string after "/todo". Indexes in the result are 0-based. */
export function parseTodoCommand(args: string): TodoCommand {
	const trimmed = args.trim();
	if (!trimmed) return { type: "list" };
	if (trimmed === "clear") return { type: "clear" };

	const match = /^(done|remove)(?:\s+(.*))?$/.exec(trimmed);
	if (match) {
		const number = Number(match[2]?.trim());
		if (!Number.isInteger(number) || number < 1) {
			return { type: "invalid", message: `${TODO_USAGE}` };
		}
		return { type: match[1] === "done" ? "done" : "remove", index: number - 1 };
	}

	return { type: "add", text: trimmed.replace(/[\r\n]+/g, " ") };
}

/** Return the todo list from the latest todo entry on the given branch (empty if none). */
export function getTodosFromBranch(branch: ReadonlyArray<SessionEntry>): TodoItem[] {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODO_ENTRY_TYPE && Array.isArray(entry.data)) {
			return (entry.data as TodoItem[]).map((item) => ({ text: item.text, done: item.done }));
		}
	}
	return [];
}

export interface TodoResult {
	todos: TodoItem[];
	/** Set when the list changed and must be persisted. */
	changed: boolean;
	/** Set when the command was rejected (e.g. index out of range). */
	error?: string;
}

/** Apply a non-list command to a todo list without mutating the input. */
export function applyTodoCommand(todos: ReadonlyArray<TodoItem>, command: TodoCommand): TodoResult {
	const next = todos.map((item) => ({ ...item }));
	switch (command.type) {
		case "add":
			next.push({ text: command.text, done: false });
			return { todos: next, changed: true };
		case "clear":
			return { todos: [], changed: next.length > 0 };
		case "done":
		case "remove": {
			if (command.index >= next.length) {
				return { todos: next, changed: false, error: `No todo #${command.index + 1}` };
			}
			if (command.type === "done") next[command.index].done = true;
			else next.splice(command.index, 1);
			return { todos: next, changed: true };
		}
		case "list":
			return { todos: next, changed: false };
		case "invalid":
			return { todos: next, changed: false, error: command.message };
	}
}

export function formatTodos(todos: ReadonlyArray<TodoItem>): string {
	if (todos.length === 0) return "No todos. Add one with /todo <text>";
	return todos.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}
