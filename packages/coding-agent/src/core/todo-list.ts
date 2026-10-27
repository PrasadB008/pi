/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item. Returns false (and adds nothing) when the text is empty. */
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
