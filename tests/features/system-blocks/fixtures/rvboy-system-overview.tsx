import { systemblock } from "lib"
// Based on seveibar/rvboy-advance v0.9.2 system-overview.tsx.
// PCB references are omitted so the diagram can render without the physical board.
export const SystemOverview = () => (
  <>
    <systemblock.page
      name="console"
      displayName="RVboy Advance | RV1106G3 handheld"
      description="Derived from abse/gameboy-advance. Blocks are linked to the physical circuit; arrows describe interfaces, not additional electrical wires."
      direction="right"
    >
      <systemblock.group name="compute" displayName="Linux compute">
        <systemblock.component
          name="soc"
          displayName="RV1106G3 / Cortex-A7 + 256 MB DDR3L"
        />
        <systemblock.component
          name="flash"
          displayName="32 MB SPI NOR / bootloader"
        />
        <systemblock.component
          name="sd"
          displayName="microSD / Linux + games"
        />
        <systemblock.component
          name="debug"
          displayName="UART2 / five-pin SWD + reset / recovery"
        />
      </systemblock.group>
      <systemblock.group
        name="human-interface"
        displayName="Display and controls"
      >
        <systemblock.component
          name="lcd"
          displayName="3.5-inch IPS / 480 x 320 landscape"
          description="ER-TFT035IPS-6, RGB666 video plus 8-bit SPI + D/C command initialization; native panel scan is 320 x 480."
        />
        <systemblock.component
          name="keys"
          displayName="D-pad / ABXY / L R / Start Select"
        />
        <systemblock.component name="backlight" displayName="PWM backlight" />
      </systemblock.group>
      <systemblock.group name="sound" displayName="Mono audio">
        <systemblock.component name="volume" displayName="Analog volume" />
        <systemblock.component
          name="amp"
          displayName="PAM8403 / mono speaker"
        />
      </systemblock.group>
      <systemblock.component
        name="usb"
        displayName="USB-C / power + USB 2.0 device"
      />
      <systemblock.connection
        from="soc"
        to="flash"
        label="FSPI x4"
        direction="both"
      />
      <systemblock.connection
        from="soc"
        to="sd"
        label="SDMMC0 x4"
        direction="both"
      />
      <systemblock.connection from="soc" to="lcd" label="RGB666 + SPI1" />
      <systemblock.connection
        from="lcd"
        to="soc"
        label="FT6236 / I2C0"
        color="#16856b"
        direction="both"
      />
      <systemblock.connection
        from="keys"
        to="soc"
        label="MCP23017 / I2C0 + IRQ"
        color="#16856b"
        direction="both"
      />
      <systemblock.connection from="soc" to="backlight" label="PWM0" />
      <systemblock.connection
        from="soc"
        to="volume"
        label="Codec LINEOUT"
        color="#8254a6"
      />
      <systemblock.connection
        from="volume"
        to="amp"
        label="AC-coupled mono"
        color="#8254a6"
      />
      <systemblock.connection
        from="usb"
        to="soc"
        label="USB 2.0"
        direction="both"
      />
      <systemblock.connection
        from="debug"
        to="soc"
        label="UART2 or CPU SWD / recovery"
        color="#64748b"
        lineStyle="dotted"
        direction="both"
      />
    </systemblock.page>
    <systemblock.page
      name="power"
      displayName="RVboy Advance | power and sequencing"
      direction="right"
    >
      <systemblock.group name="sources" displayName="Input power">
        <systemblock.component
          name="aa"
          displayName="4 x AA / reverse protection"
        />
        <systemblock.component name="boost" displayName="TPS63070 / 4.98 V" />
        <systemblock.component name="usbin" displayName="USB-C 5 V input" />
        <systemblock.component
          name="or"
          displayName="Isolated VSYS / USB priority"
        />
      </systemblock.group>
      <systemblock.group name="regulators" displayName="Sequenced supplies">
        <systemblock.component
          name="core"
          displayName="0.899 V / logic + CPU"
        />
        <systemblock.component
          name="memory"
          displayName="1.345 V DDR3L + 1.792 V analog"
        />
        <systemblock.component
          name="io"
          displayName="3.234 V / IO and peripherals"
        />
        <systemblock.component
          name="monitor"
          displayName="4 x TPS3808 / rail supervision"
        />
      </systemblock.group>
      <systemblock.component
        name="load"
        displayName="RV1106G3 / reset released last"
      />
      <systemblock.component
        name="highpower"
        displayName="Backlight + speaker amplifier"
      />
      <systemblock.connection
        from="aa"
        to="boost"
        label="Protected AA supply"
        kind="power"
      />
      <systemblock.connection
        from="boost"
        to="or"
        label="4.98 V"
        kind="power"
      />
      <systemblock.connection from="usbin" to="or" label="5 V" kind="power" />
      <systemblock.connection from="or" to="core" label="VSYS" kind="power" />
      <systemblock.connection from="or" to="memory" label="VSYS" kind="power" />
      <systemblock.connection from="or" to="io" label="VSYS" kind="power" />
      <systemblock.connection
        from="or"
        to="highpower"
        label="VSYS"
        kind="power"
      />
      <systemblock.connection
        from="core"
        to="memory"
        label="CORE_GOOD enables"
      />
      <systemblock.connection
        from="memory"
        to="io"
        label="Both rails good enables"
      />
      <systemblock.connection
        from="core"
        to="load"
        label="0.9 V"
        kind="power"
      />
      <systemblock.connection
        from="memory"
        to="load"
        label="DDR / analog rails"
        kind="power"
      />
      <systemblock.connection
        from="io"
        to="load"
        label="3.234 V"
        kind="power"
      />
      <systemblock.connection
        from="monitor"
        to="load"
        label="nPOR / delayed release"
      />
    </systemblock.page>
  </>
)
