import type { SessionEntry } from "./session-manager.ts";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

/**
 * Return the todo list kept by the `todo` tool. The latest `todo` tool result on the
 * branch carries the full list in its details, so the last one wins.
 */
export function getTodosFromBranch(branch: readonly SessionEntry[]): TodoItem[] {
	let todos: TodoItem[] = [];
	for (const entry of branch) {
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (msg.role !== "toolResult" || msg.toolName !== "todo") continue;
		const details = msg.details as { todos?: TodoItem[] } | undefined;
		if (details && Array.isArray(details.todos)) {
			todos = details.todos;
		}
	}
	return todos;
}

export function formatTodoList(todos: readonly TodoItem[]): string {
	const doneCount = todos.filter((todo) => todo.done).length;
	const lines = [`Todos (${doneCount}/${todos.length} done)`];
	for (const todo of todos) {
		lines.push(`  [${todo.done ? "x" : " "}] #${todo.id} ${todo.text}`);
	}
	return lines.join("\n");
}
