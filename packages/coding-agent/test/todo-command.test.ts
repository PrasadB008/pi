import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand } from "../src/core/todo.ts";

describe("/todo command", () => {
	it("is registered as a builtin slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("shows a hint when the list is empty", () => {
		const result = applyTodoCommand([], "/todo");
		expect(result.items).toEqual([]);
		expect(result.added).toBe(false);
		expect(result.message).toContain("No todos");
	});

	it("adds items and lists them in order", () => {
		const first = applyTodoCommand([], "/todo write tests");
		expect(first.added).toBe(true);
		expect(first.items).toEqual(["write tests"]);

		const second = applyTodoCommand(first.items, "/todo   ship it  ");
		expect(second.items).toEqual(["write tests", "ship it"]);
		expect(second.message).toBe("Todo added (2 total):\n1. write tests\n2. ship it");

		const listed = applyTodoCommand(second.items, "/todo");
		expect(listed.added).toBe(false);
		expect(listed.message).toBe("Todos:\n1. write tests\n2. ship it");
	});

	it("does not mutate the input list", () => {
		const items = ["a"];
		applyTodoCommand(items, "/todo b");
		expect(items).toEqual(["a"]);
	});
});
