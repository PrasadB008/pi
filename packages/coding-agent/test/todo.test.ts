import { describe, it, expect } from "vitest";
import { TodoList } from "../src/modes/interactive/todo.ts";

describe("TodoList", () => {
	it("should add a todo item", () => {
		const list = new TodoList();
		list.add("Buy milk");
		expect(list.list()).toEqual(["Buy milk"]);
	});

	it("should list all todo items", () => {
		const list = new TodoList();
		list.add("Buy milk");
		list.add("Write tests");
		list.add("Deploy app");
		expect(list.list()).toEqual(["Buy milk", "Write tests", "Deploy app"]);
	});

	it("should format todo items with numbers", () => {
		const list = new TodoList();
		list.add("Buy milk");
		list.add("Write tests");
		const formatted = list.format();
		expect(formatted).toBe("1. Buy milk\n2. Write tests");
	});

	it("should return message when list is empty", () => {
		const list = new TodoList();
		expect(list.format()).toBe("No todo items yet.");
	});

	it("should trim whitespace from todo items", () => {
		const list = new TodoList();
		list.add("  Buy milk  ");
		expect(list.list()).toEqual(["Buy milk"]);
	});

	it("should ignore empty strings", () => {
		const list = new TodoList();
		list.add("");
		list.add("   ");
		expect(list.list()).toEqual([]);
	});

	it("should clear all items", () => {
		const list = new TodoList();
		list.add("Buy milk");
		list.add("Write tests");
		list.clear();
		expect(list.list()).toEqual([]);
	});
});
