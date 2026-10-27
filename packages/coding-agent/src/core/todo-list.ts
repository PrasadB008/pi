/**
 * In-memory todo list backing the /todo slash command.
 * Items live for the lifetime of the interactive session process; they are not persisted.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined if the text was empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}

	get size(): number {
		return this.items.length;
	}
}

/** Extract the argument text from a "/todo" or "/todo <text>" input line. */
export function parseTodoArgument(input: string): string {
	return input.replace(/^\/todo\b\s*/, "").trim();
}

/** Format the list as numbered lines, or a hint when empty. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todos yet. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
