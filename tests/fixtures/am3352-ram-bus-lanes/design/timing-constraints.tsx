import { Fragment } from "react"
import type { PcbRoutingConstraints } from "@tscircuit/props"
const data = (byte: number) => [
  ...Array.from({ length: 8 }, (_, bit) => pin(`DDR_D${byte * 8 + bit}`)),
  pin(`DDR_DQM${byte}`),
]
const strobes = (byte: number) => [
  pin(`DDR_DQS${byte}`),
  pin(`DDR_DQSn${byte}`),
]
const spacingGroups = [
  "DDR_DATA0",
  "DDR_DATA1",
  "DDR_DQS_PAIR0",
  "DDR_DQS_PAIR1",
  "DDR_CK_PAIR",
  "DDR_ADDR_CTRL",
]
const spacing = (name: string): PcbRoutingConstraints["spacing"] =>
  spacingGroups.map((otherBus) => ({
    otherBus,
    centerlineWidthMultiplier: otherBus === name ? 3 : 4,
    reducedCenterlineWidthMultiplier: 1,
  }))
import ballMap from "./am3352-ballmap.json"
const pin = (signal: string) => {
  const ball = Object.entries(ballMap).find(([, s]) => s === signal)?.[0]
  if (!ball) throw new Error(`Unknown AM3352 signal: ${signal}`)
  return `.U1 > .${ball}`
}
// Values from TI SPRS717L Tables 7-66 through 7-69 belong to this design.
// Generic check-only buses compose data/strobe and address/clock groups.
// Physical stackup, reference planes, termination and decoupling still need
// separate validation. RESETn is not an ADDR_CTRL member in Table 7-66.
export function TimingConstraints() {
  const command = [
    ...Array.from({ length: 13 }, (_, bit) => pin(`DDR_A${bit}`)),
    ...Array.from({ length: 3 }, (_, bit) => pin(`DDR_BA${bit}`)),
    ...[
      "DDR_CSn0",
      "DDR_CASn",
      "DDR_RASn",
      "DDR_WEn",
      "DDR_CKE",
      "DDR_ODT",
    ].map(pin),
  ]
  const clock = [pin("DDR_CK"), pin("DDR_CKn")]
  return (
    <>
      {([0, 1] as const).map((byte) => (
        <Fragment key={byte}>
          <bus
            name={`DDR_BYTE${byte}`}
            routingPhaseIndex={1}
            maxLengthSkew="25mil"
            pcbRoutingConstraints={{ expectedTraceCount: 11 }}
            connections={[...data(byte), ...strobes(byte)]}
          />
          <bus
            name={`DDR_DATA${byte}`}
            routingDisabled
            connections={data(byte)}
            maxLengthSkew="25mil"
            pcbRoutingConstraints={{
              expectedTraceCount: 9,
              lengthBounds: {
                referenceBus: `DDR_BYTE${byte}`,
                referenceMetric: "longest_manhattan",
                max: 0,
              },
              maxReducedSpacingLength: "1250mil",
              spacing: spacing(`DDR_DATA${byte}`),
              impedanceBounds: { min: "50ohm", max: "75ohm" },
            }}
          />
          <differentialpair
            name={`DDR_DQS_PAIR${byte}`}
            positiveConnection={strobes(byte)[0]!}
            negativeConnection={strobes(byte)[1]!}
            maxLengthSkew="5mil"
            pcbTraceGap={0.12}
            pcbRoutingConstraints={{
              expectedTraceCount: 2,
              maxReducedSpacingLength: "1250mil",
              spacing: spacing(`DDR_DQS_PAIR${byte}`),
              impedanceBounds: { min: "100ohm", max: "150ohm" },
            }}
          />
        </Fragment>
      ))}
      <bus
        name="DDR_COMMAND_CLOCK"
        routingDisabled
        connections={[...command, ...clock]}
      />
      <bus
        name="DDR_ADDR_CTRL"
        routingDisabled
        connections={command}
        pcbRoutingConstraints={{
          expectedTraceCount: 22,
          lengthBounds: {
            referenceBus: "DDR_COMMAND_CLOCK",
            referenceMetric: "longest_manhattan",
            min: "250mil",
            max: "350mil",
          },
          maxReducedSpacingLength: "1250mil",
          spacing: spacing("DDR_ADDR_CTRL"),
          impedanceBounds: { min: "50ohm", max: "75ohm" },
        }}
      />
      <differentialpair
        name="DDR_CK_PAIR"
        positiveConnection={clock[0]!}
        negativeConnection={clock[1]!}
        maxLengthSkew="5mil"
        pcbTraceGap={0.12}
        pcbRoutingConstraints={{
          expectedTraceCount: 2,
          lengthBounds: {
            referenceBus: "DDR_COMMAND_CLOCK",
            referenceMetric: "longest_manhattan",
            min: "250mil",
            max: "350mil",
          },
          maxReducedSpacingLength: "1250mil",
          spacing: spacing("DDR_CK_PAIR"),
          impedanceBounds: { min: "100ohm", max: "150ohm" },
        }}
      />
    </>
  )
}
