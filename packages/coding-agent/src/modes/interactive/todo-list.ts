import type { SessionEntry } from "../../core/session-manager.ts";

/** Custom session entry type used to persist the /todo list. */
export const TODO_ENTRY_TYPE = "todo-list";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoState {
	todos: TodoItem[];
	nextId: number;
}

export interface TodoCommandResult {
	state: TodoState;
	/** True when the state changed and must be persisted. */
	changed: boolean;
	/** True when `message` is a usage or lookup error. */
	error: boolean;
	/** Lines to show the user. */
	lines: string[];
}

export const TODO_USAGE = "Usage: /todo [list] | add <text> | done <id> | undo <id> | remove <id> | clear";

export function emptyTodoState(): TodoState {
	return { todos: [], nextId: 1 };
}

function isTodoState(data: unknown): data is TodoState {
	if (typeof data !== "object" || data === null) return false;
	const candidate = data as { todos?: unknown; nextId?: unknown };
	return Array.isArray(candidate.todos) && typeof candidate.nextId === "number";
}

/** Rebuild the todo list from the entries on the current branch (last snapshot wins). */
export function loadTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	let state = emptyTodoState();
	for (const entry of branch) {
		if (entry.type === "custom" && entry.customType === TODO_ENTRY_TYPE && isTodoState(entry.data)) {
			state = { todos: entry.data.todos.map((todo) => ({ ...todo })), nextId: entry.data.nextId };
		}
	}
	return state;
}

export function formatTodoLines(state: TodoState): string[] {
	if (state.todos.length === 0) return ["No todos. Use /todo add <text> to add one."];
	const done = state.todos.filter((todo) => todo.done).length;
	return [
		`Todos (${done}/${state.todos.length} done)`,
		...state.todos.map((todo) => `${todo.done ? "[x]" : "[ ]"} #${todo.id} ${todo.text}`),
	];
}

function fail(state: TodoState, message: string): TodoCommandResult {
	return { state, changed: false, error: true, lines: [message] };
}

/** Apply the arguments after "/todo" to the current state. Pure: never mutates `state`. */
export function runTodoCommand(args: string, state: TodoState): TodoCommandResult {
	const trimmed = args.trim();
	const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
	const action = (match?.[1] ?? "list").toLowerCase();
	const rest = (match?.[2] ?? "").trim();

	switch (action) {
		case "list":
			return { state, changed: false, error: false, lines: formatTodoLines(state) };

		case "add": {
			if (!rest) return fail(state, "Usage: /todo add <text>");
			const todo: TodoItem = { id: state.nextId, text: rest, done: false };
			return {
				state: { todos: [...state.todos, todo], nextId: state.nextId + 1 },
				changed: true,
				error: false,
				lines: [`Added todo #${todo.id}: ${todo.text}`],
			};
		}

		case "done":
		case "undo": {
			const done = action === "done";
			const id = /^#?(\d+)$/.exec(rest);
			if (!id) return fail(state, `Usage: /todo ${action} <id>`);
			const target = state.todos.find((todo) => todo.id === Number(id[1]));
			if (!target) return fail(state, `Todo #${id[1]} not found`);
			return {
				state: {
					todos: state.todos.map((todo) => (todo.id === target.id ? { ...todo, done } : todo)),
					nextId: state.nextId,
				},
				changed: target.done !== done,
				error: false,
				lines: [`Todo #${target.id} ${done ? "completed" : "reopened"}`],
			};
		}

		case "remove": {
			const id = /^#?(\d+)$/.exec(rest);
			if (!id) return fail(state, "Usage: /todo remove <id>");
			const target = state.todos.find((todo) => todo.id === Number(id[1]));
			if (!target) return fail(state, `Todo #${id[1]} not found`);
			return {
				state: { todos: state.todos.filter((todo) => todo.id !== target.id), nextId: state.nextId },
				changed: true,
				error: false,
				lines: [`Removed todo #${target.id}`],
			};
		}

		case "clear":
			return {
				state: emptyTodoState(),
				changed: state.todos.length > 0,
				error: false,
				lines: [`Cleared ${state.todos.length} todo(s)`],
			};

		default:
			return fail(state, TODO_USAGE);
	}
}
