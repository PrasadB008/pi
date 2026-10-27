/** In-memory todo list for one interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item. Returns false when the text is empty after trimming. */
	add(text: string): boolean {
		const item = text.trim();
		if (!item) return false;
		this.items.push(item);
		return true;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Formats items as a numbered list, or a hint when there are none. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todos yet. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
