export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

export interface TodoCommandResult {
	items: TodoItem[];
	/** Set when the arguments were invalid; items are returned unchanged. */
	error?: string;
}

/**
 * Apply the arguments of a /todo command (the text after "/todo") to a list.
 * Never mutates the input list. An empty argument string leaves the list unchanged.
 */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const current = items.map((item) => ({ ...item }));
	const match = args.trim().match(/^(\S+)\s*(.*)$/s);
	const action = match ? match[1] : "";
	const rest = match ? match[2].trim() : "";

	const fail = (error: string): TodoCommandResult => ({ items: current, error });
	const parseIndex = (): number | undefined => {
		const n = Number(rest);
		return Number.isInteger(n) && n >= 1 && n <= current.length ? n - 1 : undefined;
	};

	switch (action) {
		case "":
			return { items: current };
		case "add":
			if (!rest) return fail(TODO_USAGE);
			current.push({ text: rest, done: false });
			return { items: current };
		case "done": {
			const index = parseIndex();
			if (index === undefined) return fail(`Invalid todo number: ${rest || "(none)"}. ${TODO_USAGE}`);
			current[index].done = true;
			return { items: current };
		}
		case "remove": {
			const index = parseIndex();
			if (index === undefined) return fail(`Invalid todo number: ${rest || "(none)"}. ${TODO_USAGE}`);
			current.splice(index, 1);
			return { items: current };
		}
		case "clear":
			return { items: [] };
		default:
			return fail(TODO_USAGE);
	}
}
