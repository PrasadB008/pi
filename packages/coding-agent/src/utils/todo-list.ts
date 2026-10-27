/**
 * Simple todo list manager for session todos.
 */
export class TodoList {
	private items: string[] = [];

	/**
	 * Add a todo item to the list.
	 */
	add(text: string): void {
		this.items.push(text);
	}

	/**
	 * Get all todo items.
	 */
	getItems(): readonly string[] {
		return this.items;
	}

	/**
	 * Get formatted todo list as a string.
	 */
	format(): string {
		if (this.items.length === 0) {
			return "No todo items";
		}
		return this.items.map((item, i) => `${i + 1}. ${item}`).join("\n");
	}

	/**
	 * Clear all todo items.
	 */
	clear(): void {
		this.items = [];
	}
}
