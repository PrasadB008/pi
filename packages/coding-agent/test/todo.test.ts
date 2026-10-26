import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo.ts";

describe("TodoList", () => {
	it("adds items to the list", () => {
		const list = new TodoList();
		list.add("Fix bug");
		list.add("Write tests");
		expect(list.getItems()).toEqual(["Fix bug", "Write tests"]);
	});

	it("formats empty list", () => {
		const list = new TodoList();
		expect(list.format()).toBe("No todo items");
	});

	it("formats list with items", () => {
		const list = new TodoList();
		list.add("Fix bug");
		list.add("Write tests");
		expect(list.format()).toBe("1. Fix bug\n2. Write tests");
	});

	it("clears all items", () => {
		const list = new TodoList();
		list.add("Fix bug");
		list.add("Write tests");
		list.clear();
		expect(list.getItems()).toEqual([]);
		expect(list.format()).toBe("No todo items");
	});
});
