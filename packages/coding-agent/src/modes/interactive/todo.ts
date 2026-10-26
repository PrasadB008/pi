export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		if (text.trim()) {
			this.items.push(text.trim());
		}
	}

	list(): string[] {
		return [...this.items];
	}

	format(): string {
		if (this.items.length === 0) {
			return "No todo items yet.";
		}
		return this.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
	}

	clear(): void {
		this.items = [];
	}
}
