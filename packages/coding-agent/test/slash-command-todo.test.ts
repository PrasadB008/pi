import { Container } from "@earendil-works/pi-tui";
import { describe, expect, test } from "vitest";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

type TodoContext = {
	chatContainer: Container;
};

const handleTodoCommand = Reflect.get(InteractiveMode.prototype, "handleTodoCommand") as (
	this: TodoContext,
	text: string | undefined,
) => void;

describe("slash command /todo", () => {
	test("adds item to todo list", () => {
		initTheme("dark");
		const context = {
			chatContainer: new Container(),
		};
		handleTodoCommand.call(context, "fix bug in parser");
		const output = stripAnsi(context.chatContainer.render(120).join("\n"));
		expect(output).toContain("Added to todo: fix bug in parser");
	});

	test("lists todo items when called without argument", () => {
		initTheme("dark");
		const context = {
			chatContainer: new Container(),
		};
		// Add two items
		handleTodoCommand.call(context, "first task");
		handleTodoCommand.call(context, "second task");
		// List items
		handleTodoCommand.call(context, undefined);
		const output = stripAnsi(context.chatContainer.render(120).join("\n"));
		expect(output).toContain("Todo List");
		expect(output).toContain("1. first task");
		expect(output).toContain("2. second task");
	});

	test("shows empty message when no todo items", () => {
		initTheme("dark");
		const context = {
			chatContainer: new Container(),
		};
		handleTodoCommand.call(context, undefined);
		const output = stripAnsi(context.chatContainer.render(120).join("\n"));
		expect(output).toContain("No todo items");
	});
});
