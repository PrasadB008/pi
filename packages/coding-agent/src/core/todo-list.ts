/** In-memory todo list for one interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns its 1-based number, or undefined when the text is blank. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Parse the argument of a `/todo` input line. Empty string means "list". */
export function parseTodoArgument(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}

export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
