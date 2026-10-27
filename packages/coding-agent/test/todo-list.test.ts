import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, TodoStore } from "../src/core/todo-list.ts";

describe("todo list", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds trimmed items and ignores empty text", () => {
		const store = new TodoStore();
		store.add("a", "  write tests ");
		store.add("a", "   ");
		expect(store.list("a")).toEqual(["write tests"]);
	});

	it("keeps lists separate per session", () => {
		const store = new TodoStore();
		store.add("a", "one");
		store.add("b", "two");
		expect(store.list("a")).toEqual(["one"]);
		expect(store.list("b")).toEqual(["two"]);
	});

	it("formats numbered items and an empty hint", () => {
		expect(formatTodoList(["one", "two"])).toBe("1. one\n2. two");
		expect(formatTodoList([])).toContain("No todo items");
	});
});
