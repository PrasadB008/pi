import type { SessionEntry } from "./session-manager.ts";

export interface TodoItem {
	id: number;
	text: string;
	done: boolean;
}

function isTodoItem(value: unknown): value is TodoItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return typeof item.id === "number" && typeof item.text === "string" && typeof item.done === "boolean";
}

/**
 * The `todo` tool stores its full list in each tool result's details.
 * The last such result on the branch holds the current list.
 */
export function extractTodos(entries: readonly SessionEntry[]): TodoItem[] {
	let todos: TodoItem[] = [];
	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const msg = entry.message;
		if (msg.role !== "toolResult" || msg.toolName !== "todo") continue;
		const details = msg.details as { todos?: unknown } | undefined;
		if (details && Array.isArray(details.todos)) {
			todos = details.todos.filter(isTodoItem);
		}
	}
	return todos;
}
