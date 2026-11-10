# Position assembly parts with face constraints

Parts, printed parts, and named subassemblies use `mountedTo` and `mountFace`
to align two reference frames. This includes geometry-less containers and the
`assembly.cadassembly` alias. `mountOffset` is a signed offset along the target
face's in-plane X/Y axes; `mountGap` is nonnegative clearance along its outward
normal. Distances accept mm numbers or unit strings.

```tsx
<assembly.device name="GANTRY">
  <assembly.part name="BRIDGE" modelUrl="./bridge.step">
    <assembly.referencesurface
      name="rail"
      plane="xz"
      normalDirection="y-"
      centerYOffset="-20mm"
    />
  </assembly.part>
  <assembly.subassembly
    name="Z_MODULE"
    mountedTo=".BRIDGE > .rail"
    mountFace="base"
    mountOffset={{ x: "10mm", y: "-5mm" }}
    mountGap="2mm"
  >
    <assembly.referencesurface name="base" plane="xz" normalDirection="y+" />
    <assembly.part name="SPINDLE" modelUrl="./spindle.step" />
  </assembly.subassembly>
</assembly.device>
```

The mounting frames' outward normals oppose and their X tangents align. Both
origins and directions use a right-handed owner-local frame (+X right, +Y top,
+Z above). A positive in-plane Y offset follows `normal × xAxis`; it is not
necessarily world +Y. A positive gap separates the faces along the target
normal. Omitted offset axes are zero. The child inherits its containing
assembly's full rigid frame; a mounted child instead takes its target's resolved
world frame exactly once. No absolute position or rotation props are introduced.

References accept CSS child/descendant/attribute selectors as well as compact
identity paths such as `GANTRY.BRIDGE.rail`. Named JSCAD reference rectangles and
the motor's `frontface`/`backface` are available as virtual reference-surface
nodes, so `.SPACER > .board` and `.MOTOR > .backface` work without extra JSX.
`mountFace` can be a local name or a CSS selector matching one face on that owner.
Explicit `assembly.referencesurface` children also work on subassemblies.
Imported model files are not assumed to contain named mounting datums.

Core resolves forward references within the nearest assembly device and rejects
invalid selectors, missing/ambiguous faces, self mounts, and cycles mixing
containment and attachment. Model offsets align geometry inside the owner frame;
they do not reposition its reference surfaces or children. Boards retain their
PCB anchoring behavior and can select motor backfaces with CSS references.

This implements the face-mounting contract from [props #967](https://github.com/tscircuit/props/pull/967) (`@tscircuit/props`
0.0.716). Assembly STEP completeness, exact solid modeling, and serialized GLB
hierarchy are separate exporter/schema work.
