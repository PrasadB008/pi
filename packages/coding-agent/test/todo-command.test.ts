import { Container } from "@earendil-works/pi-tui";
import { describe, expect, test, vi } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";
import { stripAnsi } from "../src/utils/ansi.ts";

type TodoFakeThis = { chatContainer: Container; todoList: TodoList; ui: { requestRender(): void } };

function createFakeThis(): TodoFakeThis {
	return { chatContainer: new Container(), todoList: new TodoList(), ui: { requestRender: vi.fn() } };
}

function render(container: Container): string {
	return stripAnsi(container.render(80).join("\n"));
}

describe("/todo command", () => {
	const handleTodoCommand = Reflect.get(InteractiveMode.prototype, "handleTodoCommand") as (
		this: TodoFakeThis,
		text: string,
	) => void;

	test("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	test("lists an empty state when no todos exist", () => {
		initTheme("dark");
		const fake = createFakeThis();
		handleTodoCommand.call(fake, "/todo");
		expect(render(fake.chatContainer)).toContain("No todos");
	});

	test("adds items with /todo <text> and lists them with /todo", () => {
		initTheme("dark");
		const fake = createFakeThis();
		handleTodoCommand.call(fake, "/todo write tests");
		handleTodoCommand.call(fake, "/todo   update docs  ");
		expect(fake.todoList.list()).toEqual(["write tests", "update docs"]);

		const listContainer = new Container();
		fake.chatContainer = listContainer;
		handleTodoCommand.call(fake, "/todo");
		const output = render(listContainer);
		expect(output).toContain("1. write tests");
		expect(output).toContain("2. update docs");
	});
});
