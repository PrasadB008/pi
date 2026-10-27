export interface TodoItem {
	id: number;
	text: string;
}

/** In-memory todo list for the current interactive session. */
export class TodoList {
	private items: TodoItem[] = [];
	private nextId = 1;

	add(text: string): TodoItem {
		const item: TodoItem = { id: this.nextId++, text };
		this.items.push(item);
		return item;
	}

	list(): ReadonlyArray<TodoItem> {
		return this.items;
	}
}
