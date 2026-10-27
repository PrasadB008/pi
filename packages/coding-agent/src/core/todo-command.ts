export type TodoCommandResult =
	| { kind: "list"; items: string[] }
	| { kind: "added"; items: string[]; added: string };

/**
 * Apply a `/todo` command to a todo list.
 * With text, returns a new list with the text appended. Without text, returns the list unchanged.
 * The input list is never mutated.
 */
export function runTodoCommand(items: readonly string[], text: string): TodoCommandResult {
	const added = text.trim();
	if (!added) {
		return { kind: "list", items: [...items] };
	}
	return { kind: "added", items: [...items, added], added };
}

/** Format todo items as a numbered list, or a hint when the list is empty. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) {
		return "No todo items. Add one with /todo <text>";
	}
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
