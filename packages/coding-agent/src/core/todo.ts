import type { SessionEntry } from "./session-manager.ts";

/** customType used for todo snapshots stored as session custom entries. */
export const TODO_ENTRY_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoSnapshot {
	items: TodoItem[];
}

export type TodoAction =
	| { type: "list" }
	| { type: "add"; text: string }
	| { type: "done"; index: number }
	| { type: "undo"; index: number }
	| { type: "remove"; index: number }
	| { type: "clear" }
	| { type: "usage"; message: string };

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | undo <n> | rm <n> | clear]";

/** Parse the argument string after "/todo". Item numbers in the input are 1-based. */
export function parseTodoArgs(args: string): TodoAction {
	const trimmed = args.trim();
	if (!trimmed) return { type: "list" };

	const match = trimmed.match(/^(\S+)\s*(.*)$/s);
	const sub = (match?.[1] ?? "").toLowerCase();
	const rest = (match?.[2] ?? "").trim();

	switch (sub) {
		case "list":
			return { type: "list" };
		case "clear":
			return { type: "clear" };
		case "add":
			return rest ? { type: "add", text: rest } : { type: "usage", message: "Usage: /todo add <text>" };
		case "done":
		case "undo":
		case "rm":
		case "remove": {
			const n = Number(rest);
			if (!/^\d+$/.test(rest) || n < 1) {
				return { type: "usage", message: `Usage: /todo ${sub} <n> (n is the item number, starting at 1)` };
			}
			const index = n - 1;
			if (sub === "done") return { type: "done", index };
			if (sub === "undo") return { type: "undo", index };
			return { type: "remove", index };
		}
		default:
			return { type: "usage", message: TODO_USAGE };
	}
}

export interface TodoResult {
	items: TodoItem[];
	/** True when items changed and a new snapshot should be persisted. */
	changed: boolean;
	/** Set when the action could not be applied. */
	error?: string;
}

/** Apply an action to a list without mutating the input. */
export function applyTodoAction(items: readonly TodoItem[], action: TodoAction): TodoResult {
	const current = items.map((item) => ({ ...item }));
	switch (action.type) {
		case "list":
			return { items: current, changed: false };
		case "usage":
			return { items: current, changed: false, error: action.message };
		case "add":
			return { items: [...current, { text: action.text, done: false }], changed: true };
		case "clear":
			return { items: [], changed: current.length > 0 };
		case "done":
		case "undo": {
			const item = current[action.index];
			if (!item) return { items: current, changed: false, error: `No todo #${action.index + 1}` };
			item.done = action.type === "done";
			return { items: current, changed: true };
		}
		case "remove": {
			if (!current[action.index]) {
				return { items: current, changed: false, error: `No todo #${action.index + 1}` };
			}
			current.splice(action.index, 1);
			return { items: current, changed: true };
		}
	}
}

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.text === "string" && typeof item.done === "boolean";
}

/** Read the latest todo snapshot from a session branch (oldest first). Empty when none exists. */
export function getTodosFromBranch(branch: readonly SessionEntry[]): TodoItem[] {
	for (let i = branch.length - 1; i >= 0; i--) {
		const entry = branch[i];
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as Partial<TodoSnapshot> | undefined;
		if (data && Array.isArray(data.items)) {
			return data.items.filter(isTodoItem).map((item) => ({ text: item.text, done: item.done }));
		}
	}
	return [];
}

/** Plain-text rendering, one item per line. */
export function formatTodos(items: readonly TodoItem[]): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}
