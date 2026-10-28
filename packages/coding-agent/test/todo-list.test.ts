import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { applyTodoCommand, formatTodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds text and lists items in order", () => {
		const first = applyTodoCommand([], "/todo write tests");
		expect(first.added).toBe("write tests");
		const second = applyTodoCommand(first.items, "/todo   update docs  ");
		expect(second.added).toBe("update docs");
		expect(formatTodoList(second.items)).toBe("1. write tests\n2. update docs");
	});

	it("lists without changing items when no text is given", () => {
		const result = applyTodoCommand(["a"], "/todo");
		expect(result.added).toBeUndefined();
		expect(result.items).toEqual(["a"]);
	});

	it("does not mutate the input list", () => {
		const items = ["a"];
		applyTodoCommand(items, "/todo b");
		expect(items).toEqual(["a"]);
	});
});
