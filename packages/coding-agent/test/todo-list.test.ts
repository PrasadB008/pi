import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("reports an empty list", () => {
		const list = new TodoList();
		expect(list.run("")).toEqual({ message: "No todo items. Add one with /todo <text>", isError: false });
	});

	it("adds, completes, reopens and removes items", () => {
		const list = new TodoList();
		list.run("write tests");
		list.run("ship it");
		expect(list.run("").message).toBe("1. [ ] write tests\n2. [ ] ship it");

		expect(list.run("done 1").message).toBe("Done: write tests");
		expect(list.run("").message).toBe("1. [x] write tests\n2. [ ] ship it");

		expect(list.run("undo 1").message).toBe("Reopened: write tests");
		expect(list.run("remove 1").message).toBe("Removed: write tests");
		expect(list.run("").message).toBe("1. [ ] ship it");
	});

	it("clears the list", () => {
		const list = new TodoList();
		list.run("a");
		list.run("clear");
		expect(list.getItems()).toHaveLength(0);
	});

	it("rejects bad item numbers", () => {
		const list = new TodoList();
		list.run("a");
		expect(list.run("done").isError).toBe(true);
		expect(list.run("done x").isError).toBe(true);
		expect(list.run("done 2")).toEqual({ message: "No todo item 2", isError: true });
	});
});
