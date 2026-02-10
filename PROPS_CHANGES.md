# Required Changes to @tscircuit/props

This PR depends on updates to the @tscircuit/props package. The following changes need to be made to `@tscircuit/props/lib/components/constraint.ts`:

## Type Changes

Add `centerX` property to `PcbXDistConstraint`:
```typescript
export type PcbXDistConstraint = {
  // ... existing properties ...

  /**
   * Optional X coordinate for the center point between left and right components.
   * Allows positioning both components on the x-axis.
   */
  centerX?: Distance
}
```

Add `centerY` property to `PcbYDistConstraint`:
```typescript
export type PcbYDistConstraint = {
  // ... existing properties ...

  /**
   * Optional Y coordinate for the center point between top and bottom components.
   * Allows positioning both components on the y-axis.
   */
  centerY?: Distance
}
```

## Zod Schema Changes

Update `pcbXDistConstraintProps`:
```typescript
export const pcbXDistConstraintProps = z.object({
  pcb: z.literal(true).optional(),
  xDist: distance,
  left: z.string(),
  right: z.string(),

  edgeToEdge: z.literal(true).optional(),
  centerToCenter: z.literal(true).optional(),
  centerX: distance.optional(),  // ADD THIS LINE
})
```

Update `pcbYDistConstraintProps`:
```typescript
export const pcbYDistConstraintProps = z.object({
  pcb: z.literal(true).optional(),
  yDist: distance,
  top: z.string(),
  bottom: z.string(),

  edgeToEdge: z.literal(true).optional(),
  centerToCenter: z.literal(true).optional(),
  centerY: distance.optional(),  // ADD THIS LINE
})
```
