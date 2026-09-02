# Setup

## Requirements

- Node.js >= 20
- npm >= 10

## Installation

### From npm (when published)

```bash
npm install traceprojector
```

### From source

```bash
git clone https://github.com/sachncs/bounded-commuting-discrete-trace-preserving-projections.git
cd bounded-commuting-discrete-trace-preserving-projections
npm install
```

## Verify Installation

```bash
npm test
```

You should see all tests pass (166 tests as of v0.1.0).

## Usage in a Project

### ESM (modern bundlers, Node.js)

```javascript
import { Mesh, Whitney, Projector } from 'traceprojector'

const mesh = new Mesh(vertices, tetrahedra)
const whitney = new Whitney(mesh)
const traceProjector = new Projector(mesh, whitney, { quadratureOrder: 3 })
```

### CommonJS (legacy Node.js)

```javascript
const { Mesh, Whitney, Projector } = require('traceprojector')
```

### Browser (UMD via CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/traceprojector/dist/traceprojector.umd.js"></script>
<script>
  const { Mesh, Whitney, Projector } = window.Projector;
</script>
```

## TypeScript

Hand-written `.d.ts` files are included in `src/lib/`. If your bundler does not resolve them automatically, add the package to your `tsconfig.json` `types` array or reference the declaration files directly.
