/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/**
 * Parse a "/todo" input line. Returns the text to add, or undefined when the
 * command has no argument (list request).
 */
export function parseTodoCommand(text: string): string | undefined {
	const arg = text.replace(/^\/todo\s*/, "").trim();
	return arg ? arg : undefined;
}

export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todo items. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
