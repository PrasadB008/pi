import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, TodoStore } from "../src/core/todo.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("lists a hint when empty", () => {
		const store = new TodoStore();
		expect(formatTodoList(store.list("s1"))).toContain("No todos yet");
	});

	it("adds items per session and lists them numbered", () => {
		const store = new TodoStore();
		expect(store.add("s1", "write tests")).toBe(1);
		expect(store.add("s1", "ship it")).toBe(2);
		store.add("s2", "other session");
		expect(formatTodoList(store.list("s1"))).toBe("1. write tests\n2. ship it");
		expect(store.list("s2")).toEqual(["other session"]);
	});
});
