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
    circuit.db.pcb_via_clearance_error.list().map(({ message }) => message),
  ).toMatchInlineSnapshot(`
    [
      "Vias pcb_via[#pcb_via_2] and pcb_via[#pcb_via_3] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_24] and pcb_via[#pcb_via_112] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_26] and pcb_via[#pcb_via_108] from different nets are too close together (gap: 0.064mm)",
      "Vias pcb_via[#pcb_via_42] and pcb_via[#pcb_via_43] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_44] and pcb_via[#pcb_via_81] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_48] and pcb_via[#pcb_via_49] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_54] and pcb_via[#pcb_via_55] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_80] and pcb_via[#pcb_via_81] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_84] and pcb_via[#pcb_via_85] from different nets are too close together (gap: 0.060mm)",
      "Vias pcb_via[#pcb_via_266] and pcb_via[#pcb_via_322] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_269] and pcb_via[#pcb_via_303] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_271] and pcb_via[#pcb_via_296] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_272] and pcb_via[#pcb_via_295] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_272] and pcb_via[#pcb_via_296] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_273] and pcb_via[#pcb_via_320] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_274] and pcb_via[#pcb_via_299] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_274] and pcb_via[#pcb_via_320] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_275] and pcb_via[#pcb_via_315] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_276] and pcb_via[#pcb_via_315] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_276] and pcb_via[#pcb_via_335] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_278] and pcb_via[#pcb_via_316] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_280] and pcb_via[#pcb_via_339] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_281] and pcb_via[#pcb_via_332] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_284] and pcb_via[#pcb_via_305] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_287] and pcb_via[#pcb_via_346] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_289] and pcb_via[#pcb_via_326] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_292] and pcb_via[#pcb_via_328] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_294] and pcb_via[#pcb_via_319] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_295] and pcb_via[#pcb_via_298] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_297] and pcb_via[#pcb_via_365] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_297] and pcb_via[#pcb_via_385] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_304] and pcb_via[#pcb_via_406] from different nets are too close together (gap: 0.085mm)",
      "Vias pcb_via[#pcb_via_307] and pcb_via[#pcb_via_406] from different nets are too close together (gap: 0.085mm)",
    ]
  `)
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
