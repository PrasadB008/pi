import type { SessionEntry } from "./session-manager.ts";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

/**
 * Read the current todo list from a session branch.
 * The `todo` tool (see examples/extensions/todo.ts) stores its full list in each result's details,
 * so the last `todo` tool result holds the current state.
 */
export function getTodosFromBranch(entries: readonly SessionEntry[]): TodoItem[] {
	let todos: TodoItem[] = [];
	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (msg.role !== "toolResult" || msg.toolName !== "todo") continue;
		const details = msg.details as { todos?: unknown } | undefined;
		if (details && Array.isArray(details.todos)) {
			todos = details.todos as TodoItem[];
		}
	}
	return todos;
}
