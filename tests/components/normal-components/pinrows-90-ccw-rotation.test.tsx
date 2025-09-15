import { test, expect } from "bun:test";
import "lib/register-catalogue";
import { getTestFixture } from "tests/fixtures/get-test-fixture";

test("pinrow5", () => {
  const { circuit } = getTestFixture();

  const pinLabelStyles = [
    {
      name: "top",
      suffix: "_pinlabeltextaligncenter",
      isDefaultStyle: true,
    },
    {
      name: "bottom",
      suffix: "_pinlabeltextaligncenter_pinlabelverticallyinverted",
      isDefaultStyle: false,
    },
    {
      name: "left",
      suffix: "_pinlabeltextalignleft",
      isDefaultStyle: false,
    },
    {
      name: "right",
      suffix: "_pinlabeltextalignright",
      isDefaultStyle: false,
    },
  ];

  const textOrientationStyles = [
    {
      name: "default_orientation",
      suffix: "",
      isDefaultOrientation: true,
    },
    {
      name: "orthogonal_orientation",
      suffix: "_pinlabelorthogonal",
      isDefaultOrientation: false,
    },
  ];

  const jumpers = [];

  for (let i = 0; i < pinLabelStyles.length; i++) {
    const style = pinLabelStyles[i];
    for (let j = 0; j < textOrientationStyles.length; j++) {
      const orientation = textOrientationStyles[j];
      let def = `pinrow3`;

      if (!(style.isDefaultStyle && orientation.isDefaultOrientation)) {
        def += style.suffix;
      }
      def += orientation.suffix;
      jumpers.push(
        <jumper
          name={def}
          footprint={def}
          pcbX={j * 15 - 5}
          pcbY={i * 22 - 30}
          pcbRotation={90}
        />,
      );
    }
  }

  circuit.add(
    <board width="30mm" height="88mm">
      {jumpers}
    </board>,
  );
  circuit.render();
  const soup = circuit.getCircuitJson();
  expect(soup).toMatchPcbSnapshot(import.meta.path);
});
