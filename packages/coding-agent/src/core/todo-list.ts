/** In-memory todo list for the current interactive session (not persisted). */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item. Returns false (and adds nothing) when the text is blank. */
	add(text: string): boolean {
		const item = text.trim();
		if (!item) return false;
		this.items.push(item);
		return true;
	}

	list(): readonly string[] {
		return this.items;
	}
}
