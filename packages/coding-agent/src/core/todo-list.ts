export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): string[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
	}

	isEmpty(): boolean {
		return this.items.length === 0;
	}
}
