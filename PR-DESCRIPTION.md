Fixes #1576

## Reproduction

Added tests that demonstrate the bug. Before the fix, changing schPinSpacing from 0.2 to 0.8 incorrectly changed box dimensions even when there were no pins on the affected sides.

Test output before fix:
```
Small spacing - width: 0.4 height: 1
Large spacing - width: 1.6 height: 4
Test FAILED - width changed from 0.4 to 1.6
```

## Fix

Changed width/height calculation in getAllDimensionsForSchematicBox.ts to use fixed MIN_PADDING (0.4) instead of schPinSpacing * 2. This ensures box dimensions are determined by pin positions, not pin spacing.

## Result

After fix, box dimensions stay constant when schPinSpacing changes:

```
Small spacing - width: 0.4 height: 1
Large spacing - width: 0.4 height: 2.8
Tests PASS - width stays at 0.4
```

The schPinSpacing parameter now only affects spacing between pins, not the overall box size.

## Tests

- Added repro-schpinspacing-width-leftright.test.tsx
- Added repro-schpinspacing-width-topbottom.test.tsx
- Updated snapshots for affected tests
