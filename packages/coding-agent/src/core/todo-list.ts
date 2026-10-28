/** In-memory todo list for the current interactive session. Not persisted to the session file. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns its 1-based position, or undefined if the text is empty. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}
