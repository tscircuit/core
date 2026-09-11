import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve: () => resolve() }
}

test("async footprint completion order does not change PCB IDs or SVG", async () => {
  const renderWithCompletionOrder = async (reverse: boolean) => {
    const first = deferred()
    const second = deferred()
    const { circuit } = getTestFixture({
      platform: {
        footprintLibraryMap: {
          test: async (name) => {
            await (name === "first" ? first.promise : second.promise)
            return { footprintCircuitJson: external0402Footprint }
          },
        },
      },
    })
    circuit.add(
      <board width={16} height={8} routingDisabled>
        <resistor name="R1" resistance="1k" footprint="test:first" pcbX={-3} />
        <resistor name="R2" resistance="2k" footprint="test:second" pcbX={3} />
        <pcbnotetext
          text="R1: first declared"
          pcbX={-3}
          pcbY={2}
          fontSize={0.5}
        />
        <pcbnotetext
          text="R2: second declared"
          pcbX={3}
          pcbY={2}
          fontSize={0.5}
        />
      </board>,
    )
    circuit.render()
    // Render between completions to reproduce different network response orders.
    const completionOrder = reverse ? [second, first] : [first, second]
    for (const footprint of completionOrder) {
      footprint.resolve()
      await new Promise((resolve) => setTimeout(resolve, 0))
      circuit.render()
    }
    await circuit.renderUntilSettled()
    return circuit
  }

  const forward = await renderWithCompletionOrder(false)
  const reverse = await renderWithCompletionOrder(true)
  expect(forward.db.pcb_smtpad.list()).toHaveLength(4)
  expect(forward.db.pcb_smtpad.list().every((pad) => pad.pcb_port_id)).toBe(
    true,
  )
  expect(reverse.db.pcb_smtpad.list()).toEqual(forward.db.pcb_smtpad.list())
  expect(convertCircuitJsonToPcbSvg(reverse.getCircuitJson())).toBe(
    convertCircuitJsonToPcbSvg(forward.getCircuitJson()),
  )
  expect(forward).toMatchPcbSnapshot(import.meta.path)
})
