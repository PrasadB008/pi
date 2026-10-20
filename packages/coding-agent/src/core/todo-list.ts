export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	message: string;
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | clear]";

export function formatTodoList(items: readonly TodoItem[]): string {
	if (items.length === 0) {
		return "No todos. Add one with /todo add <text>";
	}
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

/** Apply the arguments of a `/todo` command to a list. Never mutates `items`. */
export function runTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) {
		return { items: [...items], message: formatTodoList(items), isError: false };
	}

	const [subcommand = "", ...rest] = trimmed.split(/\s+/);
	const value = rest.join(" ");

	if (subcommand === "add" && value) {
		const next = [...items, { text: value, done: false }];
		return { items: next, message: `Added todo ${next.length}: ${value}`, isError: false };
	}
	if (subcommand === "done" && /^\d+$/.test(value)) {
		const index = Number(value) - 1;
		const item = items[index];
		if (!item) {
			return { items: [...items], message: `No todo ${value}`, isError: true };
		}
		const next = items.map((existing, i) => (i === index ? { ...existing, done: true } : existing));
		return { items: next, message: `Completed todo ${value}: ${item.text}`, isError: false };
	}
	if (subcommand === "clear" && !value) {
		return { items: [], message: "Cleared todos", isError: false };
	}
	return { items: [...items], message: TODO_USAGE, isError: true };
}
