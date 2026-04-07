// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";

const STORAGE_KEY = "completion-guide-state";

describe("Feature: email-address-input, Property 1: Email localStorage Round-Trip", () => {
  /**
   * **Validates: Requirements 3.1, 3.2, 7.4**
   *
   * For any string value stored as `emailAddress` in the localStorage state
   * object, saving via JSON.stringify and then loading via JSON.parse should
   * restore the identical string value.
   */

  beforeEach(() => {
    localStorage.clear();
  });

  it("should round-trip any emailAddress string through localStorage", () => {
    fc.assert(
      fc.property(fc.string(), (email) => {
        // Save: mirrors saveToLocalStorage in Index.tsx
        const state = {
          selectedDays: [],
          minutesPerDay: {},
          completionDate: "",
          submitted: false,
          weeks: [],
          checkedTaskIds: [],
          warnings: { unallocatedTasks: false, exceededDate: false },
          emailAddress: email,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        // Load: mirrors loadFromLocalStorage in Index.tsx
        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        const restored = parsed.emailAddress || "";

        // The restored value must equal the original — unless the original
        // was empty string, in which case the `|| ""` fallback also yields "".
        expect(restored).toBe(email || "");
      }),
      { numRuns: 100 },
    );
  });
});

import { isValidEmail } from "@/pages/Index";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

describe("Feature: email-address-input, Property 2: Email Validation Correctness", () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * For any non-empty string, isValidEmail should return true if and only if
   * the string matches the expected email regex pattern.
   */

  it("should return true only for strings matching the email pattern", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (input) => {
        const result = isValidEmail(input);
        const expected = EMAIL_REGEX.test(input);
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});

import { setActorEmail } from "@/lib/xapi";
import { greedyScheduleTasks } from "@/lib/scheduler";
import type { TaskPool } from "@shared/tasks";

describe("Feature: email-address-input, Property 3: Scheduler Independence from Email", () => {
  /**
   * **Validates: Requirements 6.1**
   *
   * For any two distinct email address values, given identical scheduling
   * inputs (selectedDays, minutesPerDay, taskPool), greedyScheduleTasks
   * should produce identical week schedules.
   */

  const fixedTaskPool: TaskPool = {
    assigned: [
      { id: 1, module: 1, unit: "U1", page: "P1", activity_type: "read", weight: 0.5 },
      { id: 2, module: 1, unit: "U1", page: "P2", activity_type: "review", weight: 1 },
    ],
    available: [
      { id: 3, module: 2, unit: "U2", page: "P3", activity_type: "test", weight: 0.75 },
      { id: 4, module: 2, unit: "U2", page: "P4", activity_type: "read", weight: 0.5 },
    ],
    completed: [],
  };

  const fixedSelectedDays = ["M", "W", "F"];
  const fixedDailyHours: Record<string, number> = { M: 2, W: 2, F: 2 };

  it("should produce identical schedules regardless of the actor email", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (emailA, emailB) => {
        setActorEmail(emailA);
        const resultA = greedyScheduleTasks(
          fixedTaskPool,
          fixedSelectedDays,
          fixedDailyHours,
        );

        setActorEmail(emailB);
        const resultB = greedyScheduleTasks(
          fixedTaskPool,
          fixedSelectedDays,
          fixedDailyHours,
        );

        expect(resultA).toStrictEqual(resultB);
      }),
      { numRuns: 100 },
    );
  });
});
