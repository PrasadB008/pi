import { describe, expect, it, vi } from "vitest";
import todoExtension from "../examples/extensions/todo.ts";
import type { ExtensionAPI, ExtensionCommandContext } from "../src/core/extensions/index.ts";

type CommandHandler = (args: string, ctx: ExtensionCommandContext) => Promise<void> | void;

function setup() {
	const commands = new Map<string, CommandHandler>();
	const sendUserMessage = vi.fn<ExtensionAPI["sendUserMessage"]>();

	const api = {
		registerTool: vi.fn(),
		registerCommand(name: string, command: { handler: CommandHandler }) {
			commands.set(name, command.handler);
		},
		on: vi.fn(),
		sendUserMessage,
	} as unknown as ExtensionAPI;

	todoExtension(api);

	const custom = vi.fn(async () => undefined);
	const notify = vi.fn();
	const ctx = { mode: "tui", ui: { notify, custom } } as unknown as ExtensionCommandContext;

	async function run(args: string): Promise<void> {
		const handler = commands.get("todo");
		if (!handler) throw new Error("Missing command: todo");
		await handler(args, ctx);
	}

	return { commands, custom, notify, run, sendUserMessage };
}

describe("todo example extension /todo command", () => {
	it("registers /todo alongside /todos", () => {
		const { commands } = setup();
		expect(commands.has("todo")).toBe(true);
		expect(commands.has("todos")).toBe(true);
	});

	it("shows the list with no arguments", async () => {
		const { custom, run, sendUserMessage } = setup();
		await run("");
		expect(custom).toHaveBeenCalledOnce();
		expect(sendUserMessage).not.toHaveBeenCalled();
	});

	it("asks the agent to add a todo", async () => {
		const { run, sendUserMessage } = setup();
		await run("write tests");
		expect(sendUserMessage).toHaveBeenCalledWith('Use the todo tool to add this todo: "write tests"', {
			deliverAs: "followUp",
		});
	});

	it("asks the agent to clear todos", async () => {
		const { run, sendUserMessage } = setup();
		await run("clear");
		expect(sendUserMessage).toHaveBeenCalledWith("Use the todo tool to clear all todos.", {
			deliverAs: "followUp",
		});
	});

	it("reports an unknown todo id", async () => {
		const { notify, run, sendUserMessage } = setup();
		await run("done 7");
		expect(notify).toHaveBeenCalledWith("Todo #7 not found", "error");
		expect(sendUserMessage).not.toHaveBeenCalled();
	});
});
