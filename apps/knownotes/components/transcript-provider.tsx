"use client"

import { createContext } from "react"
import { Transcript } from "@/types"

export const RecordContext = createContext<{
  transcript: Transcript[]
}>({
  transcript: [],
})
