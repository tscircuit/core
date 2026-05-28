# Ubuntu font integration — core fork analysis

**Branch:** feat/ubuntu-font
**Date:** 2026-05-28
**Conclusion:** no code changes required in @tscircuit/core for Ubuntu
font support.

## Why core doesn't need changes

Core's text-emitting primitives (`SilkscreenText`, `CopperText`,
`PcbNoteText`, etc.) ALREADY pass `props.font` through to Circuit
JSON unchanged:

```ts
// lib/components/primitive-components/SilkscreenText.ts:137
font: props.font ?? "tscircuit2024",
```

Core does NOT consume the alphabet pkg for glyph rasterization. It
just records the font name on `pcb_silkscreen_text`. Downstream
renderers (Gerber emitter inside @tscircuit/cli, SVG renderer in
circuit-to-svg, 3D renderer in circuit-json-to-gltf) read this field
and pick the alphabet.

## What core depends on

`@tscircuit/props` ZodEnum validates the incoming `font` prop. With
core 0.0.1269 + stock props 0.0.538, `font: "ubuntu"` is REJECTED at
schema parse time before it reaches the text emitter.

Once consumers override `@tscircuit/props` to the EnergyCitizen fork
(0.0.538-ec.1 with widened enum), core's compiled validation paths
accept "ubuntu" automatically. No core rebuild required because Zod
schema parsing happens at component construction time using the
runtime-resolved props pkg.

## What this branch contains

Marker doc only. The fork worktree is kept alive in case future work
needs core-side changes (e.g. exposing a font-registry hook for
custom renderers). For now the registry lives entirely in
`@tscircuit/alphabet` (fonts/index.ts getFont(name)).

## Real render dispatch happens in

- `@tscircuit/cli` (bundles `circuit-json-to-gerber`-like emitter)
  → reads `pcb_silkscreen_text.font` → looks up glyphs
- `circuit-to-svg` → same lookup for preview SVG
- `circuit-json-to-gltf` → same for 3D viewer

Patching each of those for font dispatch is the next layer of work.
For now the carrier project uses a project-local `UbuntuText` helper
component that walks the Ubuntu lineAlphabet directly and emits raw
`<silkscreenpath>` JSX per glyph segment. This bypasses the renderer
chain entirely + Gerber sees Ubuntu shape as a sequence of stroke
paths.

When upstream tscircuit accepts the font-registry pattern (W15.P7
upstream PRs), the cli bundle can be retrofitted to call
`getFont(font).lineAlphabet` instead of importing `lineAlphabet`
directly. At that point the per-project helper component is no longer
needed and silkscreentext font="ubuntu" works transparently.
