import { describe, expect, it } from "vitest";
import { TodoList } from "../src/core/todo-list.ts";

describe("TodoList (/todo command)", () => {
	it("returns undefined for empty args so the caller lists items", () => {
		const list = new TodoList();
		expect(list.run("")).toBeUndefined();
		expect(list.run("   ")).toBeUndefined();
		expect(list.format()).toContain("No todos");
	});

	it("adds, completes, reopens, removes and clears items", () => {
		const list = new TodoList();
		expect(list.run("write tests")).toEqual({ ok: true, message: "Added todo #1: write tests" });
		expect(list.run("ship it")).toEqual({ ok: true, message: "Added todo #2: ship it" });

		expect(list.run("done 1")).toEqual({ ok: true, message: "Todo #1 done" });
		expect(list.format()).toBe("Todos (1/2 done)\n[x] #1 write tests\n[ ] #2 ship it");

		expect(list.run("undo #1")).toEqual({ ok: true, message: "Todo #1 reopened" });
		expect(list.items[0].done).toBe(false);

		expect(list.run("rm 1")).toEqual({ ok: true, message: "Removed todo #1" });
		expect(list.items.map((t) => t.id)).toEqual([2]);

		expect(list.run("clear")).toEqual({ ok: true, message: "Cleared todos" });
		expect(list.items).toEqual([]);
		expect(list.run("again")?.message).toBe("Added todo #1: again");
	});

	it("reports unknown ids as errors", () => {
		const list = new TodoList();
		expect(list.run("done 9")).toEqual({ ok: false, message: "No todo #9" });
	});
});
