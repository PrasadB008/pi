/** Session-scoped todo list backing the /todo slash command. Not persisted. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns the trimmed text, or undefined if the text was empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	/** Snapshot of the current items, in insertion order. */
	list(): string[] {
		return [...this.items];
	}
}

/** Extract the argument of a "/todo [text]" input line. */
export function parseTodoArgument(input: string): string {
	return input.replace(/^\/todo\s*/, "").trim();
}
