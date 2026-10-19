import { describe, expect, it } from "vitest";
import { BUILTIN_SLASH_COMMANDS } from "../src/core/slash-commands.ts";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty and hints how to add", () => {
		const todos = new TodoList();
		expect(todos.getItems()).toEqual([]);
		expect(todos.run("")).toEqual({ ok: true, message: "No todos. Add one with /todo add <text>" });
	});

	it("adds items with increasing numbers", () => {
		const todos = new TodoList();
		expect(todos.run(" add write tests ")).toEqual({ ok: true, message: "Added todo 1: write tests" });
		expect(todos.run("add open PR")).toEqual({ ok: true, message: "Added todo 2: open PR" });
		expect(todos.getItems().map((item) => item.text)).toEqual(["write tests", "open PR"]);
	});

	it("lists items with completion state", () => {
		const todos = new TodoList();
		todos.run("add one");
		todos.run("add two");
		todos.run("done 1");
		expect(todos.run("list")).toEqual({ ok: true, message: "[x] 1. one\n[ ] 2. two" });
		expect(todos.run("")).toEqual(todos.run("list"));
	});

	it("completes an item and is idempotent", () => {
		const todos = new TodoList();
		todos.run("add one");
		expect(todos.run("done 1")).toEqual({ ok: true, message: "Completed todo 1: one" });
		expect(todos.run("complete 1")).toEqual({ ok: true, message: "Todo 1 is already done" });
	});

	it("does not reuse numbers", () => {
		const todos = new TodoList();
		todos.run("add one");
		todos.run("done 1");
		expect(todos.run("add two")).toEqual({ ok: true, message: "Added todo 2: two" });
	});

	it("rejects invalid input", () => {
		const todos = new TodoList();
		expect(todos.run("add").ok).toBe(false);
		expect(todos.run("add   ").ok).toBe(false);
		expect(todos.run("done").ok).toBe(false);
		expect(todos.run("done abc").ok).toBe(false);
		expect(todos.run("done 1 2").ok).toBe(false);
		expect(todos.run("done 5")).toEqual({ ok: false, message: "No todo with number 5" });
		const unknown = todos.run("remove 1");
		expect(unknown.ok).toBe(false);
		expect(unknown.message).toContain('Unknown /todo subcommand "remove"');
	});

	it("is registered as a built-in slash command", () => {
		expect(BUILTIN_SLASH_COMMANDS.some((command) => command.name === "todo")).toBe(true);
	});
});
