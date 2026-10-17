import { expect, test } from "bun:test"
import { normalizeDegrees } from "@tscircuit/math-utils"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pack-applied rotation propagates to pcb_plated_hole.ccw_rotation and avoids false pad clearance errors", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="3mm"
              pcbY="3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="-3mm"
              pcbY="-3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="3mm"
              pcbY="-3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="J1"
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="0mm"
              pcbY="-1.275mm"
              shape="pill"
              outerWidth="1.2mm"
              outerHeight="0.6mm"
              holeWidth="0.8mm"
              holeHeight="0.3mm"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="0mm"
              pcbY="-0.425mm"
              shape="pill"
              outerWidth="1.2mm"
              outerHeight="0.6mm"
              holeWidth="0.8mm"
              holeHeight="0.3mm"
            />
            <platedhole
              portHints={["pin3"]}
              pcbX="0mm"
              pcbY="0.425mm"
              shape="pill"
              outerWidth="1.2mm"
              outerHeight="0.6mm"
              holeWidth="0.8mm"
              holeHeight="0.3mm"
            />
            <platedhole
              portHints={["pin4"]}
              pcbX="0mm"
              pcbY="1.275mm"
              shape="pill"
              outerWidth="1.2mm"
              outerHeight="0.6mm"
              holeWidth="0.8mm"
              holeHeight="0.3mm"
            />
          </footprint>
        }
      />
      <trace from=".U1 > .pin1" to=".J1 > .pin1" />
      <trace from=".U1 > .pin2" to=".J1 > .pin4" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const j1Source = circuit.db.source_component.getWhere({ name: "J1" })
  expect(j1Source).toBeDefined()

  const j1Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j1Source!.source_component_id,
  })
  expect(j1Pcb).toBeDefined()
  expect(Math.abs(j1Pcb!.rotation) % 180).toBeCloseTo(90)

  const expectedRotation = normalizeDegrees(j1Pcb!.rotation)

  const platedHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((ph) => ph.pcb_component_id === j1Pcb!.pcb_component_id)
  expect(platedHoles).toHaveLength(4)

  for (const ph of platedHoles) {
    expect(ph.shape).toBe("pill")
    if (ph.shape === "pill") {
      expect(normalizeDegrees(ph.ccw_rotation ?? 0)).toBeCloseTo(
        expectedRotation,
      )
    }
  }

  const clearanceErrors = circuit
    .getCircuitJson()
    .filter((elm) => elm.type === "pcb_pad_pad_clearance_error")
  expect(clearanceErrors).toHaveLength(0)
})

test("pack-applied rotation updates rect_ccw_rotation and hole_ccw_rotation on rectangular-pad plated holes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board pcbPack routingDisabled>
      <chip
        name="U1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-3mm"
              pcbY="3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="3mm"
              pcbY="3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin3"]}
              pcbX="-3mm"
              pcbY="-3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin4"]}
              pcbX="3mm"
              pcbY="-3mm"
              width="1mm"
              height="1mm"
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="J2"
        footprint={
          <footprint>
            <platedhole
              portHints={["pin1"]}
              pcbX="0mm"
              pcbY="-1.275mm"
              shape="circular_hole_with_rect_pad"
              holeDiameter="0.5mm"
              rectPadWidth="1.2mm"
              rectPadHeight="0.6mm"
            />
            <platedhole
              portHints={["pin2"]}
              pcbX="0mm"
              pcbY="1.275mm"
              shape="pill_hole_with_rect_pad"
              holeWidth="0.8mm"
              holeHeight="0.3mm"
              rectPadWidth="1.2mm"
              rectPadHeight="0.6mm"
            />
          </footprint>
        }
      />
      <trace from=".U1 > .pin1" to=".J2 > .pin1" />
      <trace from=".U1 > .pin2" to=".J2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const j2Source = circuit.db.source_component.getWhere({ name: "J2" })
  const j2Pcb = circuit.db.pcb_component.getWhere({
    source_component_id: j2Source!.source_component_id,
  })
  expect(j2Pcb).toBeDefined()
  expect(Math.abs(j2Pcb!.rotation) % 180).toBeCloseTo(90)

  const expectedRotation = normalizeDegrees(j2Pcb!.rotation)

  const platedHoles = circuit.db.pcb_plated_hole
    .list()
    .filter((ph) => ph.pcb_component_id === j2Pcb!.pcb_component_id)
  expect(platedHoles).toHaveLength(2)

  const circularWithRect = platedHoles.find(
    (ph) => ph.shape === "circular_hole_with_rect_pad",
  )
  expect(circularWithRect).toBeDefined()
  if (circularWithRect?.shape === "circular_hole_with_rect_pad") {
    expect(
      normalizeDegrees(circularWithRect.rect_ccw_rotation ?? 0),
    ).toBeCloseTo(expectedRotation)
  }

  const pillWithRect = platedHoles.find(
    (ph) => ph.shape === "rotated_pill_hole_with_rect_pad",
  )
  expect(pillWithRect).toBeDefined()
  if (pillWithRect?.shape === "rotated_pill_hole_with_rect_pad") {
    expect(normalizeDegrees(pillWithRect.hole_ccw_rotation ?? 0)).toBeCloseTo(
      expectedRotation,
    )
    expect(normalizeDegrees(pillWithRect.rect_ccw_rotation ?? 0)).toBeCloseTo(
      expectedRotation,
    )
  }
})
