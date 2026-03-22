// core/domain/ComplianceTarget.ts
// This is a VALUE OBJECT — immutable, no identity.
export const TARGET_INTENSITY_2025 = 89.3368; // gCO₂e/MJ
export const ENERGY_FACTOR = 41_000;           // MJ per tonne of fuel

export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
    return fuelConsumptionTonnes * ENERGY_FACTOR;
}

export function computeComplianceBalance(
    actualGhgIntensity: number,
    fuelConsumptionTonnes: number,
    targetIntensity = TARGET_INTENSITY_2025
): number {
    const energy = computeEnergyInScope(fuelConsumptionTonnes);
    return (targetIntensity - actualGhgIntensity) * energy;
    // Positive = surplus, Negative = deficit
}
