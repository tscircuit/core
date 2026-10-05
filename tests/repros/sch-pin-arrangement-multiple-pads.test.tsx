import { expect, test } from "bun:test"

test("schPinArrangement should preserve pcb_port links for pins with multiple pads", async () => {
  const { Circuit } = await import("../../lib/index")

  const circuit = new Circuit()

  circuit.add(
    <board width="30mm" height="15mm" routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="0mm"
              pcbY="0mm"
              width="0.6mm"
              height="1mm"
              shape="rect"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="-2mm"
              pcbY="-2mm"
              shape="circle"
              holeDiameter="0.8mm"
              outerDiameter="1.4mm"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="2mm"
              pcbY="-2mm"
              shape="circle"
              holeDiameter="0.8mm"
              outerDiameter="1.4mm"
            />
          </footprint>
        }
        pinLabels={{ pin1: "SIG", pin2: "SHELL" }}
        connections={{ SIG: "net.S1", SHELL: "net.GND" }}
        schPinArrangement={{
          rightSide: { direction: "top-to-bottom", pins: ["SIG", "SHELL"] },
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbHoles = circuit.db.pcb_plated_hole.list()
  expect(pcbHoles.length).toBe(2)

  for (const hole of pcbHoles) {
    expect(hole.pcb_port_id).toBeTruthy()
  }
})
