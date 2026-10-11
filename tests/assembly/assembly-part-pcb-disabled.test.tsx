import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbDisabled suppresses generic part CAD including JSX geometry", () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device>
      <board width={20} height={20} />
      <assembly.part name="URL" modelUrl="https://example.com/part.glb" />
      <assembly.part
        name="JSX"
        cadModel={<cadmodel modelUrl="https://example.com/child.glb" />}
      />
    </assembly.device>,
  )
  circuit.render()
  expect(
    circuit.db.source_component.list().map((source) => source.name),
  ).toContain("URL")
  expect(
    circuit.db.source_component.list().map((source) => source.name),
  ).toContain("JSX")
  expect(circuit.db.cad_component.list()).toHaveLength(0)
})
