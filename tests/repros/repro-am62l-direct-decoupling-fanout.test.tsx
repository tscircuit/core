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
  expect(
    circuit.db.pcb_trace_error
      .list()
      .filter(({ message }) => !message.includes("dangling endpoint"))
      .map(({ message }) => message),
  ).toMatchInlineSnapshot(`
    [
      "PCB trace trace[.C_SOC_DDR_HS_L8 > port.pos] overlaps with pcb_smtpad "pcb_port[.C_SOC_DDR_HS_L8 > .pin2]" (accidental contact)",
      "PCB trace trace[.C_SOC_DDR_HS_L8 > port.pos] overlaps with trace[.C_SOC_DDR_HS_L8 > port.neg] (accidental contact)",
      "PCB trace trace[.C_SOC_DDR_HS_P8 > port.neg] overlaps with trace[.U1 > port.DDR0_DQ10] (accidental contact)",
    ]
  `)
}, 900_000)
