import type { PcbPath } from "@tscircuit/props"
import { Circuit } from "lib"

export const manualViaTransitionCases = [
  {
    name: "disconnected_top",
    fromLayer: "bottom",
    toLayer: "inner2",
    invalid: true,
  },
  {
    name: "disconnected_inner",
    fromLayer: "bottom",
    toLayer: "inner2",
    incomingLayer: "inner1",
    invalid: true,
  },
  {
    name: "connected_blind",
    fromLayer: "top",
    toLayer: "inner2",
    invalid: false,
  },
  { name: "inferred_from", toLayer: "inner2", invalid: false },
  {
    name: "through_barrel",
    fromLayer: "bottom",
    toLayer: "top",
    invalid: false,
  },
  {
    name: "through_barrel_disabled_blind",
    fromLayer: "bottom",
    toLayer: "top",
    allowBlindAndBuriedVias: false,
    invalid: false,
  },
  {
    name: "intermediate_barrel_contact",
    fromLayer: "bottom",
    toLayer: "top",
    incomingLayer: "inner1",
    invalid: false,
  },
] as const

/** Path coordinates are anchor-footprint-local points in mm (+X right, +Y up). */
export async function renderManualViaTransition(
  api: "pcbPath" | "pcbPaths",
  scenario: (typeof manualViaTransitionCases)[number],
) {
  const incomingLayer =
    "incomingLayer" in scenario ? scenario.incomingLayer : "top"
  const path: PcbPath = [
    "R1.pin2",
    ...(incomingLayer === "top"
      ? []
      : [
          { x: 1, y: 0 },
          {
            x: 1,
            y: 0,
            via: true,
            fromLayer: "top" as const,
            toLayer: incomingLayer,
          },
          { x: 1, y: 0 },
        ]),
    { x: 3, y: 0 },
    {
      x: 3,
      y: 0,
      via: true,
      fromLayer: "fromLayer" in scenario ? scenario.fromLayer : undefined,
      toLayer: scenario.toLayer,
    },
    { x: 3, y: 0 },
    { x: 5, y: 0 },
    { x: 5, y: 0, via: true, fromLayer: scenario.toLayer, toLayer: "top" },
    { x: 5, y: 0 },
    "R2.pin1",
  ]
  const circuit = new Circuit()
  circuit.schematicDisabled = true
  circuit.add(
    <board
      width={20}
      height={12}
      layers={4}
      routeRemaining={false}
      allowBlindAndBuriedVias={
        "allowBlindAndBuriedVias" in scenario
          ? scenario.allowBlindAndBuriedVias
          : true
      }
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace
        from="R1.pin2"
        to="R2.pin1"
        thickness={0.2}
        pcbPathRelativeTo="R1.pin2"
        {...(api === "pcbPath" ? { pcbPath: path } : { pcbPaths: [path] })}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}
