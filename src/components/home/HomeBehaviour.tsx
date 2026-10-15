"use client"

import { useEffect } from "react"
import { initHome } from "./home-behaviour"

/** Renders nothing; wires up the server-rendered home page once it's in the browser. */
export function HomeBehaviour() {
  useEffect(() => initHome(), [])
  return null
}
