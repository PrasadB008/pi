/**
 * Simple todo list manager for session todos.
 */
export class TodoManager {
	private items: string[] = [];

	/**
	 * Add a todo item.
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
