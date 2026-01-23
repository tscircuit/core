# CrossWithCornerHoles Component

A component that creates a cross pattern with pill-shaped plated holes and four circular plated holes at the corners.

## Pattern Description

- **Cross**: Two pill-shaped plated holes oriented at 45° and -45°
- **Corners**: Four circular plated holes positioned at the corners

## Usage

```tsx
import { CrossWithCornerHoles } from "@tscircuit/core"

// Basic usage with default dimensions
<CrossWithCornerHoles />

// Positioned component
<CrossWithCornerHoles pcbX={10} pcbY={5} pcbRotation={0} />

// Custom dimensions
<CrossWithCornerHoles
  pcbX={0}
  pcbY={0}
  crossOuterWidth="8mm"
  crossOuterHeight="2mm"
  crossHoleWidth="7mm"
  crossHoleHeight="1.5mm"
  cornerHoleDiameter="2mm"
  cornerOuterDiameter="3mm"
  cornerDistance={5}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pcbX` | `string \| number` | `0` | Center X position on PCB |
| `pcbY` | `string \| number` | `0` | Center Y position on PCB |
| `pcbRotation` | `string \| number` | `0` | Rotation of entire component |
| `crossOuterWidth` | `string \| number` | `"6mm"` | Outer width of pill-shaped cross holes |
| `crossOuterHeight` | `string \| number` | `"1.5mm"` | Outer height of pill-shaped cross holes |
| `crossHoleWidth` | `string \| number` | `"5mm"` | Hole width of pill-shaped cross holes |
| `crossHoleHeight` | `string \| number` | `"1mm"` | Hole height of pill-shaped cross holes |
| `cornerHoleDiameter` | `string \| number` | `"1.5mm"` | Hole diameter of corner circular holes |
| `cornerOuterDiameter` | `string \| number` | `"2mm"` | Outer diameter of corner circular holes |
| `cornerDistance` | `string \| number` | `4` | Distance from center to corner holes |

## Examples

See [tests/examples/cross-with-corner-holes-example.test.tsx](../../../tests/examples/cross-with-corner-holes-example.test.tsx) for usage examples.
