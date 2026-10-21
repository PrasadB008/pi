export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | remove <n> | clear]";

export interface TodoCommandResult {
	todos: TodoItem[];
	error?: string;
}

/** Apply the arguments of a `/todo` command (without the leading `/todo`) to a list. Does not mutate the input. */
export function applyTodoCommand(current: readonly TodoItem[], args: string): TodoCommandResult {
	const todos = current.map((todo) => ({ ...todo }));
	const trimmed = args.trim();
	const [subcommand = "", ...rest] = trimmed.split(/\s+/);
	const argument = rest.join(" ").trim();

	const fail = (message: string): TodoCommandResult => ({ todos, error: message });
	const parseIndex = (): number | undefined => {
		if (!/^\d+$/.test(argument)) return undefined;
		const index = Number.parseInt(argument, 10);
		return index >= 1 && index <= todos.length ? index - 1 : undefined;
	};

	switch (subcommand) {
		case "":
		case "list":
			return { todos };
		case "add":
			if (!argument) return fail(TODO_USAGE);
			todos.push({ text: argument, done: false });
			return { todos };
		case "done": {
			const index = parseIndex();
			if (index === undefined) return fail(`Invalid todo number: ${argument || "(missing)"}. ${TODO_USAGE}`);
			todos[index].done = true;
			return { todos };
		}
		case "remove": {
			const index = parseIndex();
			if (index === undefined) return fail(`Invalid todo number: ${argument || "(missing)"}. ${TODO_USAGE}`);
			todos.splice(index, 1);
			return { todos };
		}
		case "clear":
			return { todos: [] };
		default:
			return fail(TODO_USAGE);
	}
}
