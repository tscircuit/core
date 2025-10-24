# Reproducing the schPinSpacing Width Bug

## Issue
The `schPinSpacing` parameter was incorrectly affecting the width/height of the schematic box, even when there were no pins on the sides that should determine that dimension.

## Reproduction Steps

### 1. Run the test BEFORE the fix

```bash
# Checkout the commit before the fix
git checkout <commit-before-fix>

# Run the test
bun test tests/repros/repro-schpinspacing-width.test.tsx
```

**Expected Output (FAILING):**
```
Small spacing - width: 0.4 height: 1
Large spacing - width: 1.6 height: 4

✗ schPinSpacing should not change the width of the schematic box
  Expected: 1.6
  Received: 0.4
```

This shows the bug: width changes from 0.4 to 1.6 when schPinSpacing changes from 0.2 to 0.8.

### 2. Apply the fix

The fix is in `lib/utils/schematic/getAllDimensionsForSchematicBox.ts`:

**Before:**
```typescript
schWidth = Math.max(
  sideLengths.top + params.schPinSpacing * 2,
  sideLengths.bottom + params.schPinSpacing * 2,
)
```

**After:**
```typescript
const MIN_PADDING = 0.4
schWidth = Math.max(
  sideLengths.top + MIN_PADDING,
  sideLengths.bottom + MIN_PADDING,
)
```

### 3. Run the test AFTER the fix

```bash
# Run the test again
bun test tests/repros/repro-schpinspacing-width.test.tsx
```

**Expected Output (PASSING):**
```
Small spacing - width: 0.4 height: 1
Large spacing - width: 0.4 height: 2.8

✓ schPinSpacing should not change the width of the schematic box
✓ schPinSpacing should not change width when pins are on top/bottom
```

Now the width stays at 0.4 regardless of schPinSpacing (because there are no top/bottom pins).
