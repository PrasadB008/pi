import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("BUILTIN_SLASH_COMMANDS", () => {
	it("registers /todo once", () => {
		const matches = BUILTIN_SLASH_COMMANDS.filter((command) => command.name === "todo");
		expect(matches).toHaveLength(1);
		expect(matches[0]?.description).toBeTruthy();
	});
});

describe("/todo command", () => {
	it("reports an empty list when nothing was added", () => {
		expect(runTodoCommand(new TodoList(), "/todo")).toEqual({ kind: "empty" });
		expect(runTodoCommand(new TodoList(), "/todo   ")).toEqual({ kind: "empty" });
	});

	it("adds items and lists them in order", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "/todo write tests")).toEqual({ kind: "added", number: 1, item: "write tests" });
		expect(runTodoCommand(list, "/todo  update docs ")).toEqual({ kind: "added", number: 2, item: "update docs" });
		expect(runTodoCommand(list, "/todo")).toEqual({ kind: "list", lines: ["1. write tests", "2. update docs"] });
	});
});
