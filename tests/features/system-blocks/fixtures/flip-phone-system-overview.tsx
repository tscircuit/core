import { systemblock } from "lib"

// A flip-phone overview with a hub MCU, three subsystems and long labelled
// links between them. Reproduces label-induced hooks and jogs in the router.
export const FlipPhoneSystemOverview = () => (
  <systemblock.page
    name="flip-phone"
    displayName="Flip phone"
    direction="right"
  >
    <systemblock.group name="inputs" displayName="Inputs">
      <systemblock.component name="hall" displayName="Hall lid sensor" />
      <systemblock.component name="keypad" displayName="Keypad matrix" />
      <systemblock.component name="usb" displayName="USB-C" />
    </systemblock.group>
    <systemblock.group name="power" displayName="Power">
      <systemblock.component name="battery" displayName="Li-ion cell" />
      <systemblock.component name="charger" displayName="Charger" />
      <systemblock.component name="regulator" displayName="3.3 V buck" />
    </systemblock.group>
    <systemblock.component name="mcu" displayName="ESP32-S3 (UI)" />
    <systemblock.group name="cellular" displayName="Cellular">
      <systemblock.component name="modem" displayName="A7670E LTE modem" />
      <systemblock.component name="antenna" displayName="LTE antenna" />
      <systemblock.component name="sim" displayName="Nano-SIM" />
      <systemblock.component
        name="shifter"
        displayName="1.8/3.3 V level shifter"
      />
    </systemblock.group>
    <systemblock.group name="lid" displayName="Lid board">
      <systemblock.component name="display" displayName="2.4 inch TFT" />
      <systemblock.component name="backlight" displayName="Backlight switch" />
      <systemblock.component name="earpiece" displayName="Earpiece" />
    </systemblock.group>
    <systemblock.group name="audio" displayName="Audio and haptics">
      <systemblock.component name="mic" displayName="Microphone" />
      <systemblock.component name="amp" displayName="Speaker amp" />
      <systemblock.component name="vibra" displayName="Vibration motor" />
      <systemblock.component name="speaker" displayName="Loudspeaker" />
    </systemblock.group>
    <systemblock.connection from="hall" to="mcu" label="open/closed" />
    <systemblock.connection from="keypad" to="mcu" label="7 rows + 3 cols" />
    <systemblock.connection from="usb" to="mcu" label="USB" direction="both" />
    <systemblock.connection from="usb" to="charger" label="VBUS" kind="power" />
    <systemblock.connection from="charger" to="battery" kind="power" />
    <systemblock.connection from="battery" to="regulator" kind="power" />
    <systemblock.connection
      from="regulator"
      to="mcu"
      label="3.3 V"
      kind="power"
    />
    <systemblock.connection
      from="battery"
      to="modem"
      label="VBAT"
      kind="power"
    />
    <systemblock.connection from="battery" to="amp" label="VBAT" kind="power" />
    <systemblock.connection from="mcu" to="display" label="SPI (hinge FPC)" />
    <systemblock.connection from="mcu" to="backlight" label="PWM" />
    <systemblock.connection from="backlight" to="display" />
    <systemblock.connection from="mcu" to="amp" label="enable" />
    <systemblock.connection from="mcu" to="vibra" label="GPIO" />
    <systemblock.connection from="mcu" to="modem" label="PWRKEY / RESET" />
    <systemblock.connection
      from="mcu"
      to="shifter"
      label="UART + RI/DTR"
      direction="both"
    />
    <systemblock.connection
      from="shifter"
      to="modem"
      label="1.8 V UART"
      direction="both"
    />
    <systemblock.connection
      from="modem"
      to="antenna"
      label="RF"
      direction="both"
    />
    <systemblock.connection
      from="modem"
      to="sim"
      label="SIM"
      direction="both"
    />
    <systemblock.connection from="mic" to="modem" label="MIC" />
    <systemblock.connection
      from="modem"
      to="earpiece"
      label="EAR (hinge FPC)"
    />
    <systemblock.connection from="modem" to="amp" label="EAR audio" />
    <systemblock.connection from="amp" to="speaker" />
  </systemblock.page>
)
