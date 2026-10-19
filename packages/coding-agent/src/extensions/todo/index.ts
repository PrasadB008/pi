/**
 * Built-in todo command extension.
 * Provides /todo command to manage a session todo list.
 */

import type { ExtensionContext } from "../../core/extensions/types.ts";

interface TodoState {
	items: string[];
}

export async function activate(_ctx: ExtensionContext): Promise<void> {
	const todoState: TodoState = {
		items: [],
	};

	pi.registerCommand("todo", {
		description: "Add to or list session todos",
		argumentHint: "[<text>]",
		handler: async (args, context) => {
			const text = args.join(" ").trim();

			if (!text) {
				// List todos
				if (todoState.items.length === 0) {
					context.ui.notify("No todos yet");
				} else {
					const list = todoState.items.map((item, i) => `${i + 1}. ${item}`).join("\n");
					context.ui.notify(`Todos:\n${list}`);
				}
			} else {
				// Add todo
				todoState.items.push(text);
				context.ui.notify(`Added: ${text}`);
			}
		},
	});
}
