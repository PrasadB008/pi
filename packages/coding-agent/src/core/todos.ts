import type { SessionEntry } from "./session-manager.ts";

/** Custom entry type used to persist the todo list in the session. Each entry is a full snapshot. */
export const TODOS_CUSTOM_ENTRY_TYPE = "todos";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoState {
	items: TodoItem[];
	nextId: number;
}

export const EMPTY_TODO_STATE: TodoState = { items: [], nextId: 1 };

function isTodoState(value: unknown): value is TodoState {
	if (typeof value !== "object" || value === null) return false;
	const state = value as Partial<TodoState>;
	return (
		typeof state.nextId === "number" &&
		Array.isArray(state.items) &&
		state.items.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				typeof item.id === "number" &&
				typeof item.text === "string" &&
				typeof item.done === "boolean",
		)
	);
}

/** Rebuild the todo state from a session branch: the last valid snapshot wins. */
export function reconstructTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODOS_CUSTOM_ENTRY_TYPE && isTodoState(entry.data)) {
			return entry.data;
		}
	}
	return EMPTY_TODO_STATE;
}

export type TodoCommandResult =
	| { ok: true; state: TodoState; message: string }
	| { ok: false; message: string; state: TodoState };

export const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | undo <id> | remove <id> | clear]";

function parseId(arg: string): number | undefined {
	return /^#?\d+$/.test(arg) ? Number(arg.replace("#", "")) : undefined;
}

/** Format the todo list as plain lines, one per item. */
export function formatTodos(state: TodoState): string {
	if (state.items.length === 0) return "No todos. Add one with /todos add <text>";
	const done = state.items.filter((item) => item.done).length;
	const lines = state.items.map((item) => `[${item.done ? "x" : " "}] #${item.id} ${item.text}`);
	return [`Todos (${done}/${state.items.length} completed)`, ...lines].join("\n");
}

/**
 * Apply the arguments of a `/todos` command (everything after "/todos") to the state.
 * Pure: returns a new state and a message. With no arguments, state is unchanged and the list is shown.
 */
export function applyTodoCommand(state: TodoState, args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") {
		return { ok: true, state, message: formatTodos(state) };
	}

	const [subcommand, ...rest] = trimmed.split(/\s+/);
	const restText = trimmed.slice(subcommand.length).trim();

	switch (subcommand) {
		case "add": {
			if (!restText) return { ok: false, state, message: "Usage: /todos add <text>" };
			const item: TodoItem = { id: state.nextId, text: restText, done: false };
			return {
				ok: true,
				state: { items: [...state.items, item], nextId: state.nextId + 1 },
				message: `Added #${item.id}: ${item.text}`,
			};
		}
		case "done":
		case "undo":
		case "remove": {
			const id = rest.length === 1 ? parseId(rest[0]) : undefined;
			if (id === undefined) return { ok: false, state, message: `Usage: /todos ${subcommand} <id>` };
			const target = state.items.find((item) => item.id === id);
			if (!target) return { ok: false, state, message: `No todo #${id}` };
			if (subcommand === "remove") {
				return {
					ok: true,
					state: { ...state, items: state.items.filter((item) => item.id !== id) },
					message: `Removed #${id}: ${target.text}`,
				};
			}
			const done = subcommand === "done";
			return {
				ok: true,
				state: { ...state, items: state.items.map((item) => (item.id === id ? { ...item, done } : item)) },
				message: `${done ? "Completed" : "Reopened"} #${id}: ${target.text}`,
			};
		}
		case "clear": {
			if (state.items.length === 0) return { ok: true, state, message: "No todos to clear" };
			return { ok: true, state: { ...state, items: [] }, message: `Cleared ${state.items.length} todo(s)` };
		}
		default:
			return { ok: false, state, message: TODOS_USAGE };
	}
}
