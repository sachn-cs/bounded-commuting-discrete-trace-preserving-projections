import type { ScalarFn, VectorFn } from "./trace-bridge";

export type FnCategory = "scalar" | "vector";

export interface FnDef {
  id: string;
  label: string;
  category: FnCategory;
  scalar?: ScalarFn;
  vector?: VectorFn;
  formula: string;
}

const sin = Math.sin;
const cos = Math.cos;
const exp = Math.exp;
const PI = Math.PI;

export const FUNCTIONS: FnDef[] = [
  {
    id: "sincos",
    label: "sin(x) cos(y) e^z",
    category: "scalar",
    formula: "u(x, y, z) = sin(x) cos(y) e^z",
    scalar: (p) => sin(p[0]!) * cos(p[1]!) * exp(p[2]!),
    vector: (p) => [sin(p[0]!) * cos(p[1]!) * exp(p[2]!), 0, 0],
  },
  {
    id: "quadratic",
    label: "x² + y² + z²",
    category: "scalar",
    formula: "u(x, y, z) = x² + y² + z²",
    scalar: (p) => p[0]! * p[0]! + p[1]! * p[1]! + p[2]! * p[2]!,
    vector: (p) => [2 * p[0]!, 2 * p[1]!, 2 * p[2]!],
  },
  {
    id: "linear",
    label: "x + y + z",
    category: "scalar",
    formula: "u(x, y, z) = x + y + z",
    scalar: (p) => p[0]! + p[1]! + p[2]!,
    vector: () => [1, 1, 1],
  },
  {
    id: "trig",
    label: "sin(πx) sin(πy) sin(πz)",
    category: "scalar",
    formula: "u(x, y, z) = sin(πx) sin(πy) sin(πz)",
    scalar: (p) =>
      sin(PI * p[0]!) * sin(PI * p[1]!) * sin(PI * p[2]!),
    vector: (p) => [
      PI * cos(PI * p[0]!) * sin(PI * p[1]!) * sin(PI * p[2]!),
      PI * sin(PI * p[0]!) * cos(PI * p[1]!) * sin(PI * p[2]!),
      PI * sin(PI * p[0]!) * sin(PI * p[1]!) * cos(PI * p[2]!),
    ],
  },
  {
    id: "exponential",
    label: "exp(x + y + z)",
    category: "scalar",
    formula: "u(x, y, z) = exp(x + y + z)",
    scalar: (p) => exp(p[0]! + p[1]! + p[2]!),
    vector: (p) => [
      exp(p[0]! + p[1]! + p[2]!),
      exp(p[0]! + p[1]! + p[2]!),
      exp(p[0]! + p[1]! + p[2]!),
    ],
  },
];

export function findFn(id: string): FnDef {
  return FUNCTIONS.find((f) => f.id === id) ?? FUNCTIONS[0]!;
}
