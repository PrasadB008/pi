/**
 * Todo list management for the interactive mode.
 */

export interface TodoItem {
	id: string;
	text: string;
	createdAt: Date;
}

export class TodoStore {
	private items: TodoItem[] = [];
	private nextId = 1;

	add(text: string): TodoItem {
		const item: TodoItem = {
			id: String(this.nextId++),
			text,
			createdAt: new Date(),
		};
		this.items.push(item);
		return item;
	}

	list(): TodoItem[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
		this.nextId = 1;
	}

	format(): string {
		if (this.items.length === 0) {
			return "No todos yet.";
		}
		return this.items
			.map((item, index) => `${index + 1}. ${item.text}`)
			.join("\n");
	}
}
