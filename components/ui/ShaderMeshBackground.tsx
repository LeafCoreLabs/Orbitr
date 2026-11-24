"use client";

import React from "react";

interface ShaderMeshBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

/**
 * Clean solid background component (shader effects removed for clean matte carbon aesthetic)
 */
export function ShaderMeshBackground({
  className = "",
  intensity = "medium",
}: ShaderMeshBackgroundProps) {
  return null;
}
