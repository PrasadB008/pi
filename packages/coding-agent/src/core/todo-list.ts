/** In-memory todo list for the current interactive session (backs the /todo command). */
export class TodoList {
	private items: string[] = [];

	/** Adds a trimmed item. Returns its 1-based position, or undefined if the text is empty. */
	add(text: string): number | undefined {
		const item = text.trim();
		if (!item) return undefined;
		this.items.push(item);
		return this.items.length;
	}

	list(): ReadonlyArray<string> {
		return this.items;
	}

	clear(): void {
		this.items = [];
	}
}

/** Parses "/todo" input: returns the item text, or "" when the user only typed "/todo". */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}

export function formatTodoList(items: ReadonlyArray<string>): string {
	if (items.length === 0) return "No todos yet. Add one with /todo <text>";
	return ["Todos:", ...items.map((item, i) => `${i + 1}. ${item}`)].join("\n");
}
