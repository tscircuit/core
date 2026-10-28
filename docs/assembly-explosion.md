# Assembly explosion rendering

The stage/move props and PoppyGL guide APIs are merged. The core implementation
is under review in [core #4631](https://github.com/tscircuit/core/pull/4631).

| Implementation | Status | Published dependency |
| --- | --- | --- |
| [Props stage and move API](https://github.com/tscircuit/props/pull/936) | Merged | `@tscircuit/props@0.0.707` |
| [PoppyGL explosion guide lines](https://github.com/tscircuit/poppygl/pull/49) | Merged | `poppygl@0.0.36` |
| [Core constrained explosion views](https://github.com/tscircuit/core/pull/4631) | Under review | Uses the published releases above |

Core consumes published npm versions of both upstream packages. The existing
dependency check continues to reject PR preview dependencies before merge.

## Usage

Use `assembly.explosion.stage` and `assembly.explosion.move` directly in an
assembly device or subassembly. There is no explosion container, explicit
collision-check element, `run`, or `detach`.

```tsx
<assembly.device name="instrument">
  <assembly.part name="leftScrew" modelUrl="./left-screw.step" />
  <assembly.part name="rightScrew" modelUrl="./right-screw.step" />
  <assembly.subassembly name="cover">
    <assembly.part name="shell" modelUrl="./shell.step" />
    <assembly.part name="window" modelUrl="./window.step" />
    <assembly.explosion.stage name="remove-window">
      <assembly.explosion.move targetRef="window" offZ="15mm" />
    </assembly.explosion.stage>
  </assembly.subassembly>
  <assembly.explosion.stage name="remove-screws">
    <assembly.explosion.move targetRefs="leftScrew, rightScrew" offZ="8mm" />
  </assembly.explosion.stage>
  <assembly.explosion.stage name="lift-cover">
    <assembly.explosion.move targetRef="cover" offZ="12mm" />
  </assembly.explosion.stage>
  <assembly.explosion.stage
    name="park-cover"
    nextStageRef="cover.remove-window"
  >
    <assembly.explosion.move targetRef="cover" offX="60mm" />
  </assembly.explosion.stage>
</assembly.device>
```

After normal rendering resolves mounting constraints and CAD geometry, derive a
separate view:

```ts
await circuit.renderUntilSettled();
const exploded = getAssemblyExplosion(circuit);
const lifted = getAssemblyExplosion(circuit, {
  throughStageRef: "instrument.lift-cover",
  stageProgress: 0.5,
});
// Pass exploded.circuitJson to the ordinary GLTF exporter.
```

The assembled circuit, PCB positions, input props, and mounting constraints stay
unchanged. Each call reconstructs the view from assembled geometry, so repeated
evaluation and backward scrubbing do not accumulate offsets.

All stages enter one stable topological ordering. `nextStageRef` and
`prevStageRef` are precedence edges; depth-first TSX order breaks ties among
eligible stages. Short references are relative to the owning assembly;
qualified references traverse named assembly ancestors, including intermediate
parts. Root-qualified references can address sibling scopes. Duplicate stage
paths, unknown stage references, cycles, and missing or ambiguous move targets
produce named errors. Every target is validated, including stages beyond the
selected view.

Use `targetRefs` to select the parts moved by one instruction. It accepts a
comma-separated string, such as `targetRefs="leftScrew, rightScrew"`, or an array,
such as `targetRefs={["leftScrew", "rightScrew"]}`. Each reference is trimmed and
resolved relative to the stage's owning assembly. Empty lists, blank entries,
and unresolved or ambiguous references are rejected. The legacy singular
`targetRef="cover"` remains supported; supply exactly one of `targetRef` and
`targetRefs`.

Stages contain ordered moves. `offX`, `offY`, and `offZ` describe one simultaneous
straight translation in the owning assembly's resolved frame. Every selected
target shares that displacement and the move's progress. Repeated references
and overlapping parent/child selections translate each descendant only once.
Separate moves execute sequentially. The optional progress value advances through
the selected stage's moves in equal portions, leaving previous stages complete; zero shows
the selected stage's initial pose. Model-less carrier geometry moves with its
descendants, and child stages operate at the displaced pose. Reference-surface
centers move with the solids; their normal and tangent directions stay unchanged
under these translation-only operations.

## PoppyGL rendering

Reproduce standalone PNGs, GLBs, and resolved view JSON with:

```sh
bun scripts/render-assembly-explosion.tsx work/assembly-explosion-preview
```

The visual regression fixture renders four states of a constrained lamp:
assembled, lifted cover, cover parked beside the lamp, and cap separately lifted
from the displaced cover. A second fixture checks local movement against emitted
reference-frame directions for upright, inverted, and tilted mounting faces.

`lines` contains world-space movement segments, with origins in right-handed
circuit XYZ (mm, +Z above). Convert points through the same frame boundary as the
GLTF exporter before passing them to PoppyGL's `explosionLines`. The current
exporter uses `[-x, z, y]` in its final glTF scene, as established by
`GltfBuilder.toGltfTranslation` after CAD center conversion. The regression checks
guide endpoints against actual emitted glTF node translations.

PoppyGL guides are depth-tested and do not write depth. The core fixture uses
them for lift-then-slide paths and the final cap movement. Guide origins on
model-less subassemblies use the centroid of emitted descendant CAD origins.
For a multi-target move, `lines` contains one guide per distinct selected part,
with its individual `targetRef` and origin sampled before any target moves.
Model-less centroids include prior moves of their descendants.

## Remaining work before assembly verification

This implementation renders mechanical CAD translations. It rejects movement of
targets containing PCB or cable geometry rather than producing a partially
displaced assembly. Moving folded/flat boards, flexible cables, physical fastening
constraints, and rotations require further work.

The returned view explicitly reports `collisionCheckStatus: "not_implemented"`.
There is no swept-solid collision engine or successful assembly-verification
claim in this implementation. A follow-up needs full-path collision checks, intentional
mating contact rules, missing-geometry/incomplete results, and reproducible
diagnostics tied to stage and move positions. Guides show declared motion paths;
they do not certify clearance.

## Circuit JSON programs and whole-stage targets

After CAD rendering, `getCircuitJson()` emits `cad_explosion_stage` and
`cad_explosion_move` records alongside assembled geometry. These follow the
[Circuit JSON schema proposal](https://github.com/tscircuit/circuit-json/pull/937).
The draft dependency uses that proposal's preview; replace it with a published
release before merging (the existing dependency gate remains enabled).

Stage records contain explicit CAD/reference-surface membership and resolved
playback order. Move records contain sequential order, typed targets and resolved
world-space displacement vectors. Physical assembly targets expand to all emitted
descendant geometry, including reference surfaces on model-less owners.

`targetRef="remove-bolts"` can name another explosion stage. Its members move
together, preserving earlier displacements, without replaying its instructions.
Membership is the union of a stage's authored targets, resolved transitively at
export. Cyclic stage membership and ambiguous part/stage names are errors.
Targeting a stage does not change temporal ordering; use `prevStageRef` or
`nextStageRef` to specify playback precedence as before.

```tsx
<assembly.explosion.stage name="remove-bolts">
  <assembly.explosion.move targetRefs="bolt1,bolt2" offZ="30mm" />
</assembly.explosion.stage>
<assembly.explosion.stage name="park-bolts" prevStageRef="remove-bolts">
  <assembly.explosion.move targetRef="remove-bolts" offX="20mm" />
</assembly.explosion.stage>
```

JSON consumers call `getCircuitJsonAssemblyExplosion(assembledCircuitJson,
options)` without a live circuit tree. The evaluator validates all stage and move
references, membership, contiguous order and finite translations before applying
a partial view. It deduplicates overlapping selections per move, moves surface
centers without rotating axes and never mutates assembled input. Guide segments
are emitted per moving CAD component. Backward scrubbing always restarts from
assembled positions. Existing live-tree evaluation retains its part-level guide
anchors; whole-stage targets use the JSON evaluator.
