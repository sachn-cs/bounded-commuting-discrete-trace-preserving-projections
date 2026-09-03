import {
  Box,
  Code2,
  Cpu,
  GitBranch,
  Layers,
  Target,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Layers,
    title: "Full 3D de Rham complex",
    body: "Π⁰ over H¹, Π¹ over H(curl), Π² over H(div), Π³ over L². Lowest order, lowest effort, ready for production FE schemes.",
  },
  {
    icon: Target,
    title: "Exact boundary traces",
    body: "Vertex values u(v), edge tangentials ∫_e u·t ds, and face normal fluxes ∫_f u·n dA are reproduced to machine precision on every boundary simplex.",
  },
  {
    icon: GitBranch,
    title: "Section 6.3 cascade",
    body: "Vertex, edge, and face boundary weights wired as L²-duality functionals on the surface trace spaces P¹, N₀, and RT₀. Cross-checked by verifyBoundaryWeights().",
  },
  {
    icon: Box,
    title: "Zero runtime dependencies",
    body: "LU solve, 3×3 inverse, barycentric gradients, surface differential operators — every kernel routine is hand-rolled in pure JavaScript.",
  },
  {
    icon: Cpu,
    title: "AABB point location",
    body: "O(log N) point-in-tet queries after a one-time balanced tree build. Pick any point inside the unit cube and get the projected value in microseconds.",
  },
  {
    icon: Code2,
    title: "Higher-order enrichment",
    body: "Scalar bubble basis for H¹ (p ≥ 4) and an L² monomial basis for L² (p ≥ 1). Vector-valued higher-order on H(curl) and H(div) is on the public roadmap.",
  },
];

export function Features() {
  return (
    <section className="border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Capabilities
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to project onto the discrete de Rham complex.
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            One library, four form degrees, three trace spaces, zero
            transpilation. The same code runs in Node 26, the browser, and the
            sandboxed playground below.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="group relative overflow-hidden border-border/60 bg-card/50 transition-colors hover:border-primary/40"
            >
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/0 blur-2xl transition-all duration-500 group-hover:bg-primary/15"
                aria-hidden
              />
              <CardHeader>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
