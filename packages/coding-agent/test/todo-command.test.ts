import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds text to the list", () => {
		const items: string[] = [];
		const result = applyTodoCommand(items, "/todo write tests");
		expect(items).toEqual(["write tests"]);
		expect(result).toEqual({ message: "Todo added (1): write tests", isWarning: false });
	});

	it("lists items in order when called without text", () => {
		const items: string[] = [];
		applyTodoCommand(items, "/todo first");
		applyTodoCommand(items, "/todo second");
		const result = applyTodoCommand(items, "/todo");
		expect(result.message).toBe("Todos:\n1. first\n2. second");
		expect(result.isWarning).toBe(false);
	});

	it("warns when the list is empty", () => {
		const result = applyTodoCommand([], "/todo   ");
		expect(result.isWarning).toBe(true);
	});
});
