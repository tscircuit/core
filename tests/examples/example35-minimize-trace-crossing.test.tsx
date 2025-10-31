import { describe, it, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VC15"],
  pin2: ["VC14"],
  pin3: ["VC13"],
  pin4: ["VC12"],
  pin5: ["VC11"],
  pin6: ["VC10"],
  pin7: ["VC9"],
  pin8: ["VC8"],
  pin9: ["VC7"],
  pin10: ["VC6"],
  pin11: ["VC5"],
  pin12: ["VC4"],
  pin13: ["VC3"],
  pin14: ["VC2"],
  pin15: ["VC1"],
  pin16: ["VC0"],
  pin17: ["VSS"],
  pin18: ["SRP"],
  pin19: ["NC1"],
  pin20: ["SRN"],
  pin21: ["TS1"],
  pin22: ["TS2"],
  pin23: ["TS3"],
  pin24: ["REG18"],
  pin25: ["ALERT"],
  pin26: ["SCL"],
  pin27: ["SDA"],
  pin28: ["HDQ"],
  pin29: ["CFETOFF"],
  pin30: ["DFETOFF"],
  pin31: ["DCHG"],
  pin32: ["DDSG"],
  pin33: ["RST_SHUT"],
  pin34: ["REG2"],
  pin35: ["REG1"],
  pin36: ["REGIN"],
  pin37: ["BREG"],
  pin38: ["FUSE"],
  pin39: ["PDSG"],
  pin40: ["PCHG"],
  pin41: ["LD"],
  pin42: ["PACK"],
  pin43: ["DSG"],
  pin44: ["NC2"],
  pin45: ["CHG"],
  pin46: ["CP1"],
  pin47: ["BAT"],
  pin48: ["VC16"],
} as const

export const BQ76952PFBR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
        jlcpcb: ["C2862742"],
      }}
      schWidth={2}
      manufacturerPartNumber="BQ76952PFBR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-2.7500579999999957mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-2.249932000000001mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="-1.7500599999999906mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="-1.249933999999996mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="-0.7500619999999998mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.24993599999999105mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin7"]}
            pcbX="0.24993599999999105mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin8"]}
            pcbX="0.7500619999999856mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin9"]}
            pcbX="1.249933999999996mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin10"]}
            pcbX="1.7500599999999906mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin11"]}
            pcbX="2.249932000000001mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin12"]}
            pcbX="2.7500579999999957mm"
            pcbY="-4.05003mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin13"]}
            pcbX="4.0500299999999925mm"
            pcbY="-2.750058000000003mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin14"]}
            pcbX="4.0500299999999925mm"
            pcbY="-2.249932000000001mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin15"]}
            pcbX="4.0500299999999925mm"
            pcbY="-1.7500599999999906mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin16"]}
            pcbX="4.0500299999999925mm"
            pcbY="-1.2499340000000032mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin17"]}
            pcbX="4.0500299999999925mm"
            pcbY="-0.7500620000000069mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin18"]}
            pcbX="4.0500299999999925mm"
            pcbY="-0.24993600000000527mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin19"]}
            pcbX="4.0500299999999925mm"
            pcbY="0.24993600000000527mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin20"]}
            pcbX="4.0500299999999925mm"
            pcbY="0.7500619999999998mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin21"]}
            pcbX="4.0500299999999925mm"
            pcbY="1.249933999999996mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin22"]}
            pcbX="4.0500299999999925mm"
            pcbY="1.7500599999999906mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin23"]}
            pcbX="4.0500299999999925mm"
            pcbY="2.249931999999994mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin24"]}
            pcbX="4.0500299999999925mm"
            pcbY="2.7500579999999957mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin25"]}
            pcbX="2.7500579999999957mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin26"]}
            pcbX="2.249932000000001mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin27"]}
            pcbX="1.7500599999999906mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin28"]}
            pcbX="1.249933999999996mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin29"]}
            pcbX="0.7500619999999856mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin30"]}
            pcbX="0.24993599999999105mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin31"]}
            pcbX="-0.24993599999999105mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin32"]}
            pcbX="-0.7500619999999998mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin33"]}
            pcbX="-1.249933999999996mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin34"]}
            pcbX="-1.7500599999999906mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin35"]}
            pcbX="-2.249932000000001mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin36"]}
            pcbX="-2.7500579999999957mm"
            pcbY="4.0500299999999925mm"
            width="0.2800096mm"
            height="1.7999964mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin37"]}
            pcbX="-4.0500299999999925mm"
            pcbY="2.7500579999999957mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin38"]}
            pcbX="-4.0500299999999925mm"
            pcbY="2.249931999999994mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin39"]}
            pcbX="-4.0500299999999925mm"
            pcbY="1.7500599999999906mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin40"]}
            pcbX="-4.0500299999999925mm"
            pcbY="1.249933999999996mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin41"]}
            pcbX="-4.0500299999999925mm"
            pcbY="0.7500619999999998mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin42"]}
            pcbX="-4.0500299999999925mm"
            pcbY="0.24993600000000527mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin43"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-0.24993600000000527mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin44"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-0.7500620000000069mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin45"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-1.2499340000000032mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin46"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-1.7500599999999906mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin47"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-2.249932000000001mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin48"]}
            pcbX="-4.0500299999999925mm"
            pcbY="-2.750058000000003mm"
            width="1.7999964mm"
            height="0.2800096mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -2.750007199999999, y: 2.750007199999999 },
              { x: 2.7500071999999847, y: 2.750007199999999 },
              { x: 2.7500071999999847, y: -2.750007199999999 },
              { x: -2.750007199999999, y: -2.750007199999999 },
              { x: -2.750007199999999, y: 2.750007199999999 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -3.5001199999999955, y: -4.150360000000006 },
              { x: -3.6488610559976564, y: -3.999717970296075 },
              { x: -3.4988499999999902, y: -3.850340575985264 },
              { x: -3.348838944002324, y: -3.999717970296075 },
              { x: -3.4975799999999992, y: -4.150360000000006 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -2.100580000000008, y: -1.8999199999999945 },
              { x: -2.2887163503048242, y: -1.7602885755021305 },
              { x: -2.215185444868041, y: -1.5378353737742998 },
              { x: -1.980894555131954, y: -1.5378353737742998 },
              { x: -1.9073636496951991, y: -1.7602885755021305 },
              { x: -2.0955000000000013, y: -1.8999199999999945 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=a396a72d4bc5451488d3c2f08fc922f7&pn=C2862742",
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: {
          x: -0.0009905999999944015,
          y: 0.002006600000001413,
          z: 0,
        },
      }}
      schPinStyle={{
        CP1: {
          marginTop: 0.2,
        },
        BAT: {
          marginTop: 0.2,
          marginBottom: 0.2,
        },
        VC0: {
          marginBottom: 0.2,
        },
        VSS: {
          marginTop: 0.2,
        },
        SDA: {
          marginTop: 0.2,
        },
        HDQ: {
          marginTop: 0.2,
        },
        CFETOFF: {
          marginTop: 0.2,
        },
        DFETOFF: {
          marginTop: 0.2,
        },
        DSG: {
          marginTop: 0.2,
        },
      }}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [
            "CP1",
            "BAT",
            "VC16",
            "VC15",
            "VC14",
            "VC13",
            "VC12",
            "VC11",
            "VC10",
            "VC9",
            "VC8",
            "VC7",
            "VC6",
            "VC5",
            "VC4",
            "VC3",
            "VC2",
            "VC1",
            "VC0",
            "SRP",
            "NC1",
            "SRN",
            "TS1",
            "TS2",
            "TS3",
            "REG18",
          ],
        },
        rightSide: {
          direction: "top-to-bottom",
          pins: [
            "CHG",
            "DSG",
            "PACK",
            "LD",
            "PCHG",
            "PDSG",
            "FUSE",
            "BREG",
            "REGIN",
            "REG1",
            "REG2",
            "RST_SHUT",
            "DDSG",
            "DCHG",
            "DFETOFF",
            "CFETOFF",
            "HDQ",
            "SDA",
            "SCL",
            "ALERT",
            "VSS",
          ],
        },
      }}
      {...props}
    />
  )
}

const resCapColsOffset = { schX: -5, schY: 0 }
const resCapColSpacing = 2
const resCapCols = [
  ["J1.pin1", "R2", "C4", "U1.VC16"],
  ["J1.pin2", "R3", "C5", "U1.VC15"],
  ["J1.pin3", "R4", "C6", "U1.VC14"],
  ["J1.pin4", "R7", "C7", "U1.VC13"],
  ["J1.pin5", "R8", "C8", "U1.VC12"],
  ["J1.pin6", "R11", "C9", "U1.VC10"],
  ["J3.pin1", "R12", "C10", "U1.VC9"],
  ["J3.pin2", "R13", "C11", "U1.VC8"],
  ["J3.pin3", "R14", "C14", "U1.VC6"],
  ["J3.pin4", "R16", "C16", "U1.VC5"],
  ["J3.pin5", "R17", "C17", "U1.VC4"],
  ["J4.pin1", "R18", "C18", "U1.VC3"],
  ["J4.pin2", "R19", "C19", "U1.VC2"],
  ["J4.pin3", "R21", "C21", "U1.VC1"],
  ["J4.pin4", "R22", "C22", "U1.VC1"],
  // These are different
  // ["J4.pin5", "R23", "...", "..."],
  // ["J4.pin5", "R24", "...", "..."],
]

describe("minimize trace crossing", () => {
  it("minimize trace crossing", async () => {
    const { circuit } = getTestFixture()
    const board = (
      <board routingDisabled schMaxTraceDistance={10}>
        <group pcbPack>
          {resCapCols.map(([j, r, c, u], i) => (
            <>
              <resistor
                name={r}
                schX={resCapColsOffset.schX}
                schY={resCapColsOffset.schY - i * resCapColSpacing}
                resistance="20"
                footprint="0402"
                connections={{
                  pin1: j,
                  pin2: `${c}.pin1`,
                }}
              />
              <capacitor
                name={c}
                schX={resCapColsOffset.schX + 1 + (i % 2 ? 0 : 1)}
                schY={resCapColsOffset.schY - 1 - i * resCapColSpacing}
                capacitance="220nF"
                footprint="0402"
                schOrientation="vertical"
                connections={{
                  pin1: u,
                  pin2: resCapCols[i + 1]
                    ? `${resCapCols[i + 1][2]}.pin1`
                    : undefined,
                }}
              />
            </>
          ))}
          <BQ76952PFBR
            name="U1"
            schX={5}
            connections={{
              VSS: "net.GND",
            }}
          />
        </group>
        <pinheader
          name="J1"
          pinCount={6}
          schX={-9}
          schPinSpacing={0.4}
          schY={-4}
          pcbX={-14}
          pcbY={-15}
          pcbRotation="-90deg"
        />
        <pinheader
          name="J3"
          pinCount={5}
          schX={-9}
          schPinSpacing={0.4}
          schY={-10}
          pcbX={-14}
          pcbY={0}
          pcbRotation="-90deg"
        />
        <pinheader
          name="J4"
          pinCount={6}
          schX={-9}
          schPinSpacing={0.4}
          schY={-16}
          pcbX={-14}
          pcbY={15}
          pcbRotation="-90deg"
        />
      </board>
    )

    circuit.add(board)

    await circuit.render()

    expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  })
})
