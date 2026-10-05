import { expect, test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("routes the AM62L and LPDDR4 with the real decoupling network present", async () => {
  const circuit = await renderAm62lLpddr4Fanout({
    fanoutSolverLabel:
      "AM62L32 + LPDDR4: 414 UNIQUE PHASE TRACES · 48 OPEN POWER VIA ENDS",
    includeDirectDecouplingNetworkInInitialRender: true,
    includePowerPlaneFanout: true,
    snapshotPath: import.meta.path,
  })
  // Checks 0.0.223 additionally detects the existing different-net via gaps.
  expect(
    circuit.db.pcb_via_clearance_error.list().map(({ message }) => message),
  ).toMatchInlineSnapshot(`
    [
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.064mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.060mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
      "Vias unnamed via and unnamed via from different nets are too close together (gap: 0.085mm)",
    ]
  `)
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter(({ message }) => !message.includes("dangling endpoint"))
      .map(({ message }) => message),
  ).toMatchInlineSnapshot(`
    [
      "PCB trace .C_SOC_DDR_HS_L8 > .pin1 to net.VDD_LPDDR4 overlaps with pcb_smtpad "C_SOC_DDR_HS_L8.pin2" (accidental contact)",
      "PCB trace .C_SOC_DDR_HS_L8 > .pin1 to net.VDD_LPDDR4 overlaps with .C_SOC_DDR_HS_L8 > .pin2 to net.GND (accidental contact)",
      "PCB trace .C_SOC_DDR_HS_P8 > .pin2 to net.GND overlaps with U1.DDR0_DQ10 to U2.DQ10 (accidental contact)",
    ]
  `)
}, 900_000)
