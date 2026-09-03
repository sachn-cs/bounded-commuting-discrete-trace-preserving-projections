# traceprojector web playground

Interactive Next.js 16 + shadcn/ui playground for the
[`traceprojector`](../) library.

## What it does

- **3D viewer** — renders the unit-cube tetrahedral mesh with `three.js`,
  colored by the value the projector returns at each tet centroid.
- **API playground** — type a point, pick a function and a form degree,
  see the projected value, the tet it lands in, and the barycentric
  coordinates.
- **Convergence plot** — h-refinement L²-error curves, drawn with
  Recharts.
- **Code export** — copy a Node 26 snippet that reproduces the current
  configuration.

## Run it

From the **repository root** (not from `web/`):

```bash
npm install           # installs the lib and the playground in one shot
npm run web:dev       # http://localhost:3000
```

`web/` is an npm workspace, so `import { … } from 'traceprojector'`
inside the playground resolves directly to `../src/traceprojector/`.
No rebuild step is needed — edit the lib, hit save, the playground
picks it up.

## Build for production

```bash
npm run web:build
npm run web:start
```

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Server Components)
- [React 19](https://react.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (Radix primitives + Tailwind
  variants)
- [three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/)
  + [@react-three/drei](https://drei.docs.pmnd.rs/)
- [Recharts](https://recharts.org/)
- [Lucide](https://lucide.dev/) icons
- [sonner](https://sonner.emilkowal.ski/) toasts
