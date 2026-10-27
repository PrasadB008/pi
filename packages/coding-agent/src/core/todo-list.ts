/**
 * In-memory todo list for the `/todo` slash command.
 * Items live for the lifetime of the interactive session and are cleared by `/new`.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns its 1-based number, or undefined when the text is blank. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
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
