/** In-memory todo list for one interactive session. */
export class TodoList {
	private items: string[];

	constructor() {
		this.items = [];
	}

	/** Add an item. Returns the trimmed text, or undefined if it was empty. */
	add(text: string): string | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return item;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Parse "/todo" or "/todo <text>" input. Returns the trimmed argument ("" for none). */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}
