import type { SessionEntry } from "./session-manager.ts";

export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

/** Full snapshot stored in each "todo" custom session entry. */
export interface TodoState {
	todos: TodoItem[];
	nextId: number;
}

export type TodoCommand =
	| { action: "list" }
	| { action: "add"; text: string }
	| { action: "done"; id: number }
	| { action: "undo"; id: number }
	| { action: "remove"; id: number }
	| { action: "clear" }
	| { action: "usage"; message: string };

export const TODO_USAGE = "Usage: /todo [add <text> | done <id> | undo <id> | remove <id> | clear]";

export function emptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

function isTodoState(value: unknown): value is TodoState {
	if (typeof value !== "object" || value === null) return false;
	const state = value as Partial<TodoState>;
	return (
		typeof state.nextId === "number" &&
		Array.isArray(state.todos) &&
		state.todos.every(
			(t) => typeof t === "object" && t !== null && typeof t.id === "number" && typeof t.text === "string",
		)
	);
}

/**
 * Read the todo list for the current branch: the latest "todo" custom entry wins.
 * Because the state lives in session entries, forking or navigating the tree restores
 * the list as it was at that point.
 */
export function getTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODO_ENTRY_TYPE && isTodoState(entry.data)) {
			return { nextId: entry.data.nextId, todos: entry.data.todos.map((t) => ({ ...t, done: t.done === true })) };
		}
	}
	return emptyTodoState();
}

export function parseTodoCommand(text: string): TodoCommand {
	const args = text.replace(/^\/todo\s*/, "").trim();
	if (!args) return { action: "list" };

	const match = args.match(/^(\S+)\s*([\s\S]*)$/);
	const verb = (match?.[1] ?? "").toLowerCase();
	const rest = (match?.[2] ?? "").trim();

	switch (verb) {
		case "list":
		case "clear":
			// Exact match only, so "/todo clear the cache" is added as a todo instead of clearing the list.
			if (!rest) return { action: verb };
			return { action: "add", text: args };
		case "add":
			return rest ? { action: "add", text: rest } : { action: "usage", message: "Usage: /todo add <text>" };
		case "done":
		case "undo":
		case "remove": {
			const idText = rest.replace(/^#/, "");
			const id = /^\d+$/.test(idText) ? Number(idText) : 0;
			if (!Number.isSafeInteger(id) || id < 1) {
				return { action: "usage", message: `Usage: /todo ${verb} <id>` };
			}
			return { action: verb, id };
		}
		default:
			// Bare text is treated as shorthand for "add".
			return { action: "add", text: args };
	}
}

export interface TodoApplyResult {
	state: TodoState;
	changed: boolean;
	message: string;
}

/** Apply a mutating command to a state without modifying the input. */
export function applyTodoCommand(state: TodoState, command: TodoCommand): TodoApplyResult {
	const unchanged = (message: string): TodoApplyResult => ({ state, changed: false, message });

	switch (command.action) {
		case "add": {
			const todo: TodoItem = { id: state.nextId, text: command.text, done: false };
			return {
				state: { todos: [...state.todos, todo], nextId: state.nextId + 1 },
				changed: true,
				message: `Added #${todo.id}: ${todo.text}`,
			};
		}
		case "done":
		case "undo": {
			const target = state.todos.find((t) => t.id === command.id);
			if (!target) return unchanged(`No todo #${command.id}`);
			const done = command.action === "done";
			if (target.done === done) return unchanged(`Todo #${target.id} is already ${done ? "done" : "open"}`);
			return {
				state: {
					nextId: state.nextId,
					todos: state.todos.map((t) => (t.id === target.id ? { ...t, done } : t)),
				},
				changed: true,
				message: `${done ? "Completed" : "Reopened"} #${target.id}: ${target.text}`,
			};
		}
		case "remove": {
			const target = state.todos.find((t) => t.id === command.id);
			if (!target) return unchanged(`No todo #${command.id}`);
			return {
				state: { nextId: state.nextId, todos: state.todos.filter((t) => t.id !== target.id) },
				changed: true,
				message: `Removed #${target.id}: ${target.text}`,
			};
		}
		case "clear": {
			if (state.todos.length === 0) return unchanged("No todos to clear");
			return {
				state: { todos: [], nextId: state.nextId },
				changed: true,
				message: `Cleared ${state.todos.length} todo${state.todos.length === 1 ? "" : "s"}`,
			};
		}
		case "list":
			return unchanged(formatTodoList(state));
		case "usage":
			return unchanged(command.message);
	}
}

export function formatTodoList(state: TodoState): string {
	if (state.todos.length === 0) return "No todos. Add one with /todo add <text>";
	const done = state.todos.filter((t) => t.done).length;
	const lines = state.todos.map((t) => `${t.done ? "[x]" : "[ ]"} #${t.id} ${t.text}`);
	return [`Todos (${done}/${state.todos.length} done)`, ...lines].join("\n");
}
