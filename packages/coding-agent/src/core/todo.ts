export const TODO_CUSTOM_TYPE = "todo";

export interface TodoItem {
	text: string;
	done: boolean;
}

export interface TodoCommandResult {
	todos: TodoItem[];
	/** True when `todos` differs from the input and should be saved. */
	changed: boolean;
	/** Set when the command was invalid; `todos` is then the unchanged input. */
	error?: string;
}

/**
 * Apply the arguments of `/todo` to a todo list.
 * Empty args list, `clear` removes all, `done <n>` completes item n (1-based),
 * anything else is added as a new item.
 */
export function applyTodoCommand(todos: TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) return { todos, changed: false };
	if (trimmed === "clear") return { todos: [], changed: true };

	if (trimmed === "done" || trimmed.startsWith("done ")) {
		const match = /^done\s+(\d+)$/.exec(trimmed);
		if (!match) return { todos, changed: false, error: "Usage: /todo done <n>" };
		const index = Number.parseInt(match[1], 10) - 1;
		if (index < 0 || index >= todos.length) {
			return { todos, changed: false, error: `No todo number ${match[1]}` };
		}
		return { todos: todos.map((item, i) => (i === index ? { ...item, done: true } : item)), changed: true };
	}

	return { todos: [...todos, { text: trimmed, done: false }], changed: true };
}

export function formatTodoLines(todos: TodoItem[]): string[] {
	return todos.map((item, index) => `${index + 1}. [${item.done ? "x" : " "}] ${item.text}`);
}
