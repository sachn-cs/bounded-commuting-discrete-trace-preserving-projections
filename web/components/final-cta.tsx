import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 py-24">
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--brand-glow)" }}
        aria-hidden
      />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          Ready to project?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          Spin up the playground, pick a function, and watch the trace
          projectors do their thing on a live tetrahedral mesh — all in
          your browser, no installation required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
              Read the source
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
