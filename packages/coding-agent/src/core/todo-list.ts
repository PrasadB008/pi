export type TodoCommandResult =
	| { kind: "added"; item: string; count: number }
	| { kind: "list"; items: string[] }
	| { kind: "empty" };

/**
 * Apply a `/todo` command line to a todo list.
 * `/todo <text>` appends the trimmed text; `/todo` alone reports the current items.
 */
export function applyTodoCommand(todos: string[], text: string): TodoCommandResult {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		todos.push(item);
		return { kind: "added", item, count: todos.length };
	}
	if (todos.length === 0) {
		return { kind: "empty" };
	}
	return { kind: "list", items: [...todos] };
}
