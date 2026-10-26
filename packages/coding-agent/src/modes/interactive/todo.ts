/**
 * TodoList manages a session-scoped todo list.
 */
export class TodoList {
	private items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	list(): string[] {
		return [...this.items];
	}

	format(): string {
		if (this.items.length === 0) {
			return "No todos yet.";
		}
		return this.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
	}
}
