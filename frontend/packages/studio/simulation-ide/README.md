# @coze-studio/simulation-ide

## Infinite Simulation IDE

A development environment where every software idea is tested inside thousands of AI-generated simulated futures before humans build or launch it.

### Features

- **Product Input Configuration**: Define product ideas, target customers, pricing models, competitors, onboarding flows, and existing context
- **Simulation Engine**: Generates predictions based on market dynamics, competitive analysis, and customer behavior modeling
- **Output Dashboard**: Rich visualization of simulation results including:
  - Predicted adoption by customer segment
  - Objections and mitigation strategies
  - Churn risk analysis
  - Feature gap identification
  - Pricing sensitivity analysis
  - Support burden estimation
  - Abuse case prediction
  - MVP scope recommendation with technical architecture and backlog

### Usage

```tsx
import { SimulationPage } from '@coze-studio/simulation-ide';

function App() {
  return <SimulationPage />;
}
```

### Architecture

- `src/types/` - TypeScript type definitions for all simulation data structures
- `src/engine/` - Simulation engine that processes inputs and generates predictions
- `src/store.ts` - Zustand state management
- `src/components/` - React components (InputForm, OutputDashboard, SimulationPage)
- `src/styles/` - CSS modules for dark-themed UI

### Development

```bash
# From monorepo root
rush build -o @coze-studio/simulation-ide

# Run tests
cd frontend/packages/studio/simulation-ide
npm run test
```
