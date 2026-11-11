# Bench Supply Status Indicator

[Open the board in tscircuit](https://tscircuit.com/editor?&snippet_type=board#data:application/gzip;base64,H4sIADDX9GoAA62WbW/aMBDHv4qVV620hkBhZVNBosBWIUTXQNmmZS9MYkjUYEeJo9IhvvvONjHhITxIfYPsw/f/3Z19dpZGQD2yMHmyML4aZBGxmCOPTHEacnR1jRpNdOVQhO4nDMceegs87jcco2rN546BfBLMfA7zSl3OccpZzFJOYrCJyU3IXBw6RlNogEoUUJ9gj8SI4jmBRb0yuIG1zVLKG8vKCibcFYiKWatK0SljPIoD+NsxYGXM3irKp48nJEwayz+OMa45xifkGN8HHcf4CyLu5FdjeVP+LIe/G0trhRLXF7Y7OQITsEpZXDFJggRiz8KyRVjKiKkrLOXXnVCsugVQTQKAIil9YatmpNscKSReBukIiMtCJqo1iwmhRxG1fUL5EMHFEXaDXDJtyVHWLBvLot/OTGidx1ZG8KfmRWniT1LOGc2Aw5+CuLVveo0mbPQhMaWvNmlHfm9rxO5vbU3VvDu6ObpwUCUFUoNToNu9M2BZR0F1nRKcux3STX6LeIzpNuxZVIy/R2JMo92DkDBeEdEozBeNUfsPJsXb3Zi9Zls3zgc129PLKNdsB3oN6rF/PCF3l6BpzOaAMHtl1EQm6Mv8mciecFMQTnqIwLSHbPwiF/tiiPbQELMjTZgyjxT7qUUu5r5adl587Yvj0x7nFwGa8lLKxmVTBruSUymqXrZm4/YslSY4OVI8+3Y3wMvczq+FkiXzgMNTdaEXXNghcaF1dZC9fLpFpzZftoLi+ywkWas+inVeABP1mEKDyv7ce9jEPX1YQURTqFAgkATha+KKp4iTBUfiB1wfuoP2IxqOWqOXISohuztGLXlXUD4M/hHQ0GIwOiH2w+4Oh2j0hLqD1kO/u6VjmZsrdEtqBl8VkX5e0igK3/tkRqh3qCTiiYeRzTjmAaNwYVqrtZB4HlkUkTgfUW18OJlcYQqzKfLNf1yUZPRydl+S31EwvnaosfoPSXurHH4JAAA=)

The link contains the source. Development, routing, testing, and snapshot capture run locally. The single authoritative board source is [tests/fixtures/bench-supply-status-indicator.tsx](../../../tests/fixtures/bench-supply-status-indicator.tsx). Both repro tests instantiate this same board.

## Local reproduction

1. Run bun install in core.
2. Run bun test tests/repros/copper-text-group-rotation.test.tsx tests/repros/copper-text-group-rotation-expected.test.tsx.
3. Inspect tests/repros/__snapshots__/copper-text-group-rotation-pcb.snap.svg.
4. To see the behavioral failure, temporarily change test.failing to test in the expected-behavior test and run it. The copper supply legend should be at 90 degrees; it is emitted at 0 degrees.

The snapshot test also asserts that the board emits no core error elements. The desired-behavior test is explicitly marked as an expected failure. This PR reproduces the defect and changes no production implementation.

## Actual board snapshot

![Locally rendered Bench Supply Status Indicator](./board-pcb.png)

The rotated supply legend is in the lower-left corner. Yellow silkscreen follows the group's 90-degree rotation; red copper stays horizontal. The SVG is emitted by core's toMatchPcbSnapshot matcher from this actual board's Circuit JSON. The PNG is rasterized from that exact SVG with resvg. No image-generation model or hand-drawn board is used.

## Board and validation

The 40 x 28 mm board has a two-pin 5 V input, a green power LED, 100 nF decoupling, a momentary button, an NPN output stage with base resistor and pulldown, an output header, and two mounting holes.

Local build: 9 electrical components, 13 routed PCB traces, and no core error elements. Two repro tests plus the existing copper-text test pass, including one expected failure. Biome checks pass. The full core suite and manufacturing sign-off were not performed.

Source baseline: fc7c379e7376db75f8d61fec5447c8022ede6526 (core package 0.0.2344). Local environment: Bun 1.4.4 on Windows, props 0.0.724, circuit-json 0.0.548, circuit-to-svg 0.0.457, math-utils 0.0.39.

## Cause and prior-report search

CopperText.ts emits ccw_rotation from props.pcbRotation instead of inheriting the group's global orientation.

Searched open and closed organization issues and PRs for coppertext/copper text/copper_text/copper label with group, parent, rotation, and transform terms on 2026-11-11. No matching report for this core authoring path was found. Related [circuit-json-util#144](https://github.com/tscircuit/circuit-json-util/pull/144) fixes an external Circuit JSON transform, and [core#5172](https://github.com/tscircuit/core/pull/5172) addresses routing obstacles.
