import { Container } from "@earendil-works/pi-tui";
import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

type TodoContext = {
	chatContainer: Container;
	todoItems: string[];
	ui: { requestRender(): void };
	showWarning(message: string): void;
};

const handleTodoCommand = Reflect.get(InteractiveMode.prototype, "handleTodoCommand") as (
	this: TodoContext,
	text: string,
) => void;

function createContext(): TodoContext & { warnings: string[] } {
	const warnings: string[] = [];
	return {
		chatContainer: new Container(),
		todoItems: [],
		ui: { requestRender: () => {} },
		showWarning: (message: string) => {
			warnings.push(message);
		},
		warnings,
	};
}

describe("/todo command", () => {
	test("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("adds items and lists them", () => {
		initTheme("dark");
		const context = createContext();

		handleTodoCommand.call(context, "/todo write tests");
		handleTodoCommand.call(context, "/todo   open PR  ");
		expect(context.todoItems).toEqual(["write tests", "open PR"]);

		const before = context.chatContainer.children.length;
		handleTodoCommand.call(context, "/todo");
		expect(context.todoItems).toHaveLength(2);
		const listed = stripAnsi(context.chatContainer.children.slice(before).flatMap((c) => c.render(120)).join("\n"));
		expect(listed).toContain("1. write tests");
		expect(listed).toContain("2. open PR");
	});

	test("warns when listing an empty todo list", () => {
		initTheme("dark");
		const context = createContext();

		handleTodoCommand.call(context, "/todo");

		expect(context.warnings).toHaveLength(1);
		expect(context.chatContainer.children).toHaveLength(0);
	});
});
