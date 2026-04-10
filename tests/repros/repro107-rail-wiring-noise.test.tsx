import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const railPins = {
  pin1: ["VCC"],
  pin2: ["GND"],
} as const

const railAttrs = {
  pin1: { requiresPower: true, mustBeConnected: true },
  VCC: { requiresPower: true, mustBeConnected: true },
  pin2: { requiresGround: true, mustBeConnected: true },
  GND: { requiresGround: true, mustBeConnected: true },
} as const

const WrappedRailConsumer = (props: ChipProps<typeof railPins>) => {
  return (
    <chip
      pinLabels={railPins}
      pinAttributes={railAttrs}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-1.2mm"
            pcbY="0mm"
            width="1mm"
            height="0.7mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="1.2mm"
            pcbY="0mm"
            width="1mm"
            height="0.7mm"
            shape="rect"
          />
          <courtyardoutline
            outline={[
              { x: -2.1, y: -1 },
              { x: 2.1, y: -1 },
              { x: 2.1, y: 1 },
              { x: -2.1, y: 1 },
              { x: -2.1, y: -1 },
            ]}
          />
        </footprint>
      }
      {...props}
    />
  )
}

const hasWarningMessage = (
  element: unknown,
): element is { type: string; message: string } => {
  return (
    typeof element === "object" &&
    element !== null &&
    "type" in element &&
    "message" in element &&
    typeof element.type === "string" &&
    typeof element.message === "string"
  )
}

test("repro107: rail-aware chips should not emit missing power/ground pin definition warnings", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="16mm" layers={2}>
      <chip
        name="U_INLINE"
        pcbX={0}
        pcbY={4}
        pinLabels={railPins}
        pinAttributes={railAttrs}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-1.2mm"
              pcbY="0mm"
              width="1mm"
              height="0.7mm"
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX="1.2mm"
              pcbY="0mm"
              width="1mm"
              height="0.7mm"
              shape="rect"
            />
            <courtyardoutline
              outline={[
                { x: -2.1, y: -1 },
                { x: 2.1, y: -1 },
                { x: 2.1, y: 1 },
                { x: -2.1, y: 1 },
                { x: -2.1, y: -1 },
              ]}
            />
          </footprint>
        }
      />

      <WrappedRailConsumer name="U_WRAPPED" pcbX={0} pcbY={-4} />

      <trace from="net.VCC" to="U_INLINE.VCC" />
      <trace from="net.GND" to="U_INLINE.GND" />
      <trace from="net.VCC" to="U_WRAPPED.VCC" />
      <trace from="net.GND" to="U_WRAPPED.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const warningTypesToReject = new Set([
    "source_no_power_pin_defined_warning",
    "source_no_ground_pin_defined_warning",
  ])
  const componentNames = new Set(["U_INLINE", "U_WRAPPED"])

  const unexpectedWarnings = circuit
    .getCircuitJson()
    .filter(
      (element) =>
        hasWarningMessage(element) &&
        warningTypesToReject.has(element.type) &&
        [...componentNames].some((name) => element.message.startsWith(name)),
    )

  expect(unexpectedWarnings).toHaveLength(0)
})
