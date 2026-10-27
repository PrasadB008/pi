/** In-memory todo list for the current session, used by the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item. Returns false if the text is empty after trimming. */
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
