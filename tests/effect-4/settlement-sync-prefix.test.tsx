import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("settlement preserves synchronous rendering, metadata and completion event timing", async () => {
  const { circuit } = getTestFixture({ platform: { routingDisabled: true } })
  circuit.projectUrl = "https://example.com/public-circuit"
  circuit.add(
    <board>
      <resistor name="R1" resistance="10k" footprint="0402" />
      <pcbnotetext text="Effect 4 settlement" pcbY={2} />
    </board>,
  )
  const ordering: string[] = []
  circuit.on("renderable:renderLifecycle:SourceRender:start", () => {
    ordering.push("source")
  })
  circuit.on("renderComplete", () => {
    ordering.push("complete")
  })
  const settled = circuit.renderUntilSettled()
  ordering.push("returned")
  expect(circuit._hasRenderedAtleastOnce).toBe(true)
  expect(circuit.db.source_project_metadata.list()).toHaveLength(1)
  expect(ordering.indexOf("source")).toBeLessThan(ordering.indexOf("returned"))
  await settled
  expect(ordering.at(-1)).toBe("complete")
  const metadata = circuit.db.source_project_metadata.list()[0]
  expect(metadata.project_url).toBe(circuit.projectUrl)
  await circuit.renderUntilSettled()
  expect(circuit.db.source_project_metadata.list()).toEqual([metadata])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
