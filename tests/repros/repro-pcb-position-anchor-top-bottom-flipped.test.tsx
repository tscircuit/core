import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "pcbPositionAnchor top_left puts the component's top edge (max Y) at pcbY",
  () => {
    const { circuit } = getTestFixture()

    circuit.add(
      <board width="16mm" height="12mm">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0805"
          pcbX={-2}
          pcbY={2}
          pcbPositionAnchor="top_left"
        />
        <pcbnoterect pcbX={-2} pcbY={2} width="0.3mm" height="0.3mm" />
        <pcbnotetext
          pcbX={-4.6}
          pcbY={2}
          text="ANCHOR (-2, 2)"
          fontSize="0.4mm"
        />
        <pcbnotetext
          pcbY={-3.5}
          text="top_left: R1 SHOULD HANG BELOW-RIGHT OF ANCHOR"
          fontSize="0.45mm"
        />
        <pcbnotetext
          pcbY={-4.3}
          text="GROUPS AND SILKSCREEN TREAT TOP AS MAX Y"
          fontSize="0.45mm"
        />
      </board>,
    )

    circuit.render()

    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const pads = circuit.db.pcb_smtpad.list() as Array<{
      x: number
      y: number
      width: number
      height: number
    }>
    const left = Math.min(...pads.map((pad) => pad.x - pad.width / 2))
    const top = Math.max(...pads.map((pad) => pad.y + pad.height / 2))

    expect({
      left: Number(left.toFixed(3)),
      top: Number(top.toFixed(3)),
    }).toEqual({ left: -2, top: 2 })
  },
)
