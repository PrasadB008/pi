/** In-memory todo list backing the /todo slash command. */
export class TodoList {
	readonly items: string[] = [];

	add(text: string): void {
		this.items.push(text);
	}

	format(): string {
		if (this.items.length === 0) {
			return "No todos. Add one with /todo <text>";
		}
		return ["Todos:", ...this.items.map((item, index) => `${index + 1}. ${item}`)].join("\n");
	}
}
