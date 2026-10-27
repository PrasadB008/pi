/** In-memory todo list backing the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Add an item and return its 1-based position. Blank text is ignored (returns 0). */
	add(text: string): number {
		const item = text.trim();
		if (!item) return 0;
		this.items.push(item);
		return this.items.length;
	}

	list(): string[] {
		return [...this.items];
	}
}
