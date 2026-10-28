import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("/todo", () => {
	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});

	it("adds trimmed items and lists them numbered", () => {
		const list = new TodoList();
		expect(list.add("  write tests ")).toBe("write tests");
		list.add("ship it");
		expect(list.format()).toBe("1. write tests\n2. ship it");
	});

	it("ignores empty text and reports an empty list", () => {
		const list = new TodoList();
		expect(list.add("   ")).toBeUndefined();
		expect(list.getItems()).toHaveLength(0);
		expect(list.format()).toBeUndefined();
	});
});
