import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import importedDiodeCircuitJson from "tests/fixtures/assets/d-sod-123-footprint.circuit.json"
import "tests/fixtures/extend-expect-any-svg"

const panelLabelSvg = (label: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="34"
  viewBox="0 0 800 34"
>
  <rect x="0" y="0" width="800" height="34" fill="#151515" />
  <text
    x="400"
    y="22"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="17"
    font-weight="700"
    text-anchor="middle"
  >${label}</text>
</svg>`

test("regular and imported SOD-123 diode footprints stack vertically", () => {
  const { circuit: regularCircuit } = getTestFixture()
  regularCircuit.add(
    <board width="8mm" height="6mm">
      <diode name="D1" footprint="sod123" />
    </board>,
  )
  regularCircuit.render()

  const { circuit: importedCircuit } = getTestFixture()
  importedCircuit.add(
    <board
      width="8mm"
      height="6mm"
      circuitJson={importedDiodeCircuitJson as any}
    />,
  )
  importedCircuit.render()

  const diode = importedCircuit.selectOne(".D1") as any
  expect(diode.cathode.props.pinNumber).toBe(1)
  expect(diode.neg.props.pinNumber).toBe(1)
  expect(diode.anode.props.pinNumber).toBe(2)
  expect(diode.pos.props.pinNumber).toBe(2)

  const sourcePorts = importedCircuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === diode.source_component_id)
  const pin1 = sourcePorts.find((port) => port.pin_number === 1)
  const pin2 = sourcePorts.find((port) => port.pin_number === 2)

  expect(pin1?.port_hints).toContain("K")
  expect(pin1?.port_hints).toContain("cathode")
  expect(pin1?.port_hints).toContain("neg")
  expect(pin1?.port_hints).not.toContain("anode")
  expect(pin1?.port_hints).not.toContain("pos")

  expect(pin2?.port_hints).toContain("A")
  expect(pin2?.port_hints).toContain("anode")
  expect(pin2?.port_hints).toContain("pos")
  expect(pin2?.port_hints).not.toContain("cathode")
  expect(pin2?.port_hints).not.toContain("neg")

  const stackedSvg = stackSvgsVertically(
    [
      panelLabelSvg("regular sod123 footprint"),
      convertCircuitJsonToPcbSvg(regularCircuit.getCircuitJson()),
      panelLabelSvg("kicad-imported SOD-123 footprint circuit json"),
      convertCircuitJsonToPcbSvg(importedCircuit.getCircuitJson()),
    ],
    { gap: 8, normalizeSize: false },
  )

  expect(stackedSvg).toMatchSvgSnapshot(
    import.meta.path,
    "diode-sod123-regular-vs-imported",
  )
})
