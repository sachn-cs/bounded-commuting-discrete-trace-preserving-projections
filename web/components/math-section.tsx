import { ArrowDown, ChevronRight, Sigma } from "lucide-react";

export function MathSection() {
  return (
    <section className="border-b border-border/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            Mathematical background
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built on a clean decomposition.
          </h2>
          <p className="mt-4 text-balance text-muted-foreground">
            Each projector splits into a boundary-preserving part and an
            interior ring part, both computed in stable local solves on
            Alfeld- or Worsey-Farin-subdivided patches.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 shadow-lg shadow-primary/5">
            <div className="flex items-center justify-center gap-4 text-2xl font-semibold sm:text-3xl">
              <span className="font-mono">Πˡ</span>
              <span className="text-muted-foreground">=</span>
              <span className="font-mono text-primary">Π_∂ˡ</span>
              <span className="text-muted-foreground">+</span>
              <span className="font-mono text-accent">Π_ringˡ</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono">(I − Π_∂ˡ)</span>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Π_∂ˡ prescribes the boundary data exactly; Π_ringˡ is the
              interior projector with vanishing trace.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/40 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sigma className="h-4 w-4 text-primary" />
                Boundary weight cascade
              </div>
              <ol className="mt-3 space-y-2 font-mono text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ChevronRight className="h-3.5 w-3.5 text-primary" />
                  ζ<sub className="text-xs">0,v</sub>
                  <sup className="text-xs">0</sup> on P¹ (eq. 6.25)
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  ζ<sub className="text-xs">0,e</sub>
                  <sup className="text-xs">1</sup> on N₀ (eq. 6.31)
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                  ζ<sub className="text-xs">0,f</sub>
                  <sup className="text-xs">2</sup> on RT₀ (eq. 6.36)
                </li>
              </ol>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/40 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sigma className="h-4 w-4 text-accent" />
                Commuting diagram
              </div>
              <ul className="mt-3 space-y-2 font-mono text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-accent" />
                  grad Π⁰ = Π¹ grad
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-accent" />
                  curl Π¹ = Π² curl
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-accent" />
                  div Π² = Π³ div
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            From{" "}
            <a
              href="https://arxiv.org/abs/2604.28103"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
            >
              Ern, Guzmán, Potu (2026) — arXiv:2604.28103
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
