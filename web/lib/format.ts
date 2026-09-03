export function formatNumber(n: number, digits = 6): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) < 1e-12) return n.toExponential(2);
  return n.toFixed(digits);
}

export function formatBary(b: [number, number, number, number]): string {
  return `[${b.map((v) => v.toFixed(3)).join(", ")}]`;
}

export function generateCode(args: {
  functionId: string;
  subdivision: number;
  point: [number, number, number];
  p: number;
  quadratureOrder: number;
  form: number;
}): string {
  const { functionId, subdivision, point, p, quadratureOrder, form } = args;
  return `import {
  Mesh, Whitney, Projector, generateUnitCubeMesh,
} from 'traceprojector'

const mesh = generateUnitCubeMesh(${subdivision})
const whitney = new Whitney(mesh)
const projector = new Projector(mesh, whitney, { quadratureOrder: ${quadratureOrder} })
projector.computeBoundaryWeights()
projector.buildLocator()

const u = (p) => /* your function: '${functionId}' */ 0
const value = projector.projectHp(u, [${point.join(", ")}], /* tIdx */ 0, /* l */ ${form}, /* p */ ${p})
console.log(value)
`;
}
