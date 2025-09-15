import { test, expect } from "bun:test";
import "lib/register-catalogue";
import { getTestFixture } from "../fixtures/get-test-fixture";
import type { ChipProps } from "@tscircuit/props";

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
  pin7: ["pin7"],
  pin8: ["common", "C"],
} as const;

const RS_03 = (props: ChipProps<typeof pinLabels>) => (
  <chip
    pinLabels={pinLabels}
    supplierPartNumbers={{
      jlcpcb: ["C7428714"],
    }}
    schPinArrangement={{
      leftSide: {
        pins: ["C"],
        direction: "top-to-bottom",
      },
      rightSide: {
        pins: ["pin1", "pin2", "pin3", "pin4", "pin5", "pin6", "pin7"],
        direction: "top-to-bottom",
      },
    }}
    manufacturerPartNumber="RS_03"
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          pcbX="1.7960339999999633mm"
          pcbY="1.7960339999999633mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin2"]}
          pcbX="2.5399999999999636mm"
          pcbY="0mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin3"]}
          pcbX="1.7960339999999633mm"
          pcbY="-1.7960339999999633mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin4"]}
          pcbX="0mm"
          pcbY="-2.5399999999999636mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin5"]}
          pcbX="-1.7960339999999633mm"
          pcbY="-1.7960339999999633mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin6"]}
          pcbX="-2.5399999999999636mm"
          pcbY="0mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin7"]}
          pcbX="-1.7960339999999633mm"
          pcbY="1.7960339999999633mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <platedhole
          portHints={["pin8"]}
          pcbX="0mm"
          pcbY="2.5399999999999636mm"
          outerDiameter="1.499997mm"
          holeDiameter="0.9000235999999999mm"
          shape="circle"
        />
        <silkscreenpath
          route={[
            { x: -0.6349999999999909, y: 4.699000000000069 },
            { x: -0.6349999999999909, y: 5.461000000000013 },
            { x: 0.6349999999999909, y: 5.461000000000013 },
            { x: 0.6349999999999909, y: 4.699000000000069 },
          ]}
        />
      </footprint>
    }
    cadModel={{
      objUrl:
        "https://modelcdn.tscircuit.com/easyeda_models/download?uuid=a1e5e433dfbd402f854a03c19c373fbf&pn=C7428714",
      rotationOffset: { x: 0, y: 0, z: 0 },
      positionOffset: { x: 0, y: 0, z: 0 },
    }}
    {...props}
  />
);

// Reproduction for overlapping plated holes when using grid layout with mm string gap

test("rs03 grid layout gap string does not cause overlapping holes", () => {
  const { circuit } = getTestFixture();

  circuit.add(
    <board width="10mm" height="10mm">
      <group
        subcircuit
        pcbLayout={{ gridCols: 3, gridRows: 3, grid: true, gridGap: "10mm" }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <RS_03 name={`S${n}`} key={n} />
        ))}
      </group>
    </board>,
  );

  circuit.render();

  const holes = circuit.db.pcb_plated_hole.list();
  const coords = holes.map((h) => `${h.x.toFixed(3)},${h.y.toFixed(3)}`);
  const unique = new Set(coords);
  expect(unique.size).toBe(holes.length);

  for (let i = 0; i < holes.length; i++) {
    for (let j = i + 1; j < holes.length; j++) {
      const h1 = holes[i] as any;
      const h2 = holes[j] as any;
      const dx = h1.x - h2.x;
      const dy = h1.y - h2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const h1Size =
        "outer_diameter" in h1
          ? h1.outer_diameter
          : Math.max(h1.outer_width, h1.outer_height);
      const h2Size =
        "outer_diameter" in h2
          ? h2.outer_diameter
          : Math.max(h2.outer_width, h2.outer_height);
      const minDistance = Math.max(h1Size, h2Size);
      expect(distance).toBeGreaterThan(minDistance);
    }
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path);
});
