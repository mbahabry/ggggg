import { describe, it, expect } from "vitest";
import { sumByType, calculateFinancials } from "./finance-rules";

describe("sumByType", () => {
  it("sums only transactions matching the requested type", () => {
    const transactions = [
      { type: "REVENUE" as const, amount: 1000 },
      { type: "EXPENSE" as const, amount: 300 },
      { type: "REVENUE" as const, amount: 500 },
    ];
    expect(sumByType(transactions, "REVENUE")).toBe(1500);
    expect(sumByType(transactions, "EXPENSE")).toBe(300);
  });

  it("returns 0 for an empty list", () => {
    expect(sumByType([], "REVENUE")).toBe(0);
  });
});

describe("calculateFinancials", () => {
  it("computes revenue, expense and net profit", () => {
    const transactions = [
      { type: "REVENUE" as const, amount: 200000 },
      { type: "REVENUE" as const, amount: 50000 },
      { type: "EXPENSE" as const, amount: 120000 },
      { type: "EXPENSE" as const, amount: 30000 },
    ];
    const result = calculateFinancials(transactions);
    expect(result.revenue).toBe(250000);
    expect(result.expense).toBe(150000);
    expect(result.net).toBe(100000);
  });

  it("allows a negative net when expenses exceed revenue", () => {
    const result = calculateFinancials([
      { type: "REVENUE", amount: 1000 },
      { type: "EXPENSE", amount: 5000 },
    ]);
    expect(result.net).toBe(-4000);
  });

  it("handles an empty transaction list", () => {
    const result = calculateFinancials([]);
    expect(result).toEqual({ revenue: 0, expense: 0, net: 0 });
  });
});
