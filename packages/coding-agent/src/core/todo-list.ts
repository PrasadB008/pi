/**
 * Session-scoped todo list for the coding agent.
 * Persists across turns within a session.
 */
export class TodoList {
	private items: string[] = [];

	/**
	 * Add an item to the todo list.
	 * Returns the item number (1-based).
	 */
	add(text: string): number {
		this.items.push(text);
		return this.items.length;
	}

	/**
	 * Get all items in the todo list.
	 * Returns an array of items with their 1-based indices.
	 */
	getItems(): Array<{ index: number; text: string }> {
		return this.items.map((text, i) => ({
			index: i + 1,
			text,
		}));
	}

	/**
	 * Get a formatted string representation of all items.
	 */
	format(): string {
		if (this.items.length === 0) {
			return "Todo list is empty.";
		}
		return this.items.map((text, i) => `${i + 1}. ${text}`).join("\n");
	}

	/**
	 * Clear all items from the todo list.
	 */
	clear(): void {
		this.items = [];
	}
}
