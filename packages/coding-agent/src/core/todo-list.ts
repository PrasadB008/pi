/** In-memory todo list for an interactive session. Backs the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when it is empty. */
	add(text: string): string | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return trimmed;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Parse "/todo" or "/todo <text>". Returns the item text, "" when listing. */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
