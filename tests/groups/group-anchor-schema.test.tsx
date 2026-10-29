import { expect, test } from "bun:test"
import { pcb_group } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import "tests/fixtures/extend-expect-any-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native group anchor alignment follows the Circuit JSON schema", async () => {
  const panels: string[] = []
  const validationResults = []

  for (const pcbAnchorAlignment of [undefined, "center", "top_left"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width={10} height={10} routingDisabled schematicDisabled>
        <group name="G1" pcbAnchorAlignment={pcbAnchorAlignment}>
          <resistor name="R1" resistance="1k" footprint="0402" />
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()

    // Validate the serialized native output, as downstream consumers do.
    const circuitJson = JSON.parse(JSON.stringify(circuit.getCircuitJson()))
    const [pcbGroup] = circuitJson.filter(
      (element: { type: string }) => element.type === "pcb_group",
    )
    const parsed = pcb_group.safeParse(pcbGroup)
    validationResults.push(
      parsed.success
        ? parsed.data.anchor_alignment
        : parsed.error.issues.map((issue) => issue.path.join(".")),
    )

    const label = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
      <rect width="400" height="100" fill="#111827" />
      <g fill="white" font-family="monospace" font-size="14">
        <text x="16" y="24">pcbAnchorAlignment: ${pcbAnchorAlignment ?? "omitted"}</text>
        <text x="16" y="48">emitted: ${JSON.stringify(pcbGroup.anchor_alignment) ?? "omitted"}</text>
        <text x="16" y="76" fill="${parsed.success ? "#86efac" : "#fca5a5"}">Schema: ${parsed.success ? "VALID" : "REJECTED (anchor_alignment)"}</text>
      </g>
    </svg>`
    panels.push(
      stackSvgsVertically(
        [
          label,
          convertCircuitJsonToPcbSvg(circuit.getCircuitJson(), {
            width: 400,
            height: 300,
            showPcbGroups: true,
          }),
        ],
        { gap: 0, normalizeSize: false },
      ),
    )
  }

  await expect(
    stackSvgsHorizontally(panels, { gap: 16, normalizeSize: false }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
  expect(validationResults).toEqual(["center", "center", "top_left"])
})
