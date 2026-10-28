/**
 * Apply a "/todo" command line to a todo list.
 * "/todo <text>" appends <text>; "/todo" alone lists the items.
 * Mutates `items` when an item is added and returns the message to display.
 */
export function runTodoCommand(items: string[], text: string): string {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return `Todo added (${items.length}): ${item}`;
	}
	if (items.length === 0) {
		return "No todo items. Add one with /todo <text>";
	}
	return ["Todo:", ...items.map((entry, index) => `  ${index + 1}. ${entry}`)].join("\n");
}
