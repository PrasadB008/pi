import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		expect(new TodoList().list()).toEqual([]);
	});

	it("adds items with increasing ids", () => {
		const todos = new TodoList();
		expect(todos.add("write tests")).toEqual({ id: 1, text: "write tests" });
		expect(todos.add("ship it")).toEqual({ id: 2, text: "ship it" });
		expect(todos.list().map((item) => item.text)).toEqual(["write tests", "ship it"]);
	});
});

describe("/todo builtin command", () => {
	it("is registered", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
