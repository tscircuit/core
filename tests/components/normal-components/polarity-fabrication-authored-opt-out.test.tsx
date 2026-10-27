import { expect, test } from "bun:test"
import type { Capacitor } from "lib/components/normal-components/Capacitor"
import type { Diode } from "lib/components/normal-components/Diode"
import type { Led } from "lib/components/normal-components/Led"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const AuthoredBar = () => (
  <fabricationnotepath
    route={[
      { x: 0.8, y: -0.4 },
      { x: 0.8, y: 0.4 },
    ]}
  />
)

test("automatic polarity notes have explicit author control without classifying artwork", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={48} height={16} routingDisabled>
      <led
        name="LED_AUTHORED"
        footprint="0603"
        pcbX={-18}
        pcbAutoPolarityMarkings={false}
      >
        <AuthoredBar />
      </led>
      <diode
        name="D_AUTHORED"
        footprint="sod123"
        pcbX={-6}
        pcbAutoPolarityMarkings={false}
      >
        <AuthoredBar />
      </diode>
      <capacitor
        name="C_AUTHORED"
        footprint="cap0805"
        capacitance="10uF"
        polarized
        pcbX={6}
        pcbAutoPolarityMarkings={false}
      >
        <fabricationnotetext text="+" pcbX={-0.8} fontSize={0.4} />
      </capacitor>
      <led name="LED_UNRELATED" footprint="0603" pcbX={18}>
        <fabricationnotetext text="+" pcbY={2} fontSize={0.4} />
        <fabricationnotetext text="-" pcbY={-2} fontSize={0.4} />
        <fabricationnotepath
          route={[
            { x: -1, y: 3 },
            { x: 1, y: 3 },
          ]}
        />
      </led>
      <pcbnotetext
        text="Authored art preserved with auto=false; unrelated +/- notes do not affect generation"
        pcbY={6}
        fontSize={0.35}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const [name, pathCount, textCount] of [
    ["LED_AUTHORED", 1, 0],
    ["D_AUTHORED", 1, 0],
    ["C_AUTHORED", 0, 1],
    ["LED_UNRELATED", 5, 2],
  ] as const) {
    const component = circuit.selectOne(`.${name}`) as Led | Diode | Capacitor
    const filter = { pcb_component_id: component.pcb_component_id! }
    const paths = circuit.db.pcb_fabrication_note_path.list(filter)
    const texts = circuit.db.pcb_fabrication_note_text.list(filter)
    expect(paths).toHaveLength(pathCount)
    expect(texts).toHaveLength(textCount)
    component.updatePcbComponentSizeCalculation()
    const rerendered = circuit.db.pcb_fabrication_note_path.list(filter)
    expect(rerendered.map((note) => note.route)).toEqual(
      paths.map((note) => note.route),
    )
    if (paths.length > 0) expect(rerendered[0]).toEqual(paths[0])
    expect(circuit.db.pcb_fabrication_note_text.list(filter)).toEqual(texts)
  }
  const led = circuit.selectOne(".LED_UNRELATED") as Led
  const filter = { pcb_component_id: led.pcb_component_id! }
  const authored = circuit.db.pcb_fabrication_note_path.list(filter)[0]!
  led.setProps({ ...led.props, pcbAutoPolarityMarkings: false })
  led.updatePcbComponentSizeCalculation()
  expect(circuit.db.pcb_fabrication_note_path.list(filter)).toEqual([authored])
  led.setProps({ ...led.props, pcbAutoPolarityMarkings: true })
  led.updatePcbComponentSizeCalculation()
  expect(circuit.db.pcb_fabrication_note_path.list(filter)).toHaveLength(5)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
