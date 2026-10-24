import { describe, expect, it } from "vitest";
import { TODO_USAGE, TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("shows an empty hint when there are no todos", () => {
		const list = new TodoList();
		expect(list.run("").message).toContain("No todos");
	});

	it("adds, completes, reopens, and removes todos", () => {
		const list = new TodoList();
		list.run("add write tests");
		list.run("add ship it");
		expect(list.run("").message).toBe("1. [ ] write tests\n2. [ ] ship it");

		list.run("done 1");
		expect(list.run("list").message).toBe("1. [x] write tests\n2. [ ] ship it");

		list.run("undo 1");
		expect(list.getItems()[0].done).toBe(false);

		expect(list.run("rm 1").message).toBe("Removed todo 1: write tests");
		expect(list.getItems()).toEqual([{ text: "ship it", done: false }]);

		list.run("clear");
		expect(list.getItems()).toHaveLength(0);
	});

	it("reports errors for bad input", () => {
		const list = new TodoList();
		list.run("add one");
		expect(list.run("add")).toEqual({ message: TODO_USAGE, isError: true });
		expect(list.run("bogus")).toEqual({ message: TODO_USAGE, isError: true });
		expect(list.run("done 5")).toEqual({ message: "No todo numbered 5", isError: true });
		expect(list.run("done abc").isError).toBe(true);
		expect(list.run("rm")).toEqual({ message: TODO_USAGE, isError: true });
	});
});
