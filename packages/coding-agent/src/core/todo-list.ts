/** In-memory todo list backing the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item and returns the new item count. Blank text is ignored. */
	add(text: string): number {
		const item = text.trim();
		if (item) this.items.push(item);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	/** Numbered lines, one per item. */
	format(): string[] {
		return this.items.map((item, index) => `${index + 1}. ${item}`);
	}
}
