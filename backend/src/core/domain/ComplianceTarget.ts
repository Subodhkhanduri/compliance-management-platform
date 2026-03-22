// Pure value object — the formula lives HERE and only here.
export const TARGET_INTENSITY_2025 = 89.3368;  // gCO₂e/MJ
export const ENERGY_FACTOR_MJ_PER_TONNE = 41_000;

export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
    if (fuelConsumptionTonnes < 0) {
        throw new Error('Fuel consumption cannot be negative');
    }
    return fuelConsumptionTonnes * ENERGY_FACTOR_MJ_PER_TONNE;
}

export function computeComplianceBalance(
    actualGhgIntensity: number,
    fuelConsumptionTonnes: number,
    targetIntensity: number = TARGET_INTENSITY_2025
): number {
    const energy = computeEnergyInScope(fuelConsumptionTonnes);
    // Positive = surplus (ship is clean), Negative = deficit (ship owes)
    return (targetIntensity - actualGhgIntensity) * energy;
}

export function computePercentDiff(baseline: number, comparison: number): number {
    if (baseline === 0) throw new Error('Baseline GHG intensity cannot be zero');
    return ((comparison / baseline) - 1) * 100;
}

export function isCompliant(ghgIntensity: number): boolean {
    return ghgIntensity <= TARGET_INTENSITY_2025;
}
