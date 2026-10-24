import { expect, test } from "bun:test"
import { PcbNoteText } from "lib/components/primitive-components/PcbNoteText"
import type { Chip } from "lib/components/normal-components/Chip"
import { resolvePcbProperty } from "lib/utils/pcbSx/resolve-pcb-property"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function EncoderMarkings({
  name,
  pcbX,
  hidden = false,
}: {
  name: string
  pcbX: number
  hidden?: boolean
}) {
  return (
    <chip
      name={name}
      pcbX={pcbX}
      pcbSx={
        hidden ? { "& silkscreencircle": { visibility: "hidden" } } : undefined
      }
      footprint={
        <footprint>
          <silkscreencircle
            pcbX={-0.000127}
            pcbY={0.250063}
            radius={4.325366}
          />
          <silkscreencircle pcbX={-0.000127} pcbY={0.250063} radius={3.3528} />
          <silkscreencircle pcbX={-0.000127} pcbY={0.250063} radius={3.048} />
          <silkscreentext
            text="{NAME}"
            pcbX={-0.000127}
            pcbY={9.149463}
            anchorAlignment="center"
            fontSize={1}
          />
        </footprint>
      }
    />
  )
}

test("ENC1 shaft circles ignore inherited hidden visibility", async () => {
  const { circuit } = getTestFixture({
    platform: { partsEngineDisabled: true },
  })
  circuit.schematicDisabled = true
  circuit.add(
    <board width={36} height={30} routingDisabled>
      <EncoderMarkings name="ENC1" pcbX={-9} />
      <EncoderMarkings name="ENC2" pcbX={9} hidden />
      <pcbnotetext
        text="USB-C control dial: ENC1 shaft markings"
        pcbY={13}
        fontSize={0.8}
      />
      <pcbnotetext
        text="Default visible"
        pcbX={-9}
        pcbY={6.5}
        fontSize={0.65}
      />
      <pcbnotetext
        text="Hide circles only"
        pcbX={9}
        pcbY={6.5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const visibleEncoder = circuit.selectOne(".ENC1") as Chip
  const hiddenEncoder = circuit.selectOne(".ENC2") as Chip
  const hiddenCircle = hiddenEncoder.selectOne("silkscreencircle")!
  expect(
    resolvePcbProperty({
      propertyName: "visibility",
      resolvedPcbSx: hiddenCircle.getResolvedPcbSx(),
      pathFromAmpersand: "silkscreencircle",
      component: hiddenCircle,
    }),
  ).toBe("hidden")
  const circles = circuit.db.pcb_silkscreen_circle.list()
  const visibleCount = circles.filter(
    (circle) => circle.pcb_component_id === visibleEncoder.pcb_component_id,
  ).length
  const hiddenCount = circles.filter(
    (circle) => circle.pcb_component_id === hiddenEncoder.pcb_component_id,
  ).length
  expect(visibleCount).toBe(3)
  expect(hiddenCount).toBe(3)
  expect(
    circuit.db.pcb_silkscreen_text.list().map((text) => text.text),
  ).toEqual(["ENC1", "ENC2"])

  circuit.firstChild!.add(
    new PcbNoteText({
      text: `Expected 3; emitted ${visibleCount}`,
      pcbX: -9,
      pcbY: -6.5,
      fontSize: 0.6,
    }),
  )
  circuit.firstChild!.add(
    new PcbNoteText({
      text: `Expected 0; emitted ${hiddenCount}`,
      pcbX: 9,
      pcbY: -6.5,
      fontSize: 0.6,
      color: hiddenCount === 0 ? "#55dd88" : "#ff6666",
    }),
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
