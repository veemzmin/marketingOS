"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  defaultValue,
  value: valueProp,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const value = valueProp ?? internalValue

  const setValue = (next: string) => {
    if (valueProp === undefined) {
      setInternalValue(next)
    }
    onValueChange?.(next)
  }

  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={cn("w-full", className)} {...props} />
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-gray-200 bg-white p-1",
        className
      )}
      {...props}
    />
  )
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs")
  }

  const isActive = context.value === value

  return (
    <button
      type="button"
      onClick={() => context.setValue(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100",
        className
      )}
      {...props}
    />
  )
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({
  value,
  className,
  ...props
}: TabsContentProps) {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("TabsContent must be used within Tabs")
  }

  if (context.value !== value) {
    return null
  }

  return <div className={cn("mt-4", className)} {...props} />
}
