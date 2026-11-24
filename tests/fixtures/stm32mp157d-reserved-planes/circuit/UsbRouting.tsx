import React from "react"
import { pinFor, dramPinFor } from "./stm32mp157"
import { routingPhase } from "./RoutingPhases"
/** Named end-to-end paths give the differential-pair checker unambiguous terminals.
 * ESD pads and the reversible connector's duplicate contacts remain on each net.
 * The completed route must pass the USB pair and connectivity checks, including stubs.
 */
export function UsbRouting({ busesOnly = false }: { busesOnly?: boolean }) {
  const links = [
    [
      "PC",
      `U70.${pinFor("USB_DP2")}`,
      `U70.${pinFor("USB_DM2")}`,
      "J2.A6",
      "J2.A7",
    ],
    [
      "HOST",
      `U70.${pinFor("USB_DP1")}`,
      `U70.${pinFor("USB_DM1")}`,
      "U20.pin59",
      "U20.pin58",
    ],
    ["M1", "U20.pin2", "U20.pin1", "J8.A6", "J8.A7"],
    ["M2", "U20.pin4", "U20.pin3", "J9.A6", "J9.A7"],
    ["M3", "U20.pin7", "U20.pin6", "J10.A6", "J10.A7"],
    ["M4", "U20.pin9", "U20.pin8", "J11.A6", "J11.A7"],
    ["CAM", "U20.pin12", "U20.pin11", "J3.A6", "J3.A7"],
  ]
  return (
    <>
      {links.map(([n, sp, sm, ep, em]) => (
        <React.Fragment key={n}>
          <trace
            name={`${n}_path_DP`}
            routingPhaseIndex={busesOnly ? undefined : routingPhase.usb}
            from={sp}
            to={ep}
            thickness={0.2}
            schDisplayLabel={`${n}_USB_DP`}
          />
          <trace
            name={`${n}_path_DM`}
            routingPhaseIndex={busesOnly ? undefined : routingPhase.usb}
            from={sm}
            to={em}
            thickness={0.2}
            schDisplayLabel={`${n}_USB_DM`}
          />
          <differentialpair
            name={`${n}_USB`}
            positiveConnection={`${n}_path_DP`}
            negativeConnection={`${n}_path_DM`}
            maxLengthSkew={0.15}
            targetDifferentialImpedance={90}
            maxUncoupledLength={2}
          />
        </React.Fragment>
      ))}
      {["CLK", "DQS0", "DQS1"].map((n) => (
        <React.Fragment key={n}>
          <trace
            name={`DDR_${n}_P_path`}
            routingPhaseIndex={
              busesOnly
                ? undefined
                : n === "DQS0"
                  ? routingPhase.ddrByte0
                  : n === "DQS1"
                    ? routingPhase.ddrByte1
                    : routingPhase.ddr
            }
            from={`U70.${pinFor(`DDR_${n}P`)}`}
            to={`U71.${dramPinFor(`DDR_${n}P`)}`}
            thickness={0.15}
          />
          <trace
            name={`DDR_${n}_N_path`}
            routingPhaseIndex={
              busesOnly
                ? undefined
                : n === "DQS0"
                  ? routingPhase.ddrByte0
                  : n === "DQS1"
                    ? routingPhase.ddrByte1
                    : routingPhase.ddr
            }
            from={`U70.${pinFor(`DDR_${n}N`)}`}
            to={`U71.${dramPinFor(`DDR_${n}N`)}`}
            thickness={0.15}
          />
          <differentialpair
            name={`DDR_${n}`}
            positiveConnection={`DDR_${n}_P_path`}
            negativeConnection={`DDR_${n}_N_path`}
            maxLengthSkew={0.25}
            targetDifferentialImpedance={100}
            // The impedance target alone does not request coupled routing.
            // Provisional geometry; verify 100 ohm against the final stackup.
            pcbTraceGap={0.15}
          />
        </React.Fragment>
      ))}
    </>
  )
}
