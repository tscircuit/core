import { expect, test } from "bun:test"
import type { Chip } from "lib/components/normal-components/Chip"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing(
  "TLV75533 stencil apertures align with its SOT-23-5 lands",
  async () => {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={14} height={10} routingDisabled schematicDisabled>
        <chip
          name="U1"
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
                noSolderPaste
              />
              <smtpad
                shape="rect"
                width={0.6}
                height={1.1}
                pcbX={0}
                pcbY={-1.3}
                portHints={["2"]}
                noSolderPaste
              />
              <smtpad
                shape="rect"
                width={0.6}
                height={1.1}
                pcbX={0.95}
                pcbY={-1.3}
                portHints={["3"]}
                noSolderPaste
              />
              <smtpad
                shape="rect"
                width={0.6}
                height={1.1}
                pcbX={0.95}
                pcbY={1.3}
                portHints={["4"]}
                noSolderPaste
              />
              <smtpad
                shape="rect"
                width={0.6}
                height={1.1}
                pcbX={-0.95}
                pcbY={1.3}
                portHints={["5"]}
                noSolderPaste
              />
              <solderpaste
                shape="rect"
                width={1.1}
                height={0.6}
                pcbX={-0.95}
                pcbY={-1.3}
                pcbRotation={90}
              />
              <solderpaste
                shape="rect"
                width={1.1}
                height={0.6}
                pcbX={0}
                pcbY={-1.3}
                pcbRotation={90}
              />
              <solderpaste
                shape="rect"
                width={1.1}
                height={0.6}
                pcbX={0.95}
                pcbY={-1.3}
                pcbRotation={90}
              />
              <solderpaste
                shape="rect"
                width={1.1}
                height={0.6}
                pcbX={0.95}
                pcbY={1.3}
                pcbRotation={90}
              />
              <solderpaste
                shape="rect"
                width={1.1}
                height={0.6}
                pcbX={-0.95}
                pcbY={1.3}
                pcbRotation={90}
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
        <pcbnotetext
          text="TLV75533 3.3 V regulator"
          pcbY={3.8}
          fontSize={0.45}
        />
        <pcbnotetext
          text="U1: five 1.1 x 0.6 mm paste apertures at 90 deg"
          pcbY={-3.6}
          fontSize={0.3}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
      showSolderPaste: true,
    })
    const regulator = circuit.selectOne<Chip>(".U1")!
    const apertures = circuit.db.pcb_solder_paste
      .list()
      .filter((paste) => paste.pcb_component_id === regulator.pcb_component_id)
    expect(apertures).toHaveLength(5)
    for (const aperture of apertures) {
      expect(aperture).toMatchObject({
        shape: "rotated_rect",
        width: 1.1,
        height: 0.6,
        ccw_rotation: 90,
      })
    }
  },
)
