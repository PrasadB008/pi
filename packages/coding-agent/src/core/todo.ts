export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoResult {
	/** Message to show to the user. */
	message: string;
	/** True if the message is a usage or input error. */
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | rm <n> | clear]";

export function formatTodoList(items: ReadonlyArray<TodoItem>): string {
	if (items.length === 0) return "No todos. Add one with /todo add <text>";
	return items.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}

function parseIndex(arg: string, items: ReadonlyArray<TodoItem>): number | undefined {
	if (!/^\d+$/.test(arg)) return undefined;
	const index = Number(arg) - 1;
	return index >= 0 && index < items.length ? index : undefined;
}

/** Apply the argument string of a /todo command to the list (mutating it) and describe the outcome. */
export function applyTodoCommand(items: TodoItem[], args: string): TodoResult {
	const trimmed = args.trim();
	if (!trimmed) return { message: formatTodoList(items), isError: false };

	const match = /^(\S+)\s*(.*)$/s.exec(trimmed);
	const subcommand = match?.[1] ?? "";
	const rest = (match?.[2] ?? "").trim();

	switch (subcommand) {
		case "add": {
			if (!rest) return { message: "Usage: /todo add <text>", isError: true };
			items.push({ text: rest, done: false });
			return { message: `Added todo ${items.length}: ${rest}`, isError: false };
		}
		case "done": {
			const index = parseIndex(rest, items);
			if (index === undefined) return { message: `No todo ${rest || "(missing number)"}. Usage: /todo done <n>`, isError: true };
			const item = items[index];
			item.done = !item.done;
			return { message: `${item.done ? "Completed" : "Reopened"} todo ${index + 1}: ${item.text}`, isError: false };
		}
		case "rm": {
			const index = parseIndex(rest, items);
			if (index === undefined) return { message: `No todo ${rest || "(missing number)"}. Usage: /todo rm <n>`, isError: true };
			const [removed] = items.splice(index, 1);
			return { message: `Removed todo ${index + 1}: ${removed.text}`, isError: false };
		}
		case "clear": {
			items.length = 0;
			return { message: "Cleared all todos", isError: false };
		}
		default:
			return { message: TODO_USAGE, isError: true };
	}
}
