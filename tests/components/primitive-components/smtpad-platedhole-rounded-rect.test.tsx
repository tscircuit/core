import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("smtpad and platedhole rounded rect support", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="20mm" height="20mm">
      <smtpad
        shape="rect"
        width="2mm"
        height="2mm"
        pcbX={-5}
        pcbY={0}
        cornerRadius={0.5}
        layer="top"
      />
      <smtpad
        shape="rect"
        width="2mm"
        height="2mm"
        pcbX={-2}
        pcbY={0}
        rectBorderRadius={0.5}
        layer="top"
      />
      <platedhole
        shape="circular_hole_with_rect_pad"
        holeDiameter="1mm"
        rectPadWidth="2mm"
        rectPadHeight="2mm"
        pcbX={2}
        pcbY={0}
        rectBorderRadius={0.5}
      />
      <platedhole
        shape="pill_hole_with_rect_pad"
        holeWidth="1mm"
        holeHeight="0.5mm"
        rectPadWidth="2mm"
        rectPadHeight="2mm"
        pcbX={5}
        pcbY={0}
        rectBorderRadius={0.5}
      />
    </board>,
  )
  project.render()

  const circuitJson = project.getCircuitJson()
  
  const smtpads = circuitJson.filter((item: any) => item.type === "pcb_smtpad")
  const platedholes = circuitJson.filter((item: any) => item.type === "pcb_plated_hole")

  // Check first smtpad (cornerRadius)
  expect(smtpads[0].shape).toBe("rect")
  expect(smtpads[0].rect_border_radius).toBe(0.5)

  // Check second smtpad (rectBorderRadius)
  expect(smtpads[1].shape).toBe("rect")
  expect(smtpads[1].rect_border_radius).toBe(0.5)

  // Check platedhole circular_hole_with_rect_pad
  expect(platedholes[0].shape).toBe("circular_hole_with_rect_pad")
  expect(platedholes[0].rect_border_radius).toBe(0.5)

  // Check platedhole pill_hole_with_rect_pad
  expect(platedholes[1].shape).toBe("pill_hole_with_rect_pad")
  expect(platedholes[1].rect_border_radius).toBe(0.5)
})
