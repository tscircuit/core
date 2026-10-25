# Avoid rendering unused autorouter progress graphics

Native CLI builds consume progress metrics, yet Core calls solver.preview() on
every tick. For a dense mesh that allocates large graphic frames repeatedly.
The reproduction routes a generated two-resistor PCB and observes preview calls
without reading graphics. The stacked fix makes frames lazy and memoized,
including forwarding through Group. Consumers that read or serialize graphics
still receive a frame. No routing algorithm or geometry changes.

![Inspected native routed control](native-control.png)

Every PR must report paired benchmark effects before merge. The comparison
checks native completion and route hashes, metrics-only preview calls, and
interactive consumers with repeated reads. This tiny fixture establishes work
avoidance, not an AM3352 routing speed claim.
