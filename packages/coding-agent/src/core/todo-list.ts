export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommandResult = { items: TodoItem[]; error?: undefined } | { items: TodoItem[]; error: string };

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

/** Apply the arguments of a `/todo` command to a list. Never mutates the input list. */
export function applyTodoCommand(items: readonly TodoItem[], args: string): TodoCommandResult {
	const [subcommand = "", ...rest] = args.trim().split(/\s+/);
	const argument = rest.join(" ").trim();
	const current = items.map((item) => ({ ...item }));

	const parseIndex = (): number | undefined => {
		const index = Number.parseInt(argument, 10);
		if (!/^\d+$/.test(argument) || index < 1 || index > current.length) return undefined;
		return index - 1;
	};
	const badIndex: TodoCommandResult = {
		items: current,
		error: `Todo number must be between 1 and ${current.length}`,
	};

	switch (subcommand) {
		case "":
		case "list":
			return { items: current };
		case "add":
			if (!argument) return { items: current, error: TODO_USAGE };
			current.push({ text: argument, done: false });
			return { items: current };
		case "done": {
			const index = parseIndex();
			if (index === undefined) return badIndex;
			current[index].done = true;
			return { items: current };
		}
		case "remove": {
			const index = parseIndex();
			if (index === undefined) return badIndex;
			current.splice(index, 1);
			return { items: current };
		}
		case "clear":
			return { items: [] };
		default:
			return { items: current, error: TODO_USAGE };
	}
}

export function formatTodoList(items: readonly TodoItem[]): string {
	if (items.length === 0) return "No todos. Use /todo add <text>.";
	return items.map((item, i) => `${i + 1}. [${item.done ? "x" : " "}] ${item.text}`).join("\n");
}
