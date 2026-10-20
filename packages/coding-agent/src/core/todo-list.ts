export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoResult {
	items: TodoItem[];
	/** "list" is the formatted list, "status" a confirmation, "error" an invalid request. */
	kind: "list" | "status" | "error";
	message: string;
}

export const TODO_USAGE = "Usage: /todo <text> | /todo done <n> | /todo clear";

/** Apply the arguments of a `/todo` command to a list. Returns a new list; the input is not modified. */
export function applyTodoCommand(items: readonly TodoItem[], rawArgs: string): TodoResult {
	const args = rawArgs.trim();

	if (args === "clear") {
		return { items: [], kind: "status", message: "Todo list cleared" };
	}

	const doneMatch = /^done\s+(\d+)$/.exec(args);
	if (doneMatch) {
		const index = Number(doneMatch[1]) - 1;
		const item = items[index];
		if (!item) {
			return { items: [...items], kind: "error", message: `No todo item ${doneMatch[1]}` };
		}
		const next = items.map((existing, i) => (i === index ? { ...existing, done: true } : { ...existing }));
		return { items: next, kind: "status", message: `Done: ${item.text}` };
	}

	if (args) {
		const next = [...items.map((item) => ({ ...item })), { text: args, done: false }];
		return { items: next, kind: "status", message: `Todo added (${next.length}): ${args}` };
	}

	if (items.length === 0) {
		return { items: [], kind: "status", message: `No todo items. ${TODO_USAGE}` };
	}
	const lines = items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`);
	return { items: items.map((item) => ({ ...item })), kind: "list", message: `Todo\n\n${lines.join("\n")}` };
}
