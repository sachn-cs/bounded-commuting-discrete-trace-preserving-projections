"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildProjector } from "@/lib/trace-bridge";
import { findFn } from "@/lib/functions";

interface ConvergenceChartProps {
  functionId: string;
  form: 0 | 1 | 2 | 3;
  p: number;
  quadratureOrder: number;
}

interface DataPoint {
  h: number;
  n: number;
  error: number;
}

function computeL2Error(
  projector: ReturnType<typeof buildProjector>["projector"],
  fn: (p: number[]) => number,
  quadratureOrder: number
): number {
  const mesh = (
    projector.mesh as unknown as {
      getTetrahedra: () => number[][];
      getVertex: (i: number) => [number, number, number];
    }
  );
  const tets = mesh.getTetrahedra();
  const getVertex = mesh.getVertex.bind(mesh);

  const gaussPts: Array<[number, number, number, number]> = [];
  for (let i = 0; i < quadratureOrder; i++) {
    for (let j = 0; j < quadratureOrder - i; j++) {
      for (let k = 0; k < quadratureOrder - i - j; k++) {
        const l0 = (i + 0.5) / quadratureOrder;
        const l1 = (j + 0.5) / quadratureOrder;
        const l2 = (k + 0.5) / quadratureOrder;
        const l3 = 1 - l0 - l1 - l2;
        if (l3 < 0) continue;
        gaussPts.push([l0, l1, l2, l3]);
      }
    }
  }

  let total = 0;
  for (const tet of tets) {
    const verts = tet.map((i) => getVertex(i));
    const J = [
      [verts[1][0] - verts[0][0], verts[2][0] - verts[0][0], verts[3][0] - verts[0][0]],
      [verts[1][1] - verts[0][1], verts[2][1] - verts[0][1], verts[3][1] - verts[0][1]],
      [verts[1][2] - verts[0][2], verts[2][2] - verts[0][2], verts[3][2] - verts[0][2]],
    ];
    const det =
      J[0][0] * (J[1][1] * J[2][2] - J[1][2] * J[2][1]) -
      J[0][1] * (J[1][0] * J[2][2] - J[1][2] * J[2][0]) +
      J[0][2] * (J[1][0] * J[2][1] - J[1][1] * J[2][0]);
    const vol = Math.abs(det) / 6;
    for (const [l0, l1, l2, l3] of gaussPts) {
      const x =
        l0 * verts[0][0] + l1 * verts[1][0] + l2 * verts[2][0] + l3 * verts[3][0];
      const y =
        l0 * verts[0][1] + l1 * verts[1][1] + l2 * verts[2][1] + l3 * verts[3][1];
      const z =
        l0 * verts[0][2] + l1 * verts[1][2] + l2 * verts[2][2] + l3 * verts[3][2];
      const exact = fn([x, y, z]);
      const proj = projector.projectHp(
        fn,
        [x, y, z],
        0,
        0,
        0
      ) as number;
      const diff = exact - proj;
      total += diff * diff * vol / gaussPts.length;
    }
  }
  return Math.sqrt(total);
}

export function ConvergenceChart({
  functionId,
  form,
  p,
  quadratureOrder,
}: ConvergenceChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const fn = findFn(functionId);
      const fnVal = fn.scalar!;
      const points: DataPoint[] = [];
      for (const n of [4, 6, 8, 10, 12]) {
        if (cancelled) return;
        try {
          const b = buildProjector(n, quadratureOrder);
          const error = computeL2Error(b.projector, fnVal, quadratureOrder);
          points.push({ h: 1 / n, n, error });
          setData([...points]);
        } catch {
          points.push({ h: 1 / n, n, error: NaN });
        }
      }
      setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [functionId, form, p, quadratureOrder]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          L² error on the unit cube vs. mesh size h = 1/n.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setData([])}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Running…" : "Refresh"}
        </Button>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid stroke="#333" strokeDasharray="3 3" />
            <XAxis
              dataKey="h"
              type="number"
              scale="log"
              domain={["auto", "auto"]}
              tickFormatter={(v) => v.toFixed(3)}
              stroke="#888"
            />
            <YAxis
              scale="log"
              domain={["auto", "auto"]}
              tickFormatter={(v) => v.toExponential(1)}
              stroke="#888"
            />
            <Tooltip
              contentStyle={{
                background: "#0a0a0a",
                border: "1px solid #333",
                fontSize: 12,
              }}
              labelFormatter={(v) => `h = ${Number(v).toFixed(4)}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="error"
              name="L² error"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {data.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Expected slope for lowest-order P¹ on smooth data: error ∝ h².
        </p>
      )}
    </div>
  );
}
