import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds an item when text is given", () => {
		const items: string[] = [];
		const result = applyTodoCommand(items, "/todo write tests");
		expect(result.added).toBe(true);
		expect(items).toEqual(["write tests"]);
	});

	it("lists items in order when no text is given", () => {
		const items: string[] = [];
		applyTodoCommand(items, "/todo first");
		applyTodoCommand(items, "/todo second");
		const result = applyTodoCommand(items, "/todo");
		expect(result.added).toBe(false);
		expect(result.message).toBe("Todo list:\n1. first\n2. second");
	});

	it("reports an empty list", () => {
		const result = applyTodoCommand([], "/todo");
		expect(result.added).toBe(false);
		expect(result.message).toContain("No todo items");
	});
});
