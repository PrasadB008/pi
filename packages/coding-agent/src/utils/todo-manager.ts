/**
 * Todo list manager for the interactive session.
 */

export class TodoManager {
	private todos: string[] = [];

	/**
	 * Add a todo item to the list.
	 */
	addTodo(text: string): void {
		this.todos.push(text);
	}

	/**
	 * Get all todos.
	 */
	getTodos(): string[] {
		return [...this.todos];
	}

	/**
	 * Get formatted todo list as a string.
	 */
	formatTodos(): string {
		if (this.todos.length === 0) {
			return "No todos yet. Use /todo <text> to add one.";
		}
		return this.todos.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
	}

	/**
	 * Clear all todos.
	 */
	clear(): void {
		this.todos = [];
	}
}
