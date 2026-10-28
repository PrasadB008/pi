/**
 * In-memory todo list backing the built-in `/todo` slash command.
 * Items live for the lifetime of the current session and are not persisted.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when the text is empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	getItems(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Parse `/todo [text]` input. Returns the argument text (empty when listing). */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}

/** Format items as a numbered list, one per line. */
export function formatTodoItems(items: readonly string[]): string {
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
