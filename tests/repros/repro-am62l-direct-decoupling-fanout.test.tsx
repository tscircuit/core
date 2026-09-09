import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("captures duplicate AM62L decoupling traces at the global handoff", async () => {
  await renderAm62lLpddr4Fanout({
    expectDuplicateDecouplingTraceFailure: true,
    includeDirectDecouplingNetworkInInitialRender: true,
    includePowerPlaneFanout: true,
    fanoutSolverLabel:
      "AM62L32 + LPDDR4: 638 PHASE TRACES · 398 UNIQUE IDS · PCB DRC ERRORS",
    snapshotPath: import.meta.path,
  })
}, 600_000)
