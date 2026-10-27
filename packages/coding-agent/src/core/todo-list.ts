/**
 * In-memory todo list for the current interactive session (backs the /todo command).
 */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item and returns its 1-based number, or undefined for empty text. */
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

/** Renders the list as numbered lines, or undefined when empty. */
export function formatTodoList(items: readonly string[]): string | undefined {
	if (items.length === 0) return undefined;
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
