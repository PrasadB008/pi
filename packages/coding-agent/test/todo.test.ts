import { describe, expect, it } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { AuthStorage } from "../src/core/auth-storage.ts";
import { SessionManager } from "../src/core/session-manager.ts";
import { SettingsManager } from "../src/core/settings-manager.ts";
import { getModelRuntime } from "./model-runtime-test-utils.ts";
import { createTestResourceLoader } from "./utilities.ts";

describe("AgentSession todo management", () => {
	async function createSession() {
		const resourceLoader = createTestResourceLoader();
		const authStorage = new AuthStorage(resourceLoader);
		const settingsManager = new SettingsManager(resourceLoader);
		const sessionManager = new SessionManager(resourceLoader);
		const modelRuntime = getModelRuntime();

		const session = new AgentSession({
			agent: { id: "test-agent", name: "Test Agent", description: "Test" },
			authStorage,
			settingsManager,
			sessionManager,
			modelRuntime,
			resourceLoader,
		});

		return session;
	}

	it("should start with an empty todo list", async () => {
		const session = await createSession();
		expect(session.getTodoItems()).toEqual([]);
	});

	it("should add a todo item", async () => {
		const session = await createSession();
		session.addTodoItem("Fix bug in parser");
		expect(session.getTodoItems()).toEqual(["Fix bug in parser"]);
	});

	it("should add multiple todo items", async () => {
		const session = await createSession();
		session.addTodoItem("Fix bug in parser");
		session.addTodoItem("Add tests");
		session.addTodoItem("Update docs");
		expect(session.getTodoItems()).toEqual(["Fix bug in parser", "Add tests", "Update docs"]);
	});

	it("should clear all todo items", async () => {
		const session = await createSession();
		session.addTodoItem("Fix bug in parser");
		session.addTodoItem("Add tests");
		session.clearTodoItems();
		expect(session.getTodoItems()).toEqual([]);
	});

	it("should return a copy of the todo list", async () => {
		const session = await createSession();
		session.addTodoItem("Fix bug in parser");
		const items = session.getTodoItems();
		items.push("Malicious item");
		expect(session.getTodoItems()).toEqual(["Fix bug in parser"]);
	});
});
