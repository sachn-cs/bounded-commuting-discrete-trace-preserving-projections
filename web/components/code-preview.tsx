"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const TABS = [
  {
    id: "install",
    label: "Install",
    code: `# Node 26+
npm install traceprojector`,
  },
  {
    id: "project",
    label: "Project",
    code: `import {
  Mesh, Whitney, Projector, generateUnitCubeMesh,
} from 'traceprojector'

const mesh    = generateUnitCubeMesh(4)
const whitney = new Whitney(mesh)

const projector = new Projector(mesh, whitney, { quadratureOrder: 3 })
projector.computeBoundaryWeights()
projector.buildLocator()

const u     = (p) => Math.sin(p[0]) * Math.cos(p[1]) * Math.exp(p[2])
const value = projector.projectH1(u, [0.5, 0.5, 0.5], 0)
console.log(value)  // ≈ 1.365`,
  },
  {
    id: "boundary",
    label: "Exact boundary",
    code: `// Π⁰ reproduces u(v) at every boundary vertex,
// Π¹ reproduces ∫ₑ u·t ds at every boundary edge,
// Π² reproduces ∫f u·n dA at every boundary face.
// verifyBoundaryWeights() is a free cross-check.
projector.verifyBoundaryWeights()`,
  },
];

export function CodePreview() {
  const [active, setActive] = useState(TABS[0]!.id);
  const [copied, setCopied] = useState(false);
  const code = TABS.find((t) => t.id === active)!.code;

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section
      id="install"
      className="border-b border-border/40 bg-card/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Get started in 30 seconds
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              One <code className="font-mono text-primary">npm install</code>,
              then the API is the same as the math.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No build step, no transpiler, no peer-dep negotiation. Drop the
              lib into any Node 26 project and call{" "}
              <code className="font-mono text-foreground">projectH1</code>,{" "}
              <code className="font-mono text-foreground">projectHcurl</code>,{" "}
              <code className="font-mono text-foreground">projectHdiv</code>,
              or <code className="font-mono text-foreground">projectL2</code>{" "}
              — the rest of the de Rham complex is just composition.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                ESM-only, CJS and UMD bundles shipped on npm
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                Hand-written <code className="font-mono">.d.ts</code> for
                every module
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                Works in the browser via the UMD bundle on jsDelivr
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-zinc-950 shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                </div>
                <div className="ml-3 flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-400">
                  <Terminal className="h-3 w-3" />
                  traceprojector
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={copy}
                className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            <div className="flex border-b border-white/5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActive(tab.id)}
                  className={
                    "border-b-2 px-4 py-2 text-xs font-medium transition-colors " +
                    (active === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-zinc-500 hover:text-zinc-300")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-zinc-100">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
