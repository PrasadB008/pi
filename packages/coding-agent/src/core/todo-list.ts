export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	getAll(): string[] {
		return [...this.items];
	}

	clear(): void {
		this.items = [];
	}

	isEmpty(): boolean {
		return this.items.length === 0;
	}

	format(): string {
		if (this.isEmpty()) {
			return "No todos yet.";
		}
		return this.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
	}
}
