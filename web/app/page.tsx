"use client";

import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, Play, RefreshCw, BarChart3, Code2, Box } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";

import { MeshViewer } from "@/components/mesh-viewer";
import { ConvergenceChart } from "@/components/convergence-chart";
import { buildProjector, projectAtPoint } from "@/lib/trace-bridge";
import { FUNCTIONS, findFn } from "@/lib/functions";
import { formatBary, formatNumber, generateCode } from "@/lib/format";

import type { Projector as ProjectorT } from "traceprojector";

export default function Page() {
  const [subdivision, setSubdivision] = useState(6);
  const [quadratureOrder, setQuadratureOrder] = useState(3);
  const [functionId, setFunctionId] = useState("sincos");
  const [p, setP] = useState(0);
  const [form, setForm] = useState<0 | 1 | 2 | 3>(0);
  const [showEdges, setShowEdges] = useState(true);

  const [pointStr, setPointStr] = useState("0.5, 0.5, 0.5");

  const [projector, setProjector] = useState<ProjectorT | null>(null);
  const [bundleInfo, setBundleInfo] = useState<{
    tets: number;
    vertices: number;
  } | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);

  useEffect(() => {
    setIsBuilding(true);
    try {
      const b = buildProjector(subdivision, quadratureOrder);
      setProjector(b.projector);
      setBundleInfo({ tets: b.tets, vertices: b.vertices });
    } catch (err) {
      toast.error("Failed to build projector", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsBuilding(false);
    }
  }, [subdivision, quadratureOrder]);

  const point = useMemo<[number, number, number]>(() => {
    const parts = pointStr.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 3 && parts.every((v) => Number.isFinite(v))) {
      return [parts[0]!, parts[1]!, parts[2]!];
    }
    return [0.5, 0.5, 0.5];
  }, [pointStr]);

  const projection = useMemo(() => {
    if (!projector) return null;
    const fn = findFn(functionId);
    const fnVal = fn.scalar!;
    try {
      return projectAtPoint(projector, fnVal, point, p);
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }, [projector, functionId, point, p]);

  const exactValue = useMemo(() => {
    const fn = findFn(functionId);
    return fn.scalar!(point);
  }, [functionId, point]);

  const codeSnippet = useMemo(
    () =>
      generateCode({
        functionId,
        subdivision,
        point,
        p,
        quadratureOrder,
        form,
      }),
    [functionId, subdivision, point, p, quadratureOrder, form]
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(codeSnippet);
    toast.success("Copied snippet to clipboard");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors />
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Box className="h-5 w-5" />
            <div>
              <h1 className="text-lg font-semibold leading-none">
                traceprojector playground
              </h1>
              <p className="text-xs text-muted-foreground">
                Bounded, commuting, discrete-trace preserving projections —
                visualised live in the browser.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bundleInfo && (
              <>
                <Badge variant="secondary">
                  {bundleInfo.tets.toLocaleString()} tets
                </Badge>
                <Badge variant="secondary">
                  {bundleInfo.vertices.toLocaleString()} verts
                </Badge>
              </>
            )}
            {isBuilding && (
              <Badge variant="outline">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> building
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mesh</CardTitle>
              <CardDescription>
                Structured unit-cube tetrahedral mesh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Subdivision (n³ cubes)</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {subdivision}
                  </span>
                </div>
                <Slider
                  min={2}
                  max={10}
                  step={1}
                  value={[subdivision]}
                  onValueChange={(v) => setSubdivision(v[0]!)}
                />
              </div>
              <div className="space-y-2">
                <Label>Quadrature order</Label>
                <Select
                  value={String(quadratureOrder)}
                  onValueChange={(v) => setQuadratureOrder(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((q) => (
                      <SelectItem key={q} value={String(q)}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edges">Show edges</Label>
                <input
                  id="edges"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={showEdges}
                  onChange={(e) => setShowEdges(e.target.checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Function</CardTitle>
              <CardDescription>
                Pre-defined scalar/vector fields to project.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={functionId} onValueChange={setFunctionId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNCTIONS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs">
                {findFn(functionId).formula}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projection</CardTitle>
              <CardDescription>
                Form degree l and polynomial degree p.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Form degree (l)</Label>
                <Select
                  value={String(form)}
                  onValueChange={(v) => setForm(parseInt(v) as 0 | 1 | 2 | 3)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 — H¹ (P¹)</SelectItem>
                    <SelectItem value="1">1 — H(curl) (N₀)</SelectItem>
                    <SelectItem value="2">2 — H(div) (RT₀)</SelectItem>
                    <SelectItem value="3">3 — L² (P⁰)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Polynomial degree (p)</Label>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {p}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={4}
                  step={1}
                  value={[p]}
                  onValueChange={(v) => setP(v[0]!)}
                />
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Tabs defaultValue="viewer" className="w-full">
            <TabsList>
              <TabsTrigger value="viewer">
                <Box className="mr-1 h-3.5 w-3.5" /> 3D Viewer
              </TabsTrigger>
              <TabsTrigger value="playground">
                <Play className="mr-1 h-3.5 w-3.5" /> API Playground
              </TabsTrigger>
              <TabsTrigger value="convergence">
                <BarChart3 className="mr-1 h-3.5 w-3.5" /> Convergence
              </TabsTrigger>
              <TabsTrigger value="export">
                <Code2 className="mr-1 h-3.5 w-3.5" /> Code Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="viewer">
              <Card>
                <CardContent className="p-0">
                  <div className="h-[560px] overflow-hidden rounded-md">
                    <MeshViewer
                      projector={projector}
                      functionId={functionId}
                      p={p}
                      form={form as 0 | 1 | 2}
                      showEdges={showEdges}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="playground">
              <Card>
                <CardHeader>
                  <CardTitle>Project at a point</CardTitle>
                  <CardDescription>
                    Type a point inside [0, 1]³ and see what the projector
                    returns, plus the tetrahedron it lands in and the
                    barycentric coordinates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Point (x, y, z)</Label>
                    <Input
                      value={pointStr}
                      onChange={(e) => setPointStr(e.target.value)}
                      placeholder="0.5, 0.5, 0.5"
                    />
                  </div>
                  <Separator />
                  {projection && "error" in projection ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
                      {projection.error}
                    </div>
                  ) : projection ? (
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Exact u(point)</dt>
                        <dd className="font-mono">
                          {formatNumber(exactValue)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Π^p u(point)
                        </dt>
                        <dd className="font-mono">
                          {formatNumber(projection.value)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          |error|
                        </dt>
                        <dd className="font-mono">
                          {formatNumber(
                            Math.abs(projection.value - exactValue)
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          tet index
                        </dt>
                        <dd className="font-mono">{projection.tIdx}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">barycentric</dt>
                        <dd className="font-mono">
                          {formatBary(projection.bary)}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Building projector…
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="convergence">
              <Card>
                <CardHeader>
                  <CardTitle>h-refinement convergence</CardTitle>
                  <CardDescription>
                    Run the projector for the current function on unit-cube
                    meshes of increasing subdivision and plot the L² error
                    vs. h.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConvergenceChart
                    functionId={functionId}
                    form={form}
                    p={p}
                    quadratureOrder={quadratureOrder}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle>Reproducible snippet</CardTitle>
                  <CardDescription>
                    Copy this code into a Node 26 script to reproduce the
                    current configuration.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[440px] rounded-md border bg-zinc-950 text-zinc-100">
                    <pre className="p-4 text-xs leading-relaxed">
                      <code>{codeSnippet}</code>
                    </pre>
                  </ScrollArea>
                  <div className="mt-3 flex justify-end">
                    <Button onClick={copyCode} size="sm">
                      <Copy className="mr-2 h-3.5 w-3.5" /> Copy snippet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-muted-foreground">
          traceprojector · pure-JS FEM de Rham projections · Node 26+ ·
          source on{" "}
          <a
            href="https://github.com/sachncs/traceprojector"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
