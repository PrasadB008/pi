export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Text to show on success. */
	message?: string;
	/** Usage or validation error to show as a warning. */
	error?: string;
}

export const TODO_USAGE = "Usage: /todo [list | add <text> | done <n> | undo <n> | rm <n> | clear]";

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) {
		return "No todos. Add one with /todo add <text>";
	}
	return items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

function parseIndex(arg: string, items: ReadonlyArray<TodoItem>): number | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const index = Number.parseInt(arg, 10) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/**
 * Apply the arguments of a `/todo` command to `items` (mutates the array).
 * `args` is the text after `/todo`.
 */
export function runTodoCommand(items: TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	const match = /^(\S+)\s*(.*)$/s.exec(trimmed);
	const subcommand = match ? match[1].toLowerCase() : "list";
	const rest = match ? match[2].trim() : "";

	switch (subcommand) {
		case "list":
			return { message: formatTodoList(items) };
		case "add": {
			if (!rest) return { error: "Usage: /todo add <text>" };
			items.push({ text: rest, done: false });
			return { message: `Added todo ${items.length}: ${rest}` };
		}
		case "done":
		case "undo":
		case "rm": {
			const index = parseIndex(rest, items);
			if (index === undefined) {
				return { error: items.length === 0 ? "No todos." : `Usage: /todo ${subcommand} <1-${items.length}>` };
			}
			if (subcommand === "rm") {
				const [removed] = items.splice(index, 1);
				return { message: `Removed todo: ${removed.text}` };
			}
			items[index].done = subcommand === "done";
			return { message: formatTodoList(items) };
		}
		case "clear": {
			const before = items.length;
			const remaining = items.filter((item) => !item.done);
			items.splice(0, items.length, ...remaining);
			return { message: `Cleared ${before - remaining.length} completed todo(s)` };
		}
		default:
			return { error: TODO_USAGE };
	}
}
