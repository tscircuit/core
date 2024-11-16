import { test, expect } from "bun:test"
import { getTestFixture } from "../../../tests/fixtures/get-test-fixture"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { su } from "@tscircuit/soup-util"

const pinLabels = {
  pin1: ["pin1", "GND"],
  pin2: ["pin2", "VOUT1"],
  pin3: ["pin3", "VIN"],
  pin4: ["pin4", "VOUT2"],
} as const

test("custom footptint extra pin", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="chips"
        cadModel={{
          objUrl:
            "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=e80246a9471445bfb635be848806a22e&pn=C6186",
          rotationOffset: { x: 0, y: 0, z: 0 },
          positionOffset: { x: 0, y: 0, z: 0 },
        }}
        pinLabels={pinLabels}
        supplierPartNumbers={{
          jlcpcb: ["C6186"],
        }}
        manufacturerPartNumber="AMS1117_3_3"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="2.929959849999932mm"
              pcbY="-2.2999699999999166mm"
              width="2.4999949999999997mm"
              height="1.0999978mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="2.929959849999932mm"
              pcbY="0mm"
              width="2.4999949999999997mm"
              height="1.0999978mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="2.929959849999932mm"
              pcbY="2.2999700000000303mm"
              width="2.4999949999999997mm"
              height="1.0999978mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="-3.009957149999991mm"
              pcbY="0mm"
              width="2.3400004mm"
              height="3.5999928mm"
              shape="rect"
            />
            <silkscreenpath
              route={[
                { x: -1.6114077499998984, y: -3.3262061999998878 },
                { x: -1.6114077499998984, y: 3.3262062000000014 },
                { x: 1.3313854499999707, y: 3.3262062000000014 },
                { x: 1.3313854499999707, y: -3.3262061999998878 },
                { x: -1.6114077499998984, y: -3.3262061999998878 },
              ]}
            />
          </footprint>
        }
      />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  const numPorts = su(circuitJson).source_port.list().length
  expect(numPorts).toBe(4)

  expect(
    convertCircuitJsonToSchematicSvg(circuitJson as any, {
      grid: {
        cellSize: 1,
        labelCells: true,
      },
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
