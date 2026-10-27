/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns false when the text is empty after trimming. */
	add(text: string): boolean {
		const trimmed = text.trim();
		if (!trimmed) return false;
		this.items.push(trimmed);
		return true;
	}

	list(): readonly string[] {
		return this.items;
	}
}
