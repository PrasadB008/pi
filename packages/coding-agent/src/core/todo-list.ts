/**
 * In-memory todo list backing the /todo slash command.
 * Items live for the lifetime of the process and are not persisted.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns its 1-based number, or undefined if the text is blank. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}
