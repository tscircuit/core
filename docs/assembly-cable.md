# `<assembly.cable />` waypoints

Use `waypoints` to guide a cable around a holder, through clips, or along an
external lane. The points are finite numeric XYZ coordinates in millimeters in
right-handed **circuit world**: +X right, +Y top, +Z above. They do not inherit a
board or part's local translation or rotation.

```tsx
<assembly.cable
  name="PITCH_HARNESS"
  from=".CONTROLLER > .J_PITCH"
  to="PITCH_MOTOR.pigtail"
  model="jst_ph_pins3"
  waypoints={[
    { x: -26, y: 29, z: 20 },
    { x: -78, y: 29, z: 20 },
    { x: -78, y: 19, z: -45 },
    { x: 107, y: 20.5, z: 30 },
  ]}
/>
```

The start and end stay at their resolved wire exits, including the existing
0.1 mm outward tangent samples that orient their connector housings. Authored
points appear between those samples, in the supplied order. The result uses
Circuit JSON's existing `cad_cable.path`; viewers do not reroute it or add sag.
Omitting `waypoints`, or passing `[]`, preserves the automatic arched route.

Waypoints describe a polyline. Add samples around a bend for a smooth-looking
service loop. No smoothing that could cut across a requested clearance lane is
added. Consecutive coincident points and exact reversing bends are rejected
before rendering because they cannot produce a valid cable frame. Waypoints do
not provide obstacle avoidance, bend-radius qualification, or a wire-motion
simulation.

## Imported motor pigtails

A named reference surface on `assembly.part` or `assembly.printedpart` can define
a cable mating frame. Its normal points away from the attachment; its local
X-axis identifies the contact row. References use the same mounting transforms
as named mounting surfaces. An explicit cable `model` is required because a
surface alone does not specify the connector type.

```tsx
<assembly.part name="PITCH_MOTOR" cadModel={pitchMotorCad}>
  <assembly.referencesurface
    name="pigtail"
    plane="yz"
    normalDirection="x+"
    centerXOffset={100}
    centerYOffset={20.5}
    centerZOffset={24}
  />
</assembly.part>
```

The gimbal fixture uses the actual imported 2805 motor meshes and proposes
added detachable PH3 pigtail terminations. The stock Robu motor is not claimed
to contain a JST socket. The single 84 × 70 mm controller, screw clamp,
fasteners, three motors and stand retain their project dimensions. Its PCB
population is reduced to the three motor headers to keep the cable example
focused; it is not a replacement fabrication file. See
`tests/assembly/fixtures/gimbal-one-mechanical.md` and the paired before/after
assembly snapshot.

This core change requires the `@tscircuit/props` waypoint schema to be released
first. Development validation uses the official props source from the companion
PR; no package override or unpublished branch is added to this repository.
