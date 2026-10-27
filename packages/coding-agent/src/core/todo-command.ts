/**
 * Apply a "/todo" command line to a session todo list.
 * "/todo <text>" appends <text>; "/todo" alone lists the items.
 * Mutates `items` when an item is added and returns the message to show.
 */
export function applyTodoCommand(items: string[], text: string): string {
	const item = text.replace(/^\/todo\s*/, "").trim();
	if (item) {
		items.push(item);
		return `Todo added (${items.length}): ${item}`;
	}
	if (items.length === 0) {
		return "No todo items. Use /todo <text> to add one.";
	}
	return ["Todo:", ...items.map((entry, index) => `  ${index + 1}. ${entry}`)].join("\n");
}
