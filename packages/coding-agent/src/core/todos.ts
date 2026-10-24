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
 * Return the todo list from the most recent `todo` tool result on the given session branch.
 * The `todo` tool stores the full list in `details.todos` on every result, so the last one wins.
 */
export function getTodosFromBranch(entries: ReadonlyArray<SessionEntry>): TodoItem[] {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "message") continue;
		const message = entry.message;
		if (message.role !== "toolResult" || message.toolName !== "todo") continue;
		const details = message.details as { todos?: unknown } | undefined;
		if (!details || !Array.isArray(details.todos)) continue;
		return details.todos.filter(isTodoItem);
	}
	return [];
}

export function formatTodosMarkdown(todos: ReadonlyArray<TodoItem>): string {
	if (todos.length === 0) return "No todos on the current branch.";
	const done = todos.filter((t) => t.done).length;
	const lines = todos.map((t) => `- [${t.done ? "x" : " "}] #${t.id} ${t.text}`);
	return [`${done}/${todos.length} completed`, "", ...lines].join("\n");
}
