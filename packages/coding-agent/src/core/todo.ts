import type { SessionEntry } from "./session-manager.ts";

/** customType of session entries that store a snapshot of the todo list. */
export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export type TodoCommand =
	| { type: "list" }
	| { type: "add"; text: string }
	| { type: "done"; id: number }
	| { type: "invalid"; message: string };

export const TODO_USAGE = "Usage: /todo [list] | /todo add <text> | /todo done <number>";

/** Parse the text after `/todo`. No arguments lists items. */
export function parseTodoArgs(args: string): TodoCommand {
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") return { type: "list" };

	const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
	const subcommand = match?.[1];
	const rest = match?.[2]?.trim() ?? "";

	if (subcommand === "add") {
		if (!rest) return { type: "invalid", message: TODO_USAGE };
		return { type: "add", text: rest };
	}
	if (subcommand === "done" || subcommand === "complete") {
		if (!/^\d+$/.test(rest)) return { type: "invalid", message: TODO_USAGE };
		return { type: "done", id: Number.parseInt(rest, 10) };
	}
	return { type: "invalid", message: TODO_USAGE };
}

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.id === "number" && typeof item.text === "string" && typeof item.done === "boolean";
}

/**
 * Rebuild the todo list from session entries (ordered root to leaf).
 * The most recent todo entry holds the full list, so branches and resumed sessions see their own state.
 */
export function getTodosFromEntries(entries: ReadonlyArray<SessionEntry>): TodoItem[] {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type === "custom" && entry.customType === TODO_ENTRY_TYPE) {
			const data = entry.data;
			if (Array.isArray(data)) return data.filter(isTodoItem).map((item) => ({ ...item }));
			return [];
		}
	}
	return [];
}

export function addTodo(todos: ReadonlyArray<TodoItem>, text: string): { todos: TodoItem[]; added: TodoItem } {
	const nextId = todos.reduce((max, item) => Math.max(max, item.id), 0) + 1;
	const added: TodoItem = { id: nextId, text, done: false };
	return { todos: [...todos.map((item) => ({ ...item })), added], added };
}

/** Mark an item done. Returns undefined when the id does not exist. */
export function completeTodo(
	todos: ReadonlyArray<TodoItem>,
	id: number,
): { todos: TodoItem[]; completed: TodoItem; alreadyDone: boolean } | undefined {
	const target = todos.find((item) => item.id === id);
	if (!target) return undefined;
	const updated = todos.map((item) => (item.id === id ? { ...item, done: true } : { ...item }));
	return { todos: updated, completed: { ...target, done: true }, alreadyDone: target.done };
}

export function formatTodos(todos: ReadonlyArray<TodoItem>): string {
	if (todos.length === 0) return "No todos. Add one with /todo add <text>";
	const remaining = todos.filter((item) => !item.done).length;
	const lines = todos.map((item) => `${item.done ? "[x]" : "[ ]"} ${item.id}. ${item.text}`);
	return `Todos (${remaining} open, ${todos.length - remaining} done)\n${lines.join("\n")}`;
}
