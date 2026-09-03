import { test } from "bun:test"
import { renderAm62lLpddr4Fanout } from "tests/fixtures/create-am62l-lpddr4-fanout"

test("routes adjacent real AM62L-to-LPDDR4 DQ lanes through Pipeline 9", async () => {
  await renderAm62lLpddr4Fanout({
    fanoutSolverLabel:
      "AM62L32 -> MT53E1G16D1ZW LPDDR4: ADJACENT DQ0/DQ1 THROUGH PIPELINE 9",
    routedDdrDataTraceNames: ["DQ0", "DQ1"],
    snapshotDiffThresholdPercent: 0.001,
    snapshotPath: import.meta.path,
    usePublicPipeline9Preset: true,
    useProductionGlobalAutorouter: true,
  })
}, 300_000)
