import { test, expect } from "bun:test";
import { createUseComponent } from "lib/hooks/create-use-component";
import type { CommonLayoutProps } from "@tscircuit/props";
import { getTestFixture } from "../../fixtures/get-test-fixture";

const pinLabels = {
  "1": "pos",
  "2": "neg",
} as const;
const pinNames = Object.values(pinLabels);

interface Props extends CommonLayoutProps {
  name: string;
}

let staticAssetsServerUrl = "";

const RedLed = (props: Props) => {
  return (
    <chip
      {...props}
      cadModel={{
        objUrl: `${staticAssetsServerUrl}/models/C965799.obj`,
        rotationOffset: { x: 0, y: 0, z: 0 },
        positionOffset: { x: 0, y: 0, z: 0 },
      }}
      pinLabels={pinLabels}
      schPinSpacing={0.75}
      schPinArrangement={{
        leftSide: {
          direction: "top-to-bottom",
          pins: [1],
        },
        rightSide: {
          direction: "bottom-to-top",
          pins: [2],
        },
      }}
      supplierPartNumbers={{
        jlcpcb: ["C965799"],
      }}
      footprint={
        <footprint>
          <smtpad
            portHints={["2"]}
            pcbX="-0.7995919999999614mm"
            pcbY="-0.003428999999982807mm"
            width="0.7999983999999999mm"
            height="0.7999983999999999mm"
            shape="rect"
          />
          <smtpad
            portHints={["1"]}
            pcbX="0.7995919999999614mm"
            pcbY="0.003428999999982807mm"
            width="0.7999983999999999mm"
            height="0.7999983999999999mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: -0.3235452000000123 },
              { x: 0.2105660000000853, y: -0.3235452000000123 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.3564890000001242 },
              { x: 0.22047200000019984, y: 0.3464814000001297 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.3564890000001242 },
              { x: 0.22047200000019984, y: -0.3235452000000123 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.24051260000010188, y: 0.7565136000000621 },
              { x: 1.3905738000000838, y: 0.7565136000000621 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.24051260000010188, y: -0.7436103999999659 },
              { x: 1.3905738000000838, y: -0.7436103999999659 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 1.3905738000000838, y: 0.7564628000000084 },
              { x: 1.3905738000000838, y: -0.7235189999998966 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1394967999997334, y: -0.7458963999999924 },
              { x: -1.1896089999999049, y: -0.7458963999999924 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: -0.345795599999974 },
              { x: -1.4895575999997845, y: -0.4458207999998649 },
              { x: -1.1896089999999049, y: -0.7458963999999924 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: 0.3541268000000173 },
              { x: -1.4895575999997845, y: -0.345795599999974 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.4895575999997845, y: 0.3541268000000173 },
              { x: -1.4895575999997845, y: 0.4542790000000423 },
              { x: -1.1896089999999049, y: 0.7542276000000356 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -0.1394967999997334, y: 0.7542276000000356 },
              { x: -1.1896089999999049, y: 0.7542276000000356 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 0.22047200000019984, y: 0.006477000000018052 },
              { x: -0.11953239999991183, y: 0.006477000000018052 },
            ]}
          />
        </footprint>
      }
    />
  );
};

const useRedLed = createUseComponent(RedLed, pinNames);

test("<RedLed /> component name validation", async () => {
  const { circuit, staticAssetsServerUrl: url } = getTestFixture({
    withStaticAssetsServer: true,
  });
  staticAssetsServerUrl = url!;
  const RedLedComp = useRedLed("LED") as typeof RedLed;

  // Successful case with original name
  expect(() => {
    circuit.add(
      <board width="12mm" height="10mm">
        <RedLedComp name="LED" schX={0} />
      </board>,
    );
  }).not.toThrow();

  // More explicit error catching
  let errorThrown = false;
  try {
    circuit.add(
      <board width="12mm" height="10mm">
        <RedLedComp name="different_led_name" schX={0} />
      </board>,
    );
  } catch (error: unknown) {
    errorThrown = true;
    if (error instanceof Error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch(
        /Component name mismatch. Hook name: LED, Component prop name: different_led_name/,
      );
    } else {
      throw new Error("Unexpected error type");
    }
  }
  expect(errorThrown).toBe(true);
});
