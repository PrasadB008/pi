import type { SessionEntry } from "./session-manager.ts";

/** Custom session entry type used by the /todo command. */
export const TODO_ENTRY_TYPE = "todo";

/** Extract todo texts, in order, from session entries. Entries of other types are ignored. */
export function getTodos(entries: readonly SessionEntry[]): string[] {
	const todos: string[] = [];
	for (const entry of entries) {
		if (entry.type !== "custom" || entry.customType !== TODO_ENTRY_TYPE) continue;
		const data = entry.data as { text?: unknown } | undefined;
		if (typeof data?.text === "string") todos.push(data.text);
	}
	return todos;
}

/** Format todos as a numbered list, or a usage hint when empty. */
export function formatTodos(todos: readonly string[]): string {
	if (todos.length === 0) return "No todos. Usage: /todo <text>";
	return `Todos:\n${todos.map((todo, index) => `${index + 1}. ${todo}`).join("\n")}`;
}
