/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item. Returns the stored text, or undefined if it was empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}

	/** Numbered lines for display, e.g. "1. write tests". */
	format(): string[] {
		return this.items.map((item, index) => `${index + 1}. ${item}`);
	}
}
