# T113-S3 fanout phase transit fixture

This is the exact 27-connection SimpleRouteJson input emitted for the HDMI
fanout phase of the 96-component T113-S3 Linux board. `source_trace_199`
connects two breakout points and belongs to the later global routing phase.
Its paired `breakout:pcb_breakout_point_11` connection belongs to
`pcb_group_5` and connects the LT8912B pad to its fanout boundary point.

The group-scoped phase must retain the local breakout connection without
claiming the global transit tail merely because both share a source trace.
