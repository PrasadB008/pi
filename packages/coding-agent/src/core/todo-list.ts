/** In-memory todo list for a single interactive session. Not persisted. */
export class TodoList {
	private items: string[] = [];

	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	list(): readonly string[] {
		return this.items;
	}
}

/** Format items as a numbered list, or a usage hint when empty. */
export function formatTodoList(items: readonly string[]): string {
	if (items.length === 0) {
		return "No todo items. Add one with /todo <text>";
	}
	return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}
