# `<assembly.cable />` waypoints

Use `waypoints` to guide a cable around a holder, through clips, or along an
external lane. The points are finite numeric XYZ offsets in millimeters.
`waypointAnchor` chooses the start or end mating center as their origin.
`waypointAxisOrientation` independently chooses the start or end board's axes.
Both props are required whenever `waypoints` is supplied, including `[]`.

```tsx
<assembly.cable
  name="PITCH_HARNESS"
  from=".CONTROLLER > .J_PITCH"
  to="PITCH_MOTOR.pigtail"
  model="jst_ph_pins3"
  waypointAnchor="start"
  waypointAxisOrientation="board_at_start"
  waypoints={[
    { x: 0, y: -10, z: 6.4 },
    { x: -52, y: -10, z: 6.4 },
    { x: -52, y: -10, z: -51.8 },
  ]}
/>
```

The start and end stay at their resolved wire exits, including the existing
0.1 mm outward tangent samples that orient their connector housings. Authored
points appear between those samples, in the supplied order. The result uses
Circuit JSON's existing `cad_cable.path`; viewers do not reroute it or add sag.
The anchor is the mating center, before the connector housing's wire-exit offset.
Rotating the connector or placing it on the bottom layer does not rotate the
chosen board axes. The selected orientation endpoint must belong to a board;
standalone part references can still be anchors while using the other end's board.
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
`tests/assembly/fixtures/gimbal-one-mechanical.md`.

This implementation uses the released `@tscircuit/props` 0.0.715 waypoint schema.
