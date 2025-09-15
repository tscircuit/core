import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.skip("group-match-adapt5 - matchAdaptTemplate", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      routingDisabled
      matchAdapt
      matchAdaptTemplate={{
        boxes: [
          {
            boxId: "U1",
            leftPinCount: 2,
            rightPinCount: 2,
            topPinCount: 0,
            bottomPinCount: 0,
            centerX: -0.20000000000000018,
            centerY: 2.5000000000000004,
            pins: [
              {
                pinNumber: 1,
                x: -1.2000000000000002,
                y: 2.6,
              },
              {
                pinNumber: 2,
                x: -1.2000000000000002,
                y: 2.4000000000000004,
              },
              {
                pinNumber: 3,
                x: 0.8,
                y: 2.6,
              },
              {
                pinNumber: 4,
                x: 0.8,
                y: 2.4000000000000004,
              },
            ],
          },
          {
            boxId: "P1",
            leftPinCount: 0,
            rightPinCount: 0,
            topPinCount: 1,
            bottomPinCount: 1,
            centerX: -2.4000000000000004,
            centerY: 1.7,
            pins: [
              {
                pinNumber: 2,
                x: -2.4000000000000004,
                y: 2.2,
              },
              {
                pinNumber: 1,
                x: -2.4000000000000004,
                y: 1.2,
              },
            ],
          },
        ],
        netLabels: [
          {
            netId: "NET1",
            netLabelId: "loaded-nl-64033ad4-73e8-408b-9375-bd5e993f8bf4-0",
            anchorPosition: "top",
            x: -2.4000000000000004,
            y: 0.6000000000000001,
          },
          {
            netId: "NET2",
            netLabelId: "loaded-nl-1c5a1acd-ac1b-4762-bd7a-4f1b1d546fec-1",
            anchorPosition: "left",
            x: 1.2000000000000002,
            y: 2.6,
          },
        ],
        paths: [
          {
            points: [
              {
                x: -2.4000000000000004,
                y: 2.2,
              },
              {
                x: -2.4000000000000004,
                y: 2.6,
              },
              {
                x: -1.2000000000000002,
                y: 2.6,
              },
            ],
            from: {
              boxId: "P1",
              pinNumber: 2,
            },
            to: {
              boxId: "U1",
              pinNumber: 1,
            },
          },
          {
            points: [
              {
                x: -2.4000000000000004,
                y: 1.2,
              },
              {
                x: -2.4000000000000004,
                y: 0.6000000000000001,
              },
            ],
            from: {
              boxId: "P1",
              pinNumber: 1,
            },
            to: {
              netLabelId: "loaded-nl-64033ad4-73e8-408b-9375-bd5e993f8bf4-0",
            },
          },
          {
            points: [
              {
                x: 0.8,
                y: 2.6,
              },
              {
                x: 1.2000000000000002,
                y: 2.6,
              },
            ],
            from: {
              boxId: "U1",
              pinNumber: 3,
            },
            to: {
              netLabelId: "loaded-nl-1c5a1acd-ac1b-4762-bd7a-4f1b1d546fec-1",
            },
          },
        ],
        junctions: [],
      }}
    >
      <chip
        name="U1"
        footprint="soic4"
        connections={{
          pin1: "R1.1",
        }}
      />
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        connections={{
          pin2: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchSchematicSnapshot(import.meta.path)
})
