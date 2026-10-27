/**
 * In-memory todo list scoped to one interactive session.
 */
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

	/** Numbered, newline-separated rendering of the list. */
	format(): string {
		if (this.items.length === 0) return "No todo items. Use /todo <text> to add one.";
		return `Todo list:\n${this.items.map((item, index) => `${index + 1}. ${item}`).join("\n")}`;
	}

	clear(): void {
		this.items = [];
	}
}
