import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Translated from the VBAT_IN fanout region in TI's SK-AM62 Altium source.
const vbatFanoutCopperOutline = [
  { x: 0.930422, y: 0.296974 },
  { x: 0.930422, y: -0.287988 },
  { x: 0.20957, y: -1.00884 },
  { x: -0.14603, y: -1.00884 },
  { x: -0.14603, y: -0.167846 },
  { x: -0.673042, y: -0.167846 },
  { x: -0.79373, y: -0.152603 },
  { x: -0.79373, y: 0.69296 },
  { x: -0.610342, y: 0.69296 },
  { x: -0.610342, y: 0.113586 },
  { x: 0.227858, y: 0.113586 },
  { x: 0.227858, y: 0.69296 },
  { x: 0.26037, y: 0.69296 },
  { x: 0.28131, y: 0.7139 },
  { x: 0.323944, y: 0.722381 },
  { x: 0.458373, y: 0.812203 },
  { x: 0.631642, y: 0.985471 },
  { x: 0.70267, y: 0.999599 },
  { x: 0.753516, y: 1.033574 },
  { x: 0.930422, y: 1.033574 },
]

test("TI SK-AM62 imported VBAT fanout copper is deleted", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="8mm" height="7mm" routingDisabled>
      <chip
        name="C9"
        manufacturerPartNumber="GRM155R61A106ME11D"
        pcbX={-1.36523}
        pcbY={0.87076}
        pcbRotation={90}
        noSchematicRepresentation
        pinLabels={{ pin1: "1", pin2: "2" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.489966}
              width={0.5588}
              height={0.635}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.489966}
              width={0.5588}
              height={0.635}
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="C10"
        manufacturerPartNumber="GRM033R61C104KE14D"
        pcbX={-0.191242}
        pcbY={0.825294}
        pcbRotation={90}
        noSchematicRepresentation
        pinLabels={{ pin1: "1", pin2: "2" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.279908}
              width={0.3556}
              height={0.3302}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.279908}
              width={0.3556}
              height={0.3302}
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="FL2"
        manufacturerPartNumber="BLM15PX121SN1D"
        pcbX={-0.70483}
        pcbY={-1.18664}
        pcbRotation={90}
        noSchematicRepresentation
        pinLabels={{ pin1: "1", pin2: "2" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.459994}
              width={0.6096}
              height={0.6096}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.459994}
              width={0.6096}
              height={0.6096}
              shape="rect"
            />
          </footprint>
        }
      />
      <chip
        name="MOD1"
        manufacturerPartNumber="WL1837MODGIMOCT"
        pcbX={1.565422}
        pcbY={0.404289}
        noSchematicRepresentation
        pinLabels={{ pin46: "VBAT_IN", pin47: "VBAT_IN" }}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin46"]}
              pcbY={0.349885}
              width={0.762}
              height={0.4064}
              shape="rect"
            />
            <smtpad
              portHints={["pin47"]}
              pcbY={-0.349885}
              width={0.762}
              height={0.4064}
              shape="rect"
            />
          </footprint>
        }
      />
      <trace
        path={[
          ".C9 > .pin1",
          ".FL2 > .pin2",
          ".C10 > .pin1",
          ".MOD1 > .pin46",
          ".MOD1 > .pin47",
          "net.VBAT_IN",
        ]}
      />
      <copperpour
        connectsTo="net.VBAT_IN"
        layer="top"
        outline={vbatFanoutCopperOutline}
        padMargin={0}
        traceMargin={0}
        clearance={0}
        boardEdgeMargin={0}
        cutoutMargin={0}
        useThermalReliefs={false}
      />
      <pcbnotetext
        text="TI SK-AM62 VBAT_IN FANOUT"
        pcbX={0}
        pcbY={-2.7}
        fontSize={0.4}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_copper_pour.list()).toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
