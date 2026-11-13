import { expect, test } from "bun:test"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement, PcbComponent } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("keeps catalog CAD orientation and assembly rotation separate through the parts cache", async () => {
  const catalogPcb = {
    type: "pcb_component",
    pcb_component_id: "pcb_component_1",
    source_component_id: "source_component_1",
    center: { x: 0, y: 0 },
    width: 4,
    height: 4,
    layer: "top",
    rotation: 0,
    obstructs_within_bounds: true,
  } satisfies PcbComponent
  const catalogPcbWithAssemblyRotation = {
    ...catalogPcb,
    supplier_assembly_rotation_offset_map: { jlcpcb: 0, pcbway: 180 },
  }
  const supplierPart: AnyCircuitElement[] = [
    catalogPcbWithAssemblyRotation,
    ...[
      [1, -2, 1],
      [2, -2, -1],
      [3, 2, -1],
      [4, 2, 1],
    ].map(
      ([pin, x, y]): AnyCircuitElement => ({
        type: "pcb_smtpad",
        shape: "rect",
        pcb_smtpad_id: `pcb_smtpad_${pin}`,
        pcb_component_id: "pcb_component_1",
        x: x!,
        y: y!,
        width: 0.5,
        height: 0.3,
        layer: "top",
        port_hints: [`pin${pin}`],
      }),
    ),
  ]
  const cache = new Map<string, string>()
  const partsEngine: PartsEngine = {
    findPart: () => ({ jlcpcb: ["C123"], pcbway: ["PCBWAY-123"] }),
    fetchPartCircuitJson: () => supplierPart,
  }
  for (let render = 0; render < 2; render++) {
    const { circuit } = getTestFixture({
      platform: {
        partsEngine,
        localCacheEngine: {
          getItem: (key) => cache.get(key) ?? null,
          setItem: (key, value) => {
            cache.set(key, value)
          },
        },
      },
    })
    circuit.add(
      <board width={10} height={10} routingDisabled>
        <chip
          name="U1"
          pcbRotation={270}
          supplierPartNumbers={{ jlcpcb: ["C123"], pcbway: ["PCBWAY-123"] }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                pcbX={-1}
                pcbY={-2}
                width={0.3}
                height={0.5}
                shape="rect"
              />
              <smtpad
                portHints={["pin2"]}
                pcbX={1}
                pcbY={-2}
                width={0.3}
                height={0.5}
                shape="rect"
              />
              <smtpad
                portHints={["pin3"]}
                pcbX={1}
                pcbY={2}
                width={0.3}
                height={0.5}
                shape="rect"
              />
              <smtpad
                portHints={["pin4"]}
                pcbX={-1}
                pcbY={2}
                width={0.3}
                height={0.5}
                shape="rect"
              />
            </footprint>
          }
        />
      </board>,
    )
    await circuit.renderUntilSettled()

    const placedComponent = circuit.db.pcb_component.list()[0]!
    expect(placedComponent).toMatchObject({
      rotation: 270,
      pin1_location: "bottomside_left",
      supplier_pin1_location_map: {
        jlcpcb: "leftside_top",
        pcbway: "leftside_top",
      },
      supplier_assembly_rotation_offset_map: { jlcpcb: 0, pcbway: 180 },
    })
    expect(
      JSON.parse(cache.get("part-orientation-analysis:v7:jlcpcb:C123")!),
    ).toMatchObject({
      pin1_location: "leftside_top",
      assembly_rotation_offset: 0,
    })
    expect(
      JSON.parse(cache.get("part-orientation-analysis:v7:pcbway:PCBWAY-123")!),
    ).toMatchObject({
      pin1_location: "leftside_top",
      assembly_rotation_offset: 180,
    })
  }
})
