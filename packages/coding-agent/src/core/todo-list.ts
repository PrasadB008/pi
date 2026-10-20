export interface TodoItem {
	text: string;
	done: boolean;
}

export type TodoCommandResult = { ok: true; todos: TodoItem[] } | { ok: false; error: string };

/** Apply `/todo` arguments (the text after "/todo") to a list. Never mutates the input. */
export function applyTodoCommand(todos: ReadonlyArray<TodoItem>, args: string): TodoCommandResult {
	const [subcommand = "", ...rest] = args.trim().split(/\s+/);
	const argument = rest.join(" ").trim();
	const copy = todos.map((todo) => ({ ...todo }));

	if (subcommand === "") {
		return { ok: true, todos: copy };
	}
	if (subcommand === "add") {
		if (!argument) return { ok: false, error: "Usage: /todo add <text>" };
		copy.push({ text: argument, done: false });
		return { ok: true, todos: copy };
	}
	if (subcommand === "done") {
		const todo = /^\d+$/.test(argument) ? copy[Number.parseInt(argument, 10) - 1] : undefined;
		if (!todo) return { ok: false, error: "Usage: /todo done <n> (n is an item number from /todo)" };
		todo.done = true;
		return { ok: true, todos: copy };
	}
	if (subcommand === "clear") {
		return { ok: true, todos: [] };
	}
	return { ok: false, error: "Usage: /todo [add <text>|done <n>|clear]" };
}

export function formatTodos(todos: ReadonlyArray<TodoItem>): string {
	if (todos.length === 0) return "No todos. Use /todo add <text>";
	return todos.map((todo, i) => `${i + 1}. [${todo.done ? "x" : " "}] ${todo.text}`).join("\n");
}
