import { beforeAll, describe, expect, test, vi } from "vitest";
import { type Component, Container, type Focusable, type TUI } from "../../tui/src/tui.ts";
import { InteractiveMode } from "../src/modes/interactive/interactive-mode.ts";
import { initTheme } from "../src/modes/interactive/theme/theme.ts";

function renderLastLine(container: Container, width = 120): string {
	const last = container.children[container.children.length - 1];
	if (!last) return "";
	return last.render(width).join("\n");
}

describe("InteractiveMode /todo command", () => {
	beforeAll(() => {
		initTheme("dark");
	});

	test("adds a todo item when /todo <text> is used", () => {
		const fakeThis: any = {
			chatContainer: new Container(),
			ui: { requestRender: vi.fn() },
			editor: { setText: vi.fn() },
			todoItems: [],
			lastStatusSpacer: undefined,
			lastStatusText: undefined,
		};

		(InteractiveMode as any).prototype.handleTodoCommand.call(fakeThis, "/todo Buy groceries");

		expect(fakeThis.todoItems).toEqual(["Buy groceries"]);
		expect(fakeThis.editor.setText).toHaveBeenCalledWith("");
		expect(renderLastLine(fakeThis.chatContainer)).toContain("Added todo: Buy groceries");
	});

	test("lists todos when /todo is used without text", () => {
		const fakeThis: any = {
			chatContainer: new Container(),
			ui: { requestRender: vi.fn() },
			editor: { setText: vi.fn() },
			todoItems: ["Task 1", "Task 2"],
			lastStatusSpacer: undefined,
			lastStatusText: undefined,
		};

		(InteractiveMode as any).prototype.handleTodoCommand.call(fakeThis, "/todo");

		expect(renderLastLine(fakeThis.chatContainer)).toContain("Todos:");
		expect(renderLastLine(fakeThis.chatContainer)).toContain("1. Task 1");
		expect(renderLastLine(fakeThis.chatContainer)).toContain("2. Task 2");
	});

	test("shows message when listing empty todos", () => {
		const fakeThis: any = {
			chatContainer: new Container(),
			ui: { requestRender: vi.fn() },
			editor: { setText: vi.fn() },
			todoItems: [],
			lastStatusSpacer: undefined,
			lastStatusText: undefined,
		};

		(InteractiveMode as any).prototype.handleTodoCommand.call(fakeThis, "/todo");

		expect(renderLastLine(fakeThis.chatContainer)).toContain("No todos yet");
	});

	test("handles multiple todo additions", () => {
		const fakeThis: any = {
			chatContainer: new Container(),
			ui: { requestRender: vi.fn() },
			editor: { setText: vi.fn() },
			todoItems: [],
			lastStatusSpacer: undefined,
			lastStatusText: undefined,
		};

		(InteractiveMode as any).prototype.handleTodoCommand.call(fakeThis, "/todo First task");
		expect(fakeThis.todoItems).toEqual(["First task"]);

		(InteractiveMode as any).prototype.handleTodoCommand.call(fakeThis, "/todo Second task");
		expect(fakeThis.todoItems).toEqual(["First task", "Second task"]);
	});
});
