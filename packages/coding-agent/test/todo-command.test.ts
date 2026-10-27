import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo-command.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("reports an empty list", () => {
		const result = applyTodoCommand([], "/todo");
		expect(result.items).toEqual([]);
		expect(result.message).toContain("No todo items");
	});

	it("adds text and then lists the items in order", () => {
		const first = applyTodoCommand([], "/todo write tests");
		expect(first.items).toEqual(["write tests"]);
		expect(first.message).toBe("Todo added (1): write tests");

		const second = applyTodoCommand(first.items, "/todo   ship it  ");
		expect(second.items).toEqual(["write tests", "ship it"]);

		const listed = applyTodoCommand(second.items, "/todo");
		expect(listed.items).toEqual(["write tests", "ship it"]);
		expect(listed.message).toBe("Todo items:\n1. write tests\n2. ship it");
	});

	it("does not mutate the input list", () => {
		const items = ["a"];
		applyTodoCommand(items, "/todo b");
		expect(items).toEqual(["a"]);
	});
});
