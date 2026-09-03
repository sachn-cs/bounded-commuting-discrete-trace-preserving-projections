import Link from "next/link";
import { ArrowRight, Star, Sparkles, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <div
        className="absolute left-1/2 top-0 -z-10 h-[600px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--brand-glow)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            v0.1.0 — Section 6.3 boundary-weight cascade is live
          </Badge>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Trace-preserving
            <br />
            <span className="text-gradient">finite-element projections</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
            A small, dependency-free JavaScript reference implementation of
            <span className="font-mono text-foreground"> Π⁰, Π¹, Π², Π³ </span>
            for the 3D de Rham complex. Bounded, commuting, exact on the
            boundary. Open source under MIT.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/playground">
                Open the playground
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://github.com/sachncs/traceprojector"
                target="_blank"
                rel="noreferrer"
              >
                <Star className="mr-2 h-4 w-4" />
                Star on GitHub
              </a>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <a href="#install">
                <Terminal className="mr-2 h-4 w-4" />
                npm install
              </a>
            </Button>
          </div>

          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/40 bg-border/40 text-left">
            {[
              { k: "0", label: "Runtime deps", sub: "pure ESM" },
              { k: "26+", label: "Node version", sub: "v26+ only" },
              { k: "192", label: "Tests passing", sub: "Mocha + Chai" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-1 bg-card px-6 py-5"
              >
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-mono text-3xl font-semibold text-foreground">
                  {s.k}
                </dd>
                <dd className="text-xs text-muted-foreground">{s.sub}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
