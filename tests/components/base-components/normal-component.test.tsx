import { it, expect } from "bun:test";

import { NormalComponent } from "lib/components/base-components/NormalComponent";
import { Footprint } from "lib/components/primitive-components/Footprint";
import type { Port } from "lib/components/primitive-components/Port";
import { SmtPad } from "lib/components/primitive-components/SmtPad";

it("should be able to get ports from footprinter string footprint prop", () => {
  const component = new NormalComponent<any>({
    name: "test",
    footprint: "0402",
  });

  component.doInitialInitializePortsFromChildren();

  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[];

  expect(ports.map((p) => p.props.name)).toEqual(
    expect.arrayContaining(["pin1", "pin2"]),
  );
});

it("should be able to get ports from Footprint class", () => {
  const footprint = new Footprint({});

  footprint.add(
    new SmtPad({
      layer: "top",
      shape: "circle",
      radius: 0.2,
      portHints: ["pin1"],
    }),
  );

  const component = new NormalComponent<any>({
    name: "test",
    footprint: footprint,
  });

  component.doInitialInitializePortsFromChildren();

  const ports = component.children.filter(
    (c) => c.componentName === "Port",
  ) as Port[];

  expect(ports.map((p) => p.props.name)).toEqual(["pin1"]);
});
