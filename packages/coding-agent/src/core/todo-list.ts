/**
 * In-memory todo list for an interactive session, driven by the /todo slash command.
 * Items are not persisted to the session file.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined if it was empty. */
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

/** Extract the argument from "/todo" or "/todo <text>" input. */
export function parseTodoArgument(input: string): string {
	return input.replace(/^\/todo\s*/, "").trim();
}
