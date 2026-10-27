/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when it is empty. */
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

/** Parse "/todo" or "/todo <text>" input. Returns the argument text (possibly empty). */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
