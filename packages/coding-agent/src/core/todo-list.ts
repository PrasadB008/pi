/**
 * In-memory todo list for the current interactive session.
 * Items live only for the lifetime of the process; they are not written to the session file.
 */
export class TodoList {
	private readonly items: string[] = [];

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

/**
 * Parse the argument of a `/todo` input line.
 * Returns undefined when the line is not a /todo command, "" for a bare `/todo`.
 */
export function parseTodoCommand(text: string): string | undefined {
	if (text === "/todo") return "";
	if (text.startsWith("/todo ")) return text.slice("/todo".length).trim();
	return undefined;
}
