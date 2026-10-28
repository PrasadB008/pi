import { Container } from "@earendil-works/pi-tui";
import { describe, expect, test, vi } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

interface TodoThis {
	chatContainer: Container;
	todoItems: string[];
	ui: { requestRender(): void };
}

describe("/todo slash command", () => {
	test("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("adds items and lists them", () => {
		const handleTodoCommand = Reflect.get(InteractiveMode.prototype, "handleTodoCommand") as (
			this: TodoThis,
			text: string,
		) => void;
		initTheme("dark");
		const self: TodoThis = {
			chatContainer: new Container(),
			todoItems: [],
			ui: { requestRender: vi.fn() },
		};

		handleTodoCommand.call(self, "/todo");
		expect(stripAnsi(self.chatContainer.render(120).join("\n"))).toContain("No todos");

		handleTodoCommand.call(self, "/todo write tests");
		handleTodoCommand.call(self, "/todo  ship it ");
		expect(self.todoItems).toEqual(["write tests", "ship it"]);

		self.chatContainer.clear();
		handleTodoCommand.call(self, "/todo");
		const output = stripAnsi(self.chatContainer.render(120).join("\n"));
		expect(output).toContain("1. write tests");
		expect(output).toContain("2. ship it");
	});
});
