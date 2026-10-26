/**
 * TodoManager - Simple in-memory todo list for a session.
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
	 * Clear all todos.
	 */
	clear(): void {
		this.todos = [];
	}
}
