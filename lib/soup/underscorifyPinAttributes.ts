import type { PinAttributeMap } from "@tscircuit/props"
import type { SourceComponentBase } from "circuit-json"

export const underscorifyPinAttributes = (
  pinAttributes?: Record<string, PinAttributeMap>,
): SourceComponentBase["source_pin_attributes"] | undefined => {
  if (!pinAttributes) return undefined

  const source_pin_attributes: Record<string, any> = {}

  for (const [pinName, attrs] of Object.entries(pinAttributes)) {
    source_pin_attributes[pinName] = {
      ...(attrs.mustBeConnected !== undefined && {
        must_be_connected: attrs.mustBeConnected,
      }),
      ...(attrs.requiresPower !== undefined && {
        requires_power: attrs.requiresPower,
      }),
      ...(attrs.requiresGround !== undefined && {
        requires_ground: attrs.requiresGround,
      }),
      ...(attrs.requiresVoltage !== undefined && {
        requires_voltage: attrs.requiresVoltage,
      }),
      ...(attrs.doNotConnect !== undefined && {
        do_not_connect: attrs.doNotConnect,
      }),
      ...(attrs.includeInBoardPinout !== undefined && {
        include_in_board_pinout: attrs.includeInBoardPinout,
      }),
      ...(attrs.highlightColor !== undefined && {
        highlight_color: attrs.highlightColor,
      }),
      ...(attrs.providesPower !== undefined && {
        provides_power: attrs.providesPower,
      }),
      ...(attrs.providesGround !== undefined && {
        provides_ground: attrs.providesGround,
      }),
      ...(attrs.providesVoltage !== undefined && {
        provides_voltage: attrs.providesVoltage,
      }),
    }
  }

  return source_pin_attributes
}
