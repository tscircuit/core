import type { CommonLayoutProps } from "@tscircuit/props";
import { test, expect } from "bun:test";
import { getTestFixture } from "../fixtures/get-test-fixture";

test("example14-shared-port-hints", async () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="20mm" height="30mm">
      <MyComponent name="U1" />
    </board>,
  );

  circuit.render();
});

const MyComponent = (props: { name: string }) => {
  return (
    <chip
      {...props}
      footprint={
        <footprint>
          <platedhole
            portHints={["1"]}
            pcbX="-8.89mm"
            pcbY="7.62mm"
            outerDiameter="1.27mm"
            holeDiameter="0.7mm"
            shape="circle"
          />
          <smtpad
            portHints={["1"]}
            pcbX="-8.278mm"
            pcbY="7.62mm"
            width="1.626mm"
            height="1.325mm"
            shape="rect"
          />
        </footprint>
      }
    />
  );
};
