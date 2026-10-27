/**
 * In-memory todo list for the current interactive session.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined when the text is empty. */
	add(text: string): string | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return trimmed;
	}

	list(): readonly string[] {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Returns the argument of a "/todo" command ("" when alone), or undefined when text is not a /todo command. */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo ".length).trim();
	return undefined;
}
