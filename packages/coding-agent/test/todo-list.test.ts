import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("starts empty", () => {
		const list = new TodoList();
		expect(list.run("")).toEqual({ message: "Todo list is empty. Add one with /todo add <text>", isError: false });
	});

	it("adds, completes, lists and removes items", () => {
		const list = new TodoList();
		list.run("add write tests");
		list.run("add  ship it ");
		expect(list.run("done 1").isError).toBe(false);
		expect(list.run("").message).toBe("Todo:\n1. [x] write tests\n2. [ ] ship it");

		expect(list.run("remove 1").message).toBe("Removed todo 1: write tests");
		expect(list.getItems()).toEqual([{ text: "ship it", done: false }]);

		list.run("clear");
		expect(list.getItems()).toEqual([]);
	});

	it("reports errors for bad input", () => {
		const list = new TodoList();
		expect(list.run("add").isError).toBe(true);
		expect(list.run("done 1")).toEqual({ message: "Todo list is empty", isError: true });
		list.run("add one");
		expect(list.run("done 2").message).toBe("Usage: /todo done <n> (n is 1-1)");
		expect(list.run("done x").isError).toBe(true);
		expect(list.run("bogus").isError).toBe(true);
	});
});
