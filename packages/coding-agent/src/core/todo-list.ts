export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Message to show. Lines are plain text. */
	message: string;
	/** True when the message reports a usage or input error. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | undone <n> | remove <n> | clear]";

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	return items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

function parseIndex(arg: string, items: ReadonlyArray<TodoItem>): number | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const index = Number.parseInt(arg, 10) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/**
 * Apply a `/todo` command to the list (mutating it) and return the message to show.
 * `text` is the full command line, for example "/todo add write tests".
 */
export function runTodoCommand(text: string, items: TodoItem[]): TodoCommandResult {
	const rest = text.replace(/^\/todo\s*/, "").trim();
	if (!rest) return { message: formatTodoList(items), isError: false };

	const match = /^(\S+)\s*([\s\S]*)$/.exec(rest);
	const subcommand = match?.[1] ?? "";
	const arg = (match?.[2] ?? "").trim();

	switch (subcommand) {
		case "add": {
			if (!arg) return { message: "Usage: /todo add <text>", isError: true };
			items.push({ text: arg, done: false });
			return { message: `Added todo ${items.length}: ${arg}`, isError: false };
		}
		case "done":
		case "undone": {
			const index = parseIndex(arg, items);
			if (index === undefined) return { message: `Usage: /todo ${subcommand} <n> (1-${items.length})`, isError: true };
			const item = items[index];
			item.done = subcommand === "done";
			return { message: formatTodoList(items), isError: false };
		}
		case "remove": {
			const index = parseIndex(arg, items);
			if (index === undefined) return { message: `Usage: /todo remove <n> (1-${items.length})`, isError: true };
			const [removed] = items.splice(index, 1);
			return { message: `Removed todo: ${removed.text}`, isError: false };
		}
		case "clear": {
			items.length = 0;
			return { message: "Cleared all todos", isError: false };
		}
		default:
			return { message: TODO_USAGE, isError: true };
	}
}
