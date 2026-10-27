/** In-memory todo list for the running interactive session. Not persisted to the session file. */
export class TodoList {
	private items: string[] = [];

	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}
}
