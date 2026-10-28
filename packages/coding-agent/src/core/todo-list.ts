/** In-memory todo list for one interactive session, driven by the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item and returns it trimmed. Returns undefined when the text is blank. */
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
