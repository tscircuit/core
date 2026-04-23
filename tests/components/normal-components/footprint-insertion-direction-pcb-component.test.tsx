import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("footprint insertionDirection populates pcb_component post-transform properties", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="40mm" height="40mm">
      <resistor
        name="R1"
        resistance="1k"
        pcbX={5}
        pcbY={5}
        footprint={
          <footprint insertionDirection="from_front">
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
            />
          </footprint>
        }
      />
      <resistor
        name="R2"
        resistance="1k"
        pcbX={10}
        pcbY={5}
        pcbRotation={90}
        footprint={
          <footprint insertionDirection="from_front">
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
            />
          </footprint>
        }
      />
      <resistor
        name="R3"
        resistance="1k"
        pcbX={15}
        pcbY={5}
        layer="bottom"
        footprint={
          <footprint insertionDirection="from_front">
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
            />
          </footprint>
        }
      />
      <resistor
        name="R4"
        resistance="1k"
        pcbX={20}
        pcbY={5}
        pcbRotation={90}
        layer="bottom"
        footprint={
          <footprint insertionDirection="from_front">
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
            />
          </footprint>
        }
      />
      <connector
        name="J1"
        pcbX={25}
        pcbY={5}
        layer="bottom"
        manufacturerPartNumber="TEST"
        pinLabels={{ pin1: ["A"], pin2: ["B"] }}
        footprint={
          <footprint insertionDirection="from_front" originalLayer="bottom">
            <smtpad
              shape="rect"
              portHints={["pin1"]}
              pcbX={-1}
              pcbY={0}
              width={1}
              height={2}
            />
            <smtpad
              shape="rect"
              portHints={["pin2"]}
              pcbX={1}
              pcbY={0}
              width={1}
              height={2}
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  const sourceComponents = circuit.db.source_component.list()

  const getInsertionDirection = (name: string) => {
    const source = sourceComponents.find((component) => component.name === name)
    const pcbComponent = pcbComponents.find(
      (component) =>
        component.source_component_id === source?.source_component_id,
    )
    return pcbComponent?.insertion_direction
  }

  expect(getInsertionDirection("R1")).toBe("from_front")
  expect(getInsertionDirection("R2")).toBe("from_left")
  expect(getInsertionDirection("R3")).toBe("from_back")
  expect(getInsertionDirection("R4")).toBe("from_left")
  expect(getInsertionDirection("J1")).toBe("from_front")
})
