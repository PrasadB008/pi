import type { SessionEntry } from "./session-manager.ts";

/** customType of the session entries that store the /todo list. */
export const TODO_ENTRY_TYPE = "pi.todo";

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
	| { action: "clear" }
	| { action: "error"; message: string };

export const TODO_USAGE = "Usage: /todo [add <text> | done <id> | rm <id> | clear]";

export function emptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

/** Rebuild the todo list from the session branch. The last todo entry wins, so branching restores the right list. */
export function reconstructTodoState(entries: ReadonlyArray<SessionEntry>): TodoState {
	let state = emptyTodoState();
	for (const entry of entries) {
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as Partial<TodoState> | undefined;
		if (!data || !Array.isArray(data.todos) || typeof data.nextId !== "number") continue;
		state = { todos: data.todos.map((todo) => ({ ...todo })), nextId: data.nextId };
	}
	return state;
}

/** Parse the text after `/todo`. A bare `/todo` lists. */
export function parseTodoCommand(text: string): TodoCommand {
	const args = text.replace(/^\/todo\s*/, "").trim();
	if (!args) return { action: "list" };

	const match = /^(\S+)\s*(.*)$/s.exec(args);
	const verb = (match?.[1] ?? "").toLowerCase();
	const rest = (match?.[2] ?? "").trim();

	switch (verb) {
		case "list":
			return { action: "list" };
		case "clear":
			return { action: "clear" };
		case "add":
			return rest ? { action: "add", text: rest } : { action: "error", message: "Usage: /todo add <text>" };
		case "done":
		case "toggle":
		case "rm":
		case "remove": {
			const id = Number(rest.replace(/^#/, ""));
			if (!Number.isInteger(id) || id < 1) {
				return { action: "error", message: `Usage: /todo ${verb} <id>` };
			}
			return { action: verb === "done" || verb === "toggle" ? "toggle" : "remove", id };
		}
		default:
			return { action: "error", message: TODO_USAGE };
	}
}

export interface TodoApplyResult {
	state: TodoState;
	changed: boolean;
	message: string;
}

/** Apply a parsed command to the state without mutating it. */
export function applyTodoCommand(state: TodoState, command: TodoCommand): TodoApplyResult {
	switch (command.action) {
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
			if (!target) return { state, changed: false, message: `Todo #${command.id} not found` };
			const todos = state.todos.map((todo) => (todo.id === command.id ? { ...todo, done: !todo.done } : todo));
			return {
				state: { todos, nextId: state.nextId },
				changed: true,
				message: `Todo #${target.id} ${target.done ? "reopened" : "completed"}`,
			};
		}
		case "remove": {
			if (!state.todos.some((todo) => todo.id === command.id)) {
				return { state, changed: false, message: `Todo #${command.id} not found` };
			}
			return {
				state: { todos: state.todos.filter((todo) => todo.id !== command.id), nextId: state.nextId },
				changed: true,
				message: `Removed todo #${command.id}`,
			};
		}
		case "clear": {
			if (state.todos.length === 0) return { state, changed: false, message: "No todos to clear" };
			return { state: emptyTodoState(), changed: true, message: `Cleared ${state.todos.length} todo(s)` };
		}
		case "error":
			return { state, changed: false, message: command.message };
		case "list":
			return { state, changed: false, message: formatTodoList(state) };
	}
}

export function formatTodoList(state: TodoState): string {
	if (state.todos.length === 0) return "No todos. Add one with /todo add <text>";
	const done = state.todos.filter((todo) => todo.done).length;
	const lines = state.todos.map((todo) => `[${todo.done ? "x" : " "}] #${todo.id} ${todo.text}`);
	return [`Todos (${done}/${state.todos.length} done)`, ...lines].join("\n");
}
