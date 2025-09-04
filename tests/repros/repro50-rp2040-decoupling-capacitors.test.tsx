import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Benchmark2Rp2040DecouplingCapacitors as RP2040Circuit } from "benchmarking/benchmarks/benchmark2-rp2040-decoupling-capacitors.tsx"

test.skip("repro50: rp2040 decoupling capacitors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(<RP2040Circuit />)

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
