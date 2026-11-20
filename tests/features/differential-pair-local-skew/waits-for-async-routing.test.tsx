import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

test("local skew is added after asynchronous differential pair routing completes", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={20} height={15}>
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace name="DP" from=".U1 > .pin8" to=".U2 > .pin1" />
      <trace name="DN" from=".U1 > .pin7" to=".U2 > .pin2" />
      <differentialpair
        name="DATA"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap={1.12}
      />
      <pcbnotetext
        pcbY={5}
        fontSize={0.5}
        text="The autorouter routes DATA asynchronously"
      />
    </board>,
  )

  circuit.render()
  expect(circuit.db.pcb_differential_pair_local_skew.list()).toEqual([])
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const [localSkew] = circuit.db.pcb_differential_pair_local_skew.list()
  expect(
    formatKnotPoints({ circuitJson: circuit.getCircuitJson(), localSkew }),
  ).toMatchInlineSnapshot(`
    "P -2.85,1.905  N -2.85,0.635  skew 0
    P 2.85,1.905  N 2.85,0.635  skew 0"
  `)
})
