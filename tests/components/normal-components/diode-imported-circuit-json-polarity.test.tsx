import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import kicadSod123FootprintCircuitJson from "tests/fixtures/assets/d-sod-123-footprint.circuit.json"
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

const TestCircuit = ({ footprint }: { footprint: string }) => (
  <board width="8mm" height="6mm">
    <diode name="D1" footprint={footprint} />
    <testpoint
      name="POS"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="0.7mm"
      pcbX={-3}
      pcbY={2}
    />
    <testpoint
      name="NEG"
      footprintVariant="pad"
      padShape="circle"
      padDiameter="0.7mm"
      pcbX={3}
      pcbY={2}
    />
    <trace from=".POS > .pin1" to=".D1 > .pos" pcbStraightLine />
    <trace from=".NEG > .pin1" to=".D1 > .neg" pcbStraightLine />
  </board>
)

test("regular and kicad SOD-123 diode footprints stack vertically", async () => {
  const { circuit: regularCircuit } = getTestFixture()
  regularCircuit.add(<TestCircuit footprint="sod123" />)
  await regularCircuit.renderUntilSettled()

  let kicadLoaderCallCount = 0
  const { circuit: kicadCircuit } = getTestFixture({
    platform: {
      footprintLibraryMap: {
        kicad: async (footprintName: string) => {
          kicadLoaderCallCount++
          expect(footprintName).toBe("Diode_SMD/D_SOD-123")
          return { footprintCircuitJson: kicadSod123FootprintCircuitJson }
        },
      },
    },
  })
  kicadCircuit.add(<TestCircuit footprint="kicad:Diode_SMD/D_SOD-123" />)
  await kicadCircuit.renderUntilSettled()
  expect(kicadLoaderCallCount).toBe(1)

  const diode = kicadCircuit.selectOne(".D1") as any
  expect(diode.cathode.props.pinNumber).toBe(1)
  expect(diode.neg.props.pinNumber).toBe(1)
  expect(diode.anode.props.pinNumber).toBe(2)
  expect(diode.pos.props.pinNumber).toBe(2)

  const stackedSvg = stackSvgsVertically(
    [
      panelLabelSvg("regular sod123 footprint"),
      convertCircuitJsonToPcbSvg(regularCircuit.getCircuitJson()),
      panelLabelSvg("kicad SOD-123 footprint"),
      convertCircuitJsonToPcbSvg(kicadCircuit.getCircuitJson()),
    ],
    { gap: 8, normalizeSize: false },
  )

  expect(stackedSvg).toMatchSvgSnapshot(
    import.meta.path,
    "diode-sod123-regular-vs-kicad",
  )
})
