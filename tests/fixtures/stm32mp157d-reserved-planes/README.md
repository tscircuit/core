# STM32MP157D four-motor motherboard

TSX source of the six-layer [four-motor USB-C STM32MP157D motherboard](https://tscircuit.com/MustafaMulla29/four-motor-usbc-stm32mp157d) (package version 2.0.4). Unbroken pours reserve inner1 (GND), inner2 (MPU_CORE, DDR1V35) and inner4 (SYS3V3, MPU3V3) under the STM32MP157D (U70) and its DDR3L (U71).

Changes from the published source:

- `circuit/parts.tsx` wires DDR byte-lane pins at the buses' 0.15 mm width instead of the 0.2 mm `Wire` default.
- With `routingMode="fanout-ddr"`, the `bus_lanes` phase requests only DDR byte 0 data (DDR_DQ0–DDR_DQ7, DDR_DQM0) on inner3. DQS, byte 1 and every other phase stay unrouted.
- `circuit/RoutingPhases.tsx` checks the byte phases with an array lookup. Both share index 0, so the original `===` pair fails strict typechecking.

`library/` keeps only the three JSON files the TSX imports. [NOTICE.md](library/NOTICE.md) gives their KiCad library origin and license.
