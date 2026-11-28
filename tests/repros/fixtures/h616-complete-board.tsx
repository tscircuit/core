import type { ReactElement } from "react"

/** Complete supplied H616 spaced board: 125 components, 760 pads, 121 routable nets.
 * Footprint-local points are in mm, +X right, +Y up. Native pad coordinates and
 * the original DDR timing requirements are preserved; no routed copper is loaded.
 */
export default function H616CompleteBoard(): ReactElement {
  return (
    <board
      title="H616 complete board"
      width={76.1321195159058}
      height={92.5}
      outline={[
        { x: -44.23132034355964, y: -46.25 },
        { x: 31.90079917234616, y: -46.25 },
        { x: 31.90079917234616, y: 46.25 },
        { x: -44.23132034355964, y: 46.25 },
      ]}
      layers={4}
      schematicDisabled={true}
      routeRemaining={false}
      isViaInPadAllowed={false}
      minTraceWidth={0.08}
      minTraceToPadEdgeClearance={0.1}
      minViaEdgeToPadEdgeClearance={0.1}
      minPadEdgeToPadEdgeClearance={0.1}
      minViaPadDiameter={0.35}
      minViaHoleDiameter={0.15}
      autorouter={{ local: true, serverCacheEnabled: false }}
    >
      <chip
        name={"C1"}
        manufacturerPartNumber={"100n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.490000000000009}
        pcbY={5.597499999999997}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C10"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.842500000000001}
        pcbY={17.859999999999985}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C11"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={1.6274999999999977}
        pcbY={11.579999999999998}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C12"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={0.9625000000000057}
        pcbY={10.709999999999994}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C13"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.277500000000003}
        pcbY={18.519999999999996}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C14"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.6200000000000045}
        pcbY={1.0874999999999915}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C15"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={1.509999999999991}
        pcbY={-24.887500000000003}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C16"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={2.289999999999992}
        pcbY={-19.760000000000005}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C17"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-6.670000000000016}
        pcbY={-28.120000000000005}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C18"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-0.36000000000001364}
        pcbY={-16.992500000000007}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C19"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-7.840000000000003}
        pcbY={-28.129999999999995}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C2"}
        manufacturerPartNumber={"100n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-10.060000000000002}
        pcbY={12.579999999999998}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C20"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={1.289999999999992}
        pcbY={-28.202500000000015}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C21"}
        manufacturerPartNumber={"4.7u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={2.282499999999999}
        pcbY={-20.970000000000013}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C22"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={1.8100000000000023}
        pcbY={-17.012500000000003}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C23"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-1.539999999999992}
        pcbY={-16.992500000000007}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C24"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-9}
        pcbY={-28.097499999999997}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C25"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={2.147500000000008}
        pcbY={-23.070000000000007}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C26"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-1.9475000000000193}
        pcbY={-19.220000000000013}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C27"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.402500000000003}
        pcbY={-25.77000000000001}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C28"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-6.760000000000019}
        pcbY={-21.517500000000013}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C29"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.490000000000009}
        pcbY={-24.997500000000002}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C3"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-3.607500000000016}
        pcbY={8.11999999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C30"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.450000000000017}
        pcbY={-20.047500000000014}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C31"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-2.6100000000000136}
        pcbY={-17.022500000000008}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C32"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={0.6899999999999977}
        pcbY={-17.012500000000003}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C33"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.409999999999997}
        pcbY={-27.360000000000014}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C34"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={0.12000000000000455}
        pcbY={-24.627500000000012}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C35"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-7.052500000000009}
        pcbY={-14.41000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C36"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.357500000000016}
        pcbY={-14.38000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C37"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-10.090000000000003}
        pcbY={-20.102500000000006}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C38"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-1.8199999999999932}
        pcbY={-30.9075}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C39"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.117500000000007}
        pcbY={-31.150000000000006}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C4"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.450000000000017}
        pcbY={3.2524999999999977}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C40"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.552499999999981}
        pcbY={8.719999999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C41"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.849999999999994}
        pcbY={13.837499999999991}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C42"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.602499999999992}
        pcbY={9.959999999999994}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C43"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.8700000000000045}
        pcbY={12.647499999999994}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C44"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.707499999999982}
        pcbY={12.509999999999991}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C45"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={3.8899999999999864}
        pcbY={12.647499999999994}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C46"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.632499999999993}
        pcbY={13.58999999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C47"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.212500000000006}
        pcbY={10.989999999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C48"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.652500000000003}
        pcbY={9.139999999999986}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C49"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.66749999999999}
        pcbY={10.129999999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C5"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.237500000000011}
        pcbY={16.879999999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C50"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.66749999999999}
        pcbY={11.33999999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C51"}
        manufacturerPartNumber={"10u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.680000000000007}
        pcbY={31.68249999999999}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C52"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={7.489999999999981}
        pcbY={15.452499999999986}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C53"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.430000000000007}
        pcbY={14.349999999999994}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C54"}
        manufacturerPartNumber={"470n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.319999999999993}
        pcbY={4.262499999999989}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C55"}
        manufacturerPartNumber={"470n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={6.560000000000002}
        pcbY={3.802499999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C56"}
        manufacturerPartNumber={"2.2u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.469999999999999}
        pcbY={1.7874999999999943}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C57"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11}
        pcbY={1.6624999999999943}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C58"}
        manufacturerPartNumber={"100n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.539999999999992}
        pcbY={1.0699999999999932}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C59"}
        manufacturerPartNumber={"18p"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.949999999999989}
        pcbY={6.852499999999992}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C6"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.469999999999999}
        pcbY={12.692499999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C60"}
        manufacturerPartNumber={"18p"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={6.6699999999999875}
        pcbY={6.839999999999989}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C61"}
        manufacturerPartNumber={"100n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.400000000000006}
        pcbY={12.312499999999986}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C62"}
        manufacturerPartNumber={"100n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.639999999999986}
        pcbY={15.427499999999995}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C63"}
        manufacturerPartNumber={"220n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.180000000000007}
        pcbY={10.009999999999991}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C64"}
        manufacturerPartNumber={"1n"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.680000000000007}
        pcbY={0.30749999999999034}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C65"}
        manufacturerPartNumber={"4.7u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-7.1425000000000125}
        pcbY={-12.725000000000009}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5675}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5675}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"C66"}
        manufacturerPartNumber={"47u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.252499999999998}
        pcbY={-35.07000000000002}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={1.5625}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-1.5625}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C67"}
        manufacturerPartNumber={"47u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.247500000000002}
        pcbY={-32.99000000000001}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={1.5625}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-1.5625}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C68"}
        manufacturerPartNumber={"4.7u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={6.6200000000000045}
        pcbY={-9.150000000000006}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"C69"}
        manufacturerPartNumber={"47u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-8.262500000000017}
        pcbY={-33.42500000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={1.5625}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-1.5625}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.325}
              height={1.8}
              cornerRadius={0.25}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"C7"}
        manufacturerPartNumber={"2.2p"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-0.6299999999999955}
        pcbY={9.387499999999989}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C8"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.5}
        pcbY={17.187499999999986}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"C9"}
        manufacturerPartNumber={"1u"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.5}
        pcbY={14.952499999999986}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5675}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5675}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.735}
              height={0.62}
              cornerRadius={0.155}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"D1"}
        manufacturerPartNumber={"LED"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={18.24638374460887}
        pcbY={25.170980225850624}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.875}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.05}
              height={0.95}
              cornerRadius={0.2375}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.875}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.05}
              height={0.95}
              cornerRadius={0.2375}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"D2"}
        manufacturerPartNumber={"LED"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={18.266383744608873}
        pcbY={19.004999999999995}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.875}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.05}
              height={0.95}
              cornerRadius={0.2375}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.875}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.05}
              height={0.95}
              cornerRadius={0.2375}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"D3"}
        manufacturerPartNumber={"SP0502BAHT"}
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
        }}
        pcbX={9.017499999999984}
        pcbY={-24.13000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.9375}
              pcbY={0.95}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.475}
              height={0.6}
              cornerRadius={0.15}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.9375}
              pcbY={-0.95}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.475}
              height={0.6}
              cornerRadius={0.15}
              ccwRotation={0}
            />
            <smtpad
              name={"pad2"}
              pcbX={0.9375}
              pcbY={0}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.475}
              height={0.6}
              cornerRadius={0.15}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"D4"}
        manufacturerPartNumber={"D_Schottky"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-10.150000000000006}
        pcbY={-14.300000000000011}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={1.25}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={1}
              cornerRadius={0.25}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-1.25}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={1}
              cornerRadius={0.25}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"J1"}
        manufacturerPartNumber={"Micro_SD_Card_Det2"}
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
          pin4: ["NATIVE_4"],
          pin5: ["NATIVE_5"],
          pin6: ["NATIVE_6"],
          pin7: ["NATIVE_7"],
          pin8: ["NATIVE_8"],
          pin9: ["NATIVE_9"],
          pin10: ["NATIVE_10"],
          pin11: ["NATIVE_11"],
        }}
        pcbX={2.1999999999999886}
        pcbY={27.75999999999999}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={7.725}
              pcbY={-2.775}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={7.725}
              pcbY={-1.675}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad2"}
              pcbX={7.725}
              pcbY={-0.575}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad3"}
              pcbX={7.725}
              pcbY={0.525}
              portHints={["pin4"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad4"}
              pcbX={7.725}
              pcbY={1.625}
              portHints={["pin5"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad5"}
              pcbX={7.725}
              pcbY={2.725}
              portHints={["pin6"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad6"}
              pcbX={7.725}
              pcbY={3.825}
              portHints={["pin7"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad7"}
              pcbX={7.725}
              pcbY={4.925}
              portHints={["pin8"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad8"}
              pcbX={7.725}
              pcbY={5.875}
              portHints={["pin9"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.7}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad9"}
              pcbX={-2.775}
              pcbY={6.825}
              portHints={["pin10"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={0.8}
              ccwRotation={270}
            />
            <smtpad
              name={"pad10"}
              pcbX={3.425}
              pcbY={6.825}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad11"}
              pcbX={-6.925}
              pcbY={6.825}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={2.8}
              ccwRotation={270}
            />
            <smtpad
              name={"pad12"}
              pcbX={7.725}
              pcbY={-4.325}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1}
              height={1.2}
              ccwRotation={270}
            />
            <smtpad
              name={"pad13"}
              pcbX={-7.375}
              pcbY={-6.675}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={1.3}
              height={1.9}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        noConnect={["pin6", "pin14"]}
        name={"J2"}
        manufacturerPartNumber={"USB_C_Receptacle_USB2.0"}
        pinLabels={{
          pin1: ["NATIVE_A1"],
          pin2: ["NATIVE_A4"],
          pin3: ["NATIVE_A5"],
          pin4: ["NATIVE_A6"],
          pin5: ["NATIVE_A7"],
          pin6: ["NATIVE_A8"],
          pin7: ["NATIVE_A9"],
          pin8: ["NATIVE_A12"],
          pin9: ["NATIVE_B1"],
          pin10: ["NATIVE_B4"],
          pin11: ["NATIVE_B5"],
          pin12: ["NATIVE_B6"],
          pin13: ["NATIVE_B7"],
          pin14: ["NATIVE_B8"],
          pin15: ["NATIVE_B9"],
          pin16: ["NATIVE_B12"],
          pin17: ["NATIVE_S1"],
        }}
        pcbX={7.939999999999998}
        pcbY={-32.18000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <hole
              name={"pad0"}
              pcbX={-2.89}
              pcbY={1.45}
              shape={"circle"}
              diameter={0.6}
            />
            <hole
              name={"pad1"}
              pcbX={2.89}
              pcbY={1.45}
              shape={"circle"}
              diameter={0.6}
            />
            <smtpad
              name={"pad2"}
              pcbX={-3.2}
              pcbY={2.51}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad3"}
              pcbX={-2.4}
              pcbY={2.51}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad4"}
              pcbX={-1.25}
              pcbY={2.51}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad5"}
              pcbX={-0.25}
              pcbY={2.51}
              portHints={["pin4"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad6"}
              pcbX={0.25}
              pcbY={2.51}
              portHints={["pin5"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad7"}
              pcbX={1.25}
              pcbY={2.51}
              portHints={["pin6"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad8"}
              pcbX={2.4}
              pcbY={2.51}
              portHints={["pin7"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad9"}
              pcbX={3.2}
              pcbY={2.51}
              portHints={["pin8"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad10"}
              pcbX={3.2}
              pcbY={2.51}
              portHints={["pin9"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad11"}
              pcbX={2.4}
              pcbY={2.51}
              portHints={["pin10"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad12"}
              pcbX={1.75}
              pcbY={2.51}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad13"}
              pcbX={0.75}
              pcbY={2.51}
              portHints={["pin12"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad14"}
              pcbX={-0.75}
              pcbY={2.51}
              portHints={["pin13"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad15"}
              pcbX={-1.75}
              pcbY={2.51}
              portHints={["pin14"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad16"}
              pcbX={-2.4}
              pcbY={2.51}
              portHints={["pin15"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad17"}
              pcbX={-3.2}
              pcbY={2.51}
              portHints={["pin16"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={0}
            />
            <platedhole
              name={"pad18"}
              pcbX={-4.32}
              pcbY={1.93}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={2}
              outerHeight={0.9}
              holeWidth={1.7}
              holeHeight={0.6}
              pcbRotation={90}
            />
            <platedhole
              name={"pad19"}
              pcbX={-4.32}
              pcbY={-2.24}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={1.7}
              outerHeight={0.9}
              holeWidth={1.4}
              holeHeight={0.6}
              pcbRotation={90}
            />
            <platedhole
              name={"pad20"}
              pcbX={4.32}
              pcbY={1.93}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={2}
              outerHeight={0.9}
              holeWidth={1.7}
              holeHeight={0.6}
              pcbRotation={90}
            />
            <platedhole
              name={"pad21"}
              pcbX={4.32}
              pcbY={-2.24}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={1.7}
              outerHeight={0.9}
              holeWidth={1.4}
              holeHeight={0.6}
              pcbRotation={90}
            />
          </footprint>
        }
      />
      <chip
        noConnect={["pin6", "pin14"]}
        name={"J3"}
        manufacturerPartNumber={"USB_C_Receptacle_USB2.0"}
        pinLabels={{
          pin1: ["NATIVE_A1"],
          pin2: ["NATIVE_A4"],
          pin3: ["NATIVE_A5"],
          pin4: ["NATIVE_A6"],
          pin5: ["NATIVE_A7"],
          pin6: ["NATIVE_A8"],
          pin7: ["NATIVE_A9"],
          pin8: ["NATIVE_A12"],
          pin9: ["NATIVE_B1"],
          pin10: ["NATIVE_B4"],
          pin11: ["NATIVE_B5"],
          pin12: ["NATIVE_B6"],
          pin13: ["NATIVE_B7"],
          pin14: ["NATIVE_B8"],
          pin15: ["NATIVE_B9"],
          pin16: ["NATIVE_B12"],
          pin17: ["NATIVE_S1"],
        }}
        pcbX={-8.900000000000006}
        pcbY={-6.3700000000000045}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <hole
              name={"pad0"}
              pcbX={1.45}
              pcbY={2.89}
              shape={"circle"}
              diameter={0.6}
            />
            <hole
              name={"pad1"}
              pcbX={1.45}
              pcbY={-2.89}
              shape={"circle"}
              diameter={0.6}
            />
            <smtpad
              name={"pad2"}
              pcbX={2.51}
              pcbY={3.2}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad3"}
              pcbX={2.51}
              pcbY={2.4}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad4"}
              pcbX={2.51}
              pcbY={1.25}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad5"}
              pcbX={2.51}
              pcbY={0.25}
              portHints={["pin4"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad6"}
              pcbX={2.51}
              pcbY={-0.25}
              portHints={["pin5"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad7"}
              pcbX={2.51}
              pcbY={-1.25}
              portHints={["pin6"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad8"}
              pcbX={2.51}
              pcbY={-2.4}
              portHints={["pin7"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad9"}
              pcbX={2.51}
              pcbY={-3.2}
              portHints={["pin8"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad10"}
              pcbX={2.51}
              pcbY={-3.2}
              portHints={["pin9"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad11"}
              pcbX={2.51}
              pcbY={-2.4}
              portHints={["pin10"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad12"}
              pcbX={2.51}
              pcbY={-1.75}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad13"}
              pcbX={2.51}
              pcbY={-0.75}
              portHints={["pin12"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad14"}
              pcbX={2.51}
              pcbY={0.75}
              portHints={["pin13"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad15"}
              pcbX={2.51}
              pcbY={1.75}
              portHints={["pin14"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.3}
              height={1.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad16"}
              pcbX={2.51}
              pcbY={2.4}
              portHints={["pin15"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad17"}
              pcbX={2.51}
              pcbY={3.2}
              portHints={["pin16"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.6}
              height={1.16}
              ccwRotation={270}
            />
            <platedhole
              name={"pad18"}
              pcbX={1.93}
              pcbY={4.32}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={2}
              outerHeight={0.9}
              holeWidth={1.7}
              holeHeight={0.6}
              pcbRotation={0}
            />
            <platedhole
              name={"pad19"}
              pcbX={-2.24}
              pcbY={4.32}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={1.7}
              outerHeight={0.9}
              holeWidth={1.4}
              holeHeight={0.6}
              pcbRotation={0}
            />
            <platedhole
              name={"pad20"}
              pcbX={1.93}
              pcbY={-4.32}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={2}
              outerHeight={0.9}
              holeWidth={1.7}
              holeHeight={0.6}
              pcbRotation={0}
            />
            <platedhole
              name={"pad21"}
              pcbX={-2.24}
              pcbY={-4.32}
              portHints={["pin17"]}
              shape={"pill"}
              outerWidth={1.7}
              outerHeight={0.9}
              holeWidth={1.4}
              holeHeight={0.6}
              pcbRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"L1"}
        manufacturerPartNumber={"1,5uH"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-7.560000000000002}
        pcbY={-16.745000000000005}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.825}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.825}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"L2"}
        manufacturerPartNumber={"1,5uH"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.659999999999997}
        pcbY={-16.655}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.825}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.825}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"L3"}
        manufacturerPartNumber={"1,5uH"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-9.314999999999998}
        pcbY={-22.540000000000006}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.825}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.825}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"L4"}
        manufacturerPartNumber={"1,5uH"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.125}
        pcbY={-29.340000000000003}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.825}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.825}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"L5"}
        manufacturerPartNumber={"1,5uH"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-0.9350000000000023}
        pcbY={-28.420000000000016}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.825}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.825}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.85}
              height={2}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R1"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.469999999999999}
        pcbY={8.107499999999987}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R10"}
        manufacturerPartNumber={"1R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.710000000000008}
        pcbY={29.29249999999999}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R11"}
        manufacturerPartNumber={"33R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={7.66749999999999}
        pcbY={29.439999999999998}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R12"}
        manufacturerPartNumber={"10k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.069999999999993}
        pcbY={27.757499999999993}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R13"}
        manufacturerPartNumber={"10k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.73999999999998}
        pcbY={34.33}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R14"}
        manufacturerPartNumber={"1k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.862499999999983}
        pcbY={17.279999999999987}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R15"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={16.836383744608874}
        pcbY={25.073480225850627}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R16"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={16.836383744608867}
        pcbY={18.88749999999999}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R17"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.702499999999986}
        pcbY={4.61999999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R18"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={8.6875}
        pcbY={3.559999999999988}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R19"}
        manufacturerPartNumber={"150k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={3.7224999999999966}
        pcbY={6.179999999999993}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R2"}
        manufacturerPartNumber={"2k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-11.480000000000018}
        pcbY={10.422499999999985}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R20"}
        manufacturerPartNumber={"10k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.689999999999998}
        pcbY={-3.4825000000000017}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R21"}
        manufacturerPartNumber={"5.1k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.347499999999997}
        pcbY={-27.75}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"R22"}
        manufacturerPartNumber={"5.1k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={10.837500000000006}
        pcbY={-27.72}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R23"}
        manufacturerPartNumber={"22k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.1200000000000045}
        pcbY={-4.5575000000000045}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R24"}
        manufacturerPartNumber={"22k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-4.090000000000003}
        pcbY={-8.687500000000014}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R25"}
        manufacturerPartNumber={"10k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.5625}
        pcbY={-12.050000000000011}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <chip
        name={"R26"}
        manufacturerPartNumber={"10k"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={11.710000000000008}
        pcbY={15.852499999999992}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R3"}
        manufacturerPartNumber={"240R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={3.549999999999983}
        pcbY={8.127499999999998}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={270}
            />
          </footprint>
        }
      />
      <chip
        name={"R4"}
        manufacturerPartNumber={"100R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-6.112500000000011}
        pcbY={11.439999999999998}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R5"}
        manufacturerPartNumber={"240R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-6.247500000000002}
        pcbY={8.009999999999991}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"R6"}
        manufacturerPartNumber={"240R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={-6.909999999999997}
        pcbY={9.80749999999999}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R7"}
        manufacturerPartNumber={"0R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={5.719999999999999}
        pcbY={-20.872500000000002}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R8"}
        manufacturerPartNumber={"NC"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={4.549999999999983}
        pcbY={-20.902500000000003}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0}
              pcbY={-0.5975}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
            <smtpad
              name={"pad1"}
              pcbX={0}
              pcbY={0.5975}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"R9"}
        manufacturerPartNumber={"0R"}
        pinLabels={{ pin1: ["NATIVE_1"], pin2: ["NATIVE_2"] }}
        pcbX={3.797499999999985}
        pcbY={-26.41000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={0.5975}
              pcbY={0}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
            <smtpad
              name={"pad1"}
              pcbX={-0.5975}
              pcbY={0}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.715}
              height={0.64}
              cornerRadius={0.16}
              ccwRotation={180}
            />
          </footprint>
        }
      />
      <chip
        name={"TP1"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={4.799999999999983}
        pcbY={-18.610000000000014}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP10"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={-23.334213562373108}
        pcbY={-10.420000000000002}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP11"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={17.06369239115962}
        pcbY={32.60107711996249}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP12"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={17.0836923911596}
        pcbY={30.46107711996249}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP13"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={17.29369239115961}
        pcbY={34.731077119962485}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP2"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={-15.964213562373104}
        pcbY={-16.80000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP3"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={-23.294213562373088}
        pcbY={-5.570000000000007}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP4"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={-33.524213562373106}
        pcbY={-0.09000000000000341}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP5"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={21.193692391159598}
        pcbY={-12.970000000000013}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP6"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={21.143692391159615}
        pcbY={-15.260000000000005}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP7"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={17.063692391159602}
        pcbY={-3.940000000000012}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP8"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={-30.974213562373095}
        pcbY={-31.25}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        name={"TP9"}
        manufacturerPartNumber={"TestPoint"}
        pinLabels={{ pin1: ["NATIVE_1"] }}
        pcbX={20.103692391159623}
        pcbY={-20.91000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <platedhole
              name={"pad0"}
              pcbX={0}
              pcbY={0}
              portHints={["pin1"]}
              shape={"circle"}
              outerDiameter={1}
              holeDiameter={0.5}
            />
          </footprint>
        }
      />
      <chip
        noConnect={[
          "pin100",
          "pin118",
          "pin74",
          "pin101",
          "pin58",
          "pin120",
          "pin152",
          "pin153",
          "pin169",
          "pin59",
          "pin76",
          "pin99",
          "pin75",
          "pin168",
          "pin2",
          "pin3",
          "pin4",
          "pin5",
          "pin7",
          "pin8",
          "pin11",
          "pin12",
          "pin14",
          "pin15",
          "pin16",
          "pin17",
          "pin18",
          "pin20",
          "pin21",
          "pin22",
          "pin23",
          "pin25",
          "pin26",
          "pin27",
          "pin28",
          "pin30",
          "pin32",
          "pin33",
          "pin34",
          "pin35",
          "pin36",
          "pin37",
          "pin38",
          "pin39",
          "pin40",
          "pin41",
          "pin42",
          "pin43",
          "pin44",
          "pin45",
          "pin47",
          "pin48",
          "pin49",
          "pin50",
          "pin53",
          "pin54",
          "pin65",
          "pin70",
          "pin71",
          "pin73",
          "pin78",
          "pin79",
          "pin80",
          "pin81",
          "pin82",
          "pin83",
          "pin94",
          "pin95",
          "pin96",
          "pin110",
          "pin111",
          "pin112",
          "pin113",
          "pin114",
          "pin115",
          "pin116",
          "pin117",
          "pin119",
          "pin148",
          "pin154",
          "pin164",
          "pin165",
          "pin170",
          "pin179",
          "pin180",
          "pin181",
          "pin187",
          "pin188",
          "pin194",
          "pin196",
          "pin211",
          "pin212",
          "pin213",
          "pin214",
          "pin227",
          "pin228",
          "pin238",
          "pin239",
          "pin240",
          "pin242",
          "pin244",
          "pin245",
          "pin257",
          "pin259",
          "pin260",
          "pin261",
          "pin262",
          "pin263",
          "pin277",
          "pin278",
        ]}
        name={"U1"}
        manufacturerPartNumber={"H616"}
        pinLabels={{
          pin1: ["NATIVE_A1"],
          pin2: ["NATIVE_A2"],
          pin3: ["NATIVE_A4"],
          pin4: ["NATIVE_A6"],
          pin5: ["NATIVE_A8"],
          pin6: ["NATIVE_A10"],
          pin7: ["NATIVE_A12"],
          pin8: ["NATIVE_A14"],
          pin9: ["NATIVE_A16"],
          pin10: ["NATIVE_A18"],
          pin11: ["NATIVE_A19"],
          pin12: ["NATIVE_A20"],
          pin13: ["NATIVE_A21"],
          pin14: ["NATIVE_B1"],
          pin15: ["NATIVE_B2"],
          pin16: ["NATIVE_B3"],
          pin17: ["NATIVE_B4"],
          pin18: ["NATIVE_B5"],
          pin19: ["NATIVE_B6"],
          pin20: ["NATIVE_B7"],
          pin21: ["NATIVE_B8"],
          pin22: ["NATIVE_B9"],
          pin23: ["NATIVE_B10"],
          pin24: ["NATIVE_B11"],
          pin25: ["NATIVE_B12"],
          pin26: ["NATIVE_B13"],
          pin27: ["NATIVE_B14"],
          pin28: ["NATIVE_B15"],
          pin29: ["NATIVE_B16"],
          pin30: ["NATIVE_B17"],
          pin31: ["NATIVE_B18"],
          pin32: ["NATIVE_B19"],
          pin33: ["NATIVE_B20"],
          pin34: ["NATIVE_B21"],
          pin35: ["NATIVE_C1"],
          pin36: ["NATIVE_C2"],
          pin37: ["NATIVE_C3"],
          pin38: ["NATIVE_C4"],
          pin39: ["NATIVE_C5"],
          pin40: ["NATIVE_C6"],
          pin41: ["NATIVE_C7"],
          pin42: ["NATIVE_C8"],
          pin43: ["NATIVE_C9"],
          pin44: ["NATIVE_C10"],
          pin45: ["NATIVE_C11"],
          pin46: ["NATIVE_C12"],
          pin47: ["NATIVE_C13"],
          pin48: ["NATIVE_C14"],
          pin49: ["NATIVE_C15"],
          pin50: ["NATIVE_C16"],
          pin51: ["NATIVE_C17"],
          pin52: ["NATIVE_C18"],
          pin53: ["NATIVE_C19"],
          pin54: ["NATIVE_C20"],
          pin55: ["NATIVE_D1"],
          pin56: ["NATIVE_D2"],
          pin57: ["NATIVE_D3"],
          pin58: ["NATIVE_D4"],
          pin59: ["NATIVE_D5"],
          pin60: ["NATIVE_D7"],
          pin61: ["NATIVE_D10"],
          pin62: ["NATIVE_D11"],
          pin63: ["NATIVE_D12"],
          pin64: ["NATIVE_D13"],
          pin65: ["NATIVE_D14"],
          pin66: ["NATIVE_D15"],
          pin67: ["NATIVE_D16"],
          pin68: ["NATIVE_D18"],
          pin69: ["NATIVE_D19"],
          pin70: ["NATIVE_D20"],
          pin71: ["NATIVE_D21"],
          pin72: ["NATIVE_E2"],
          pin73: ["NATIVE_E3"],
          pin74: ["NATIVE_E4"],
          pin75: ["NATIVE_E5"],
          pin76: ["NATIVE_E6"],
          pin77: ["NATIVE_E18"],
          pin78: ["NATIVE_E19"],
          pin79: ["NATIVE_E20"],
          pin80: ["NATIVE_F1"],
          pin81: ["NATIVE_F2"],
          pin82: ["NATIVE_F3"],
          pin83: ["NATIVE_F4"],
          pin84: ["NATIVE_F5"],
          pin85: ["NATIVE_F8"],
          pin86: ["NATIVE_F9"],
          pin87: ["NATIVE_F10"],
          pin88: ["NATIVE_F11"],
          pin89: ["NATIVE_F12"],
          pin90: ["NATIVE_F13"],
          pin91: ["NATIVE_F14"],
          pin92: ["NATIVE_F15"],
          pin93: ["NATIVE_F18"],
          pin94: ["NATIVE_F19"],
          pin95: ["NATIVE_F20"],
          pin96: ["NATIVE_F21"],
          pin97: ["NATIVE_G2"],
          pin98: ["NATIVE_G3"],
          pin99: ["NATIVE_G4"],
          pin100: ["NATIVE_G5"],
          pin101: ["NATIVE_G6"],
          pin102: ["NATIVE_G8"],
          pin103: ["NATIVE_G9"],
          pin104: ["NATIVE_G10"],
          pin105: ["NATIVE_G11"],
          pin106: ["NATIVE_G12"],
          pin107: ["NATIVE_G13"],
          pin108: ["NATIVE_G14"],
          pin109: ["NATIVE_G15"],
          pin110: ["NATIVE_G17"],
          pin111: ["NATIVE_G18"],
          pin112: ["NATIVE_G19"],
          pin113: ["NATIVE_G20"],
          pin114: ["NATIVE_G21"],
          pin115: ["NATIVE_H1"],
          pin116: ["NATIVE_H2"],
          pin117: ["NATIVE_H3"],
          pin118: ["NATIVE_H4"],
          pin119: ["NATIVE_H5"],
          pin120: ["NATIVE_H6"],
          pin121: ["NATIVE_H8"],
          pin122: ["NATIVE_H9"],
          pin123: ["NATIVE_H10"],
          pin124: ["NATIVE_H11"],
          pin125: ["NATIVE_H12"],
          pin126: ["NATIVE_H13"],
          pin127: ["NATIVE_H14"],
          pin128: ["NATIVE_H15"],
          pin129: ["NATIVE_H17"],
          pin130: ["NATIVE_H18"],
          pin131: ["NATIVE_H19"],
          pin132: ["NATIVE_H20"],
          pin133: ["NATIVE_J2"],
          pin134: ["NATIVE_J3"],
          pin135: ["NATIVE_J6"],
          pin136: ["NATIVE_J8"],
          pin137: ["NATIVE_J9"],
          pin138: ["NATIVE_J10"],
          pin139: ["NATIVE_J11"],
          pin140: ["NATIVE_J12"],
          pin141: ["NATIVE_J13"],
          pin142: ["NATIVE_J14"],
          pin143: ["NATIVE_J15"],
          pin144: ["NATIVE_J17"],
          pin145: ["NATIVE_J18"],
          pin146: ["NATIVE_J19"],
          pin147: ["NATIVE_J20"],
          pin148: ["NATIVE_J21"],
          pin149: ["NATIVE_K1"],
          pin150: ["NATIVE_K2"],
          pin151: ["NATIVE_K3"],
          pin152: ["NATIVE_K4"],
          pin153: ["NATIVE_K5"],
          pin154: ["NATIVE_K6"],
          pin155: ["NATIVE_K8"],
          pin156: ["NATIVE_K9"],
          pin157: ["NATIVE_K10"],
          pin158: ["NATIVE_K11"],
          pin159: ["NATIVE_K12"],
          pin160: ["NATIVE_K13"],
          pin161: ["NATIVE_K14"],
          pin162: ["NATIVE_K15"],
          pin163: ["NATIVE_K18"],
          pin164: ["NATIVE_K19"],
          pin165: ["NATIVE_K20"],
          pin166: ["NATIVE_L2"],
          pin167: ["NATIVE_L3"],
          pin168: ["NATIVE_L4"],
          pin169: ["NATIVE_L5"],
          pin170: ["NATIVE_L6"],
          pin171: ["NATIVE_L8"],
          pin172: ["NATIVE_L9"],
          pin173: ["NATIVE_L10"],
          pin174: ["NATIVE_L11"],
          pin175: ["NATIVE_L12"],
          pin176: ["NATIVE_L13"],
          pin177: ["NATIVE_L14"],
          pin178: ["NATIVE_L15"],
          pin179: ["NATIVE_L18"],
          pin180: ["NATIVE_L19"],
          pin181: ["NATIVE_L20"],
          pin182: ["NATIVE_L21"],
          pin183: ["NATIVE_M1"],
          pin184: ["NATIVE_M2"],
          pin185: ["NATIVE_M3"],
          pin186: ["NATIVE_M18"],
          pin187: ["NATIVE_M19"],
          pin188: ["NATIVE_M20"],
          pin189: ["NATIVE_N2"],
          pin190: ["NATIVE_N3"],
          pin191: ["NATIVE_N4"],
          pin192: ["NATIVE_N5"],
          pin193: ["NATIVE_N6"],
          pin194: ["NATIVE_N7"],
          pin195: ["NATIVE_N9"],
          pin196: ["NATIVE_N10"],
          pin197: ["NATIVE_N12"],
          pin198: ["NATIVE_N13"],
          pin199: ["NATIVE_N15"],
          pin200: ["NATIVE_N16"],
          pin201: ["NATIVE_N18"],
          pin202: ["NATIVE_N19"],
          pin203: ["NATIVE_N20"],
          pin204: ["NATIVE_N21"],
          pin205: ["NATIVE_P1"],
          pin206: ["NATIVE_P2"],
          pin207: ["NATIVE_P3"],
          pin208: ["NATIVE_P4"],
          pin209: ["NATIVE_P5"],
          pin210: ["NATIVE_P6"],
          pin211: ["NATIVE_P7"],
          pin212: ["NATIVE_P9"],
          pin213: ["NATIVE_P10"],
          pin214: ["NATIVE_P12"],
          pin215: ["NATIVE_P13"],
          pin216: ["NATIVE_P15"],
          pin217: ["NATIVE_P16"],
          pin218: ["NATIVE_P18"],
          pin219: ["NATIVE_P20"],
          pin220: ["NATIVE_P21"],
          pin221: ["NATIVE_R1"],
          pin222: ["NATIVE_R2"],
          pin223: ["NATIVE_R3"],
          pin224: ["NATIVE_R4"],
          pin225: ["NATIVE_R5"],
          pin226: ["NATIVE_R6"],
          pin227: ["NATIVE_R9"],
          pin228: ["NATIVE_R12"],
          pin229: ["NATIVE_R15"],
          pin230: ["NATIVE_R18"],
          pin231: ["NATIVE_R19"],
          pin232: ["NATIVE_R20"],
          pin233: ["NATIVE_R21"],
          pin234: ["NATIVE_T1"],
          pin235: ["NATIVE_T2"],
          pin236: ["NATIVE_T3"],
          pin237: ["NATIVE_T4"],
          pin238: ["NATIVE_T5"],
          pin239: ["NATIVE_T6"],
          pin240: ["NATIVE_T7"],
          pin241: ["NATIVE_T8"],
          pin242: ["NATIVE_T9"],
          pin243: ["NATIVE_T10"],
          pin244: ["NATIVE_T11"],
          pin245: ["NATIVE_T12"],
          pin246: ["NATIVE_T14"],
          pin247: ["NATIVE_T15"],
          pin248: ["NATIVE_T16"],
          pin249: ["NATIVE_T17"],
          pin250: ["NATIVE_T18"],
          pin251: ["NATIVE_T20"],
          pin252: ["NATIVE_T21"],
          pin253: ["NATIVE_U1"],
          pin254: ["NATIVE_U2"],
          pin255: ["NATIVE_U3"],
          pin256: ["NATIVE_U4"],
          pin257: ["NATIVE_U5"],
          pin258: ["NATIVE_U6"],
          pin259: ["NATIVE_U8"],
          pin260: ["NATIVE_U9"],
          pin261: ["NATIVE_U10"],
          pin262: ["NATIVE_U11"],
          pin263: ["NATIVE_U12"],
          pin264: ["NATIVE_U13"],
          pin265: ["NATIVE_U14"],
          pin266: ["NATIVE_U15"],
          pin267: ["NATIVE_U16"],
          pin268: ["NATIVE_U17"],
          pin269: ["NATIVE_U18"],
          pin270: ["NATIVE_U19"],
          pin271: ["NATIVE_U20"],
          pin272: ["NATIVE_U21"],
          pin273: ["NATIVE_V1"],
          pin274: ["NATIVE_V2"],
          pin275: ["NATIVE_V3"],
          pin276: ["NATIVE_V5"],
          pin277: ["NATIVE_V8"],
          pin278: ["NATIVE_V10"],
          pin279: ["NATIVE_V12"],
          pin280: ["NATIVE_V15"],
          pin281: ["NATIVE_V17"],
          pin282: ["NATIVE_V19"],
          pin283: ["NATIVE_V20"],
          pin284: ["NATIVE_V21"],
        }}
        pcbX={4.939999999999998}
        pcbY={10.174999999999997}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={5.5}
              pcbY={6.525}
              portHints={["pin1"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad1"}
              pcbX={5.5}
              pcbY={5.875}
              portHints={["pin2"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad2"}
              pcbX={5.5}
              pcbY={4.575}
              portHints={["pin3"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad3"}
              pcbX={5.5}
              pcbY={3.275}
              portHints={["pin4"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad4"}
              pcbX={5.5}
              pcbY={1.975}
              portHints={["pin5"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad5"}
              pcbX={5.5}
              pcbY={0.675}
              portHints={["pin6"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad6"}
              pcbX={5.5}
              pcbY={-0.625}
              portHints={["pin7"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad7"}
              pcbX={5.5}
              pcbY={-1.925}
              portHints={["pin8"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad8"}
              pcbX={5.5}
              pcbY={-3.225}
              portHints={["pin9"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad9"}
              pcbX={5.5}
              pcbY={-4.525}
              portHints={["pin10"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad10"}
              pcbX={5.5}
              pcbY={-5.175}
              portHints={["pin11"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad11"}
              pcbX={5.5}
              pcbY={-5.825}
              portHints={["pin12"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad12"}
              pcbX={5.5}
              pcbY={-6.475}
              portHints={["pin13"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad13"}
              pcbX={4.85}
              pcbY={6.525}
              portHints={["pin14"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad14"}
              pcbX={4.85}
              pcbY={5.875}
              portHints={["pin15"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad15"}
              pcbX={4.85}
              pcbY={5.225}
              portHints={["pin16"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad16"}
              pcbX={4.85}
              pcbY={4.575}
              portHints={["pin17"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad17"}
              pcbX={4.85}
              pcbY={3.925}
              portHints={["pin18"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad18"}
              pcbX={4.85}
              pcbY={3.275}
              portHints={["pin19"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad19"}
              pcbX={4.85}
              pcbY={2.625}
              portHints={["pin20"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad20"}
              pcbX={4.85}
              pcbY={1.975}
              portHints={["pin21"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad21"}
              pcbX={4.85}
              pcbY={1.325}
              portHints={["pin22"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad22"}
              pcbX={4.85}
              pcbY={0.675}
              portHints={["pin23"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad23"}
              pcbX={4.85}
              pcbY={0.025}
              portHints={["pin24"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad24"}
              pcbX={4.85}
              pcbY={-0.625}
              portHints={["pin25"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad25"}
              pcbX={4.85}
              pcbY={-1.275}
              portHints={["pin26"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad26"}
              pcbX={4.85}
              pcbY={-1.925}
              portHints={["pin27"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad27"}
              pcbX={4.85}
              pcbY={-2.575}
              portHints={["pin28"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad28"}
              pcbX={4.85}
              pcbY={-3.225}
              portHints={["pin29"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad29"}
              pcbX={4.85}
              pcbY={-3.875}
              portHints={["pin30"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad30"}
              pcbX={4.85}
              pcbY={-4.525}
              portHints={["pin31"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad31"}
              pcbX={4.85}
              pcbY={-5.175}
              portHints={["pin32"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad32"}
              pcbX={4.85}
              pcbY={-5.825}
              portHints={["pin33"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad33"}
              pcbX={4.85}
              pcbY={-6.475}
              portHints={["pin34"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad34"}
              pcbX={4.2}
              pcbY={6.525}
              portHints={["pin35"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad35"}
              pcbX={4.2}
              pcbY={5.875}
              portHints={["pin36"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad36"}
              pcbX={4.2}
              pcbY={5.225}
              portHints={["pin37"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad37"}
              pcbX={4.2}
              pcbY={4.575}
              portHints={["pin38"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad38"}
              pcbX={4.2}
              pcbY={3.925}
              portHints={["pin39"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad39"}
              pcbX={4.2}
              pcbY={3.275}
              portHints={["pin40"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad40"}
              pcbX={4.2}
              pcbY={2.625}
              portHints={["pin41"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad41"}
              pcbX={4.2}
              pcbY={1.975}
              portHints={["pin42"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad42"}
              pcbX={4.2}
              pcbY={1.325}
              portHints={["pin43"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad43"}
              pcbX={4.2}
              pcbY={0.675}
              portHints={["pin44"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad44"}
              pcbX={4.2}
              pcbY={0.025}
              portHints={["pin45"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad45"}
              pcbX={4.2}
              pcbY={-0.625}
              portHints={["pin46"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad46"}
              pcbX={4.2}
              pcbY={-1.275}
              portHints={["pin47"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad47"}
              pcbX={4.2}
              pcbY={-1.925}
              portHints={["pin48"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad48"}
              pcbX={4.2}
              pcbY={-2.575}
              portHints={["pin49"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad49"}
              pcbX={4.2}
              pcbY={-3.225}
              portHints={["pin50"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad50"}
              pcbX={4.2}
              pcbY={-3.875}
              portHints={["pin51"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad51"}
              pcbX={4.2}
              pcbY={-4.525}
              portHints={["pin52"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad52"}
              pcbX={4.2}
              pcbY={-5.175}
              portHints={["pin53"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad53"}
              pcbX={4.2}
              pcbY={-5.825}
              portHints={["pin54"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad54"}
              pcbX={3.55}
              pcbY={6.525}
              portHints={["pin55"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad55"}
              pcbX={3.55}
              pcbY={5.875}
              portHints={["pin56"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad56"}
              pcbX={3.55}
              pcbY={5.225}
              portHints={["pin57"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad57"}
              pcbX={3.55}
              pcbY={4.575}
              portHints={["pin58"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad58"}
              pcbX={3.55}
              pcbY={3.925}
              portHints={["pin59"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad59"}
              pcbX={3.55}
              pcbY={2.625}
              portHints={["pin60"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad60"}
              pcbX={3.55}
              pcbY={0.675}
              portHints={["pin61"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad61"}
              pcbX={3.55}
              pcbY={0.025}
              portHints={["pin62"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad62"}
              pcbX={3.55}
              pcbY={-0.625}
              portHints={["pin63"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad63"}
              pcbX={3.55}
              pcbY={-1.275}
              portHints={["pin64"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad64"}
              pcbX={3.55}
              pcbY={-1.925}
              portHints={["pin65"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad65"}
              pcbX={3.55}
              pcbY={-2.575}
              portHints={["pin66"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad66"}
              pcbX={3.55}
              pcbY={-3.225}
              portHints={["pin67"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad67"}
              pcbX={3.55}
              pcbY={-4.525}
              portHints={["pin68"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad68"}
              pcbX={3.55}
              pcbY={-5.175}
              portHints={["pin69"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad69"}
              pcbX={3.55}
              pcbY={-5.825}
              portHints={["pin70"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad70"}
              pcbX={3.55}
              pcbY={-6.475}
              portHints={["pin71"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad71"}
              pcbX={2.9}
              pcbY={5.875}
              portHints={["pin72"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad72"}
              pcbX={2.9}
              pcbY={5.225}
              portHints={["pin73"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad73"}
              pcbX={2.9}
              pcbY={4.575}
              portHints={["pin74"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad74"}
              pcbX={2.9}
              pcbY={3.925}
              portHints={["pin75"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad75"}
              pcbX={2.9}
              pcbY={3.275}
              portHints={["pin76"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad76"}
              pcbX={2.9}
              pcbY={-4.525}
              portHints={["pin77"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad77"}
              pcbX={2.9}
              pcbY={-5.175}
              portHints={["pin78"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad78"}
              pcbX={2.9}
              pcbY={-5.825}
              portHints={["pin79"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad79"}
              pcbX={2.25}
              pcbY={6.525}
              portHints={["pin80"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad80"}
              pcbX={2.25}
              pcbY={5.875}
              portHints={["pin81"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad81"}
              pcbX={2.25}
              pcbY={5.225}
              portHints={["pin82"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad82"}
              pcbX={2.25}
              pcbY={4.575}
              portHints={["pin83"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad83"}
              pcbX={2.25}
              pcbY={3.925}
              portHints={["pin84"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad84"}
              pcbX={2.25}
              pcbY={1.975}
              portHints={["pin85"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad85"}
              pcbX={2.25}
              pcbY={1.325}
              portHints={["pin86"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad86"}
              pcbX={2.25}
              pcbY={0.675}
              portHints={["pin87"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad87"}
              pcbX={2.25}
              pcbY={0.025}
              portHints={["pin88"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad88"}
              pcbX={2.25}
              pcbY={-0.625}
              portHints={["pin89"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad89"}
              pcbX={2.25}
              pcbY={-1.275}
              portHints={["pin90"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad90"}
              pcbX={2.25}
              pcbY={-1.925}
              portHints={["pin91"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad91"}
              pcbX={2.25}
              pcbY={-2.575}
              portHints={["pin92"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad92"}
              pcbX={2.25}
              pcbY={-4.525}
              portHints={["pin93"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad93"}
              pcbX={2.25}
              pcbY={-5.175}
              portHints={["pin94"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad94"}
              pcbX={2.25}
              pcbY={-5.825}
              portHints={["pin95"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad95"}
              pcbX={2.25}
              pcbY={-6.475}
              portHints={["pin96"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad96"}
              pcbX={1.6}
              pcbY={5.875}
              portHints={["pin97"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad97"}
              pcbX={1.6}
              pcbY={5.225}
              portHints={["pin98"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad98"}
              pcbX={1.6}
              pcbY={4.575}
              portHints={["pin99"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad99"}
              pcbX={1.6}
              pcbY={3.925}
              portHints={["pin100"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad100"}
              pcbX={1.6}
              pcbY={3.275}
              portHints={["pin101"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad101"}
              pcbX={1.6}
              pcbY={1.975}
              portHints={["pin102"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad102"}
              pcbX={1.6}
              pcbY={1.325}
              portHints={["pin103"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad103"}
              pcbX={1.6}
              pcbY={0.675}
              portHints={["pin104"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad104"}
              pcbX={1.6}
              pcbY={0.025}
              portHints={["pin105"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad105"}
              pcbX={1.6}
              pcbY={-0.625}
              portHints={["pin106"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad106"}
              pcbX={1.6}
              pcbY={-1.275}
              portHints={["pin107"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad107"}
              pcbX={1.6}
              pcbY={-1.925}
              portHints={["pin108"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad108"}
              pcbX={1.6}
              pcbY={-2.575}
              portHints={["pin109"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad109"}
              pcbX={1.6}
              pcbY={-3.875}
              portHints={["pin110"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad110"}
              pcbX={1.6}
              pcbY={-4.525}
              portHints={["pin111"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad111"}
              pcbX={1.6}
              pcbY={-5.175}
              portHints={["pin112"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad112"}
              pcbX={1.6}
              pcbY={-5.825}
              portHints={["pin113"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad113"}
              pcbX={1.6}
              pcbY={-6.475}
              portHints={["pin114"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad114"}
              pcbX={0.95}
              pcbY={6.525}
              portHints={["pin115"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad115"}
              pcbX={0.95}
              pcbY={5.875}
              portHints={["pin116"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad116"}
              pcbX={0.95}
              pcbY={5.225}
              portHints={["pin117"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad117"}
              pcbX={0.95}
              pcbY={4.575}
              portHints={["pin118"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad118"}
              pcbX={0.95}
              pcbY={3.925}
              portHints={["pin119"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad119"}
              pcbX={0.95}
              pcbY={3.275}
              portHints={["pin120"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad120"}
              pcbX={0.95}
              pcbY={1.975}
              portHints={["pin121"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad121"}
              pcbX={0.95}
              pcbY={1.325}
              portHints={["pin122"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad122"}
              pcbX={0.95}
              pcbY={0.675}
              portHints={["pin123"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad123"}
              pcbX={0.95}
              pcbY={0.025}
              portHints={["pin124"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad124"}
              pcbX={0.95}
              pcbY={-0.625}
              portHints={["pin125"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad125"}
              pcbX={0.95}
              pcbY={-1.275}
              portHints={["pin126"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad126"}
              pcbX={0.95}
              pcbY={-1.925}
              portHints={["pin127"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad127"}
              pcbX={0.95}
              pcbY={-2.575}
              portHints={["pin128"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad128"}
              pcbX={0.95}
              pcbY={-3.875}
              portHints={["pin129"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad129"}
              pcbX={0.95}
              pcbY={-4.525}
              portHints={["pin130"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad130"}
              pcbX={0.95}
              pcbY={-5.175}
              portHints={["pin131"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad131"}
              pcbX={0.95}
              pcbY={-5.825}
              portHints={["pin132"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad132"}
              pcbX={0.3}
              pcbY={5.875}
              portHints={["pin133"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad133"}
              pcbX={0.3}
              pcbY={5.225}
              portHints={["pin134"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad134"}
              pcbX={0.3}
              pcbY={3.275}
              portHints={["pin135"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad135"}
              pcbX={0.3}
              pcbY={1.975}
              portHints={["pin136"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad136"}
              pcbX={0.3}
              pcbY={1.325}
              portHints={["pin137"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad137"}
              pcbX={0.3}
              pcbY={0.675}
              portHints={["pin138"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad138"}
              pcbX={0.3}
              pcbY={0.025}
              portHints={["pin139"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad139"}
              pcbX={0.3}
              pcbY={-0.625}
              portHints={["pin140"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad140"}
              pcbX={0.3}
              pcbY={-1.275}
              portHints={["pin141"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad141"}
              pcbX={0.3}
              pcbY={-1.925}
              portHints={["pin142"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad142"}
              pcbX={0.3}
              pcbY={-2.575}
              portHints={["pin143"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad143"}
              pcbX={0.3}
              pcbY={-3.875}
              portHints={["pin144"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad144"}
              pcbX={0.3}
              pcbY={-4.525}
              portHints={["pin145"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad145"}
              pcbX={0.3}
              pcbY={-5.175}
              portHints={["pin146"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad146"}
              pcbX={0.3}
              pcbY={-5.825}
              portHints={["pin147"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad147"}
              pcbX={0.3}
              pcbY={-6.475}
              portHints={["pin148"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad148"}
              pcbX={-0.35}
              pcbY={6.525}
              portHints={["pin149"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad149"}
              pcbX={-0.35}
              pcbY={5.875}
              portHints={["pin150"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad150"}
              pcbX={-0.35}
              pcbY={5.225}
              portHints={["pin151"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad151"}
              pcbX={-0.35}
              pcbY={4.575}
              portHints={["pin152"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad152"}
              pcbX={-0.35}
              pcbY={3.925}
              portHints={["pin153"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad153"}
              pcbX={-0.35}
              pcbY={3.275}
              portHints={["pin154"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad154"}
              pcbX={-0.35}
              pcbY={1.975}
              portHints={["pin155"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad155"}
              pcbX={-0.35}
              pcbY={1.325}
              portHints={["pin156"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad156"}
              pcbX={-0.35}
              pcbY={0.675}
              portHints={["pin157"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad157"}
              pcbX={-0.35}
              pcbY={0.025}
              portHints={["pin158"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad158"}
              pcbX={-0.35}
              pcbY={-0.625}
              portHints={["pin159"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad159"}
              pcbX={-0.35}
              pcbY={-1.275}
              portHints={["pin160"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad160"}
              pcbX={-0.35}
              pcbY={-1.925}
              portHints={["pin161"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad161"}
              pcbX={-0.35}
              pcbY={-2.575}
              portHints={["pin162"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad162"}
              pcbX={-0.35}
              pcbY={-4.525}
              portHints={["pin163"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad163"}
              pcbX={-0.35}
              pcbY={-5.175}
              portHints={["pin164"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad164"}
              pcbX={-0.35}
              pcbY={-5.825}
              portHints={["pin165"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad165"}
              pcbX={-1}
              pcbY={5.875}
              portHints={["pin166"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad166"}
              pcbX={-1}
              pcbY={5.225}
              portHints={["pin167"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad167"}
              pcbX={-1}
              pcbY={4.575}
              portHints={["pin168"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad168"}
              pcbX={-1}
              pcbY={3.925}
              portHints={["pin169"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad169"}
              pcbX={-1}
              pcbY={3.275}
              portHints={["pin170"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad170"}
              pcbX={-1}
              pcbY={1.975}
              portHints={["pin171"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad171"}
              pcbX={-1}
              pcbY={1.325}
              portHints={["pin172"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad172"}
              pcbX={-1}
              pcbY={0.675}
              portHints={["pin173"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad173"}
              pcbX={-1}
              pcbY={0.025}
              portHints={["pin174"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad174"}
              pcbX={-1}
              pcbY={-0.625}
              portHints={["pin175"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad175"}
              pcbX={-1}
              pcbY={-1.275}
              portHints={["pin176"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad176"}
              pcbX={-1}
              pcbY={-1.925}
              portHints={["pin177"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad177"}
              pcbX={-1}
              pcbY={-2.575}
              portHints={["pin178"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad178"}
              pcbX={-1}
              pcbY={-4.525}
              portHints={["pin179"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad179"}
              pcbX={-1}
              pcbY={-5.175}
              portHints={["pin180"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad180"}
              pcbX={-1}
              pcbY={-5.825}
              portHints={["pin181"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad181"}
              pcbX={-1}
              pcbY={-6.475}
              portHints={["pin182"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad182"}
              pcbX={-1.65}
              pcbY={6.525}
              portHints={["pin183"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad183"}
              pcbX={-1.65}
              pcbY={5.875}
              portHints={["pin184"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad184"}
              pcbX={-1.65}
              pcbY={5.225}
              portHints={["pin185"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad185"}
              pcbX={-1.65}
              pcbY={-4.525}
              portHints={["pin186"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad186"}
              pcbX={-1.65}
              pcbY={-5.175}
              portHints={["pin187"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad187"}
              pcbX={-1.65}
              pcbY={-5.825}
              portHints={["pin188"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad188"}
              pcbX={-2.3}
              pcbY={5.875}
              portHints={["pin189"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad189"}
              pcbX={-2.3}
              pcbY={5.225}
              portHints={["pin190"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad190"}
              pcbX={-2.3}
              pcbY={4.575}
              portHints={["pin191"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad191"}
              pcbX={-2.3}
              pcbY={3.925}
              portHints={["pin192"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad192"}
              pcbX={-2.3}
              pcbY={3.275}
              portHints={["pin193"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad193"}
              pcbX={-2.3}
              pcbY={2.625}
              portHints={["pin194"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad194"}
              pcbX={-2.3}
              pcbY={1.325}
              portHints={["pin195"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad195"}
              pcbX={-2.3}
              pcbY={0.675}
              portHints={["pin196"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad196"}
              pcbX={-2.3}
              pcbY={-0.625}
              portHints={["pin197"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad197"}
              pcbX={-2.3}
              pcbY={-1.275}
              portHints={["pin198"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad198"}
              pcbX={-2.3}
              pcbY={-2.575}
              portHints={["pin199"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad199"}
              pcbX={-2.3}
              pcbY={-3.225}
              portHints={["pin200"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad200"}
              pcbX={-2.3}
              pcbY={-4.525}
              portHints={["pin201"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad201"}
              pcbX={-2.3}
              pcbY={-5.175}
              portHints={["pin202"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad202"}
              pcbX={-2.3}
              pcbY={-5.825}
              portHints={["pin203"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad203"}
              pcbX={-2.3}
              pcbY={-6.475}
              portHints={["pin204"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad204"}
              pcbX={-2.95}
              pcbY={6.525}
              portHints={["pin205"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad205"}
              pcbX={-2.95}
              pcbY={5.875}
              portHints={["pin206"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad206"}
              pcbX={-2.95}
              pcbY={5.225}
              portHints={["pin207"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad207"}
              pcbX={-2.95}
              pcbY={4.575}
              portHints={["pin208"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad208"}
              pcbX={-2.95}
              pcbY={3.925}
              portHints={["pin209"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad209"}
              pcbX={-2.95}
              pcbY={3.275}
              portHints={["pin210"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad210"}
              pcbX={-2.95}
              pcbY={2.625}
              portHints={["pin211"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad211"}
              pcbX={-2.95}
              pcbY={1.325}
              portHints={["pin212"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad212"}
              pcbX={-2.95}
              pcbY={0.675}
              portHints={["pin213"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad213"}
              pcbX={-2.95}
              pcbY={-0.625}
              portHints={["pin214"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad214"}
              pcbX={-2.95}
              pcbY={-1.275}
              portHints={["pin215"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad215"}
              pcbX={-2.95}
              pcbY={-2.575}
              portHints={["pin216"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad216"}
              pcbX={-2.95}
              pcbY={-3.225}
              portHints={["pin217"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad217"}
              pcbX={-2.95}
              pcbY={-4.525}
              portHints={["pin218"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad218"}
              pcbX={-2.95}
              pcbY={-5.825}
              portHints={["pin219"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad219"}
              pcbX={-2.95}
              pcbY={-6.475}
              portHints={["pin220"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad220"}
              pcbX={-3.6}
              pcbY={6.525}
              portHints={["pin221"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad221"}
              pcbX={-3.6}
              pcbY={5.875}
              portHints={["pin222"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad222"}
              pcbX={-3.6}
              pcbY={5.225}
              portHints={["pin223"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad223"}
              pcbX={-3.6}
              pcbY={4.575}
              portHints={["pin224"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad224"}
              pcbX={-3.6}
              pcbY={3.925}
              portHints={["pin225"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad225"}
              pcbX={-3.6}
              pcbY={3.275}
              portHints={["pin226"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad226"}
              pcbX={-3.6}
              pcbY={1.325}
              portHints={["pin227"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad227"}
              pcbX={-3.6}
              pcbY={-0.625}
              portHints={["pin228"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad228"}
              pcbX={-3.6}
              pcbY={-2.575}
              portHints={["pin229"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad229"}
              pcbX={-3.6}
              pcbY={-4.525}
              portHints={["pin230"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad230"}
              pcbX={-3.6}
              pcbY={-5.175}
              portHints={["pin231"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad231"}
              pcbX={-3.6}
              pcbY={-5.825}
              portHints={["pin232"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad232"}
              pcbX={-3.6}
              pcbY={-6.475}
              portHints={["pin233"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad233"}
              pcbX={-4.25}
              pcbY={6.525}
              portHints={["pin234"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad234"}
              pcbX={-4.25}
              pcbY={5.875}
              portHints={["pin235"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad235"}
              pcbX={-4.25}
              pcbY={5.225}
              portHints={["pin236"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad236"}
              pcbX={-4.25}
              pcbY={4.575}
              portHints={["pin237"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad237"}
              pcbX={-4.25}
              pcbY={3.925}
              portHints={["pin238"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad238"}
              pcbX={-4.25}
              pcbY={3.275}
              portHints={["pin239"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad239"}
              pcbX={-4.25}
              pcbY={2.625}
              portHints={["pin240"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad240"}
              pcbX={-4.25}
              pcbY={1.975}
              portHints={["pin241"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad241"}
              pcbX={-4.25}
              pcbY={1.325}
              portHints={["pin242"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad242"}
              pcbX={-4.25}
              pcbY={0.675}
              portHints={["pin243"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad243"}
              pcbX={-4.25}
              pcbY={0.025}
              portHints={["pin244"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad244"}
              pcbX={-4.25}
              pcbY={-0.625}
              portHints={["pin245"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad245"}
              pcbX={-4.25}
              pcbY={-1.925}
              portHints={["pin246"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad246"}
              pcbX={-4.25}
              pcbY={-2.575}
              portHints={["pin247"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad247"}
              pcbX={-4.25}
              pcbY={-3.225}
              portHints={["pin248"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad248"}
              pcbX={-4.25}
              pcbY={-3.875}
              portHints={["pin249"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad249"}
              pcbX={-4.25}
              pcbY={-4.525}
              portHints={["pin250"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad250"}
              pcbX={-4.25}
              pcbY={-5.825}
              portHints={["pin251"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad251"}
              pcbX={-4.25}
              pcbY={-6.475}
              portHints={["pin252"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad252"}
              pcbX={-4.9}
              pcbY={6.525}
              portHints={["pin253"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad253"}
              pcbX={-4.9}
              pcbY={5.875}
              portHints={["pin254"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad254"}
              pcbX={-4.9}
              pcbY={5.225}
              portHints={["pin255"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad255"}
              pcbX={-4.9}
              pcbY={4.575}
              portHints={["pin256"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad256"}
              pcbX={-4.9}
              pcbY={3.925}
              portHints={["pin257"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad257"}
              pcbX={-4.9}
              pcbY={3.275}
              portHints={["pin258"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad258"}
              pcbX={-4.9}
              pcbY={1.975}
              portHints={["pin259"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad259"}
              pcbX={-4.9}
              pcbY={1.325}
              portHints={["pin260"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad260"}
              pcbX={-4.9}
              pcbY={0.675}
              portHints={["pin261"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad261"}
              pcbX={-4.9}
              pcbY={0.025}
              portHints={["pin262"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad262"}
              pcbX={-4.9}
              pcbY={-0.625}
              portHints={["pin263"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad263"}
              pcbX={-4.9}
              pcbY={-1.275}
              portHints={["pin264"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad264"}
              pcbX={-4.9}
              pcbY={-1.925}
              portHints={["pin265"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad265"}
              pcbX={-4.9}
              pcbY={-2.575}
              portHints={["pin266"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad266"}
              pcbX={-4.9}
              pcbY={-3.225}
              portHints={["pin267"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad267"}
              pcbX={-4.9}
              pcbY={-3.875}
              portHints={["pin268"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad268"}
              pcbX={-4.9}
              pcbY={-4.525}
              portHints={["pin269"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad269"}
              pcbX={-4.9}
              pcbY={-5.175}
              portHints={["pin270"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad270"}
              pcbX={-4.9}
              pcbY={-5.825}
              portHints={["pin271"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad271"}
              pcbX={-4.9}
              pcbY={-6.475}
              portHints={["pin272"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad272"}
              pcbX={-5.55}
              pcbY={6.525}
              portHints={["pin273"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad273"}
              pcbX={-5.55}
              pcbY={5.875}
              portHints={["pin274"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad274"}
              pcbX={-5.55}
              pcbY={5.225}
              portHints={["pin275"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad275"}
              pcbX={-5.55}
              pcbY={3.925}
              portHints={["pin276"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad276"}
              pcbX={-5.55}
              pcbY={1.975}
              portHints={["pin277"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad277"}
              pcbX={-5.55}
              pcbY={0.675}
              portHints={["pin278"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad278"}
              pcbX={-5.55}
              pcbY={-0.625}
              portHints={["pin279"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad279"}
              pcbX={-5.55}
              pcbY={-2.575}
              portHints={["pin280"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad280"}
              pcbX={-5.55}
              pcbY={-3.875}
              portHints={["pin281"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad281"}
              pcbX={-5.55}
              pcbY={-5.175}
              portHints={["pin282"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad282"}
              pcbX={-5.55}
              pcbY={-5.825}
              portHints={["pin283"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
            <smtpad
              name={"pad283"}
              pcbX={-5.55}
              pcbY={-6.475}
              portHints={["pin284"]}
              layer={"top"}
              shape={"circle"}
              radius={0.175}
            />
          </footprint>
        }
      />
      <chip
        name={"U2"}
        manufacturerPartNumber={"K4B8G1646D"}
        pinLabels={{
          pin1: ["NATIVE_A1"],
          pin2: ["NATIVE_A2"],
          pin3: ["NATIVE_A3"],
          pin4: ["NATIVE_A7"],
          pin5: ["NATIVE_A8"],
          pin6: ["NATIVE_A9"],
          pin7: ["NATIVE_B1"],
          pin8: ["NATIVE_B2"],
          pin9: ["NATIVE_B3"],
          pin10: ["NATIVE_B7"],
          pin11: ["NATIVE_B8"],
          pin12: ["NATIVE_B9"],
          pin13: ["NATIVE_C1"],
          pin14: ["NATIVE_C2"],
          pin15: ["NATIVE_C3"],
          pin16: ["NATIVE_C7"],
          pin17: ["NATIVE_C8"],
          pin18: ["NATIVE_C9"],
          pin19: ["NATIVE_D1"],
          pin20: ["NATIVE_D2"],
          pin21: ["NATIVE_D3"],
          pin22: ["NATIVE_D7"],
          pin23: ["NATIVE_D8"],
          pin24: ["NATIVE_D9"],
          pin25: ["NATIVE_E1"],
          pin26: ["NATIVE_E2"],
          pin27: ["NATIVE_E3"],
          pin28: ["NATIVE_E7"],
          pin29: ["NATIVE_E8"],
          pin30: ["NATIVE_E9"],
          pin31: ["NATIVE_F1"],
          pin32: ["NATIVE_F2"],
          pin33: ["NATIVE_F3"],
          pin34: ["NATIVE_F7"],
          pin35: ["NATIVE_F8"],
          pin36: ["NATIVE_F9"],
          pin37: ["NATIVE_G1"],
          pin38: ["NATIVE_G2"],
          pin39: ["NATIVE_G3"],
          pin40: ["NATIVE_G7"],
          pin41: ["NATIVE_G8"],
          pin42: ["NATIVE_G9"],
          pin43: ["NATIVE_H1"],
          pin44: ["NATIVE_H2"],
          pin45: ["NATIVE_H3"],
          pin46: ["NATIVE_H7"],
          pin47: ["NATIVE_H8"],
          pin48: ["NATIVE_H9"],
          pin49: ["NATIVE_J1"],
          pin50: ["NATIVE_J2"],
          pin51: ["NATIVE_J3"],
          pin52: ["NATIVE_J7"],
          pin53: ["NATIVE_J8"],
          pin54: ["NATIVE_J9"],
          pin55: ["NATIVE_K1"],
          pin56: ["NATIVE_K2"],
          pin57: ["NATIVE_K3"],
          pin58: ["NATIVE_K7"],
          pin59: ["NATIVE_K8"],
          pin60: ["NATIVE_K9"],
          pin61: ["NATIVE_L1"],
          pin62: ["NATIVE_L2"],
          pin63: ["NATIVE_L3"],
          pin64: ["NATIVE_L7"],
          pin65: ["NATIVE_L8"],
          pin66: ["NATIVE_L9"],
          pin67: ["NATIVE_M1"],
          pin68: ["NATIVE_M2"],
          pin69: ["NATIVE_M3"],
          pin70: ["NATIVE_M7"],
          pin71: ["NATIVE_M8"],
          pin72: ["NATIVE_M9"],
          pin73: ["NATIVE_N1"],
          pin74: ["NATIVE_N2"],
          pin75: ["NATIVE_N3"],
          pin76: ["NATIVE_N7"],
          pin77: ["NATIVE_N8"],
          pin78: ["NATIVE_N9"],
          pin79: ["NATIVE_P1"],
          pin80: ["NATIVE_P2"],
          pin81: ["NATIVE_P3"],
          pin82: ["NATIVE_P7"],
          pin83: ["NATIVE_P8"],
          pin84: ["NATIVE_P9"],
          pin85: ["NATIVE_R1"],
          pin86: ["NATIVE_R2"],
          pin87: ["NATIVE_R3"],
          pin88: ["NATIVE_R7"],
          pin89: ["NATIVE_R8"],
          pin90: ["NATIVE_R9"],
          pin91: ["NATIVE_T1"],
          pin92: ["NATIVE_T2"],
          pin93: ["NATIVE_T3"],
          pin94: ["NATIVE_T7"],
          pin95: ["NATIVE_T8"],
          pin96: ["NATIVE_T9"],
        }}
        pcbX={-6.819999999999993}
        pcbY={10.539999999999992}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad0"}
              pcbX={-3.2}
              pcbY={6}
              portHints={["pin1"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad1"}
              pcbX={-2.4}
              pcbY={6}
              portHints={["pin2"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad2"}
              pcbX={-1.6}
              pcbY={6}
              portHints={["pin3"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad3"}
              pcbX={1.6}
              pcbY={6}
              portHints={["pin4"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad4"}
              pcbX={2.4}
              pcbY={6}
              portHints={["pin5"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad5"}
              pcbX={3.2}
              pcbY={6}
              portHints={["pin6"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad6"}
              pcbX={-3.2}
              pcbY={5.2}
              portHints={["pin7"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad7"}
              pcbX={-2.4}
              pcbY={5.2}
              portHints={["pin8"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad8"}
              pcbX={-1.6}
              pcbY={5.2}
              portHints={["pin9"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad9"}
              pcbX={1.6}
              pcbY={5.2}
              portHints={["pin10"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad10"}
              pcbX={2.4}
              pcbY={5.2}
              portHints={["pin11"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad11"}
              pcbX={3.2}
              pcbY={5.2}
              portHints={["pin12"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad12"}
              pcbX={-3.2}
              pcbY={4.4}
              portHints={["pin13"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad13"}
              pcbX={-2.4}
              pcbY={4.4}
              portHints={["pin14"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad14"}
              pcbX={-1.6}
              pcbY={4.4}
              portHints={["pin15"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad15"}
              pcbX={1.6}
              pcbY={4.4}
              portHints={["pin16"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad16"}
              pcbX={2.4}
              pcbY={4.4}
              portHints={["pin17"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad17"}
              pcbX={3.2}
              pcbY={4.4}
              portHints={["pin18"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad18"}
              pcbX={-3.2}
              pcbY={3.6}
              portHints={["pin19"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad19"}
              pcbX={-2.4}
              pcbY={3.6}
              portHints={["pin20"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad20"}
              pcbX={-1.6}
              pcbY={3.6}
              portHints={["pin21"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad21"}
              pcbX={1.6}
              pcbY={3.6}
              portHints={["pin22"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad22"}
              pcbX={2.4}
              pcbY={3.6}
              portHints={["pin23"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad23"}
              pcbX={3.2}
              pcbY={3.6}
              portHints={["pin24"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad24"}
              pcbX={-3.2}
              pcbY={2.8}
              portHints={["pin25"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad25"}
              pcbX={-2.4}
              pcbY={2.8}
              portHints={["pin26"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad26"}
              pcbX={-1.6}
              pcbY={2.8}
              portHints={["pin27"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad27"}
              pcbX={1.6}
              pcbY={2.8}
              portHints={["pin28"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad28"}
              pcbX={2.4}
              pcbY={2.8}
              portHints={["pin29"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad29"}
              pcbX={3.2}
              pcbY={2.8}
              portHints={["pin30"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad30"}
              pcbX={-3.2}
              pcbY={2}
              portHints={["pin31"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad31"}
              pcbX={-2.4}
              pcbY={2}
              portHints={["pin32"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad32"}
              pcbX={-1.6}
              pcbY={2}
              portHints={["pin33"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad33"}
              pcbX={1.6}
              pcbY={2}
              portHints={["pin34"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad34"}
              pcbX={2.4}
              pcbY={2}
              portHints={["pin35"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad35"}
              pcbX={3.2}
              pcbY={2}
              portHints={["pin36"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad36"}
              pcbX={-3.2}
              pcbY={1.2}
              portHints={["pin37"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad37"}
              pcbX={-2.4}
              pcbY={1.2}
              portHints={["pin38"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad38"}
              pcbX={-1.6}
              pcbY={1.2}
              portHints={["pin39"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad39"}
              pcbX={1.6}
              pcbY={1.2}
              portHints={["pin40"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad40"}
              pcbX={2.4}
              pcbY={1.2}
              portHints={["pin41"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad41"}
              pcbX={3.2}
              pcbY={1.2}
              portHints={["pin42"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad42"}
              pcbX={-3.2}
              pcbY={0.4}
              portHints={["pin43"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad43"}
              pcbX={-2.4}
              pcbY={0.4}
              portHints={["pin44"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad44"}
              pcbX={-1.6}
              pcbY={0.4}
              portHints={["pin45"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad45"}
              pcbX={1.6}
              pcbY={0.4}
              portHints={["pin46"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad46"}
              pcbX={2.4}
              pcbY={0.4}
              portHints={["pin47"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad47"}
              pcbX={3.2}
              pcbY={0.4}
              portHints={["pin48"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad48"}
              pcbX={-3.2}
              pcbY={-0.4}
              portHints={["pin49"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad49"}
              pcbX={-2.4}
              pcbY={-0.4}
              portHints={["pin50"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad50"}
              pcbX={-1.6}
              pcbY={-0.4}
              portHints={["pin51"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad51"}
              pcbX={1.6}
              pcbY={-0.4}
              portHints={["pin52"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad52"}
              pcbX={2.4}
              pcbY={-0.4}
              portHints={["pin53"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad53"}
              pcbX={3.2}
              pcbY={-0.4}
              portHints={["pin54"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad54"}
              pcbX={-3.2}
              pcbY={-1.2}
              portHints={["pin55"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad55"}
              pcbX={-2.4}
              pcbY={-1.2}
              portHints={["pin56"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad56"}
              pcbX={-1.6}
              pcbY={-1.2}
              portHints={["pin57"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad57"}
              pcbX={1.6}
              pcbY={-1.2}
              portHints={["pin58"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad58"}
              pcbX={2.4}
              pcbY={-1.2}
              portHints={["pin59"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad59"}
              pcbX={3.2}
              pcbY={-1.2}
              portHints={["pin60"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad60"}
              pcbX={-3.2}
              pcbY={-2}
              portHints={["pin61"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad61"}
              pcbX={-2.4}
              pcbY={-2}
              portHints={["pin62"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad62"}
              pcbX={-1.6}
              pcbY={-2}
              portHints={["pin63"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad63"}
              pcbX={1.6}
              pcbY={-2}
              portHints={["pin64"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad64"}
              pcbX={2.4}
              pcbY={-2}
              portHints={["pin65"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad65"}
              pcbX={3.2}
              pcbY={-2}
              portHints={["pin66"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad66"}
              pcbX={-3.2}
              pcbY={-2.8}
              portHints={["pin67"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad67"}
              pcbX={-2.4}
              pcbY={-2.8}
              portHints={["pin68"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad68"}
              pcbX={-1.6}
              pcbY={-2.8}
              portHints={["pin69"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad69"}
              pcbX={1.6}
              pcbY={-2.8}
              portHints={["pin70"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad70"}
              pcbX={2.4}
              pcbY={-2.8}
              portHints={["pin71"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad71"}
              pcbX={3.2}
              pcbY={-2.8}
              portHints={["pin72"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad72"}
              pcbX={-3.2}
              pcbY={-3.6}
              portHints={["pin73"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad73"}
              pcbX={-2.4}
              pcbY={-3.6}
              portHints={["pin74"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad74"}
              pcbX={-1.6}
              pcbY={-3.6}
              portHints={["pin75"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad75"}
              pcbX={1.6}
              pcbY={-3.6}
              portHints={["pin76"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad76"}
              pcbX={2.4}
              pcbY={-3.6}
              portHints={["pin77"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad77"}
              pcbX={3.2}
              pcbY={-3.6}
              portHints={["pin78"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad78"}
              pcbX={-3.2}
              pcbY={-4.4}
              portHints={["pin79"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad79"}
              pcbX={-2.4}
              pcbY={-4.4}
              portHints={["pin80"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad80"}
              pcbX={-1.6}
              pcbY={-4.4}
              portHints={["pin81"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad81"}
              pcbX={1.6}
              pcbY={-4.4}
              portHints={["pin82"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad82"}
              pcbX={2.4}
              pcbY={-4.4}
              portHints={["pin83"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad83"}
              pcbX={3.2}
              pcbY={-4.4}
              portHints={["pin84"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad84"}
              pcbX={-3.2}
              pcbY={-5.2}
              portHints={["pin85"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad85"}
              pcbX={-2.4}
              pcbY={-5.2}
              portHints={["pin86"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad86"}
              pcbX={-1.6}
              pcbY={-5.2}
              portHints={["pin87"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad87"}
              pcbX={1.6}
              pcbY={-5.2}
              portHints={["pin88"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad88"}
              pcbX={2.4}
              pcbY={-5.2}
              portHints={["pin89"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad89"}
              pcbX={3.2}
              pcbY={-5.2}
              portHints={["pin90"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad90"}
              pcbX={-3.2}
              pcbY={-6}
              portHints={["pin91"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad91"}
              pcbX={-2.4}
              pcbY={-6}
              portHints={["pin92"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad92"}
              pcbX={-1.6}
              pcbY={-6}
              portHints={["pin93"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad93"}
              pcbX={1.6}
              pcbY={-6}
              portHints={["pin94"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad94"}
              pcbX={2.4}
              pcbY={-6}
              portHints={["pin95"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
            <smtpad
              name={"pad95"}
              pcbX={3.2}
              pcbY={-6}
              portHints={["pin96"]}
              layer={"top"}
              shape={"circle"}
              radius={0.2}
            />
          </footprint>
        }
      />
      <chip
        noConnect={[
          "pin4",
          "pin5",
          "pin14",
          "pin16",
          "pin17",
          "pin20",
          "pin21",
          "pin22",
          "pin55",
          "pin56",
        ]}
        name={"U3"}
        manufacturerPartNumber={"AXP305"}
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
          pin4: ["NATIVE_4"],
          pin5: ["NATIVE_5"],
          pin6: ["NATIVE_6"],
          pin7: ["NATIVE_7"],
          pin8: ["NATIVE_8"],
          pin9: ["NATIVE_9"],
          pin10: ["NATIVE_10"],
          pin11: ["NATIVE_11"],
          pin12: ["NATIVE_12"],
          pin13: ["NATIVE_13"],
          pin14: ["NATIVE_14"],
          pin15: ["NATIVE_15"],
          pin16: ["NATIVE_16"],
          pin17: ["NATIVE_17"],
          pin18: ["NATIVE_18"],
          pin19: ["NATIVE_19"],
          pin20: ["NATIVE_20"],
          pin21: ["NATIVE_21"],
          pin22: ["NATIVE_22"],
          pin23: ["NATIVE_23"],
          pin24: ["NATIVE_24"],
          pin25: ["NATIVE_25"],
          pin26: ["NATIVE_26"],
          pin27: ["NATIVE_27"],
          pin28: ["NATIVE_28"],
          pin29: ["NATIVE_29"],
          pin30: ["NATIVE_30"],
          pin31: ["NATIVE_31"],
          pin32: ["NATIVE_32"],
          pin33: ["NATIVE_33"],
          pin34: ["NATIVE_34"],
          pin35: ["NATIVE_35"],
          pin36: ["NATIVE_36"],
          pin37: ["NATIVE_37"],
          pin38: ["NATIVE_38"],
          pin39: ["NATIVE_39"],
          pin40: ["NATIVE_40"],
          pin41: ["NATIVE_41"],
          pin42: ["NATIVE_42"],
          pin43: ["NATIVE_43"],
          pin44: ["NATIVE_44"],
          pin45: ["NATIVE_45"],
          pin46: ["NATIVE_46"],
          pin47: ["NATIVE_47"],
          pin48: ["NATIVE_48"],
          pin49: ["NATIVE_49"],
          pin50: ["NATIVE_50"],
          pin51: ["NATIVE_51"],
          pin52: ["NATIVE_52"],
          pin53: ["NATIVE_53"],
          pin54: ["NATIVE_54"],
          pin55: ["NATIVE_55"],
          pin56: ["NATIVE_56"],
          pin57: ["NATIVE_57"],
        }}
        pcbX={-3.319999999999993}
        pcbY={-22.41000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad4"}
              pcbX={-2.6}
              pcbY={-3.45}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad5"}
              pcbX={-2.2}
              pcbY={-3.45}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad6"}
              pcbX={-1.8}
              pcbY={-3.45}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad7"}
              pcbX={-1.4}
              pcbY={-3.45}
              portHints={["pin4"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad8"}
              pcbX={-1}
              pcbY={-3.45}
              portHints={["pin5"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad9"}
              pcbX={-0.6}
              pcbY={-3.45}
              portHints={["pin6"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad10"}
              pcbX={-0.2}
              pcbY={-3.45}
              portHints={["pin7"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad11"}
              pcbX={0.2}
              pcbY={-3.45}
              portHints={["pin8"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad12"}
              pcbX={0.6}
              pcbY={-3.45}
              portHints={["pin9"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad13"}
              pcbX={1}
              pcbY={-3.45}
              portHints={["pin10"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad14"}
              pcbX={1.4}
              pcbY={-3.45}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad15"}
              pcbX={1.8}
              pcbY={-3.45}
              portHints={["pin12"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad16"}
              pcbX={2.2}
              pcbY={-3.45}
              portHints={["pin13"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad17"}
              pcbX={2.6}
              pcbY={-3.45}
              portHints={["pin14"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad18"}
              pcbX={3.45}
              pcbY={-2.6}
              portHints={["pin15"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad19"}
              pcbX={3.45}
              pcbY={-2.2}
              portHints={["pin16"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad20"}
              pcbX={3.45}
              pcbY={-1.8}
              portHints={["pin17"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad21"}
              pcbX={3.45}
              pcbY={-1.4}
              portHints={["pin18"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad22"}
              pcbX={3.45}
              pcbY={-1}
              portHints={["pin19"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad23"}
              pcbX={3.45}
              pcbY={-0.6}
              portHints={["pin20"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad24"}
              pcbX={3.45}
              pcbY={-0.2}
              portHints={["pin21"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad25"}
              pcbX={3.45}
              pcbY={0.2}
              portHints={["pin22"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad26"}
              pcbX={3.45}
              pcbY={0.6}
              portHints={["pin23"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad27"}
              pcbX={3.45}
              pcbY={1}
              portHints={["pin24"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad28"}
              pcbX={3.45}
              pcbY={1.4}
              portHints={["pin25"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad29"}
              pcbX={3.45}
              pcbY={1.8}
              portHints={["pin26"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad30"}
              pcbX={3.45}
              pcbY={2.2}
              portHints={["pin27"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad31"}
              pcbX={3.45}
              pcbY={2.6}
              portHints={["pin28"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad32"}
              pcbX={2.6}
              pcbY={3.45}
              portHints={["pin29"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad33"}
              pcbX={2.2}
              pcbY={3.45}
              portHints={["pin30"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad34"}
              pcbX={1.8}
              pcbY={3.45}
              portHints={["pin31"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad35"}
              pcbX={1.4}
              pcbY={3.45}
              portHints={["pin32"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad36"}
              pcbX={1}
              pcbY={3.45}
              portHints={["pin33"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad37"}
              pcbX={0.6}
              pcbY={3.45}
              portHints={["pin34"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad38"}
              pcbX={0.2}
              pcbY={3.45}
              portHints={["pin35"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad39"}
              pcbX={-0.2}
              pcbY={3.45}
              portHints={["pin36"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad40"}
              pcbX={-0.6}
              pcbY={3.45}
              portHints={["pin37"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad41"}
              pcbX={-1}
              pcbY={3.45}
              portHints={["pin38"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad42"}
              pcbX={-1.4}
              pcbY={3.45}
              portHints={["pin39"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad43"}
              pcbX={-1.8}
              pcbY={3.45}
              portHints={["pin40"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad44"}
              pcbX={-2.2}
              pcbY={3.45}
              portHints={["pin41"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad45"}
              pcbX={-2.6}
              pcbY={3.45}
              portHints={["pin42"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.2}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad46"}
              pcbX={-3.45}
              pcbY={2.6}
              portHints={["pin43"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad47"}
              pcbX={-3.45}
              pcbY={2.2}
              portHints={["pin44"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad48"}
              pcbX={-3.45}
              pcbY={1.8}
              portHints={["pin45"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad49"}
              pcbX={-3.45}
              pcbY={1.4}
              portHints={["pin46"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad50"}
              pcbX={-3.45}
              pcbY={1}
              portHints={["pin47"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad51"}
              pcbX={-3.45}
              pcbY={0.6}
              portHints={["pin48"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad52"}
              pcbX={-3.45}
              pcbY={0.2}
              portHints={["pin49"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad53"}
              pcbX={-3.45}
              pcbY={-0.2}
              portHints={["pin50"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad54"}
              pcbX={-3.45}
              pcbY={-0.6}
              portHints={["pin51"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad55"}
              pcbX={-3.45}
              pcbY={-1}
              portHints={["pin52"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad56"}
              pcbX={-3.45}
              pcbY={-1.4}
              portHints={["pin53"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad57"}
              pcbX={-3.45}
              pcbY={-1.8}
              portHints={["pin54"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad58"}
              pcbX={-3.45}
              pcbY={-2.2}
              portHints={["pin55"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <smtpad
              name={"pad59"}
              pcbX={-3.45}
              pcbY={-2.6}
              portHints={["pin56"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.2}
              height={0.8}
              cornerRadius={0.05}
              ccwRotation={90}
            />
            <platedhole
              name={"pad60"}
              pcbX={-1.75}
              pcbY={-1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad61"}
              pcbX={0}
              pcbY={-1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad62"}
              pcbX={1.75}
              pcbY={-1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad63"}
              pcbX={-1.75}
              pcbY={0}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad64"}
              pcbX={0}
              pcbY={0}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <smtpad
              name={"pad65"}
              pcbX={0}
              pcbY={0}
              portHints={["pin57"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={4}
              height={4}
              ccwRotation={90}
            />
            <smtpad
              name={"pad66"}
              pcbX={0}
              pcbY={0}
              portHints={["pin57"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={4}
              height={4}
              ccwRotation={90}
            />
            <platedhole
              name={"pad67"}
              pcbX={1.75}
              pcbY={0}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad68"}
              pcbX={-1.75}
              pcbY={1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad69"}
              pcbX={0}
              pcbY={1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
            <platedhole
              name={"pad70"}
              pcbX={1.75}
              pcbY={1.75}
              portHints={["pin57"]}
              shape={"circle"}
              outerDiameter={0.5}
              holeDiameter={0.2}
            />
          </footprint>
        }
      />
      <chip
        noConnect={[
          "pin1",
          "pin2",
          "pin10",
          "pin11",
          "pin12",
          "pin13",
          "pin14",
          "pin15",
          "pin16",
          "pin17",
          "pin18",
          "pin19",
          "pin20",
          "pin21",
          "pin22",
          "pin23",
          "pin24",
          "pin27",
          "pin28",
        ]}
        name={"U4"}
        manufacturerPartNumber={"CP2102N-Axx-xQFN28"}
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
          pin4: ["NATIVE_4"],
          pin5: ["NATIVE_5"],
          pin6: ["NATIVE_6"],
          pin7: ["NATIVE_7"],
          pin8: ["NATIVE_8"],
          pin9: ["NATIVE_9"],
          pin10: ["NATIVE_10"],
          pin11: ["NATIVE_11"],
          pin12: ["NATIVE_12"],
          pin13: ["NATIVE_13"],
          pin14: ["NATIVE_14"],
          pin15: ["NATIVE_15"],
          pin16: ["NATIVE_16"],
          pin17: ["NATIVE_17"],
          pin18: ["NATIVE_18"],
          pin19: ["NATIVE_19"],
          pin20: ["NATIVE_20"],
          pin21: ["NATIVE_21"],
          pin22: ["NATIVE_22"],
          pin23: ["NATIVE_23"],
          pin24: ["NATIVE_24"],
          pin25: ["NATIVE_25"],
          pin26: ["NATIVE_26"],
          pin27: ["NATIVE_27"],
          pin28: ["NATIVE_28"],
          pin29: ["NATIVE_29"],
        }}
        pcbX={2.969999999999999}
        pcbY={-8.13000000000001}
        layer={"top"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"top"}>
            <smtpad
              name={"pad9"}
              pcbX={-1.5}
              pcbY={-2.45}
              portHints={["pin1"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad10"}
              pcbX={-1}
              pcbY={-2.45}
              portHints={["pin2"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad11"}
              pcbX={-0.5}
              pcbY={-2.45}
              portHints={["pin3"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad12"}
              pcbX={0}
              pcbY={-2.45}
              portHints={["pin4"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad13"}
              pcbX={0.5}
              pcbY={-2.45}
              portHints={["pin5"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad14"}
              pcbX={1}
              pcbY={-2.45}
              portHints={["pin6"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad15"}
              pcbX={1.5}
              pcbY={-2.45}
              portHints={["pin7"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad16"}
              pcbX={2.45}
              pcbY={-1.5}
              portHints={["pin8"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad17"}
              pcbX={2.45}
              pcbY={-1}
              portHints={["pin9"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad18"}
              pcbX={2.45}
              pcbY={-0.5}
              portHints={["pin10"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad19"}
              pcbX={2.45}
              pcbY={0}
              portHints={["pin11"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad20"}
              pcbX={2.45}
              pcbY={0.5}
              portHints={["pin12"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad21"}
              pcbX={2.45}
              pcbY={1}
              portHints={["pin13"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad22"}
              pcbX={2.45}
              pcbY={1.5}
              portHints={["pin14"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad23"}
              pcbX={1.5}
              pcbY={2.45}
              portHints={["pin15"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad24"}
              pcbX={1}
              pcbY={2.45}
              portHints={["pin16"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad25"}
              pcbX={0.5}
              pcbY={2.45}
              portHints={["pin17"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad26"}
              pcbX={0}
              pcbY={2.45}
              portHints={["pin18"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad27"}
              pcbX={-0.5}
              pcbY={2.45}
              portHints={["pin19"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad28"}
              pcbX={-1}
              pcbY={2.45}
              portHints={["pin20"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad29"}
              pcbX={-1.5}
              pcbY={2.45}
              portHints={["pin21"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.8}
              height={0.25}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad30"}
              pcbX={-2.45}
              pcbY={1.5}
              portHints={["pin22"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad31"}
              pcbX={-2.45}
              pcbY={1}
              portHints={["pin23"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad32"}
              pcbX={-2.45}
              pcbY={0.5}
              portHints={["pin24"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad33"}
              pcbX={-2.45}
              pcbY={0}
              portHints={["pin25"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad34"}
              pcbX={-2.45}
              pcbY={-0.5}
              portHints={["pin26"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad35"}
              pcbX={-2.45}
              pcbY={-1}
              portHints={["pin27"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad36"}
              pcbX={-2.45}
              pcbY={-1.5}
              portHints={["pin28"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={0.25}
              height={0.8}
              cornerRadius={0.0625}
              ccwRotation={90}
            />
            <smtpad
              name={"pad37"}
              pcbX={0}
              pcbY={0}
              portHints={["pin29"]}
              layer={"top"}
              shape={"rotated_rect"}
              width={3.35}
              height={3.35}
              ccwRotation={90}
            />
          </footprint>
        }
      />
      <chip
        name={"Y1"}
        manufacturerPartNumber={"24MHz"}
        pinLabels={{
          pin1: ["NATIVE_1"],
          pin2: ["NATIVE_2"],
          pin3: ["NATIVE_3"],
          pin4: ["NATIVE_4"],
        }}
        pcbX={8.794999999999987}
        pcbY={6.819999999999993}
        layer={"bottom"}
        noSchematicRepresentation={true}
        footprint={
          <footprint originalLayer={"bottom"}>
            <smtpad
              name={"pad0"}
              pcbX={-0.875}
              pcbY={0.7}
              portHints={["pin1"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.15}
              height={1}
              ccwRotation={0}
            />
            <smtpad
              name={"pad1"}
              pcbX={0.875}
              pcbY={0.7}
              portHints={["pin2"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.15}
              height={1}
              ccwRotation={0}
            />
            <smtpad
              name={"pad2"}
              pcbX={0.875}
              pcbY={-0.7}
              portHints={["pin3"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.15}
              height={1}
              ccwRotation={0}
            />
            <smtpad
              name={"pad3"}
              pcbX={-0.875}
              pcbY={-0.7}
              portHints={["pin4"]}
              layer={"bottom"}
              shape={"rotated_rect"}
              width={1.15}
              height={1}
              ccwRotation={0}
            />
          </footprint>
        }
      />
      <net
        name="N0220"
        connectsTo={[".U1 > .pin275", ".U2 > .pin27"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0222"
        connectsTo={[".U1 > .pin210", ".U2 > .pin34"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0218"
        connectsTo={[".U1 > .pin256", ".U2 > .pin17"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0216"
        connectsTo={[".U1 > .pin206", ".U2 > .pin14"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0214"
        connectsTo={[".U1 > .pin235", ".U2 > .pin4"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0212"
        connectsTo={[".U1 > .pin190", ".U2 > .pin2"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0215"
        connectsTo={[".U1 > .pin255", ".U2 > .pin11"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0213"
        connectsTo={[".U1 > .pin189", ".U2 > .pin3"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0221"
        connectsTo={[".U1 > .pin224", ".U2 > .pin32"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0223"
        connectsTo={[".U1 > .pin226", ".U2 > .pin35"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0225"
        connectsTo={[".U1 > .pin191", ".U2 > .pin45"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0227"
        connectsTo={[".U1 > .pin209", ".U2 > .pin47"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0224"
        connectsTo={[".U1 > .pin208", ".U2 > .pin38"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0226"
        connectsTo={[".U1 > .pin192", ".U2 > .pin46"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0219"
        connectsTo={[".U1 > .pin237", ".U2 > .pin22"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0217"
        connectsTo={[".U1 > .pin205", ".U2 > .pin15"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0169"
        connectsTo={[".U1 > .pin218", ".U2 > .pin75"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0177"
        connectsTo={[".U1 > .pin229", ".U2 > .pin82"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0203"
        connectsTo={[".U1 > .pin270", ".U2 > .pin64"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0201"
        connectsTo={[".U1 > .pin268", ".U2 > .pin88"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0168"
        connectsTo={[".U1 > .pin217", ".U2 > .pin76"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0178"
        connectsTo={[".U1 > .pin230", ".U2 > .pin93"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0167"
        connectsTo={[".U1 > .pin216", ".U2 > .pin94"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0202"
        connectsTo={[".U1 > .pin269", ".U2 > .pin70"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0188"
        connectsTo={[".U1 > .pin250", ".U2 > .pin81"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0179"
        connectsTo={[".U1 > .pin231", ".U2 > .pin74"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0200"
        connectsTo={[".U1 > .pin267", ".U2 > .pin83"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0180"
        connectsTo={[".U1 > .pin232", ".U2 > .pin80"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0157"
        connectsTo={[".U1 > .pin198", ".U2 > .pin89"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0190"
        connectsTo={[".U1 > .pin252", ".U2 > .pin86"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0210"
        connectsTo={[".U1 > .pin281", ".U2 > .pin95"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0189"
        connectsTo={[".U1 > .pin251", ".U2 > .pin87"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={6}
      />
      <net
        name="N0170"
        connectsTo={[".U1 > .pin219", ".U2 > .pin68"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0199"
        connectsTo={[".U1 > .pin266", ".U2 > .pin77"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0204"
        connectsTo={[".U1 > .pin271", ".U2 > .pin69"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0158"
        connectsTo={[".U1 > .pin200", ".U2 > .pin57"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0209"
        connectsTo={[".U1 > .pin280", ".U2 > .pin60"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0166"
        connectsTo={[".U1 > .pin215", ".U2 > .pin54"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0014"
        connectsTo={[
          ".C7 > .pin2",
          ".R4 > .pin2",
          ".U1 > .pin265",
          ".U2 > .pin58",
        ]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={2}
      />
      <trace
        name="SCKN"
        path={[".U1 > .pin265", ".U2 > .pin58", "net.N0014"]}
        routingPhaseIndex={2}
      />
      <net
        name="N0013"
        connectsTo={[
          ".C7 > .pin1",
          ".R4 > .pin1",
          ".U1 > .pin246",
          ".U2 > .pin52",
        ]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={2}
      />
      <trace
        name="SCKP"
        path={[".U1 > .pin246", ".U2 > .pin52", "net.N0013"]}
        routingPhaseIndex={2}
      />
      <net
        name="N0171"
        connectsTo={[".U1 > .pin220", ".U2 > .pin62"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0159"
        connectsTo={[".U1 > .pin202", ".U2 > .pin61"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0191"
        connectsTo={[".U1 > .pin253", ".U2 > .pin21"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0174"
        connectsTo={[".U1 > .pin223", ".U2 > .pin28"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={4}
      />
      <net
        name="N0172"
        connectsTo={[".U1 > .pin221", ".U2 > .pin10"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={4}
      />
      <net
        name="N0173"
        connectsTo={[".U1 > .pin222", ".U2 > .pin16"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={4}
      />
      <net
        name="N0206"
        connectsTo={[".U1 > .pin274", ".U2 > .pin39"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={4}
      />
      <net
        name="N0192"
        connectsTo={[".U1 > .pin254", ".U2 > .pin33"]}
        nominalTraceWidth={0.093}
        routingPhaseIndex={4}
      />
      <net
        name="N0160"
        connectsTo={[".U1 > .pin203", ".U2 > .pin55"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0161"
        connectsTo={[".U1 > .pin204", ".U2 > .pin49"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0187"
        connectsTo={[".U1 > .pin248", ".U2 > .pin51"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <net
        name="N0205"
        connectsTo={[".U1 > .pin272", ".U2 > .pin92"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={10}
      />
      <net
        name="N0211"
        connectsTo={[".U1 > .pin283", ".U2 > .pin63"]}
        nominalTraceWidth={0.0975}
        routingPhaseIndex={7}
      />
      <bus
        name="CLOCK"
        connections={["SCKP", "SCKN"]}
        maxLengthSkew={0.096626}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      {/* For n signals, range <= mean tolerance * n/(n-1) guarantees the reference mean-deviation rule. */}
      <bus
        name="LOW_DATA"
        connections={["DQ0", "DQ2", "DQ3", "DQ4", "DQ5", "DQ6", "DQ7"]}
        maxLengthSkew={(2.54 * 7) / 6}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="HIGH_DATA"
        connections={[
          "DQ1",
          "DQ10",
          "DQ11",
          "DQ12",
          "DQ13",
          "DQ14",
          "DQ15",
          "DQ8",
          "DQ9",
        ]}
        maxLengthSkew={(2.54 * 9) / 8}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="LOW_STROBE"
        connections={["SDQS1P", "SDQS1N"]}
        maxLengthSkew={0.359683}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="HIGH_STROBE"
        connections={["SDQS0P", "SDQS0N"]}
        maxLengthSkew={2.61568}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="BYTE0"
        connections={[
          "DQ0",
          "DQ1",
          "DQ2",
          "DQ3",
          "DQ4",
          "DQ5",
          "DQ6",
          "DQ7",
          "SDQM1",
          "SDQS1P",
          "SDQS1N",
        ]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="BYTE1"
        connections={[
          "DQ8",
          "DQ9",
          "DQ10",
          "DQ11",
          "DQ12",
          "DQ13",
          "DQ14",
          "DQ15",
          "SDQM0",
          "SDQS0P",
          "SDQS0N",
        ]}
        maxLengthSkew={6.418863}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="DQ0_TO_DQS"
        connections={["DQ0"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ1_TO_DQS"
        connections={["DQ1"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ2_TO_DQS"
        connections={["DQ2"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ3_TO_DQS"
        connections={["DQ3"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ4_TO_DQS"
        connections={["DQ4"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ5_TO_DQS"
        connections={["DQ5"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ6_TO_DQS"
        connections={["DQ6"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ7_TO_DQS"
        connections={["DQ7"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="SDQM1_TO_DQS"
        connections={["SDQM1"]}
        maxLengthSkew={7.546897}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".LOW_STROBE"]}
      />
      <bus
        name="DQ8_TO_DQS"
        connections={["DQ8"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ9_TO_DQS"
        connections={["DQ9"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ10_TO_DQS"
        connections={["DQ10"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ11_TO_DQS"
        connections={["DQ11"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ12_TO_DQS"
        connections={["DQ12"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ13_TO_DQS"
        connections={["DQ13"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ14_TO_DQS"
        connections={["DQ14"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="DQ15_TO_DQS"
        connections={["DQ15"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="SDQM0_TO_DQS"
        connections={["SDQM0"]}
        maxLengthSkew={5.381748}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={[".HIGH_STROBE"]}
      />
      <bus
        name="ADDRESS"
        connections={[
          "SA0",
          "SA1",
          "SA2",
          "SA3",
          "SA4",
          "SA5",
          "SA6",
          "SA7",
          "SA8",
          "SA9",
          "SA10",
          "SA11",
          "SA12",
          "SA13",
          "SA14",
          "SA15",
        ]}
        maxLengthSkew={(6.35 * 16) / 15}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="ADDRESS_COMMAND"
        lengthMatchTo={[".ADDRESS"]}
        connections={[
          "SBA0",
          "SBA1",
          "SBA2",
          "SCAS",
          "SCKE0",
          "SCKE1",
          "SCS0",
          "SCS1",
          "SODT0",
          "SODT1",
          "SRAS",
          "SWE",
        ]}
        maxLengthSkew={19.717943}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
      />
      <bus
        name="SA0_TO_CLK"
        connections={["SA0"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA1_TO_CLK"
        connections={["SA1"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA2_TO_CLK"
        connections={["SA2"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA3_TO_CLK"
        connections={["SA3"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA4_TO_CLK"
        connections={["SA4"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA5_TO_CLK"
        connections={["SA5"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA6_TO_CLK"
        connections={["SA6"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA7_TO_CLK"
        connections={["SA7"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA8_TO_CLK"
        connections={["SA8"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA9_TO_CLK"
        connections={["SA9"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA10_TO_CLK"
        connections={["SA10"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA11_TO_CLK"
        connections={["SA11"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA12_TO_CLK"
        connections={["SA12"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA13_TO_CLK"
        connections={["SA13"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA14_TO_CLK"
        connections={["SA14"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SA15_TO_CLK"
        connections={["SA15"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA0_TO_CLK"
        connections={["SBA0"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA1_TO_CLK"
        connections={["SBA1"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SBA2_TO_CLK"
        connections={["SBA2"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCAS_TO_CLK"
        connections={["SCAS"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCKE0_TO_CLK"
        connections={["SCKE0"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCKE1_TO_CLK"
        connections={["SCKE1"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCS0_TO_CLK"
        connections={["SCS0"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SCS1_TO_CLK"
        connections={["SCS1"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SODT0_TO_CLK"
        connections={["SODT0"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SODT1_TO_CLK"
        connections={["SODT1"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SRAS_TO_CLK"
        connections={["SRAS"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      <bus
        name="SWE_TO_CLK"
        connections={["SWE"]}
        maxLengthSkew={15.907342}
        pcbAllowedLayers={["top", "inner1", "inner2", "bottom"]}
        lengthMatchTo={["SCKP", "SCKN"]}
      />
      {/* Escape the interior power balls, which are surrounded by pads on all four sides. */}
      <trace
        name="DQ0"
        path={[".U1 > .pin275", ".U2 > .pin27", "net.N0220"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ1"
        path={[".U1 > .pin210", ".U2 > .pin34", "net.N0222"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ10"
        path={[".U1 > .pin256", ".U2 > .pin17", "net.N0218"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ11"
        path={[".U1 > .pin206", ".U2 > .pin14", "net.N0216"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ12"
        path={[".U1 > .pin235", ".U2 > .pin4", "net.N0214"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ13"
        path={[".U1 > .pin190", ".U2 > .pin2", "net.N0212"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ14"
        path={[".U1 > .pin255", ".U2 > .pin11", "net.N0215"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ15"
        path={[".U1 > .pin189", ".U2 > .pin3", "net.N0213"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ2"
        path={[".U1 > .pin224", ".U2 > .pin32", "net.N0221"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ3"
        path={[".U1 > .pin226", ".U2 > .pin35", "net.N0223"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ4"
        path={[".U1 > .pin191", ".U2 > .pin45", "net.N0225"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ5"
        path={[".U1 > .pin209", ".U2 > .pin47", "net.N0227"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ6"
        path={[".U1 > .pin208", ".U2 > .pin38", "net.N0224"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ7"
        path={[".U1 > .pin192", ".U2 > .pin46", "net.N0226"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ8"
        path={[".U1 > .pin237", ".U2 > .pin22", "net.N0219"]}
        routingPhaseIndex={4}
      />
      <trace
        name="DQ9"
        path={[".U1 > .pin205", ".U2 > .pin15", "net.N0217"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SA0"
        path={[".U1 > .pin218", ".U2 > .pin75", "net.N0169"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA1"
        path={[".U1 > .pin229", ".U2 > .pin82", "net.N0177"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA10"
        path={[".U1 > .pin270", ".U2 > .pin64", "net.N0203"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA11"
        path={[".U1 > .pin268", ".U2 > .pin88", "net.N0201"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA12"
        path={[".U1 > .pin217", ".U2 > .pin76", "net.N0168"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA13"
        path={[".U1 > .pin230", ".U2 > .pin93", "net.N0178"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA14"
        path={[".U1 > .pin216", ".U2 > .pin94", "net.N0167"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA15"
        path={[".U1 > .pin269", ".U2 > .pin70", "net.N0202"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA2"
        path={[".U1 > .pin250", ".U2 > .pin81", "net.N0188"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA3"
        path={[".U1 > .pin231", ".U2 > .pin74", "net.N0179"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA4"
        path={[".U1 > .pin267", ".U2 > .pin83", "net.N0200"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA5"
        path={[".U1 > .pin232", ".U2 > .pin80", "net.N0180"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA6"
        path={[".U1 > .pin198", ".U2 > .pin89", "net.N0157"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA7"
        path={[".U1 > .pin252", ".U2 > .pin86", "net.N0190"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA8"
        path={[".U1 > .pin281", ".U2 > .pin95", "net.N0210"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SA9"
        path={[".U1 > .pin251", ".U2 > .pin87", "net.N0189"]}
        routingPhaseIndex={6}
      />
      <trace
        name="SBA0"
        path={[".U1 > .pin219", ".U2 > .pin68", "net.N0170"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SBA1"
        path={[".U1 > .pin266", ".U2 > .pin77", "net.N0199"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SBA2"
        path={[".U1 > .pin271", ".U2 > .pin69", "net.N0204"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SCAS"
        path={[".U1 > .pin200", ".U2 > .pin57", "net.N0158"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SCKE0"
        path={[".U1 > .pin280", ".U2 > .pin60", "net.N0209"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SCKE1"
        path={[".U1 > .pin215", ".U2 > .pin54", "net.N0166"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SCS0"
        path={[".U1 > .pin220", ".U2 > .pin62", "net.N0171"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SCS1"
        path={[".U1 > .pin202", ".U2 > .pin61", "net.N0159"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SDQM0"
        path={[".U1 > .pin253", ".U2 > .pin21", "net.N0191"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SDQM1"
        path={[".U1 > .pin223", ".U2 > .pin28", "net.N0174"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SDQS0N"
        path={[".U1 > .pin221", ".U2 > .pin10", "net.N0172"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SDQS0P"
        path={[".U1 > .pin222", ".U2 > .pin16", "net.N0173"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SDQS1N"
        path={[".U1 > .pin274", ".U2 > .pin39", "net.N0206"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SDQS1P"
        path={[".U1 > .pin254", ".U2 > .pin33", "net.N0192"]}
        routingPhaseIndex={4}
      />
      <trace
        name="SODT0"
        path={[".U1 > .pin203", ".U2 > .pin55", "net.N0160"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SODT1"
        path={[".U1 > .pin204", ".U2 > .pin49", "net.N0161"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SRAS"
        path={[".U1 > .pin248", ".U2 > .pin51", "net.N0187"]}
        routingPhaseIndex={7}
      />
      <trace
        name="SWE"
        path={[".U1 > .pin283", ".U2 > .pin63", "net.N0211"]}
        routingPhaseIndex={7}
      />
      <autoroutingphase
        name="BGA_ESCAPES"
        phaseIndex={0}
        autorouter="dogbone"
        fanoutRoutingLayers={["inner1", "inner2"]}
        connections={[
          ".U1 > .pin167",
          ".U1 > .pin121",
          ".U1 > .pin122",
          ".U1 > .pin136",
          ".U1 > .pin137",
          ".U1 > .pin138",
          ".U2 > .pin67",
          ".U1 > .pin272",
          ".U2 > .pin43",
          ".U2 > .pin65",
          ".U2 > .pin66",
          ".U2 > .pin71",
          ".U2 > .pin92",
          ".U1 > .pin207",
          ".U1 > .pin225",
          ".U1 > .pin236",
          ".U1 > .pin247",
          ".U2 > .pin8",
          ".U2 > .pin20",
          ".U2 > .pin23",
          ".U2 > .pin26",
          ".U2 > .pin29",
          ".U2 > .pin41",
          ".U2 > .pin44",
          ".U2 > .pin50",
          ".U2 > .pin53",
          ".U2 > .pin56",
          ".U2 > .pin59",
          ".U1 > .NATIVE_V3",
          ".U2 > .NATIVE_E3",
          ".U1 > .NATIVE_P6",
          ".U2 > .NATIVE_F7",
          ".U1 > .NATIVE_U4",
          ".U2 > .NATIVE_C8",
          ".U1 > .NATIVE_P2",
          ".U2 > .NATIVE_C2",
          ".U1 > .NATIVE_T2",
          ".U2 > .NATIVE_A7",
          ".U1 > .NATIVE_N3",
          ".U2 > .NATIVE_A2",
          ".U1 > .NATIVE_U3",
          ".U2 > .NATIVE_B8",
          ".U1 > .NATIVE_N2",
          ".U2 > .NATIVE_A3",
          ".U1 > .NATIVE_R4",
          ".U2 > .NATIVE_F2",
          ".U1 > .NATIVE_R6",
          ".U2 > .NATIVE_F8",
          ".U1 > .NATIVE_N4",
          ".U2 > .NATIVE_H3",
          ".U1 > .NATIVE_P5",
          ".U2 > .NATIVE_H8",
          ".U1 > .NATIVE_P4",
          ".U2 > .NATIVE_G2",
          ".U1 > .NATIVE_N5",
          ".U2 > .NATIVE_H7",
          ".U1 > .NATIVE_T4",
          ".U2 > .NATIVE_D7",
          ".U1 > .NATIVE_P1",
          ".U2 > .NATIVE_C3",
          ".U1 > .NATIVE_P18",
          ".U2 > .NATIVE_N3",
          ".U1 > .NATIVE_R15",
          ".U2 > .NATIVE_P7",
          ".U1 > .NATIVE_U19",
          ".U2 > .NATIVE_L7",
          ".U1 > .NATIVE_U17",
          ".U2 > .NATIVE_R7",
          ".U1 > .NATIVE_P16",
          ".U2 > .NATIVE_N7",
          ".U1 > .NATIVE_R18",
          ".U2 > .NATIVE_T3",
          ".U1 > .NATIVE_P15",
          ".U2 > .NATIVE_T7",
          ".U1 > .NATIVE_U18",
          ".U2 > .NATIVE_M7",
          ".U1 > .NATIVE_T18",
          ".U2 > .NATIVE_P3",
          ".U1 > .NATIVE_R19",
          ".U2 > .NATIVE_N2",
          ".U1 > .NATIVE_U16",
          ".U2 > .NATIVE_P8",
          ".U1 > .NATIVE_R20",
          ".U2 > .NATIVE_P2",
          ".U1 > .NATIVE_N13",
          ".U2 > .NATIVE_R8",
          ".U1 > .NATIVE_T21",
          ".U2 > .NATIVE_R2",
          ".U1 > .NATIVE_V17",
          ".U2 > .NATIVE_T8",
          ".U1 > .NATIVE_T20",
          ".U2 > .NATIVE_R3",
          ".U1 > .NATIVE_P20",
          ".U2 > .NATIVE_M2",
          ".U1 > .NATIVE_U15",
          ".U2 > .NATIVE_N8",
          ".U1 > .NATIVE_U20",
          ".U2 > .NATIVE_M3",
          ".U1 > .NATIVE_N16",
          ".U2 > .NATIVE_K3",
          ".U1 > .NATIVE_V15",
          ".U2 > .NATIVE_K9",
          ".U1 > .NATIVE_P13",
          ".U2 > .NATIVE_J9",
          ".U1 > .NATIVE_U14",
          ".U2 > .NATIVE_K7",
          ".U1 > .NATIVE_T14",
          ".U2 > .NATIVE_J7",
          ".U1 > .NATIVE_P21",
          ".U2 > .NATIVE_L2",
          ".U1 > .NATIVE_N19",
          ".U2 > .NATIVE_L1",
          ".U1 > .NATIVE_U1",
          ".U2 > .NATIVE_D3",
          ".U1 > .NATIVE_R3",
          ".U2 > .NATIVE_E7",
          ".U1 > .NATIVE_R1",
          ".U2 > .NATIVE_B7",
          ".U1 > .NATIVE_R2",
          ".U2 > .NATIVE_C7",
          ".U1 > .NATIVE_V2",
          ".U2 > .NATIVE_G3",
          ".U1 > .NATIVE_U2",
          ".U2 > .NATIVE_F3",
          ".U1 > .NATIVE_N20",
          ".U2 > .NATIVE_K1",
          ".U1 > .NATIVE_N21",
          ".U2 > .NATIVE_J1",
          ".U1 > .NATIVE_T16",
          ".U2 > .NATIVE_J3",
          ".U1 > .NATIVE_V20",
          ".U2 > .NATIVE_L3",
          ".U1 > .pin199",
          ".U2 > .pin72",
          ".U1 > .pin177",
          ".U1 > .pin178",
          ".U1 > .pin163",
          ".U1 > .pin1",
          ".U1 > .pin10",
          ".U1 > .pin107",
          ".U1 > .pin108",
          ".U1 > .pin123",
          ".U1 > .pin124",
          ".U1 > .pin127",
          ".U1 > .pin128",
          ".U1 > .pin13",
          ".U1 > .pin130",
          ".U1 > .pin131",
          ".U1 > .pin142",
          ".U1 > .pin143",
          ".U1 > .pin158",
          ".U1 > .pin159",
          ".U1 > .pin160",
          ".U1 > .pin161",
          ".U1 > .pin162",
          ".U1 > .pin182",
          ".U1 > .pin183",
          ".U1 > .pin184",
          ".U1 > .pin185",
          ".U1 > .pin19",
          ".U1 > .pin193",
          ".U1 > .pin195",
          ".U1 > .pin197",
          ".U1 > .pin201",
          ".U1 > .pin233",
          ".U1 > .pin234",
          ".U1 > .pin241",
          ".U1 > .pin249",
          ".U1 > .pin258",
          ".U1 > .pin264",
          ".U1 > .pin273",
          ".U1 > .pin276",
          ".U1 > .pin282",
          ".U1 > .pin284",
          ".U1 > .pin6",
          ".U1 > .pin69",
          ".U1 > .pin91",
          ".U2 > .pin85",
          ".U2 > .pin90",
          ".U1 > .pin31",
          ".U1 > .pin52",
          ".U1 > .pin68",
          ".U1 > .pin51",
          ".U1 > .pin144",
          ".U1 > .pin145",
          ".U1 > .pin24",
          ".U1 > .pin166",
          ".U1 > .pin151",
          ".U1 > .pin134",
          ".U1 > .pin133",
          ".U1 > .pin150",
          ".U1 > .pin147",
          ".U1 > .pin146",
          ".U1 > .pin97",
          ".U1 > .pin98",
          ".U1 > .pin66",
          ".U1 > .pin67",
          ".U1 > .pin85",
        ]}
      />
      <autoroutingphase
        name="CLOCK_ROUTING"
        phaseIndex={2}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="DDR_DATA_ROUTING"
        phaseIndex={4}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="DDR_ADDRESS_ROUTING"
        phaseIndex={6}
        autorouter="bus_lanes"
      />
      <autoroutingphase
        name="DDR_COMMAND_ROUTING"
        phaseIndex={7}
        autorouter="bus_lanes"
      />
      <net
        name={"N0001"}
        connectsTo={[
          ".C1 > .pin1",
          ".C10 > .pin1",
          ".C11 > .pin1",
          ".C12 > .pin1",
          ".C13 > .pin1",
          ".C39 > .pin1",
          ".C4 > .pin1",
          ".C5 > .pin1",
          ".C6 > .pin1",
          ".C8 > .pin1",
          ".C9 > .pin1",
          ".L4 > .pin2",
          ".R1 > .pin1",
          ".TP4 > .pin1",
          ".U1 > .pin172",
          ".U1 > .pin173",
          ".U1 > .pin174",
          ".U1 > .pin175",
          ".U1 > .pin176",
          ".U2 > .pin1",
          ".U2 > .pin13",
          ".U2 > .pin18",
          ".U2 > .pin20",
          ".U2 > .pin24",
          ".U2 > .pin30",
          ".U2 > .pin31",
          ".U2 > .pin40",
          ".U2 > .pin44",
          ".U2 > .pin48",
          ".U2 > .pin5",
          ".U2 > .pin56",
          ".U2 > .pin59",
          ".U2 > .pin73",
          ".U2 > .pin78",
          ".U2 > .pin8",
          ".U2 > .pin85",
          ".U2 > .pin90",
          ".U3 > .pin9",
        ]}
        nominalTraceWidth={0.25}
        routingPhaseIndex={10}
      />
      <net
        name={"N0002"}
        connectsTo={[
          ".C1 > .pin2",
          ".C2 > .pin1",
          ".C3 > .pin1",
          ".R1 > .pin2",
          ".R2 > .pin1",
          ".U2 > .pin43",
          ".U2 > .pin71",
        ]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0003"}
        isGroundNet
        connectsTo={[
          ".C10 > .pin2",
          ".C11 > .pin2",
          ".C12 > .pin2",
          ".C13 > .pin2",
          ".C14 > .pin2",
          ".C15 > .pin1",
          ".C16 > .pin1",
          ".C17 > .pin1",
          ".C18 > .pin1",
          ".C19 > .pin1",
          ".C2 > .pin2",
          ".C20 > .pin1",
          ".C21 > .pin1",
          ".C22 > .pin1",
          ".C23 > .pin1",
          ".C24 > .pin1",
          ".C25 > .pin1",
          ".C26 > .pin1",
          ".C27 > .pin1",
          ".C28 > .pin1",
          ".C29 > .pin2",
          ".C3 > .pin2",
          ".C30 > .pin2",
          ".C31 > .pin2",
          ".C32 > .pin2",
          ".C33 > .pin2",
          ".C34 > .pin1",
          ".C35 > .pin2",
          ".C36 > .pin2",
          ".C37 > .pin2",
          ".C38 > .pin1",
          ".C39 > .pin2",
          ".C4 > .pin2",
          ".C40 > .pin1",
          ".C41 > .pin1",
          ".C42 > .pin1",
          ".C43 > .pin1",
          ".C44 > .pin1",
          ".C45 > .pin1",
          ".C46 > .pin1",
          ".C47 > .pin1",
          ".C48 > .pin1",
          ".C49 > .pin1",
          ".C5 > .pin2",
          ".C50 > .pin1",
          ".C51 > .pin2",
          ".C52 > .pin2",
          ".C53 > .pin2",
          ".C54 > .pin2",
          ".C55 > .pin2",
          ".C56 > .pin2",
          ".C57 > .pin2",
          ".C58 > .pin2",
          ".C59 > .pin1",
          ".C6 > .pin2",
          ".C60 > .pin1",
          ".C61 > .pin2",
          ".C62 > .pin2",
          ".C63 > .pin2",
          ".C64 > .pin2",
          ".C65 > .pin1",
          ".C66 > .pin2",
          ".C67 > .pin2",
          ".C68 > .pin2",
          ".C69 > .pin2",
          ".C8 > .pin2",
          ".C9 > .pin2",
          ".D1 > .pin1",
          ".D2 > .pin1",
          ".D3 > .pin3",
          ".J1 > .pin10",
          ".J1 > .pin11",
          ".J1 > .pin6",
          ".J2 > .pin1",
          ".J2 > .pin16",
          ".J2 > .pin17",
          ".J2 > .pin8",
          ".J2 > .pin9",
          ".J3 > .pin1",
          ".J3 > .pin16",
          ".J3 > .pin17",
          ".J3 > .pin8",
          ".J3 > .pin9",
          ".R14 > .pin1",
          ".R19 > .pin2",
          ".R2 > .pin2",
          ".R21 > .pin1",
          ".R22 > .pin1",
          ".R3 > .pin2",
          ".R5 > .pin2",
          ".R6 > .pin2",
          ".R7 > .pin1",
          ".TP10 > .pin1",
          ".TP9 > .pin1",
          ".U1 > .pin1",
          ".U1 > .pin10",
          ".U1 > .pin107",
          ".U1 > .pin108",
          ".U1 > .pin109",
          ".U1 > .pin123",
          ".U1 > .pin124",
          ".U1 > .pin125",
          ".U1 > .pin126",
          ".U1 > .pin127",
          ".U1 > .pin128",
          ".U1 > .pin13",
          ".U1 > .pin130",
          ".U1 > .pin131",
          ".U1 > .pin140",
          ".U1 > .pin141",
          ".U1 > .pin142",
          ".U1 > .pin143",
          ".U1 > .pin155",
          ".U1 > .pin156",
          ".U1 > .pin157",
          ".U1 > .pin158",
          ".U1 > .pin159",
          ".U1 > .pin160",
          ".U1 > .pin161",
          ".U1 > .pin162",
          ".U1 > .pin182",
          ".U1 > .pin183",
          ".U1 > .pin184",
          ".U1 > .pin185",
          ".U1 > .pin19",
          ".U1 > .pin193",
          ".U1 > .pin195",
          ".U1 > .pin197",
          ".U1 > .pin199",
          ".U1 > .pin201",
          ".U1 > .pin207",
          ".U1 > .pin225",
          ".U1 > .pin233",
          ".U1 > .pin234",
          ".U1 > .pin236",
          ".U1 > .pin241",
          ".U1 > .pin243",
          ".U1 > .pin247",
          ".U1 > .pin249",
          ".U1 > .pin258",
          ".U1 > .pin264",
          ".U1 > .pin273",
          ".U1 > .pin276",
          ".U1 > .pin279",
          ".U1 > .pin282",
          ".U1 > .pin284",
          ".U1 > .pin29",
          ".U1 > .pin6",
          ".U1 > .pin69",
          ".U1 > .pin91",
          ".U1 > .pin92",
          ".U2 > .pin12",
          ".U2 > .pin19",
          ".U2 > .pin23",
          ".U2 > .pin25",
          ".U2 > .pin26",
          ".U2 > .pin29",
          ".U2 > .pin36",
          ".U2 > .pin37",
          ".U2 > .pin41",
          ".U2 > .pin42",
          ".U2 > .pin50",
          ".U2 > .pin53",
          ".U2 > .pin6",
          ".U2 > .pin67",
          ".U2 > .pin7",
          ".U2 > .pin72",
          ".U2 > .pin79",
          ".U2 > .pin84",
          ".U2 > .pin9",
          ".U2 > .pin91",
          ".U2 > .pin96",
          ".U3 > .pin11",
          ".U3 > .pin37",
          ".U3 > .pin38",
          ".U3 > .pin41",
          ".U3 > .pin42",
          ".U3 > .pin48",
          ".U3 > .pin49",
          ".U3 > .pin54",
          ".U3 > .pin57",
          ".U3 > .pin8",
          ".U4 > .pin29",
          ".U4 > .pin3",
          ".Y1 > .pin2",
          ".Y1 > .pin4",
        ]}
        nominalTraceWidth={0.25}
        routingPhaseIndex={10}
      />
      <net
        name={"N0004"}
        connectsTo={[
          ".C14 > .pin1",
          ".C19 > .pin2",
          ".C53 > .pin1",
          ".C58 > .pin1",
          ".R17 > .pin2",
          ".R18 > .pin2",
          ".TP7 > .pin1",
          ".U1 > .pin129",
          ".U1 > .pin132",
          ".U1 > .pin177",
          ".U1 > .pin60",
          ".U1 > .pin62",
          ".U1 > .pin63",
          ".U1 > .pin93",
          ".U3 > .pin2",
        ]}
        nominalTraceWidth={0.5}
        routingPhaseIndex={10}
      />
      <net
        name={"N0005"}
        connectsTo={[
          ".C15 > .pin2",
          ".C17 > .pin2",
          ".C20 > .pin2",
          ".C26 > .pin2",
          ".C27 > .pin2",
          ".C28 > .pin2",
          ".C29 > .pin1",
          ".C30 > .pin1",
          ".C31 > .pin1",
          ".C32 > .pin1",
          ".C33 > .pin1",
          ".C34 > .pin2",
          ".C66 > .pin1",
          ".C67 > .pin1",
          ".C68 > .pin1",
          ".C69 > .pin1",
          ".D4 > .pin2",
          ".J2 > .pin10",
          ".J2 > .pin15",
          ".J2 > .pin2",
          ".J2 > .pin7",
          ".TP8 > .pin1",
          ".U3 > .pin13",
          ".U3 > .pin18",
          ".U3 > .pin3",
          ".U3 > .pin30",
          ".U3 > .pin33",
          ".U3 > .pin34",
          ".U3 > .pin45",
          ".U3 > .pin46",
          ".U3 > .pin52",
          ".U3 > .pin53",
          ".U3 > .pin6",
          ".U4 > .pin7",
          ".U4 > .pin8",
        ]}
        nominalTraceWidth={0.5}
        routingPhaseIndex={10}
      />
      <net
        name={"N0006"}
        connectsTo={[
          ".C35 > .pin1",
          ".C36 > .pin1",
          ".C41 > .pin2",
          ".C43 > .pin2",
          ".C45 > .pin2",
          ".C47 > .pin2",
          ".L1 > .pin2",
          ".L2 > .pin2",
          ".TP2 > .pin1",
          ".U1 > .pin121",
          ".U1 > .pin122",
          ".U1 > .pin136",
          ".U1 > .pin137",
          ".U1 > .pin138",
          ".U1 > .pin139",
        ]}
        nominalTraceWidth={0.2}
        routingPhaseIndex={10}
      />
      <net
        name={"N0007"}
        connectsTo={[
          ".C37 > .pin1",
          ".C40 > .pin2",
          ".C42 > .pin2",
          ".C44 > .pin2",
          ".C46 > .pin2",
          ".C48 > .pin2",
          ".C49 > .pin2",
          ".C50 > .pin2",
          ".L3 > .pin2",
          ".TP3 > .pin1",
          ".U1 > .pin102",
          ".U1 > .pin103",
          ".U1 > .pin104",
          ".U1 > .pin105",
          ".U1 > .pin106",
          ".U1 > .pin86",
          ".U1 > .pin87",
          ".U1 > .pin88",
          ".U1 > .pin89",
          ".U1 > .pin90",
        ]}
        nominalTraceWidth={0.2}
        routingPhaseIndex={10}
      />
      <net
        name={"N0008"}
        connectsTo={[
          ".C38 > .pin2",
          ".L5 > .pin2",
          ".TP6 > .pin1",
          ".U3 > .pin10",
        ]}
        nominalTraceWidth={0.5}
        routingPhaseIndex={10}
      />
      <net
        name={"N0009"}
        connectsTo={[
          ".C16 > .pin2",
          ".C51 > .pin1",
          ".C52 > .pin1",
          ".C61 > .pin1",
          ".C62 > .pin1",
          ".R10 > .pin2",
          ".R12 > .pin2",
          ".R13 > .pin2",
          ".R20 > .pin1",
          ".R26 > .pin2",
          ".TP5 > .pin1",
          ".U1 > .pin135",
          ".U1 > .pin186",
          ".U1 > .pin61",
          ".U1 > .pin77",
          ".U1 > .pin84",
          ".U3 > .pin28",
        ]}
        nominalTraceWidth={0.4}
        routingPhaseIndex={10}
      />
      <net
        name={"N0010"}
        connectsTo={[
          ".C18 > .pin2",
          ".C23 > .pin2",
          ".U3 > .pin31",
          ".U3 > .pin32",
        ]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0011"}
        connectsTo={[
          ".D3 > .pin1",
          ".J2 > .pin13",
          ".J2 > .pin5",
          ".U4 > .pin5",
        ]}
        nominalTraceWidth={0.08}
        routingPhaseIndex={10}
      />
      <net
        name={"N0012"}
        connectsTo={[
          ".D3 > .pin2",
          ".J2 > .pin12",
          ".J2 > .pin4",
          ".U4 > .pin4",
        ]}
        nominalTraceWidth={0.08}
        routingPhaseIndex={10}
      />
      <net
        name={"N0015"}
        connectsTo={[".J2 > .pin3", ".R21 > .pin2"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0016"}
        connectsTo={[".C21 > .pin2", ".R8 > .pin1", ".U3 > .pin25"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0017"}
        connectsTo={[".C63 > .pin1", ".U1 > .pin64"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0018"}
        connectsTo={[
          ".C64 > .pin1",
          ".R20 > .pin2",
          ".R9 > .pin1",
          ".U1 > .pin9",
        ]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0019"}
        connectsTo={[".C57 > .pin1", ".U1 > .pin51"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0020"}
        connectsTo={[".C56 > .pin1", ".U1 > .pin68"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0021"}
        connectsTo={[".C55 > .pin1", ".U1 > .pin144"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0022"}
        connectsTo={[".C54 > .pin1", ".U1 > .pin145"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0023"}
        connectsTo={[".C59 > .pin2", ".U1 > .pin24", ".Y1 > .pin3"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0024"}
        connectsTo={[".C60 > .pin2", ".U1 > .pin46", ".Y1 > .pin1"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0025"}
        connectsTo={[".D1 > .pin2", ".R15 > .pin1"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0026"}
        connectsTo={[".D2 > .pin2", ".R16 > .pin1"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0027"}
        connectsTo={[".J1 > .pin1", ".U1 > .pin167"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0028"}
        connectsTo={[".J1 > .pin2", ".U1 > .pin166"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0029"}
        connectsTo={[".J1 > .pin3", ".R12 > .pin1", ".U1 > .pin151"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0030"}
        connectsTo={[".J1 > .pin4", ".R10 > .pin1"]}
        nominalTraceWidth={0.5}
        routingPhaseIndex={10}
      />
      <net
        name={"N0031"}
        connectsTo={[".J1 > .pin5", ".R11 > .pin1"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0032"}
        connectsTo={[".J1 > .pin7", ".U1 > .pin134"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0033"}
        connectsTo={[".J1 > .pin8", ".U1 > .pin133"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0034"}
        connectsTo={[
          ".J1 > .pin9",
          ".R13 > .pin1",
          ".R14 > .pin2",
          ".U1 > .pin150",
        ]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0036"}
        connectsTo={[".J2 > .pin11", ".R22 > .pin2"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0038"}
        connectsTo={[".J3 > .pin3", ".R23 > .pin2"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0039"}
        connectsTo={[".J3 > .pin12", ".J3 > .pin4", ".U1 > .pin147"]}
        nominalTraceWidth={0.08}
        routingPhaseIndex={10}
      />
      <net
        name={"N0040"}
        connectsTo={[".R3 > .pin1", ".U1 > .pin178"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0041"}
        connectsTo={[".J3 > .pin13", ".J3 > .pin5", ".U1 > .pin146"]}
        nominalTraceWidth={0.08}
        routingPhaseIndex={10}
      />
      <net
        name={"N0043"}
        connectsTo={[".J3 > .pin11", ".R24 > .pin2"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0045"}
        connectsTo={[".R15 > .pin2", ".U1 > .pin97"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0046"}
        connectsTo={[".R16 > .pin2", ".U1 > .pin98"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0047"}
        connectsTo={[".R11 > .pin2", ".U1 > .pin149"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0048"}
        connectsTo={[".R17 > .pin1", ".U1 > .pin52", ".U3 > .pin23"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0049"}
        connectsTo={[".R18 > .pin1", ".U1 > .pin31", ".U3 > .pin24"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0064"}
        connectsTo={[".R19 > .pin1", ".U1 > .pin163"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0065"}
        connectsTo={[".R25 > .pin1", ".U4 > .pin6"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0066"}
        connectsTo={[".R25 > .pin2", ".U4 > .pin9"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0113"}
        connectsTo={[".R26 > .pin1", ".U1 > .pin55"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0114"}
        connectsTo={[".TP11 > .pin1", ".U1 > .pin56"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0115"}
        connectsTo={[".TP12 > .pin1", ".U1 > .pin57"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0117"}
        connectsTo={[".TP13 > .pin1", ".U1 > .pin72"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0118"}
        connectsTo={[".U1 > .pin66", ".U4 > .pin26"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0121"}
        connectsTo={[".U1 > .pin67", ".U4 > .pin25"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0129"}
        connectsTo={[".U1 > .pin85", ".U3 > .pin47"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0149"}
        connectsTo={[".U1 > .pin171", ".U3 > .pin39", ".U3 > .pin40"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0241"}
        connectsTo={[".C22 > .pin2", ".U3 > .pin29"]}
        nominalTraceWidth={0.4}
        routingPhaseIndex={10}
      />
      <net
        name={"N0242"}
        connectsTo={[".C24 > .pin2", ".U3 > .pin1"]}
        nominalTraceWidth={0.25}
        routingPhaseIndex={10}
      />
      <net
        name={"N0243"}
        connectsTo={[".C25 > .pin2", ".U3 > .pin19"]}
        nominalTraceWidth={0.2}
        routingPhaseIndex={10}
      />
      <net
        name={"N0244"}
        connectsTo={[".L1 > .pin1", ".U3 > .pin43", ".U3 > .pin44"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0245"}
        connectsTo={[".L2 > .pin1", ".U3 > .pin35", ".U3 > .pin36"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0246"}
        connectsTo={[".L3 > .pin1", ".U3 > .pin50", ".U3 > .pin51"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0247"}
        connectsTo={[".L4 > .pin1", ".U3 > .pin7"]}
        nominalTraceWidth={0.15}
        routingPhaseIndex={10}
      />
      <net
        name={"N0248"}
        connectsTo={[".L5 > .pin1", ".U3 > .pin12"]}
        nominalTraceWidth={0.4}
        routingPhaseIndex={10}
      />
      <net
        name={"N0249"}
        connectsTo={[".R5 > .pin1", ".U2 > .pin66"]}
        nominalTraceWidth={0.09}
        routingPhaseIndex={1}
      />
      <net
        name={"N0250"}
        connectsTo={[".R6 > .pin1", ".U2 > .pin65"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={1}
      />
      <net
        name={"N0251"}
        connectsTo={[".R7 > .pin2", ".R8 > .pin2", ".U3 > .pin26"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0252"}
        connectsTo={[".R9 > .pin2", ".U3 > .pin15"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0253"}
        connectsTo={[".TP1 > .pin1", ".U3 > .pin27"]}
        nominalTraceWidth={0.1}
        routingPhaseIndex={10}
      />
      <net
        name={"N0264"}
        connectsTo={[
          ".C65 > .pin2",
          ".D4 > .pin1",
          ".J3 > .pin10",
          ".J3 > .pin15",
          ".J3 > .pin2",
          ".J3 > .pin7",
          ".R23 > .pin1",
          ".R24 > .pin1",
        ]}
        nominalTraceWidth={0.4}
        routingPhaseIndex={10}
      />
      <autoroutingphase
        name="RAM_TERMINATIONS"
        phaseIndex={1}
        autorouter="auto_local"
      />
      <autoroutingphase
        name={"BOARD_ROUTING"}
        phaseIndex={10}
        autorouter={"auto_local"}
      />
      <pcbnotetext
        pcbY={42}
        fontSize={1}
        text={"H616: 121 nets, 125 components; original DDR skew constraints"}
      />
    </board>
  )
}
