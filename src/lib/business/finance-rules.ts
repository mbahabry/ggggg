export type FinanceLike = {
  type: "REVENUE" | "EXPENSE";
  amount: number;
};

export function sumByType(transactions: FinanceLike[], type: "REVENUE" | "EXPENSE"): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateFinancials(transactions: FinanceLike[]): {
  revenue: number;
  expense: number;
  net: number;
} {
  const revenue = sumByType(transactions, "REVENUE");
  const expense = sumByType(transactions, "EXPENSE");
  return { revenue, expense, net: revenue - expense };
}
