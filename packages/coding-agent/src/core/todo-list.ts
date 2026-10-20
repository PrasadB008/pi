import type { SessionEntry } from "./session-manager.ts";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

/**
 * Return the todo list as of the end of the given branch.
 *
 * Todo state lives in the `details` of `todo` tool results (see
 * examples/extensions/todo.ts); each result carries the full list, so the
 * last one wins.
 */
export function getTodosFromBranch(entries: ReadonlyArray<SessionEntry>): TodoItem[] {
	let todos: TodoItem[] = [];
	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const message = entry.message;
		if (message.role !== "toolResult" || message.toolName !== "todo") continue;
		const details = message.details as { todos?: unknown } | undefined;
		if (details && Array.isArray(details.todos)) {
			todos = details.todos as TodoItem[];
		}
	}
	return todos;
}

/** Plain-text lines for a todo list, one per item, preceded by a summary. */
export function formatTodoLines(todos: ReadonlyArray<TodoItem>): string[] {
	if (todos.length === 0) return ["No todos on the current branch"];
	const done = todos.filter((todo) => todo.done).length;
	return [
		`Todos (${done}/${todos.length} completed)`,
		...todos.map((todo) => `${todo.done ? "[x]" : "[ ]"} #${todo.id} ${todo.text}`),
	];
}
