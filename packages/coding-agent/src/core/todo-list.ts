/**
 * Simple todo list manager for the session.
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
}
