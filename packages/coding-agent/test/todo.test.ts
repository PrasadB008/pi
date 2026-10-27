import { describe, it, expect, beforeEach, vi } from "vitest";
import { AgentSession } from "../src/core/agent-session.ts";
import { createTestSession } from "./suite/harness.ts";

describe("Todo command", () => {
	let session: AgentSession;

	beforeEach(async () => {
		session = await createTestSession();
	});

	it("should add a todo item", async () => {
		const sendMessageSpy = vi.spyOn(
			session["_extensionRunner"],
			"sendMessage"
		);

		await session.prompt("/todo Buy groceries");

		expect(sendMessageSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				role: "assistant",
				content: "Added to todo: Buy groceries",
			})
		);
	});

	it("should list todo items", async () => {
		const sendMessageSpy = vi.spyOn(
			session["_extensionRunner"],
			"sendMessage"
		);

		await session.prompt("/todo Buy groceries");
		await session.prompt("/todo Call mom");
		await session.prompt("/todo");

		expect(sendMessageSpy).toHaveBeenLastCalledWith(
			expect.objectContaining({
				role: "assistant",
				content: expect.stringContaining("1. Buy groceries"),
			})
		);
		expect(sendMessageSpy).toHaveBeenLastCalledWith(
			expect.objectContaining({
				role: "assistant",
				content: expect.stringContaining("2. Call mom"),
			})
		);
	});

	it("should show empty list when no items", async () => {
		const sendMessageSpy = vi.spyOn(
			session["_extensionRunner"],
			"sendMessage"
		);

		await session.prompt("/todo");

		expect(sendMessageSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				role: "assistant",
				content: "No todo items.",
			})
		);
	});
});
