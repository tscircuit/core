import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbtrace route vias lack physical via records and differ from explicit controls", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={44} height={24} layers={4}>
      <pcbnotetext
        pcbX={0}
        pcbY={10}
        layer="bottom"
        fontSize={0.9}
        text="BOTTOM VIEW: EACH LEFT VIA SHOULD MATCH ITS RIGHT CONTROL"
      />
      {[4, -4].map((y) => (
        <Fragment key={y}>
          <pcbtrace
            route={[
              { route_type: "wire", x: -15, y, width: 0.3, layer: "bottom" },
              { route_type: "wire", x: -10, y, width: 0.3, layer: "bottom" },
              {
                route_type: "via",
                x: -10,
                y,
                from_layer: "bottom",
                to_layer: "inner2",
                outer_diameter: 3,
                hole_diameter: 1.5,
              },
            ]}
          />
          <via
            pcbX={10}
            pcbY={y}
            fromLayer="bottom"
            toLayer="inner2"
            outerDiameter={3}
            holeDiameter={1.5}
          />
          <pcbnotetext
            pcbX={-10}
            pcbY={y + 2.5}
            layer="bottom"
            fontSize={0.8}
            text={y > 0 ? "ROUTE VIA: 3 / 1.5mm" : "ROUTE VIA + TOP-ONLY VIA"}
          />
          <pcbnotetext
            pcbX={10}
            pcbY={y + 2.5}
            layer="bottom"
            fontSize={0.8}
            text="EXPLICIT VIA: 3 / 1.5mm"
          />
        </Fragment>
      ))}
      <via
        pcbX={-10}
        pcbY={-4}
        fromLayer="top"
        toLayer="inner1"
        outerDiameter={3}
        holeDiameter={1.5}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={-9}
        layer="bottom"
        fontSize={0.7}
        text="A TOP-ONLY VIA MUST NOT HIDE A BOTTOM VIA AT THE SAME POSITION"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const routeVias = circuit.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route.filter((point) => point.route_type === "via"),
    )
  expect(routeVias).toHaveLength(2)
  for (const routeVia of routeVias) {
    expect(routeVia).toMatchObject({
      outer_diameter: 3,
      hole_diameter: 1.5,
      from_layer: "bottom",
      to_layer: "inner2",
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    layer: "bottom",
    showPcbNotes: true,
    shouldDrawErrors: false,
  })
})
