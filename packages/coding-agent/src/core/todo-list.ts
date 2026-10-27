/**
 * TodoList manages a session-scoped list of todo items.
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
	 * Get all items in the todo list.
	 */
	getItems(): string[] {
		return [...this.items];
	}

	/**
	 * Clear all items from the todo list.
	 */
	clear(): void {
		this.items = [];
	}

	/**
	 * Get the count of items in the todo list.
	 */
	getCount(): number {
		return this.items.length;
	}
}
