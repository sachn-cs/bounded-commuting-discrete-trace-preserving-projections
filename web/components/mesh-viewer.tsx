"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import type { Projector } from "traceprojector";
import { findFn, type FnDef } from "@/lib/functions";

interface MeshViewerProps {
  projector: Projector | null;
  functionId: string;
  p: number;
  form: 0 | 1 | 2;
  showEdges: boolean;
}

const COLORS = {
  bg: "#0a0a0a",
  edge: "#2a2a2a",
  text: "#e5e5e5",
};

function colorRamp(t: number, target: THREE.Color) {
  const tt = Math.max(0, Math.min(1, t));
  target.setHSL(0.66 - 0.66 * tt, 0.85, 0.5);
}

function TetMesh({
  projector,
  fn,
  p,
  form,
  showEdges,
}: {
  projector: Projector;
  fn: FnDef;
  p: number;
  form: 0 | 1 | 2;
  showEdges: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const { geometry, edgeGeom, legend } = useMemo(() => {
    const mesh = projector.mesh as unknown as {
      getTetrahedra: () => number[][];
      getVertices: () => [number, number, number][];
    };
    const tetList = mesh.getTetrahedra();
    const vertices = mesh.getVertices();
    const getVertex = (i: number): [number, number, number] => vertices[i]!;

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];
    const edgePositions: number[] = [];

    const fnVal = fn.scalar ?? (() => 0);

    let min = Infinity;
    let max = -Infinity;
    const sampled: number[] = [];
    tetList.forEach((tet) => {
      const c: [number, number, number] = [0, 0, 0];
      for (const idx of tet) {
        const v = getVertex(idx);
        c[0] += v[0];
        c[1] += v[1];
        c[2] += v[2];
      }
      c[0] /= 4;
      c[1] /= 4;
      c[2] /= 4;
      let val = 0;
      try {
        val = projector.projectHp(fnVal, c, 0, form, p) as number;
      } catch {
        val = 0;
      }
      sampled.push(val);
      if (val < min) min = val;
      if (val > max) max = val;
    });
    const range = max - min || 1;

    const facesPerTet: [number, number, number][] = [
      [0, 1, 2],
      [0, 1, 3],
      [0, 2, 3],
      [1, 2, 3],
    ];

    const tmpColor = new THREE.Color();
    for (let t = 0; t < tetList.length; t++) {
      const tet = tetList[t];
      const verts = tet.map((i) => {
        const v = getVertex(i);
        return [v[0] - 0.5, v[1] - 0.5, v[2] - 0.5] as [number, number, number];
      });
      const tNorm = (sampled[t] - min) / range;
      colorRamp(tNorm, tmpColor);
      const r = tmpColor.r;
      const g = tmpColor.g;
      const b = tmpColor.b;

      for (const [i, j, k] of facesPerTet) {
        const [ax, ay, az] = verts[i];
        const [bx, by, bz] = verts[j];
        const [cx, cy, cz] = verts[k];
        positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
        const n = new THREE.Vector3()
          .subVectors(new THREE.Vector3(bx, by, bz), new THREE.Vector3(ax, ay, az))
          .cross(
            new THREE.Vector3()
              .subVectors(new THREE.Vector3(cx, cy, cz), new THREE.Vector3(ax, ay, az))
          )
          .normalize();
        normals.push(n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z);
        colors.push(r, g, b, r, g, b, r, g, b);
      }

      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          const vi = verts[i];
          const vj = verts[j];
          edgePositions.push(vi[0], vi[1], vi[2], vj[0], vj[1], vj[2]);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const edgeGeom = new THREE.BufferGeometry();
    edgeGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePositions, 3)
    );

    return {
      geometry,
      edgeGeom,
      legend: { min, max, mid: (min + max) / 2 },
    };
  }, [projector, fn, p, form]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      edgeGeom.dispose();
    };
  }, [geometry, edgeGeom]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          flatShading
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      {showEdges && (
        <lineSegments geometry={edgeGeom}>
          <lineBasicMaterial color={COLORS.edge} />
        </lineSegments>
      )}
    </group>
  );
}

export function MeshViewer({
  projector,
  functionId,
  p,
  form,
  showEdges,
}: MeshViewerProps) {
  const fn = findFn(functionId);

  if (!projector) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        <p>Building mesh…</p>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [1.4, 1.0, 1.4], fov: 45 }}
      style={{ background: COLORS.bg }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, -3, -3]} intensity={0.3} />
      <TetMesh
        projector={projector}
        fn={fn}
        p={p}
        form={form}
        showEdges={showEdges}
      />
      <gridHelper args={[1, 10, "#222", "#222"]} />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}
