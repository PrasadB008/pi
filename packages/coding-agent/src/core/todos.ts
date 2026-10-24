import type { SessionEntry } from "./session-manager.ts";

/** customType of the session entries that store the todo list. */
export const TODOS_ENTRY_TYPE = "pi-todos";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

export interface TodosState {
	items: TodoItem[];
	nextId: number;
}

export type TodosCommand =
	| { action: "list" }
	| { action: "add"; text: string }
	| { action: "done"; id: number }
	| { action: "undo"; id: number }
	| { action: "remove"; id: number }
	| { action: "clear" }
	| { action: "invalid"; message: string };

export const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | undo <id> | rm <id> | clear]";

export function emptyTodosState(): TodosState {
	return { items: [], nextId: 1 };
}

function isTodosState(value: unknown): value is TodosState {
	if (typeof value !== "object" || value === null) return false;
	const state = value as Partial<TodosState>;
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

/** Reads the latest todo snapshot from a session branch (oldest to newest). */
export function getTodosState(branch: ReadonlyArray<SessionEntry>): TodosState {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODOS_ENTRY_TYPE && isTodosState(entry.data)) {
			return entry.data;
		}
	}
	return emptyTodosState();
}

/** Parses the argument string that follows `/todos`. */
export function parseTodosCommand(args: string): TodosCommand {
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
		case "add": {
			const text = rest.replace(/\s+/g, " ");
			return text ? { action: "add", text } : { action: "invalid", message: TODOS_USAGE };
		}
		case "done":
		case "undo":
		case "rm":
		case "remove": {
			const id = /^#?(\d+)$/.exec(rest);
			if (!id) return { action: "invalid", message: TODOS_USAGE };
			const n = Number(id[1]);
			return { action: verb === "done" ? "done" : verb === "undo" ? "undo" : "remove", id: n };
		}
		default:
			return { action: "invalid", message: TODOS_USAGE };
	}
}

export interface TodosResult {
	state: TodosState;
	changed: boolean;
	message: string;
}

/** Applies a parsed command to a state without mutating it. */
export function applyTodosCommand(state: TodosState, command: TodosCommand): TodosResult {
	switch (command.action) {
		case "list":
			return { state, changed: false, message: "" };
		case "invalid":
			return { state, changed: false, message: command.message };
		case "add": {
			const item: TodoItem = { id: state.nextId, text: command.text, done: false };
			return {
				state: { items: [...state.items, item], nextId: state.nextId + 1 },
				changed: true,
				message: `Added #${item.id}: ${item.text}`,
			};
		}
		case "clear": {
			if (state.items.length === 0) return { state, changed: false, message: "No todos to clear" };
			return {
				state: { items: [], nextId: state.nextId },
				changed: true,
				message: `Cleared ${state.items.length} todo${state.items.length === 1 ? "" : "s"}`,
			};
		}
		case "done":
		case "undo": {
			const target = state.items.find((item) => item.id === command.id);
			if (!target) return { state, changed: false, message: `No todo #${command.id}` };
			const done = command.action === "done";
			return {
				state: {
					items: state.items.map((item) => (item.id === target.id ? { ...item, done } : item)),
					nextId: state.nextId,
				},
				changed: target.done !== done,
				message: `${done ? "Completed" : "Reopened"} #${target.id}: ${target.text}`,
			};
		}
		case "remove": {
			const target = state.items.find((item) => item.id === command.id);
			if (!target) return { state, changed: false, message: `No todo #${command.id}` };
			return {
				state: { items: state.items.filter((item) => item.id !== target.id), nextId: state.nextId },
				changed: true,
				message: `Removed #${target.id}: ${target.text}`,
			};
		}
	}
}

/** Plain-text rendering of the list. */
export function formatTodos(state: TodosState): string {
	if (state.items.length === 0) return "No todos. Add one with /todos add <text>";
	const done = state.items.filter((item) => item.done).length;
	const lines = state.items.map((item) => `[${item.done ? "x" : " "}] #${item.id} ${item.text}`);
	return `Todos (${done}/${state.items.length} done)\n${lines.join("\n")}`;
}
