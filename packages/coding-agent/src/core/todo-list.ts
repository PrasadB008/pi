export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	/** Todo list after applying the command. */
	todos: TodoItem[];
	/** Set when the command was invalid; the list is unchanged. */
	error?: string;
	/** Set when the command only prints a notice instead of the list. */
	notice?: string;
}

/** Apply the arguments of `/todo` to a list. Returns a new list; the input is not modified. */
export function applyTodoCommand(todos: readonly TodoItem[], args: string): TodoCommandResult {
	const current = todos.map((todo) => ({ ...todo }));
	const trimmed = args.trim();

	if (!trimmed) {
		return { todos: current };
	}
	if (trimmed === "clear") {
		return { todos: [], notice: "Todos cleared" };
	}

	const match = /^(done|rm)\s+(\d+)$/.exec(trimmed);
	if (match) {
		const index = Number(match[2]) - 1;
		const todo = current[index];
		if (!todo) {
			return { todos: current, error: `No todo #${match[2]}` };
		}
		if (match[1] === "done") {
			todo.done = true;
		} else {
			current.splice(index, 1);
		}
		return { todos: current };
	}
	if (/^(done|rm)(\s|$)/.test(trimmed)) {
		return { todos: current, error: "Usage: /todo done <n> | /todo rm <n>" };
	}

	current.push({ text: trimmed, done: false });
	return { todos: current };
}

export function formatTodoLines(todos: readonly TodoItem[]): string[] {
	return todos.map((todo, i) => `${i + 1}. [${todo.done ? "x" : " "}] ${todo.text}`);
}
