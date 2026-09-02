import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("routes real AM62L-to-LPDDR4 data lanes through core's full production pipeline", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutSolverLabel:
      "AM62L32 -> MT53E1G16D1ZW LPDDR4: CORE FANOUT + PRODUCTION GLOBAL ROUTER",
    routedDdrDataTraceNames: ["DQ0", "DQ8"],
    snapshotPath: import.meta.path,
    useProductionGlobalAutorouter: true,
  })
}, 300_000)
