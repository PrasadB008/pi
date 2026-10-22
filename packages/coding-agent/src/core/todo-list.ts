export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [list] | /todo [add] <text> | /todo done <n> | /todo rm <n> | /todo clear";

export interface TodoCommandResult {
	/** Message to show to the user. */
	message: string;
	/** True when the message is a usage or input error. */
	isError: boolean;
}

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return "No todos. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

function parseIndex(arg: string, items: ReadonlyArray<TodoItem>): number | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const index = Number.parseInt(arg, 10) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/**
 * Apply the arguments of a /todo command to the list (mutating it) and return the message to show.
 * `args` is the text after "/todo".
 */
export function runTodoCommand(items: TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	const [subcommand = "", ...rest] = trimmed.split(/\s+/);
	const argText = rest.join(" ");

	if (trimmed === "" || subcommand === "list") {
		return { message: formatTodoList(items), isError: false };
	}

	if (subcommand === "clear") {
		items.length = 0;
		return { message: "Todo list cleared", isError: false };
	}

	if (subcommand === "done" || subcommand === "rm") {
		const index = parseIndex(argText, items);
		if (index === undefined) {
			return { message: `${TODO_USAGE}\nNo todo number ${JSON.stringify(argText)}`, isError: true };
		}
		if (subcommand === "done") {
			items[index].done = true;
			return { message: `Done: ${items[index].text}`, isError: false };
		}
		const [removed] = items.splice(index, 1);
		return { message: `Removed: ${removed.text}`, isError: false };
	}

	const text = subcommand === "add" ? argText : trimmed;
	if (!text) {
		return { message: TODO_USAGE, isError: true };
	}
	items.push({ text, done: false });
	return { message: `Added #${items.length}: ${text}`, isError: false };
}
