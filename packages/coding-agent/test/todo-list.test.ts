import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("/todo command", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists nothing when empty", () => {
		expect(new TodoList().handleCommand("/todo")).toEqual({ kind: "list", items: [] });
	});

	it("adds items and lists them in order", () => {
		const todos = new TodoList();
		expect(todos.handleCommand("/todo write tests")).toEqual({ kind: "added", index: 1, item: "write tests" });
		expect(todos.handleCommand("/todo   open PR  ")).toEqual({ kind: "added", index: 2, item: "open PR" });
		expect(todos.handleCommand("/todo")).toEqual({ kind: "list", items: ["write tests", "open PR"] });
	});
});
