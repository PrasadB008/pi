export interface TodoItem {
	id: string;
	text: string;
	createdAt: number;
}

export class TodoStore {
	private items: Map<string, TodoItem> = new Map();
	private nextId = 0;

	addItem(text: string): TodoItem {
		const id = String(this.nextId++);
		const item: TodoItem = {
			id,
			text,
			createdAt: Date.now(),
		};
		this.items.set(id, item);
		return item;
	}

	getItems(): TodoItem[] {
		return Array.from(this.items.values()).sort((a, b) => a.createdAt - b.createdAt);
	}

	clear(): void {
		this.items.clear();
		this.nextId = 0;
	}
}
