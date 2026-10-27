/**
 * In-memory todo list for the current interactive session.
 * Items are not persisted to the session file.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when the text is empty. */
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
