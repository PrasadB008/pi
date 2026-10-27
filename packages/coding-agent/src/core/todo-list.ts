/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item. Returns the trimmed text, or undefined if it was empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}
