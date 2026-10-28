/** In-memory todo list used by the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Add a trimmed item. Returns the new item count, or undefined when the text is empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	getItems(): readonly string[] {
		return this.items;
	}

	/** Numbered list, one item per line. Empty string when there are no items. */
	format(): string {
		return this.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
	}
}

/** Extract the argument of a "/todo" command line. */
export function parseTodoArgument(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
