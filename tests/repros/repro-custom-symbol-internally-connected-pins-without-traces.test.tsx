import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const pinLabels = {
  pin1: ["S3"],
  pin2: ["S2"],
  pin3: ["S1"],
  pin4: ["G"],
  pin5: ["D"],
} as const

export const DMT6007LFG_7 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port
            name="pin2"
            pinNumber={2}
            aliases={["S2"]}
            direction="down"
            schX={0}
            schY={-0.4}
            schStemLength={0.2}
          />
          <port
            name="pin4"
            pinNumber={4}
            aliases={["G"]}
            direction="left"
            schX={-0.4}
            schY={0}
            schStemLength={0.2}
          />
          <port
            name="pin5"
            pinNumber={5}
            aliases={["D"]}
            direction="up"
            schX={0}
            schY={0.4}
            schStemLength={0.2}
          />
          <schematicpath
            points={[
              { x: 0.28, y: 0.04 },
              { x: 0.24, y: 0.04 },
              { x: 0.16, y: 0.04 },
              { x: 0.12, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: -0.18 },
              { x: -0.2, y: -0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: -0.04 },
              { x: -0.2, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0.18 },
              { x: -0.2, y: 0.1 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.24, y: 0.18 },
              { x: -0.24, y: -0.18 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0, y: -0.14 },
              { x: -0.2, y: -0.14 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0 },
              { x: 0, y: 0 },
              { x: 0, y: -0.2 },
              { x: 0.2, y: -0.2 },
              { x: 0.2, y: -0.06 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0.14 },
              { x: 0, y: 0.14 },
              { x: 0, y: 0.2 },
              { x: 0.2, y: 0.2 },
              { x: 0.2, y: 0.04 },
            ]}
            strokeColor="#880000"
          />
          <schematicpath
            points={[
              { x: 0.2, y: 0.04 },
              { x: 0.14, y: -0.06 },
              { x: 0.26, y: -0.06 },
              { x: 0.2, y: 0.04 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#FEFEFE"
          />
          <schematicpath
            points={[
              { x: -0.2, y: 0 },
              { x: -0.08, y: -0.04 },
              { x: -0.08, y: 0.04 },
              { x: -0.2, y: 0 },
            ]}
            strokeColor="#880000"
            isFilled
            fillColor="#FEFEFE"
          />
          <port
            name="pin1"
            pinNumber={1}
            aliases={["S3"]}
            direction="down"
            schX={-0.2}
            schY={-0.4}
            schStemLength={0.1}
          />
          <port
            name="pin3"
            pinNumber={3}
            aliases={["S1"]}
            direction="down"
            schX={0.2}
            schY={-0.4}
            schStemLength={0.1}
          />
          <schematicpath
            points={[
              { x: -0.2, y: -0.3 },
              { x: 0.2, y: -0.3 },
            ]}
            strokeColor="#880000"
          />
        </symbol>
      }
      supplierPartNumbers={{
        jlcpcb: ["C2802568"],
      }}
      manufacturerPartNumber="DMT6007LFG-7"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin4"]}
            pcbX="0.974979mm"
            pcbY="-1.50499445mm"
            width="0.419989mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.324993mm"
            pcbY="-1.50499445mm"
            width="0.419989mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="-0.324993mm"
            pcbY="-1.50499445mm"
            width="0.419989mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.974979mm"
            pcbY="-1.50499445mm"
            width="0.419989mm"
            height="0.6999986mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            points={[
              { x: "-1.1999976mm", y: "-0.39498905mm" },
              { x: "-1.1999976mm", y: "1.85499375mm" },
              { x: "-0.7499858mm", y: "1.85499375mm" },
              { x: "-0.7499858mm", y: "1.26500255mm" },
              { x: "-0.5499862mm", y: "1.26500255mm" },
              { x: "-0.5499862mm", y: "1.85499375mm" },
              { x: "-0.0999998mm", y: "1.85499375mm" },
              { x: "-0.0999998mm", y: "1.26500255mm" },
              { x: "0.0999998mm", y: "1.26500255mm" },
              { x: "0.0999998mm", y: "1.85499375mm" },
              { x: "0.5500116mm", y: "1.85499375mm" },
              { x: "0.5500116mm", y: "1.26500255mm" },
              { x: "0.7500112mm", y: "1.26500255mm" },
              { x: "0.7500112mm", y: "1.85499375mm" },
              { x: "1.1999976mm", y: "1.85499375mm" },
              { x: "1.1999976mm", y: "-0.39498905mm" },
              { x: "-1.1999976mm", y: "-0.39498905mm" },
            ]}
            shape="polygon"
          />
          <silkscreenpath
            route={[
              { x: -0.8850629999999455, y: -2.4849264500001027 },
              { x: -0.8893211813402786, y: -2.517270548428428 },
              { x: -0.9018055373397829, y: -2.547410450000143 },
              { x: -0.9216652797686038, y: -2.5732921702314115 },
              { x: -0.9475469999998722, y: -2.5931519126602325 },
              { x: -0.9776869015715874, y: -2.6056362686598504 },
              { x: -1.0100309999999126, y: -2.6098944500001835 },
              { x: -1.0423750984283515, y: -2.6056362686598504 },
              { x: -1.072514999999953, y: -2.5931519126602325 },
              { x: -1.0983967202313352, y: -2.5732921702314115 },
              { x: -1.118256462660156, y: -2.547410450000143 },
              { x: -1.1307408186596604, y: -2.517270548428428 },
              { x: -1.1349989999999934, y: -2.4849264500001027 },
              { x: -1.1307408186596604, y: -2.4525823515717775 },
              { x: -1.118256462660156, y: -2.4224424500000623 },
              { x: -1.0983967202313352, y: -2.3965607297689075 },
              { x: -1.072514999999953, y: -2.376700987339973 },
              { x: -1.0423750984283515, y: -2.364216631340355 },
              { x: -1.0100309999999126, y: -2.359958450000022 },
              { x: -0.9776869015715874, y: -2.364216631340355 },
              { x: -0.9475469999998722, y: -2.376700987339973 },
              { x: -0.9216652797686038, y: -2.3965607297689075 },
              { x: -0.9018055373397829, y: -2.4224424500000623 },
              { x: -0.8893211813402786, y: -2.4525823515717775 },
              { x: -0.8850629999999455, y: -2.4849264500001027 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="0.000127mm"
            pcbY="3.12212555mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -2.0278729999999996, y: 2.3721255499999643 },
              { x: 2.0281270000000404, y: 2.3721255499999643 },
              { x: 2.0281270000000404, y: -2.8776744499999722 },
              { x: -2.0278729999999996, y: -2.8776744499999722 },
              { x: -2.0278729999999996, y: 2.3721255499999643 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2802568.obj?uuid=7326ba298fbd406bbed597220d6d7da9",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2802568.step?uuid=7326ba298fbd406bbed597220d6d7da9",
        pcbRotationOffset: 0,
        modelOriginPosition: {
          x: 0.000012699999956566899,
          y: -0.0050228499999320775,
          z: -0.01,
        },
      }}
      {...props}
    />
  )
}
test("imported DMT6007LFG_7 custom symbol supports internallyConnectedPins without traces or netlabels", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm">
      <DMT6007LFG_7 name="Q1" internallyConnectedPins={[[1, 2, 3]]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourcePortsById = new Map(
    circuit.db.source_port
      .list()
      .map((sourcePort) => [sourcePort.source_port_id, sourcePort]),
  )
  const internalConnections =
    circuit.db.source_component_internal_connection.list()

  expect(circuit.db.source_trace.list()).toHaveLength(0)
  expect(internalConnections).toHaveLength(1)
  expect(
    internalConnections[0].source_port_ids
      .map((sourcePortId) => sourcePortsById.get(sourcePortId)?.pin_number)
      .sort((pinNumberA, pinNumberB) =>
        pinNumberA !== undefined && pinNumberB !== undefined
          ? pinNumberA - pinNumberB
          : 0,
      ),
  ).toEqual([1, 2, 3])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
