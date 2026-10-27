/** In-memory todo list for one interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	/** Add an item and return its 1-based number. Blank text is rejected. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Format items as a numbered list, one per line. */
export function formatTodoList(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
