/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Adds an item. Returns its 1-based number, or undefined if the text is blank. */
	add(text: string): number | undefined {
		const trimmed = text.trim();
		if (!trimmed) return undefined;
		this.items.push(trimmed);
		return this.items.length;
	}

	list(): ReadonlyArray<string> {
		return this.items;
	}
}

/** Extracts the argument from "/todo" or "/todo <text>". */
export function parseTodoArgs(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
