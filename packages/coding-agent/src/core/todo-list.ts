export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	todos: TodoItem[];
	message: string;
	isError: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | rm <n> | clear]";

/**
 * Apply the arguments of a `/todo` command (everything after "/todo") to a todo list.
 * Does not mutate the input list.
 */
export function applyTodoCommand(todos: readonly TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	const [subcommand = "", ...rest] = trimmed.split(/\s+/);
	const argument = rest.join(" ").trim();
	const current = todos.map((todo) => ({ ...todo }));
	const error = (message: string): TodoCommandResult => ({ todos: current, message, isError: true });
	const ok = (next: TodoItem[], message: string): TodoCommandResult => ({
		todos: next,
		message,
		isError: false,
	});

	const parseIndex = (): number | undefined => {
		if (!/^\d+$/.test(argument)) return undefined;
		const index = Number.parseInt(argument, 10);
		return index >= 1 && index <= current.length ? index - 1 : undefined;
	};

	switch (subcommand) {
		case "": {
			if (current.length === 0) return ok(current, "No todos. Add one with /todo add <text>");
			const lines = current.map((todo, i) => `${i + 1}. [${todo.done ? "x" : " "}] ${todo.text}`);
			return ok(current, `Todos:\n${lines.join("\n")}`);
		}
		case "add": {
			if (!argument) return error(TODO_USAGE);
			const next = [...current, { text: argument, done: false }];
			return ok(next, `Added todo ${next.length}: ${argument}`);
		}
		case "done": {
			const index = parseIndex();
			if (index === undefined) return error(`Invalid todo number. ${TODO_USAGE}`);
			current[index].done = true;
			return ok(current, `Completed todo ${index + 1}: ${current[index].text}`);
		}
		case "rm": {
			const index = parseIndex();
			if (index === undefined) return error(`Invalid todo number. ${TODO_USAGE}`);
			const [removed] = current.splice(index, 1);
			return ok(current, `Removed todo: ${removed.text}`);
		}
		case "clear":
			return ok([], "Cleared all todos");
		default:
			return error(TODO_USAGE);
	}
}
