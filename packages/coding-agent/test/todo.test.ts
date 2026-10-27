import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds trimmed items in order and rejects empty text", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe(true);
		expect(todos.add("ship it")).toBe(true);
		expect(todos.add("   ")).toBe(false);
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});
});

describe("/todo slash command", () => {
	it("is registered as a built-in command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
