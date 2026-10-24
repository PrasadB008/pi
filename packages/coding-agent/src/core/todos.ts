import type { SessionEntry } from "./session-manager.ts";

export const TODOS_ENTRY_TYPE = "todos";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoState {
	todos: TodoItem[];
	nextId: number;
}

export type TodoCommand =
	| { action: "list" }
	| { action: "add"; text: string }
	| { action: "toggle"; id: number }
	| { action: "remove"; id: number }
	| { action: "clear" };

export const TODOS_USAGE = "Usage: /todos [list | add <text> | done <id> | remove <id> | clear]";

export function emptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

function isTodoState(data: unknown): data is TodoState {
	if (typeof data !== "object" || data === null) return false;
	const candidate = data as { todos?: unknown; nextId?: unknown };
	return Array.isArray(candidate.todos) && typeof candidate.nextId === "number";
}

/** Return the latest todo snapshot on the given branch (entries ordered root to leaf). */
export function getTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	let state = emptyTodoState();
	for (const entry of branch) {
		if (entry.type === "custom" && entry.customType === TODOS_ENTRY_TYPE && isTodoState(entry.data)) {
			state = { todos: entry.data.todos.map((todo) => ({ ...todo })), nextId: entry.data.nextId };
		}
	}
	return state;
}

/** Parse the text after "/todos". Returns an error message for invalid input. */
export function parseTodoCommand(args: string): TodoCommand | { error: string } {
	const trimmed = args.trim();
	if (!trimmed) return { action: "list" };
	const match = /^(\S+)\s*(.*)$/s.exec(trimmed);
	const verb = (match?.[1] ?? "").toLowerCase();
	const rest = (match?.[2] ?? "").trim();

	switch (verb) {
		case "list":
			return { action: "list" };
		case "clear":
			return { action: "clear" };
		case "add":
			return rest ? { action: "add", text: rest } : { error: "Usage: /todos add <text>" };
		case "done":
		case "toggle":
		case "remove": {
			const id = /^#?(\d+)$/.exec(rest);
			if (!id) return { error: `Usage: /todos ${verb} <id>` };
			const parsed = Number(id[1]);
			return verb === "remove" ? { action: "remove", id: parsed } : { action: "toggle", id: parsed };
		}
		default:
			return { error: TODOS_USAGE };
	}
}

export interface TodoResult {
	state: TodoState;
	changed: boolean;
	message?: string;
	error?: string;
}

/** Apply a command to a state without mutating it. */
export function applyTodoCommand(state: TodoState, command: TodoCommand): TodoResult {
	switch (command.action) {
		case "list":
			return { state, changed: false };
		case "add": {
			const todo: TodoItem = { id: state.nextId, text: command.text, done: false };
			return {
				state: { todos: [...state.todos, todo], nextId: state.nextId + 1 },
				changed: true,
				message: `Added todo #${todo.id}: ${todo.text}`,
			};
		}
		case "toggle": {
			const target = state.todos.find((todo) => todo.id === command.id);
			if (!target) return { state, changed: false, error: `Todo #${command.id} not found` };
			const todos = state.todos.map((todo) => (todo.id === command.id ? { ...todo, done: !todo.done } : todo));
			return {
				state: { todos, nextId: state.nextId },
				changed: true,
				message: `Todo #${target.id} ${target.done ? "reopened" : "completed"}`,
			};
		}
		case "remove": {
			if (!state.todos.some((todo) => todo.id === command.id)) {
				return { state, changed: false, error: `Todo #${command.id} not found` };
			}
			return {
				state: { todos: state.todos.filter((todo) => todo.id !== command.id), nextId: state.nextId },
				changed: true,
				message: `Removed todo #${command.id}`,
			};
		}
		case "clear": {
			if (state.todos.length === 0) return { state, changed: false, message: "No todos to clear" };
			return {
				state: emptyTodoState(),
				changed: true,
				message: `Cleared ${state.todos.length} todo(s)`,
			};
		}
	}
}

/** Plain-text rendering of the list. */
export function formatTodoList(state: TodoState): string {
	if (state.todos.length === 0) return "No todos yet. Use /todos add <text>.";
	const done = state.todos.filter((todo) => todo.done).length;
	const lines = state.todos.map((todo) => `${todo.done ? "[x]" : "[ ]"} #${todo.id} ${todo.text}`);
	return [`Todos (${done}/${state.todos.length} completed)`, ...lines].join("\n");
}
