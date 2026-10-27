import { describe, expect, it } from "vitest";
import { TodoList } from "../src/utils/todo-list.ts";

describe("TodoList", () => {
	it("adds items to the list", () => {
		const list = new TodoList();
		list.add("Buy milk");
		list.add("Write tests");
		expect(list.list()).toEqual(["Buy milk", "Write tests"]);
	});

	it("lists all items", () => {
		const list = new TodoList();
		list.add("Task 1");
		list.add("Task 2");
		list.add("Task 3");
		expect(list.list()).toHaveLength(3);
	});

	it("returns empty list initially", () => {
		const list = new TodoList();
		expect(list.list()).toEqual([]);
		expect(list.isEmpty()).toBe(true);
	});

	it("clears all items", () => {
		const list = new TodoList();
		list.add("Task 1");
		list.add("Task 2");
		list.clear();
		expect(list.list()).toEqual([]);
		expect(list.isEmpty()).toBe(true);
	});

	it("maintains order of items", () => {
		const list = new TodoList();
		const items = ["First", "Second", "Third"];
		for (const item of items) {
			list.add(item);
		}
		expect(list.list()).toEqual(items);
	});

	it("returns a copy of the list", () => {
		const list = new TodoList();
		list.add("Original");
		const copy = list.list();
		copy.push("Modified");
		expect(list.list()).toEqual(["Original"]);
	});
});
