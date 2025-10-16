import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace pcbPath supports selectors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2" as any, { x: 0, y: 4 }, "R2.pin1" as any]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-selectors`)
})

test("trace pcbPath selector route supports custom thickness", async () => {
  const { circuit } = getTestFixture()
  let traceInstance: any = null

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-3}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={3} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbPathRelativeTo=".R1 > .pin2"
        pcbPath={["R1.pin2" as any, { x: 0, y: 4 }, "R2.pin1" as any]}
        thickness="0.5mm"
        // @ts-expect-error - ref is used for testing to inspect internal props
        ref={(instance: any) => {
          traceInstance = instance
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(traceInstance?._parsedProps.thickness).toBe("0.5mm")

  await expect(circuit).toMatchPcbSnapshot(
    `${import.meta.path}-selectors-thick-trace`,
  )
})
