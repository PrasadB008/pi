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

/** Returns the argument of a `/todo` input, or undefined when the input is not a `/todo` command. */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo ".length).trim();
	return undefined;
}
