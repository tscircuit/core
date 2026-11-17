# NEMA 17 RP2040 motor controller

These ten sheets come from [RP2040 motor controller v1.0.57 by imrishabh18](https://tscircuit.com/imrishabh18/rp2040-motor-controller#schematic).
The compressed Circuit JSON stores the published schematic layout. The snapshot test renders each sheet independently.

1. [RP2040 Controller](./__snapshots__/01-controller.snap.svg)
2. [Programming USB-C & QSPI](./__snapshots__/02-controller-programming.snap.svg)
3. [Stepper Motor Driver](./__snapshots__/03-motor-driver.snap.svg)
4. [USB-C PD Motor Power](./__snapshots__/04-motor-power.snap.svg)
5. [Temperature Telemetry](./__snapshots__/05-thermal-protection.snap.svg)
6. [Optional Encoder & Audible Alarm](./__snapshots__/06-position-alarm.snap.svg)
7. [Winding Current Measurement](./__snapshots__/07-current-telemetry.snap.svg)
8. [RGB Status Indicator](./__snapshots__/08-status-led.snap.svg)
9. [PD Voltage Selection](./__snapshots__/09-pd-voltage-control.snap.svg)
10. [Controller Controls, Status & SWD](./__snapshots__/10-controller-controls.snap.svg)

The [winding-current TSX example](./winding-current.circuit.tsx) shows how Core places and routes a
focused section of the design. Its [snapshot](./__snapshots__/winding-current-schematic_stacked.snap.svg)
shows the two shunts, amplifiers, RC filters, and inline signal labels.

Run the sheet and TSX snapshot tests from the repository root.

```sh
bun test tests/examples/nema17-motor-controller
```
