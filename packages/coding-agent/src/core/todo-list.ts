export interface TodoItem {
	text: string;
	done: boolean;
}

export const TODO_USAGE = "Usage: /todo [add <text> | done <n> | clear]";

export type TodoCommandResult = { ok: true } | { ok: false; error: string };

/** Apply the arguments of a /todo command to the list, mutating it in place. */
export function applyTodoCommand(todos: TodoItem[], args: string): TodoCommandResult {
	const trimmed = args.trim();
	if (!trimmed) return { ok: true };

	if (trimmed === "clear") {
		todos.length = 0;
		return { ok: true };
	}

	if (trimmed === "done" || trimmed.startsWith("done ")) {
		const match = /^done\s+(\d+)$/.exec(trimmed);
		if (!match) return { ok: false, error: TODO_USAGE };
		const todo = todos[Number.parseInt(match[1], 10) - 1];
		if (!todo) return { ok: false, error: `No todo number ${match[1]}` };
		todo.done = true;
		return { ok: true };
	}

	const text = (trimmed === "add" ? "" : trimmed.replace(/^add\s+/, "")).trim();
	if (!text) return { ok: false, error: TODO_USAGE };
	todos.push({ text, done: false });
	return { ok: true };
}

export function formatTodoList(todos: readonly TodoItem[]): string {
	if (todos.length === 0) return "No todos";
	return todos.map((todo, index) => `${index + 1}. [${todo.done ? "x" : " "}] ${todo.text}`).join("\n");
}
