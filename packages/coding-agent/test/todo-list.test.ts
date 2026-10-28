import { describe, expect, test } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	test("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	test("adds trimmed items in order", () => {
		const todos = new TodoList();
		expect(todos.add("  write tests ")).toBe("write tests");
		todos.add("ship it");
		expect(todos.list()).toEqual(["write tests", "ship it"]);
	});

	test("ignores blank text", () => {
		const todos = new TodoList();
		expect(todos.add("   ")).toBeUndefined();
		expect(todos.list()).toEqual([]);
	});
});

describe("/todo registration", () => {
	test("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
