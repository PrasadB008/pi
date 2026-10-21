export const TODO_CUSTOM_ENTRY_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoAction =
	| { type: "list" }
	| { type: "add"; text: string }
	| { type: "toggle"; index: number }
	| { type: "remove"; index: number }
	| { type: "clear" }
	| { type: "error"; message: string };

const USAGE = "Usage: /todo [add <text> | done <n> | rm <n> | clear]";

function parseIndex(arg: string, command: string): TodoAction {
	const index = Number.parseInt(arg, 10);
	if (!/^\d+$/.test(arg) || index < 1) {
		return { type: "error", message: `Usage: /todo ${command} <n>` };
	}
	return command === "rm" ? { type: "remove", index: index - 1 } : { type: "toggle", index: index - 1 };
}

/** Parse the full "/todo ..." input line. Indexes in actions are 0-based. */
export function parseTodoCommand(text: string): TodoAction {
	const args = text.replace(/^\/todo\s*/, "").trim();
	if (!args) return { type: "list" };
	const [command, ...rest] = args.split(/\s+/);
	const arg = rest.join(" ");
	switch (command) {
		case "add":
			return arg ? { type: "add", text: arg } : { type: "error", message: "Usage: /todo add <text>" };
		case "done":
			return parseIndex(arg, "done");
		case "rm":
			return parseIndex(arg, "rm");
		case "clear":
			return { type: "clear" };
		default:
			return { type: "error", message: USAGE };
	}
}

/** Apply a mutating action. Returns the new list, or an error message if the index is out of range. */
export function applyTodoAction(
	items: ReadonlyArray<TodoItem>,
	action: TodoAction,
): { items: TodoItem[] } | { error: string } {
	switch (action.type) {
		case "add":
			return { items: [...items, { text: action.text, done: false }] };
		case "toggle":
		case "remove": {
			if (action.index >= items.length) return { error: `No todo #${action.index + 1}` };
			if (action.type === "remove") return { items: items.filter((_, i) => i !== action.index) };
			return { items: items.map((item, i) => (i === action.index ? { ...item, done: !item.done } : item)) };
		}
		case "clear":
			return { items: [] };
		default:
			return { items: [...items] };
	}
}

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return "No todos. Use /todo add <text>";
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

/** Validate persisted entry data; returns an empty list for malformed data. */
export function readTodoItems(data: unknown): TodoItem[] {
	if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) return [];
	const items: TodoItem[] = [];
	for (const raw of (data as { items: unknown[] }).items) {
		if (raw && typeof raw === "object") {
			const { text, done } = raw as { text?: unknown; done?: unknown };
			if (typeof text === "string") items.push({ text, done: done === true });
		}
	}
	return items;
}
