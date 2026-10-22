export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	items: TodoItem[];
	/** Set when the arguments were invalid. Items are returned unchanged in that case. */
	error?: string;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

function parseIndex(items: TodoItem[], argument: string): number | undefined {
	if (!/^\d+$/.test(argument)) return undefined;
	const index = Number.parseInt(argument, 10) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/** Apply the arguments of a `/todo` command to a list. Does not mutate the input. */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const current = items.map((item) => ({ ...item }));
	const [subcommand = "", ...rest] = args.trim().split(/\s+/);
	const argument = rest.join(" ").trim();

	switch (subcommand) {
		case "":
		case "list":
			return { items: current };
		case "add":
			if (!argument) return { items: current, error: TODO_USAGE };
			return { items: [...current, { text: argument, done: false }] };
		case "done":
		case "remove": {
			const index = parseIndex(current, argument);
			if (index === undefined) return { items: current, error: `Invalid todo number. ${TODO_USAGE}` };
			if (subcommand === "done") {
				current[index].done = true;
			} else {
				current.splice(index, 1);
			}
			return { items: current };
		}
		case "clear":
			return { items: [] };
		default:
			return { items: current, error: TODO_USAGE };
	}
}

export function formatTodoList(items: readonly TodoItem[]): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}
