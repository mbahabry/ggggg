/**
 * Minimal stand-in for Prisma's Decimal type, used only by the in-memory
 * fake-data layer (see mock-prisma.ts). Supports the two ways the rest of
 * the app touches decimal fields: `Number(x)` (via valueOf) and `x.toString()`.
 */
export class FakeDecimal {
  private readonly value: number;

  constructor(value: number | string) {
    this.value = typeof value === "string" ? parseFloat(value) : value;
  }

  valueOf(): number {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }

  toNumber(): number {
    return this.value;
  }

  toJSON(): number {
    return this.value;
  }
}

export function d(value: number | string): FakeDecimal {
  return new FakeDecimal(value);
}
