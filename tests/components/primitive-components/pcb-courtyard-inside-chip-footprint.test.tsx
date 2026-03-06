import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("courtyard primitives inside a chip footprint attach to the parent component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <chip
        name="U1"
        pcbX={4}
        pcbY={-2}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={0.8}
              height={0.6}
              pcbX={-1}
              pcbY={0}
              portHints={["1"]}
            />
            <smtpad
              shape="rect"
              width={0.8}
              height={0.6}
              pcbX={1}
              pcbY={0}
              portHints={["2"]}
            />
            <courtyardoutline
              outline={[
                { x: -1.8, y: -1.2 },
                { x: 1.8, y: -1.2 },
                { x: 1.8, y: 1.2 },
                { x: -1.8, y: 1.2 },
              ]}
            />
            <courtyardrect width={2.5} height={1.5} pcbX={0.5} pcbY={-0.3} />
            <courtyardcircle radius={0.7} pcbX={-0.6} pcbY={0.4} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const [pcbComponent] = circuit.db.pcb_component.list()
  expect(pcbComponent).toBeDefined()

  const [outline] = circuit.db.pcb_courtyard_outline.list()
  const [rect] = circuit.db.pcb_courtyard_rect.list()
  const [circle] = circuit.db.pcb_courtyard_circle.list()

  expect(circuit.db.pcb_courtyard_outline.list()).toHaveLength(1)
  expect(circuit.db.pcb_courtyard_rect.list()).toHaveLength(1)
  expect(circuit.db.pcb_courtyard_circle.list()).toHaveLength(1)

  expect(outline.pcb_component_id).toBe(pcbComponent.pcb_component_id)
  expect(rect.pcb_component_id).toBe(pcbComponent.pcb_component_id)
  expect(circle.pcb_component_id).toBe(pcbComponent.pcb_component_id)

  expect(outline.layer).toBe("top")
  expect(rect.layer).toBe("top")
  expect(circle.layer).toBe("top")

  expect(circuit).toMatchPcbSnapshot(import.meta.path, { showCourtyards: true })
})
