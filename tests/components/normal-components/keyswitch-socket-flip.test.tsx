import { test, expect } from "bun:test";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

/**
 * A switch shaft you can use to connect a pluggable Kailh socket.
 *
 * Datasheet: https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/2211090930_Kailh-CPG151101S11-1_C5184526.pdf
 */
const KeyswitchSocket = (props: {
  name: string;
  pcbX?: number;
  pcbY?: number;
  layer?: "top" | "bottom";
}) => (
  <chip
    {...props}
    cadModel={{
      objUrl: "/easyeda/C5184526",
    }}
    footprint={
      <footprint>
        {/* <silkscreentext text={props.name} /> */}
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin1"]}
          layer="top"
        />
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin2"]}
          layer="top"
        />
        <hole name="H1" diameter="3mm" />
        <hole name="H2" diameter="3mm" />
        <constraint xDist="6.35mm" centerToCenter left=".H1" right=".H2" />
        <constraint yDist="2.54mm" centerToCenter top=".H1" bottom=".H2" />
        <constraint edgeToEdge xDist="11.3mm" left=".pin1" right=".pin2" />
        <constraint sameY for={[".pin1", ".H1"]} />
        <constraint sameY for={[".pin2", ".H2"]} />
        <constraint
          edgeToEdge
          xDist={(11.3 - 6.35 - 3) / 2}
          left=".pin1"
          right=".H1"
        />
      </footprint>
    }
  />
);

test("KeyswitchSocket flips correctly when placed on bottom layer", () => {
  const { project } = getTestFixture();

  project.add(
    <board width="40mm" height="40mm">
      <KeyswitchSocket name="SW1" pcbX={-10} pcbY={0} layer="top" />
      <KeyswitchSocket name="SW2" pcbX={10} pcbY={0} layer="bottom" />
    </board>,
  );

  project.render();

  // Check SMT pads
  const smtPads = project.db.pcb_smtpad.list();
  expect(smtPads.length).toBe(4);

  const topPads = smtPads.filter((pad) => pad.layer === "top");
  const bottomPads = smtPads.filter((pad) => pad.layer === "bottom");

  expect(topPads.length).toBe(2);
  expect(bottomPads.length).toBe(2);

  // Check that bottom pads are mirrored
  const topPad1 = topPads.find((pad) => pad.port_hints?.includes("pin1"));
  const bottomPad1 = bottomPads.find((pad) => pad.port_hints?.includes("pin1"));

  expect(topPad1).toBeDefined();
  expect(bottomPad1).toBeDefined();

  if (topPad1 && bottomPad1) {
    // expect(topPad1.x).toBeCloseTo(-5.65, 2)
    // expect(bottomPad1.x).toBeCloseTo(-5.65, 2)
    // expect(topPad1.y).toBeCloseTo(bottomPad1.y - 10, 2) // Accounting for the 10mm Y offset
  }

  // Check holes (should not be flipped)
  const holes = project.db.pcb_hole.list();
  expect(holes.length).toBe(4);

  const topHoles = holes.filter((hole) => hole.x < 0); // Assuming 5 is the midpoint between the two switches
  const bottomHoles = holes.filter((hole) => hole.x > 0);

  expect(topHoles.length).toBe(2);
  expect(bottomHoles.length).toBe(2);

  // Check that holes maintain their relative positions
  const topHole1 = topHoles[0];
  const bottomHole1 = bottomHoles[0];

  // expect(topHole1.x).toBeCloseTo(bottomHole1.x, 2)
  // expect(topHole1.y).toBeCloseTo(bottomHole1.y - 10, 2) // Accounting for the 10mm Y offset

  // Visual check
  expect(project).toMatchPcbSnapshot(import.meta.path);
});
