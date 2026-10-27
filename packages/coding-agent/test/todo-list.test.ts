import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList", () => {
	it("adds items and returns their 1-based index", () => {
		const list = new TodoList();
		expect(list.add("First task")).toBe(1);
		expect(list.add("Second task")).toBe(2);
		expect(list.add("Third task")).toBe(3);
	});

	it("returns all items with their indices", () => {
		const list = new TodoList();
		list.add("Task 1");
		list.add("Task 2");
		const items = list.getItems();
		expect(items).toEqual([
			{ index: 1, text: "Task 1" },
			{ index: 2, text: "Task 2" },
		]);
	});

	it("formats items as a numbered list", () => {
		const list = new TodoList();
		list.add("Buy milk");
		list.add("Write tests");
		const formatted = list.format();
		expect(formatted).toBe("1. Buy milk\n2. Write tests");
	});

	it("returns empty message when list is empty", () => {
		const list = new TodoList();
		expect(list.format()).toBe("Todo list is empty.");
	});

	it("clears all items", () => {
		const list = new TodoList();
		list.add("Task 1");
		list.add("Task 2");
		list.clear();
		expect(list.getItems()).toEqual([]);
		expect(list.format()).toBe("Todo list is empty.");
	});

	it("handles items with special characters", () => {
		const list = new TodoList();
		list.add("Fix bug: /todo command not working");
		list.add("Review PR #123");
		const items = list.getItems();
		expect(items[0].text).toBe("Fix bug: /todo command not working");
		expect(items[1].text).toBe("Review PR #123");
	});
});
