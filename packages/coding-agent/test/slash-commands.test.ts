import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /todo with an argument hint", () => {
		const todo = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "todo");
		expect(todo).toHaveLength(1);
		expect(todo[0]?.argumentHint).toBe("<text>");
	});
});

describe("TodoList", () => {
	it("reports an empty list", () => {
		const list = new TodoList();
		expect(list.handle("/todo")).toEqual({
			kind: "empty",
			message: "No todo items. Use /todo <text> to add one.",
		});
	});

	it("adds items with /todo <text> and lists them with /todo", () => {
		const list = new TodoList();
		expect(list.handle("/todo write tests")).toEqual({ kind: "added", message: "Todo added (1): write tests" });
		expect(list.handle("/todo   fix bug  ").message).toBe("Todo added (2): fix bug");
		expect(list.handle("/todo")).toEqual({ kind: "list", message: "Todo:\n1. write tests\n2. fix bug" });
		expect(list.getItems()).toEqual(["write tests", "fix bug"]);
	});
});
