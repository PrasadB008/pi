export interface TodoItem {
	id: string;
	text: string;
	createdAt: number;
}

export class TodoList {
	private items: Map<string, TodoItem> = new Map();
	private nextId: number = 0;

	add(text: string): TodoItem {
		const id = String(this.nextId++);
		const item: TodoItem = {
			id,
			text,
			createdAt: Date.now(),
		};
		this.items.set(id, item);
		return item;
	}

	getAll(): TodoItem[] {
		return Array.from(this.items.values()).sort((a, b) => a.createdAt - b.createdAt);
	}

	remove(id: string): boolean {
		return this.items.delete(id);
	}

	clear(): void {
		this.items.clear();
		this.nextId = 0;
	}

	isEmpty(): boolean {
		return this.items.size === 0;
	}

	size(): number {
		return this.items.size;
	}
}
