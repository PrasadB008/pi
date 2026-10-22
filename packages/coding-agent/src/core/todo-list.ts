export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	/** Text to show the user. */
	message: string;
	isError: boolean;
}

const USAGE = "Usage: /todo [add <text> | done <n> | rm <n> | clear]";

function formatList(items: TodoItem[]): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	return items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

/** Apply the arguments of a `/todo` command to a todo list without mutating the input. */
export function applyTodoCommand(items: TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed || trimmed === "list") {
		return { items, message: formatList(items), isError: false };
	}

	const [subcommand, ...rest] = trimmed.split(/\s+/);
	const argument = trimmed.slice(subcommand.length).trim();

	if (subcommand === "clear") {
		return { items: [], message: "Cleared all todos", isError: false };
	}

	if (subcommand === "add") {
		if (!argument) return { items, message: "Usage: /todo add <text>", isError: true };
		const next = [...items, { text: argument, done: false }];
		return { items: next, message: formatList(next), isError: false };
	}

	if (subcommand === "done" || subcommand === "rm") {
		const number = Number(rest[0]);
		if (rest.length !== 1 || !Number.isInteger(number) || number < 1 || number > items.length) {
			return {
				items,
				message: `Usage: /todo ${subcommand} <n> (n is between 1 and ${items.length})`,
				isError: true,
			};
		}
		const index = number - 1;
		const next =
			subcommand === "rm"
				? items.filter((_, i) => i !== index)
				: items.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
		return { items: next, message: formatList(next), isError: false };
	}

	return { items, message: USAGE, isError: true };
}
