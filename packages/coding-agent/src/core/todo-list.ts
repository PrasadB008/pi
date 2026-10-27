/** In-memory todo list used by the /todo slash command. */
export class TodoList {
	private items: string[] = [];

	/** Handle the full "/todo [text]" input and return the message to show. */
	handle(input: string): string {
		const text = input.replace(/^\/todo\s*/, "").trim();
		if (text) {
			this.items.push(text);
			return `Todo added (${this.items.length}): ${text}`;
		}
		if (this.items.length === 0) {
			return "No todo items. Add one with /todo <text>";
		}
		return ["Todo:", ...this.items.map((entry, index) => `${index + 1}. ${entry}`)].join("\n");
	}
}
