import type { SessionEntry } from "./session-manager.ts";

export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoAction =
	| { type: "list" }
	| { type: "add"; text: string }
	| { type: "done"; index: number }
	| { type: "remove"; index: number }
	| { type: "clear" }
	| { type: "invalid"; usage: string };

const USAGE = "Usage: /todo [<text> | done <n> | rm <n> | clear]";

/** Parse the argument string after "/todo". Item numbers are 1-based in the input and 0-based in the result. */
export function parseTodoArgs(args: string): TodoAction {
	const trimmed = args.trim();
	if (!trimmed) return { type: "list" };
	if (trimmed === "clear") return { type: "clear" };
	const match = /^(done|rm)(?:\s+(.*))?$/.exec(trimmed);
	if (!match) return { type: "add", text: trimmed };
	const n = Number(match[2]);
	if (!Number.isInteger(n) || n < 1) return { type: "invalid", usage: USAGE };
	return { type: match[1] === "done" ? "done" : "remove", index: n - 1 };
}

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.text === "string" && typeof item.done === "boolean";
}

/** Read the todo list from the latest todo snapshot on a session branch. */
export function getTodoItems(branch: ReadonlyArray<SessionEntry>): TodoItem[] {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODO_ENTRY_TYPE) {
			const data = entry.data;
			return Array.isArray(data) ? data.filter(isTodoItem).map((item) => ({ ...item })) : [];
		}
	}
	return [];
}

/** Apply an action to a list. Returns the new list, or an error message if the index is out of range. */
export function applyTodoAction(items: TodoItem[], action: TodoAction): TodoItem[] | string {
	switch (action.type) {
		case "add":
			return [...items, { text: action.text, done: false }];
		case "clear":
			return [];
		case "done":
		case "remove": {
			if (action.index >= items.length) return `No todo item ${action.index + 1}`;
			if (action.type === "remove") return items.filter((_, i) => i !== action.index);
			return items.map((item, i) => (i === action.index ? { ...item, done: true } : item));
		}
		default:
			return items;
	}
}
