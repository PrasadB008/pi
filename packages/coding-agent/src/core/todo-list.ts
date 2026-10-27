/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item and returns its 1-based number, or undefined if the text is empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) {
			return undefined;
		}
		this.items.push(item);
		return this.items.length;
	}

	list(): ReadonlyArray<string> {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}
