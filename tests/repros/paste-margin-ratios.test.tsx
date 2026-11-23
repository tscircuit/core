import { beforeAll, expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const pasteMargin = {
  solderPasteMargin: 0,
  solderPasteMarginRatio: -0.05,
}

beforeAll(async () => {
  circuit.add(
    <board width={14} height={10} routingDisabled schematicDisabled>
      <chip
        name="U1"
        pcbRotation={90}
        manufacturerPartNumber="TLV75533PDBVR"
        pinLabels={{
          pin1: "IN",
          pin2: "GND",
          pin3: "EN",
          pin4: "NC",
          pin5: "OUT",
        }}
        noConnect={["NC"]}
        pinAttributes={{
          IN: { requiresPower: true },
          GND: { requiresGround: true },
        }}
        connections={{
          IN: "net.VIN",
          EN: "net.VIN",
          GND: "net.GND",
          OUT: "net.V3V3",
        }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={0.6}
              height={1.1}
              pcbX={-0.95}
              pcbY={-1.3}
              portHints={["1"]}
              {...pasteMargin}
            />
            <smtpad
              shape="rect"
              width={0.6}
              height={1.1}
              pcbX={0}
              pcbY={-1.3}
              portHints={["2"]}
              {...pasteMargin}
            />
            <smtpad
              shape="rect"
              width={0.6}
              height={1.1}
              pcbX={0.95}
              pcbY={-1.3}
              portHints={["3"]}
              {...pasteMargin}
            />
            <smtpad
              shape="rect"
              width={0.6}
              height={1.1}
              pcbX={0.95}
              pcbY={1.3}
              portHints={["4"]}
              {...pasteMargin}
            />
            <smtpad
              shape="rect"
              width={0.6}
              height={1.1}
              pcbX={-0.95}
              pcbY={1.3}
              portHints={["5"]}
              {...pasteMargin}
            />
            <courtyardrect width={3.4} height={4.2} />
            <silkscreenrect width={2.8} height={1.3} strokeWidth={0.1} />
            <silkscreencircle radius={0.1} pcbX={-0.95} pcbY={-0.4} />
          </footprint>
        }
      />
      <capacitor
        name="CIN"
        capacitance="1uF"
        footprint="0402"
        pcbX={-3.2}
        connections={{ pin1: "net.VIN", pin2: "net.GND" }}
      />
      <capacitor
        name="COUT"
        capacitance="1uF"
        footprint="0402"
        pcbX={3.2}
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <pcbnotetext text="TLV75533 3.3 V regulator" pcbY={3.8} fontSize={0.45} />
      <pcbnotetext
        text="U1 paste: -5% per edge; local aperture 0.54 x 0.99 mm"
        pcbY={-3.6}
        fontSize={0.3}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
    width: 1200,
    height: 900,
  })
})

test(
  "TLV75533 relative paste margins follow a 90 degree placement",
  () => {
    const regulator = circuit.selectOne(".U1")!
    const apertures = circuit.db.pcb_solder_paste
      .list()
      .filter((paste) => paste.pcb_component_id === regulator.pcb_component_id)
    expect(apertures).toHaveLength(5)
    for (const aperture of apertures) {
      if (aperture.shape !== "rect")
        throw new Error("Expected rectangular paste")
      expect(aperture.width).toBeCloseTo(0.99)
      expect(aperture.height).toBeCloseTo(0.54)
      expect(aperture.layer).toBe("top")
    }
  },
)
