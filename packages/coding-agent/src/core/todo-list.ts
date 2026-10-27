/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item and returns its 1-based number, or undefined if the text is empty. */
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

/** Returns the argument text of a "/todo" command line ("" when there is none). */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
