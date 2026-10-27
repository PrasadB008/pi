import { beforeEach, describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { createTestAgent } from "./utilities.ts";

describe("Todo list management", () => {
	let session: AgentSession;

	beforeEach(async () => {
		const agent = await createTestAgent();
		session = new AgentSession(agent, {});
	});

	it("should add a todo item", () => {
		session.addTodoItem("Fix bug in parser");
		const items = session.getTodoItems();
		expect(items).toEqual(["Fix bug in parser"]);
	});

	it("should add multiple todo items", () => {
		session.addTodoItem("Fix bug in parser");
		session.addTodoItem("Write tests");
		session.addTodoItem("Update docs");
		const items = session.getTodoItems();
		expect(items).toEqual(["Fix bug in parser", "Write tests", "Update docs"]);
	});

	it("should list todo items", () => {
		session.addTodoItem("Task 1");
		session.addTodoItem("Task 2");
		const items = session.getTodoItems();
		expect(items.length).toBe(2);
		expect(items[0]).toBe("Task 1");
		expect(items[1]).toBe("Task 2");
	});

	it("should return empty list when no items", () => {
		const items = session.getTodoItems();
		expect(items).toEqual([]);
	});

	it("should clear all todo items", () => {
		session.addTodoItem("Task 1");
		session.addTodoItem("Task 2");
		session.clearTodoItems();
		const items = session.getTodoItems();
		expect(items).toEqual([]);
	});

	it("should return a copy of the todo list", () => {
		session.addTodoItem("Task 1");
		const items1 = session.getTodoItems();
		const items2 = session.getTodoItems();
		expect(items1).toEqual(items2);
		expect(items1).not.toBe(items2); // Different array instances
	});
});
