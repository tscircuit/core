import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated rectangular pads create correct component bounds", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={[
        { x: 1, y: -29 },
        { x: 15, y: -29 },
        { x: 15, y: -9 },
        { x: 1, y: -9 },
      ]}
      routingDisabled
    >
      <chip
        name="U1"
        pcbX={7.3}
        pcbY={-20.1}
        pcbRotation={-90}
        footprint={
          <footprint>
            {/* Exact C1526234 pads required to reproduce the incorrect bounds. */}
            <smtpad
              portHints={["pin30", "GNDPAD6"]}
              pcbX={-6.574917}
              pcbY={3.050159}
              width={0.499999}
              height={0.499999}
              shape="rect"
            />
            <smtpad
              portHints={["pin31", "GNDPAD7"]}
              pcbX={-6.574917}
              pcbY={-3.049905}
              width={0.499999}
              height={0.499999}
              shape="rect"
            />
            <smtpad
              portHints={["pin34", "GNDPAD10"]}
              pcbX={4.399915}
              pcbY={-3.134995}
              width={4.850003}
              height={0.4299966}
              shape="rect"
            />
            <smtpad
              portHints={["pin35", "GNDPAD11"]}
              pcbX={4.399915}
              pcbY={3.134995}
              width={4.850003}
              height={0.4299966}
              shape="rect"
            />
            <courtyardoutline
              outline={[
                { x: -7.743381, y: 3.774123 },
                { x: 7.234619, y: 3.774123 },
                { x: 7.234619, y: -3.761677 },
                { x: -7.743381, y: -3.761677 },
              ]}
            />
          </footprint>
        }
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="cap0402"
        pcbX={13}
        pcbY={-21.2}
      />
      <pcbnoterect
        pcbX={7.3}
        pcbY={-20.1}
        width={6.6999866}
        height={13.649833}
        color="#22c55e"
        strokeWidth="0.12mm"
        isStrokeDashed
      />
      <pcbnotetext
        text="GREEN: corrected bounds clear C2 by 1.57mm"
        pcbX={8}
        pcbY={-10}
        fontSize="0.45mm"
      />
      <pcbnotetext
        text="MAGENTA: courtyards are clear by 0.996mm"
        pcbX={8}
        pcbY={-10.75}
        fontSize="0.42mm"
      />
    </board>,
  )

  circuit.render()

  const [u1, c2] = circuit.db.pcb_component.list()
  const bodyClearance =
    c2.center.x - c2.width / 2 - (u1.center.x + u1.width / 2)

  expect(u1.center.x).toBeCloseTo(7.3, 6)
  expect(u1.center.y).toBeCloseTo(-20.1, 6)
  expect(u1.width).toBeCloseTo(6.6999866, 6)
  expect(u1.height).toBeCloseTo(13.649833, 6)
  expect(bodyClearance).toBeCloseTo(1.57, 2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showCourtyards: true,
  })
})
