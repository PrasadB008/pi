import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { formatTodoList, runTodoCommand, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("assigns increasing 1-based ids and trims text", () => {
		const list = new TodoList();
		expect(list.add("  write tests  ")).toEqual({ id: 1, text: "write tests", done: false });
		expect(list.add("ship").id).toBe(2);
	});

	it("rejects empty text", () => {
		expect(() => new TodoList().add("   ")).toThrow();
	});

	it("completes items and returns undefined for unknown ids", () => {
		const list = new TodoList();
		list.add("a");
		expect(list.complete(1)?.done).toBe(true);
		expect(list.complete(5)).toBeUndefined();
	});

	it("clear resets items and ids", () => {
		const list = new TodoList();
		list.add("a");
		list.clear();
		expect(list.list()).toHaveLength(0);
		expect(list.add("b").id).toBe(1);
	});
});

describe("formatTodoList", () => {
	it("shows a hint when empty", () => {
		expect(formatTodoList([])).toContain("No todos");
	});

	it("shows open/done counts and checkboxes", () => {
		const list = new TodoList();
		list.add("a");
		list.add("b");
		list.complete(2);
		expect(formatTodoList(list.list())).toBe("Todos (1 open, 1 done):\n1. [ ] a\n2. [x] b");
	});
});

describe("runTodoCommand", () => {
	it("lists with no args or 'list'", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "").message).toContain("No todos");
		expect(runTodoCommand(list, " list ").isError).toBe(false);
	});

	it("adds, lists and completes todos", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, " add buy milk")).toEqual({ message: "Added todo 1: buy milk", isError: false });
		expect(runTodoCommand(list, "add  second\ttask").message).toBe("Added todo 2: second\ttask");
		expect(runTodoCommand(list, "done 1")).toEqual({ message: "Completed todo 1: buy milk", isError: false });
		expect(runTodoCommand(list, "complete 2").isError).toBe(false);
		expect(runTodoCommand(list, "list").message).toBe(
			"Todos (0 open, 2 done):\n1. [x] buy milk\n2. [x] second\ttask",
		);
	});

	it("is case-insensitive for the subcommand", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "ADD x").isError).toBe(false);
	});

	it("reports usage errors", () => {
		const list = new TodoList();
		expect(runTodoCommand(list, "add").isError).toBe(true);
		expect(runTodoCommand(list, "add   ").isError).toBe(true);
		expect(runTodoCommand(list, "done").isError).toBe(true);
		expect(runTodoCommand(list, "done abc").isError).toBe(true);
		expect(runTodoCommand(list, "done 9")).toEqual({ message: "No todo with number 9", isError: true });
		expect(runTodoCommand(list, "bogus").message).toContain("Usage");
		expect(list.list()).toHaveLength(0);
	});
});

describe("/todo registration", () => {
	it("is a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
