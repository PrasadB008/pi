/** In-memory todo list for the current interactive session. Not persisted to the session file. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when it is empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	getItems(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}

	/** Numbered plain-text listing, or undefined when the list is empty. */
	format(): string | undefined {
		if (this.items.length === 0) return undefined;
		return this.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
	}
}
