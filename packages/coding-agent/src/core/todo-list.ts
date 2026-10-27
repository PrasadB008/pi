/** In-memory todo list used by the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item. Returns the new 1-based position, or undefined if the text is empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Formats items as a numbered list, one per line. */
export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
