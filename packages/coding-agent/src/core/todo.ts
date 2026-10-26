/**
 * Todo list management for a session.
 */

export class TodoList {
	private items: string[] = [];

	/**
	 * Add an item to the todo list.
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
	 * Clear all todo items.
	 */
	clear(): void {
		this.items = [];
	}

	/**
	 * Format the todo list as a string.
	 */
	format(): string {
		if (this.items.length === 0) {
			return "No todo items";
		}
		return this.items.map((item, i) => `${i + 1}. ${item}`).join("\n");
	}
}
