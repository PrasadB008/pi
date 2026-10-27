/**
 * In-memory todo list for the current interactive session.
 * Not persisted: it lives as long as the interactive mode instance.
 */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns false if the text is empty after trimming. */
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

/** Extract the argument of a "/todo" command line ("/todo buy milk" -> "buy milk"). */
export function parseTodoArgument(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
