/**
 * In-memory todo list for one interactive session. Not saved with the session file.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when it is empty. */
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

/** Parse `/todo` or `/todo <text>`. Returns the item text ("" when listing), or undefined if not a /todo command. */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo ".length).trim();
	return undefined;
}
