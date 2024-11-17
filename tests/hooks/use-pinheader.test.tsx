import { test, expect } from "bun:test";
import { Circuit } from "lib/Circuit";
import { usePinHeader } from "lib/hooks/use-pinheader";

test("usePinheader hook creates component with correct props", () => {
  const circuit = new Circuit();

  const useHeader = usePinHeader("Header", {
    pinLabels: ["VCC", "GND", "TX", "RX"],
  });

  const Header = useHeader("Header", {
    pinCount: 4,
    pinLabels: ["VCC", "GND", "TX", "RX"],
  });

  circuit.add(
    <board width="10mm" height="10mm">
      <Header pin1="net.GND" pin2="net.VCC" pin3="net.TX" pin4="net.RX" />
    </board>
  );

  circuit.render();

  // Check if pinheader component was created correctly
  const pinheader = circuit.selectOne("pinheader");
  expect(pinheader).not.toBeNull();
  expect(pinheader!.props.name).toBe("Header");
  expect(pinheader!.props.pinCount).toBe(4);
  expect(pinheader!.props.pinLabels).toEqual(["VCC", "GND", "TX", "RX"]);
});
