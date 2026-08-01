import type { PinAttributeMap, PinCapability } from "@tscircuit/props"
import type { SourcePinAttributes } from "circuit-json"

const setSupportedCapability = (
  sourcePortProps: SourcePinAttributes,
  capability: PinCapability,
): void => {
  switch (capability) {
    case "i2c_sda":
      sourcePortProps.supports_i2c_sda = true
      return
    case "i2c_scl":
      sourcePortProps.supports_i2c_scl = true
      return
    case "spi_cs":
      sourcePortProps.supports_spi_cs = true
      return
    case "spi_sck":
      sourcePortProps.supports_spi_sck = true
      return
    case "spi_mosi":
      sourcePortProps.supports_spi_mosi = true
      return
    case "spi_miso":
      sourcePortProps.supports_spi_miso = true
      return
    case "uart_tx":
      sourcePortProps.supports_uart_tx = true
      return
    case "uart_rx":
      sourcePortProps.supports_uart_rx = true
      return
    default: {
      const unhandledCapability: never = capability
      throw new Error(`Unhandled pin capability: ${unhandledCapability}`)
    }
  }
}

const setConfiguredCapability = (
  sourcePortProps: SourcePinAttributes,
  capability: PinCapability,
): void => {
  switch (capability) {
    case "i2c_sda":
      sourcePortProps.is_configured_for_i2c_sda = true
      return
    case "i2c_scl":
      sourcePortProps.is_configured_for_i2c_scl = true
      return
    case "spi_cs":
      sourcePortProps.is_configured_for_spi_cs = true
      return
    case "spi_sck":
      sourcePortProps.is_configured_for_spi_sck = true
      return
    case "spi_mosi":
      sourcePortProps.is_configured_for_spi_mosi = true
      return
    case "spi_miso":
      sourcePortProps.is_configured_for_spi_miso = true
      return
    case "uart_tx":
      sourcePortProps.is_configured_for_uart_tx = true
      return
    case "uart_rx":
      sourcePortProps.is_configured_for_uart_rx = true
      return
    default: {
      const unhandledCapability: never = capability
      throw new Error(
        `Unhandled configured pin capability: ${unhandledCapability}`,
      )
    }
  }
}

export const applyPinAttributesToSourcePort = (
  sourcePortProps: SourcePinAttributes,
  attributes: PinAttributeMap,
): void => {
  for (const capability of attributes.capabilities ?? []) {
    setSupportedCapability(sourcePortProps, capability)
  }

  const configuredCapabilities = new Set([
    ...(attributes.activeCapabilities ?? []),
    ...(attributes.activeCapability ? [attributes.activeCapability] : []),
  ])

  for (const capability of configuredCapabilities) {
    setConfiguredCapability(sourcePortProps, capability)
  }

  if (attributes.mustBeConnected !== undefined) {
    sourcePortProps.must_be_connected = attributes.mustBeConnected
  }
  if (attributes.providesPower !== undefined) {
    sourcePortProps.provides_power = attributes.providesPower
  }
  if (attributes.requiresPower !== undefined) {
    sourcePortProps.requires_power = attributes.requiresPower
  }
  if (attributes.providesGround !== undefined) {
    sourcePortProps.provides_ground = attributes.providesGround
  }
  if (attributes.requiresGround !== undefined) {
    sourcePortProps.requires_ground = attributes.requiresGround
  }
  if (attributes.providesVoltage !== undefined) {
    sourcePortProps.provides_voltage = attributes.providesVoltage
  }
  if (attributes.requiresVoltage !== undefined) {
    sourcePortProps.requires_voltage = attributes.requiresVoltage
  }
  if (attributes.doNotConnect !== undefined) {
    sourcePortProps.do_not_connect = attributes.doNotConnect
  }
  if (attributes.includeInBoardPinout !== undefined) {
    sourcePortProps.include_in_board_pinout = attributes.includeInBoardPinout
  }
  if (attributes.canUseInternalPullup !== undefined) {
    sourcePortProps.can_use_internal_pullup = attributes.canUseInternalPullup
  }
  if (attributes.isUsingInternalPullup !== undefined) {
    sourcePortProps.is_using_internal_pullup = attributes.isUsingInternalPullup
  }
  if (attributes.needsExternalPullup !== undefined) {
    sourcePortProps.needs_external_pullup = attributes.needsExternalPullup
  }
  if (attributes.canUseInternalPulldown !== undefined) {
    sourcePortProps.can_use_internal_pulldown =
      attributes.canUseInternalPulldown
  }
  if (attributes.isUsingInternalPulldown !== undefined) {
    sourcePortProps.is_using_internal_pulldown =
      attributes.isUsingInternalPulldown
  }
  if (attributes.needsExternalPulldown !== undefined) {
    sourcePortProps.needs_external_pulldown = attributes.needsExternalPulldown
  }
  if (attributes.canUseOpenDrain !== undefined) {
    sourcePortProps.can_use_open_drain = attributes.canUseOpenDrain
  }
  if (attributes.isUsingOpenDrain !== undefined) {
    sourcePortProps.is_using_open_drain = attributes.isUsingOpenDrain
  }
  if (attributes.canUsePushPull !== undefined) {
    sourcePortProps.can_use_push_pull = attributes.canUsePushPull
  }
  if (attributes.isUsingPushPull !== undefined) {
    sourcePortProps.is_using_push_pull = attributes.isUsingPushPull
  }
  if (attributes.shouldHaveDecouplingCapacitor !== undefined) {
    sourcePortProps.should_have_decoupling_capacitor =
      attributes.shouldHaveDecouplingCapacitor
  }
  if (attributes.recommendedDecouplingCapacitorCapacitance !== undefined) {
    sourcePortProps.recommended_decoupling_capacitor_capacitance =
      attributes.recommendedDecouplingCapacitorCapacitance
  }
}
