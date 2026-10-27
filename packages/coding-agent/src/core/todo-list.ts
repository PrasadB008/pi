/** In-memory todo list for the current interactive session. */
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

/** Returns the argument of a "/todo" command, or undefined if text is not a /todo command. */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo".length).trim();
	return undefined;
}
