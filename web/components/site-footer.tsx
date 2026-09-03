import Link from "next/link";
import { Star, FileText } from "lucide-react";

import { Logo } from "@/components/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Playground", href: "/playground" },
      { label: "npm package", href: "https://www.npmjs.com/package/traceprojector" },
      { label: "Source code", href: "https://github.com/sachncs/traceprojector" },
      { label: "Releases", href: "https://github.com/sachncs/traceprojector/releases" },
    ],
  },
  {
    title: "Documentation",
    links: [
      { label: "README", href: "https://github.com/sachncs/traceprojector#readme" },
      { label: "API reference", href: "https://github.com/sachncs/traceprojector/blob/main/docs/api.md" },
      { label: "Math background", href: "https://github.com/sachncs/traceprojector/blob/main/docs/math.md" },
      { label: "Architecture", href: "https://github.com/sachncs/traceprojector/blob/main/docs/architecture.md" },
    ],
  },
  {
    title: "Reference",
    links: [
      {
        label: "Paper (arXiv)",
        href: "https://arxiv.org/abs/2604.28103",
      },
      {
        label: "Changelog",
        href: "https://github.com/sachncs/traceprojector/blob/main/CHANGELOG.md",
      },
      {
        label: "Roadmap",
        href: "https://github.com/sachncs/traceprojector#roadmap",
      },
      {
        label: "Contributing",
        href: "https://github.com/sachncs/traceprojector/blob/main/CONTRIBUTING.md",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "MIT License", href: "https://github.com/sachncs/traceprojector/blob/main/LICENSE" },
      { label: "Security", href: "https://github.com/sachncs/traceprojector/blob/main/SECURITY.md" },
      { label: "Code of Conduct", href: "https://github.com/sachncs/traceprojector/blob/main/CODE_OF_CONDUCT.md" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Bounded, commuting, discrete-trace preserving projections
              for the 3D de Rham complex. Pure JavaScript, MIT-licensed,
              open source.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <Link
                href="https://github.com/sachncs/traceprojector"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border/60 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label="GitHub"
              >
                <Star className="h-4 w-4" />
              </Link>
              <Link
                href="https://arxiv.org/abs/2604.28103"
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border/60 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                aria-label="arXiv paper"
              >
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={
                        link.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© 2026 Sachin. Released under the MIT License.</p>
          <p>
            Built with Next.js, three.js, shadcn/ui, and zero runtime
            dependencies for the math kernel.
          </p>
        </div>
      </div>
    </footer>
  );
}
