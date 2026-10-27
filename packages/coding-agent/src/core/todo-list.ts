/** In-memory todo list for one interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns false when the text is empty after trimming. */
	add(text: string): boolean {
		const trimmed = text.trim();
		if (!trimmed) return false;
		this.items.push(trimmed);
		return true;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Returns the trimmed text after "/todo" ("" when there is none). */
export function getTodoArgument(text: string): string {
	return text.slice("/todo".length).trim();
}
