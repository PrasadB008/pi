import type { SessionEntry } from "./session-manager.ts";

/** Custom session entry type used to persist the todo list. */
export const TODO_ENTRY_TYPE = "todo-list";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoListData {
	todos: TodoItem[];
}

export interface TodoCommandResult {
	todos: TodoItem[];
	/** True when the list changed and must be persisted. */
	changed: boolean;
	/** Text to show to the user. */
	message: string;
	/** True when the message is a usage or error message. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [<text> | add <text> | done <id> | undo <id> | rm <id> | clear]";

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.id === "number" && typeof item.text === "string" && typeof item.done === "boolean";
}

/**
 * Read the current todo list from a session branch (root to leaf).
 * Each todo entry is a full snapshot, so the last one wins.
 */
export function getTodosFromBranch(branch: readonly SessionEntry[]): TodoItem[] {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as Partial<TodoListData> | undefined;
		if (data && Array.isArray(data.todos)) {
			return data.todos.filter(isTodoItem);
		}
	}
	return [];
}

export function formatTodos(todos: readonly TodoItem[]): string {
	if (todos.length === 0) return "No todos. Add one with /todo <text>";
	return todos.map((todo) => `${todo.done ? "[x]" : "[ ]"} ${todo.id}. ${todo.text}`).join("\n");
}

function usageError(todos: TodoItem[], message: string): TodoCommandResult {
	return { todos, changed: false, message, isError: true };
}

function parseId(todos: TodoItem[], arg: string): TodoItem | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const id = Number(arg);
	return todos.find((todo) => todo.id === id);
}

/** Apply the arguments of `/todo` (text after the command name) to a todo list. */
export function applyTodoCommand(todos: TodoItem[], args: string): TodoCommandResult {
	const input = args.trim();
	if (!input) {
		return { todos, changed: false, message: formatTodos(todos), isError: false };
	}

	const [first, ...rest] = input.split(/\s+/);
	const restText = rest.join(" ");
	const subcommand = first.toLowerCase();

	if (subcommand === "clear") {
		if (todos.length === 0) return { todos, changed: false, message: "No todos to clear", isError: false };
		return { todos: [], changed: true, message: `Cleared ${todos.length} todo(s)`, isError: false };
	}

	if (subcommand === "done" || subcommand === "undo" || subcommand === "rm") {
		const target = parseId(todos, restText);
		if (!target) return usageError(todos, `No todo with id ${JSON.stringify(restText)}. ${TODO_USAGE}`);
		if (subcommand === "rm") {
			return {
				todos: todos.filter((todo) => todo.id !== target.id),
				changed: true,
				message: `Removed todo ${target.id}`,
				isError: false,
			};
		}
		const done = subcommand === "done";
		return {
			todos: todos.map((todo) => (todo.id === target.id ? { ...todo, done } : todo)),
			changed: true,
			message: `${done ? "Completed" : "Reopened"} todo ${target.id}: ${target.text}`,
			isError: false,
		};
	}

	const text = subcommand === "add" ? restText : input;
	if (!text) return usageError(todos, TODO_USAGE);
	const id = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
	return {
		todos: [...todos, { id, text, done: false }],
		changed: true,
		message: `Added todo ${id}: ${text}`,
		isError: false,
	};
}
