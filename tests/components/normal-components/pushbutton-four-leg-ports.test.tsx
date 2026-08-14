import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 4-leg tactile switch must expose all four legs on the PCB. Previously
// PushButton hardcoded pinCount: 2, so pins 3 and 4 got no ports at all — the
// pads existed as copper but had no pcb_port, so they could not join a net and
// were invisible to connectivity checks. A real board shipped with two such
// pads left unrouted and the buttons dead.
test("4-leg pushbutton creates a port for every leg", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="-6.25mm"
              pcbY="2.5mm"
              shape="circle"
              holeDiameter="1.2mm"
              outerDiameter="2.5mm"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="6.25mm"
              pcbY="2.5mm"
              shape="circle"
              holeDiameter="1.2mm"
              outerDiameter="2.5mm"
            />
            <platedhole
              portHints={["pin3"]}
              pcbX="-6.25mm"
              pcbY="-2.5mm"
              shape="circle"
              holeDiameter="1.2mm"
              outerDiameter="2.5mm"
            />
            <platedhole
              portHints={["pin4"]}
              pcbX="6.25mm"
              pcbY="-2.5mm"
              shape="circle"
              holeDiameter="1.2mm"
              outerDiameter="2.5mm"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  const pcbPorts = circuitJson.filter((e: any) => e.type === "pcb_port")
  const sourcePorts = circuitJson.filter((e: any) => e.type === "source_port")

  // Every declared pin must reach the PCB, or it cannot be connected to.
  expect(sourcePorts).toHaveLength(4)
  expect(pcbPorts).toHaveLength(4)
})

// A pushbutton with no footprint has nothing to derive pins from and stays a
// two-terminal schematic part.
test("footprint-less pushbutton still has two pins", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <pushbutton name="SW1" />
    </board>,
  )

  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()

  expect(circuitJson.filter((e: any) => e.type === "source_port")).toHaveLength(
    2,
  )
})
