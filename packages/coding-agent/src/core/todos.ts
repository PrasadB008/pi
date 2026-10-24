import type { SessionEntry } from "./session-manager.ts";

/** Custom session entry type that stores a full snapshot of the todo list. */
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

export const EMPTY_TODO_STATE: TodoState = { items: [], nextId: 1 };

export const TODOS_USAGE = "Usage: /todos [add <text> | done <id> | undo <id> | rm <id> | clear]";

export interface TodosCommandResult {
	/** New state to persist, or undefined when nothing changed. */
	state?: TodoState;
	/** Human readable message. */
	message: string;
	isError?: boolean;
}

function isTodoState(value: unknown): value is TodoState {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value as { items?: unknown; nextId?: unknown };
	if (typeof candidate.nextId !== "number" || !Array.isArray(candidate.items)) return false;
	return candidate.items.every((item: unknown) => {
		if (typeof item !== "object" || item === null) return false;
		const todo = item as Partial<TodoItem>;
		return typeof todo.id === "number" && typeof todo.text === "string" && typeof todo.done === "boolean";
	});
}

/** Return the most recent todo snapshot on the given branch (root to leaf order). */
export function reconstructTodoState(branch: ReadonlyArray<SessionEntry>): TodoState {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type === "custom" && entry.customType === TODOS_ENTRY_TYPE && isTodoState(entry.data)) {
			return entry.data;
		}
	}
	return EMPTY_TODO_STATE;
}

export function formatTodoList(state: TodoState): string {
	if (state.items.length === 0) return "No todos. Add one with /todos add <text>";
	const done = state.items.filter((item) => item.done).length;
	const lines = state.items.map((item) => `[${item.done ? "x" : " "}] #${item.id} ${item.text}`);
	return `Todos (${done}/${state.items.length} done)\n${lines.join("\n")}`;
}

function parseId(arg: string): number | undefined {
	return /^#?\d+$/.test(arg) ? Number.parseInt(arg.replace("#", ""), 10) : undefined;
}

/** Apply the arguments of a `/todos` command to the state. */
export function runTodosCommand(state: TodoState, args: string): TodosCommandResult {
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") return { message: formatTodoList(state) };

	const match = /^(\S+)\s*([\s\S]*)$/.exec(trimmed);
	const subcommand = match?.[1] ?? "";
	const rest = (match?.[2] ?? "").trim();

	switch (subcommand) {
		case "add": {
			if (!rest) return { message: "Usage: /todos add <text>", isError: true };
			const item: TodoItem = { id: state.nextId, text: rest, done: false };
			return {
				state: { items: [...state.items, item], nextId: state.nextId + 1 },
				message: `Added #${item.id}: ${item.text}`,
			};
		}
		case "done":
		case "undo": {
			const id = parseId(rest);
			if (id === undefined) return { message: `Usage: /todos ${subcommand} <id>`, isError: true };
			const target = state.items.find((item) => item.id === id);
			if (!target) return { message: `No todo with id #${id}`, isError: true };
			const done = subcommand === "done";
			return {
				state: {
					items: state.items.map((item) => (item.id === id ? { ...item, done } : item)),
					nextId: state.nextId,
				},
				message: `${done ? "Completed" : "Reopened"} #${id}: ${target.text}`,
			};
		}
		case "rm": {
			const id = parseId(rest);
			if (id === undefined) return { message: "Usage: /todos rm <id>", isError: true };
			const target = state.items.find((item) => item.id === id);
			if (!target) return { message: `No todo with id #${id}`, isError: true };
			return {
				state: { items: state.items.filter((item) => item.id !== id), nextId: state.nextId },
				message: `Removed #${id}: ${target.text}`,
			};
		}
		case "clear": {
			if (state.items.length === 0) return { message: "No todos to clear" };
			return {
				state: { items: [], nextId: state.nextId },
				message: `Cleared ${state.items.length} todo${state.items.length === 1 ? "" : "s"}`,
			};
		}
		default:
			return { message: TODOS_USAGE, isError: true };
	}
}
