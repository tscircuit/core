import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copperpour creates thermal relief spokes for every SMT pad shape", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="7mm">
      <net name="GND" />
      <chip
        name="U1"
        connections={{
          pin1: "net.GND",
          pin2: "net.GND",
          pin3: "net.GND",
          pin4: "net.GND",
          pin5: "net.GND",
        }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width="1.8mm"
              height="2.6mm"
              pcbX={-6}
              portHints={["pin1"]}
            />
            <smtpad
              shape="rotated_rect"
              width="1.8mm"
              height="2.6mm"
              ccwRotation={30}
              pcbX={-3}
              portHints={["pin2"]}
            />
            <smtpad shape="circle" radius="0.9mm" portHints={["pin3"]} />
            <smtpad
              shape="rotated_pill"
              width="1.4mm"
              height="2.6mm"
              radius="0.7mm"
              ccwRotation={-35}
              pcbX={3}
              portHints={["pin4"]}
            />
            <smtpad
              shape="polygon"
              points={[
                { x: 5.1, y: -0.9 },
                { x: 6.5, y: -1.15 },
                { x: 6.95, y: 0 },
                { x: 6.35, y: 1.1 },
                { x: 5.15, y: 0.75 },
              ]}
              portHints={["pin5"]}
            />
          </footprint>
        }
      />
      <copperpour
        connectsTo="net.GND"
        layer="top"
        padMargin="0.35mm"
        useThermalReliefs
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-2.85}
        fontSize={0.35}
        text="RECT · ROTATED RECT · CIRCLE · ROTATED PILL · POLYGON"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_smtpad.list()).toHaveLength(5)
  expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
