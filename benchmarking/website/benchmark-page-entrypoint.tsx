import React from "react"
import { createRoot } from "react-dom/client"
import { BenchmarksPage } from "./BenchmarksPage"

const root = createRoot(document.getElementById("root")!)
root.render(<BenchmarksPage />)
