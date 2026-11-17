# Saving complete autorouting phases

`autorouting:end.pcbTracePaths` can be stored as JSON and passed back to
`<autoroutingphase pcbTracePaths={savedPaths} />`. Complete phases preserve
branched wire/via routes, including multiple paths sharing a pad, mid-segment
junctions, and shared trunks whose endpoints are both junctions.

The existing `{ connection, route }` format is unchanged. `connection` selects
a PCB port that identifies the path's electrical net and coordinate frame.
For a complete phase, the route may start at a junction instead of that port:
the saved copper must physically connect the path to the selected port.
Multiple distinct paths can use the same selector. Identical duplicate paths
are rejected.

Points use the enclosing group's local PCB frame, in millimetres: +X right,
+Y up, +Z above, right-handed. Group placement and the selected port's layout
displacement transform points into board world. Layers identify physical
board layers and are not rotated or mirrored by the saved-path transform.
Saving does not reverse, duplicate, reroute, or move the supplied copper.

Core builds a layer-aware graph from all saved paths. Wire centreline contacts
(including points in the middle of segments), vias, and plated ports establish
connectivity. Merely sharing a net name does not bridge a geometric gap.
Every required connection must be physically complete; disconnected pieces,
dangling endpoints, wrong-layer contacts, and contact with a different net are
rejected. A via must still have continuous `from_layer`/`to_layer` transitions,
and via-in-pad requires the existing explicit allowance.

When a phase's connections are inferred from saved paths, Core includes the
same-net source connections belonging to that phase. Explicit `connection` or
`connections` selections and connections assigned to other phases retain their
scope. The exported paths contain only this phase's copper.

Fanout phases retain their port-to-exit contract: their free ends become the
terminals for subsequent routing. See [saved fanout paths](saved-fanout-trace-paths.md).
