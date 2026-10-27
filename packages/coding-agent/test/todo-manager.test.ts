import { describe, expect, it } from "vitest";
import { TodoManager } from "../src/core/todo-manager.ts";

describe("TodoManager", () => {
	it("adds todo items", () => {
		const manager = new TodoManager();
		manager.add("First task");
		manager.add("Second task");

		expect(manager.getItems()).toEqual(["First task", "Second task"]);
	});

	it("returns empty list initially", () => {
		const manager = new TodoManager();
		expect(manager.getItems()).toEqual([]);
	});

	it("clears all todo items", () => {
		const manager = new TodoManager();
		manager.add("Task 1");
		manager.add("Task 2");
		manager.clear();

		expect(manager.getItems()).toEqual([]);
	});

	it("maintains order of added items", () => {
		const manager = new TodoManager();
		manager.add("Alpha");
		manager.add("Beta");
		manager.add("Gamma");

		expect(manager.getItems()).toEqual(["Alpha", "Beta", "Gamma"]);
	});
});
