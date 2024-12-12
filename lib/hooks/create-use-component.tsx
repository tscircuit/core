import React, { Component, type ComponentProps } from "react"
import { z } from "zod"
import { resistorProps, resistorPins } from "@tscircuit/props"

export type PinLabelSpec<
  PinLabel extends string,
  PinNumberKey extends string = never,
> =
  | readonly PinLabel[]
  | readonly (readonly PinLabel[])[]
  | Record<PinNumberKey, readonly PinLabel[]>

export type ComponentWithPins<
  Props,
  PinLabel extends string | never = never,
  PropsFromHook extends Omit<Props, "name"> | undefined = undefined,
> = React.ComponentType<
  (PropsFromHook extends undefined
    ? Omit<Props, "name">
    : Omit<Partial<Props>, "name">) & {
    [key in PinLabel]?: string
  }
> & {
  [key in PinLabel]: string
}

type CreateUseComponentConstPinLabels = <
  Props,
  PinLabel extends string | never = never,
>(
  Component: React.ComponentType<Props>,
  pins: readonly PinLabel[],
) => <PropsFromHook extends Omit<Props, "name"> | undefined = undefined>(
  name: string,
  props?: PropsFromHook,
) => ComponentWithPins<Props, PinLabel, PropsFromHook>

type CreateUseComponentPinLabelMap = <
  Props,
  PinLabel extends string | never = never,
  PinNumberKey extends string = never,
>(
  Component: React.ComponentType<Props>,
  pins: Record<PinNumberKey, readonly PinLabel[] | PinLabel[]>,
) => <PropsFromHook extends Omit<Props, "name"> | undefined = undefined>(
  name: string,
  props?: PropsFromHook,
) => ComponentWithPins<Props, PinLabel | PinNumberKey, PropsFromHook>

export const createUseComponent: CreateUseComponentConstPinLabels &
  CreateUseComponentPinLabelMap = (Component: any, pins: any) => {
  return (name: string, props?: any) => {
    const pinLabelsFlatArray: string[] = []
    if (Array.isArray(pins)) {
      pinLabelsFlatArray.push(...pins.flat())
    } else if (typeof pins === "object") {
      pinLabelsFlatArray.push(
        ...Object.values(pins as Record<string, string[]>).flat(),
        ...(Object.keys(pins) as string[]),
      )
    }
    const R: any = (props2: any) => {
      // Explicitly throw an error if names don't match
      if (props2?.name && props2.name !== name) {
        throw new Error(
          `Component name mismatch. Hook name: ${name}, ` +
            `Component prop name: ${props2.name}`,
        )
      }

      const combinedProps = { ...props, ...props2, name: name }
      const tracesToCreate: any[] = []
      for (const portLabel of pinLabelsFlatArray) {
        if (combinedProps[portLabel]) {
          const from = `.${name} > port.${portLabel}`
          const to = combinedProps[portLabel]
          tracesToCreate.push({ from, to })
          delete combinedProps[portLabel]
        }
      }
      return (
        <>
          <Component {...combinedProps} />
          {tracesToCreate.map((trace, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            <trace key={i} {...trace} />
          ))}
        </>
      )
    }
    for (const port of pinLabelsFlatArray) {
      R[port] = `.${name} > port.${port}`
    }
    return R
  }
}
