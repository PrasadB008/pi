import type { SessionEntry } from "./session-manager.ts";

/** Custom session entry type holding a full snapshot of the todo list. */
export const TODOS_ENTRY_TYPE = "todos";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodoState {
	items: TodoItem[];
	nextId: number;
}

export type TodoAction =
	| { type: "add"; text: string }
	| { type: "done"; id: number }
	| { type: "undo"; id: number }
	| { type: "remove"; id: number }
	| { type: "clear" };

export const EMPTY_TODO_STATE: TodoState = { items: [], nextId: 1 };

function isTodoState(data: unknown): data is TodoState {
	if (typeof data !== "object" || data === null) return false;
	const candidate = data as { items?: unknown; nextId?: unknown };
	return Array.isArray(candidate.items) && typeof candidate.nextId === "number";
}

/**
 * Read the todo state from a session branch (root to leaf order).
 * The last snapshot wins, so forks and tree navigation see the list as of their position.
 */
export function getTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODOS_ENTRY_TYPE && isTodoState(entry.data)) {
			return entry.data;
		}
	}
	return EMPTY_TODO_STATE;
}

export type TodoResult = { ok: true; state: TodoState } | { ok: false; error: string };

export function applyTodoAction(state: TodoState, action: TodoAction): TodoResult {
	if (action.type === "add") {
		const text = action.text.trim();
		if (!text) return { ok: false, error: "Usage: /todos add <text>" };
		const item: TodoItem = { id: state.nextId, text, done: false };
		return { ok: true, state: { items: [...state.items, item], nextId: state.nextId + 1 } };
	}
	if (action.type === "clear") {
		return { ok: true, state: { items: [], nextId: state.nextId } };
	}
	if (!state.items.some((item) => item.id === action.id)) {
		return { ok: false, error: `No todo with id ${action.id}` };
	}
	if (action.type === "remove") {
		return { ok: true, state: { ...state, items: state.items.filter((item) => item.id !== action.id) } };
	}
	const done = action.type === "done";
	return {
		ok: true,
		state: { ...state, items: state.items.map((item) => (item.id === action.id ? { ...item, done } : item)) },
	};
}

export type TodoCommandParse = { type: "list" } | { type: "action"; action: TodoAction } | { type: "error"; error: string };

const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | undo <id> | remove <id> | clear]";

/** Parse the argument string after `/todos`. */
export function parseTodoCommand(args: string): TodoCommandParse {
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") return { type: "list" };
	const match = /^(\S+)\s*(.*)$/s.exec(trimmed);
	const sub = match?.[1] ?? "";
	const rest = match?.[2]?.trim() ?? "";
	switch (sub) {
		case "add":
			return rest ? { type: "action", action: { type: "add", text: rest } } : { type: "error", error: TODOS_USAGE };
		case "clear":
			return { type: "action", action: { type: "clear" } };
		case "done":
		case "undo":
		case "remove": {
			const id = /^#?(\d+)$/.exec(rest);
			if (!id) return { type: "error", error: TODOS_USAGE };
			return { type: "action", action: { type: sub, id: Number(id[1]) } };
		}
		default:
			return { type: "error", error: TODOS_USAGE };
	}
}
