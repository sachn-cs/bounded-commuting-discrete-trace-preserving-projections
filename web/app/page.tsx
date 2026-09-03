import { CodePreview } from "@/components/code-preview";
import { Features } from "@/components/features";
import { FinalCTA } from "@/components/final-cta";
import { Hero } from "@/components/hero";
import { MathSection } from "@/components/math-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <CodePreview />
        <MathSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}
