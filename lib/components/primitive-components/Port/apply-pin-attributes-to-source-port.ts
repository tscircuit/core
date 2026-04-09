import type { PinAttributeMap } from "@tscircuit/props"

export const applyPinAttributesToSourcePort = (
  sourcePortProps: Record<string, unknown>,
  attributes: PinAttributeMap,
): void => {
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
