import { test, expect } from "bun:test";
import { Circuit } from "lib";
import { Group } from "lib/components/primitive-components/Group/Group.ts";

test("should render group as single box with external pins arranged", () => {
  const circuit = new Circuit();

  // Create Group instance directly
  const group = new Group({
    name: "BoxGroup",
    showAsBox: true,
    connections: { D1: "Header1.pin1", D2: "Header2.pin1" },
    schSpacing: 0.25,
    schWidth: 6,
    schHeight: 4,
    schPinArrangement: {
      left: { pins: ["D1"], direction: "top-to-bottom" },
      right: { pins: ["D2"], direction: "bottom-to-top" },
    },
  } as any);

  circuit.add(group);
  circuit.render();

  // Assert schematic box exists with expected dimensions
  const boxes = circuit.db.schematic_box.list();
  expect(boxes.length).toBeGreaterThan(0);

  const box = boxes[0];
  expect(box).toBeDefined();
  expect(box.width).toBeCloseTo(6);
  expect(box.height).toBeCloseTo(4);

  // Assert schematic ports for external pins D1 and D2
  const ports = circuit.db.schematic_port
    .list()
    .filter((p: any) => ["D1", "D2"].includes(p.name));
  expect(ports.length).toBe(2);
});
