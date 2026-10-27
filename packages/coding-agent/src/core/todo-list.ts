/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: string[] = [];

	/** Add an item. Returns false when the text is empty after trimming. */
	add(text: string): boolean {
		const item = text.trim();
		if (!item) return false;
		this.items.push(item);
		return true;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Extract the argument of "/todo [text]". */
export function parseTodoCommand(text: string): string {
	return text.replace(/^\/todo\s*/, "").trim();
}

/** Format items as a numbered list, or a hint when empty. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) return "No todo items. Add one with /todo <text>";
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
