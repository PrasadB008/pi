/**
 * The `todo` command as an extension. The CLI loads it as a built-in extension.
 *
 * Provides `/todo <text>` to add items to a session todo list and `/todo` to list them.
 */

import type { ExtensionFactory } from "../../core/extensions/types.ts";

export function createTodoExtension(): ExtensionFactory {
	return (pi) => {
		const todos: string[] = [];

		pi.registerCommand("todo", {
			description: "Manage a session todo list",
			handler: async (args) => {
				const text = args.trim();

				if (!text) {
					// List todos
					if (todos.length === 0) {
						return "No todos yet.";
					}
					return todos.map((item, i) => `${i + 1}. ${item}`).join("\n");
				}

				// Add todo
				todos.push(text);
				return `Added: ${text}`;
			},
		});
	};
}

export default createTodoExtension();
