import { RouteRepository } from '../../core/ports/RouteRepository';
import { ComplianceRepository } from '../../core/ports/ComplianceRepository';
import { BankRepository } from '../../core/ports/BankRepository';
import { PoolRepository } from '../../core/ports/PoolRepository';
import { Route } from '../../core/domain/Route';
import { ShipCompliance } from '../../core/domain/ShipCompliance';
import { BankEntry } from '../../core/domain/BankEntry';

// Seed fixtures — mirrors the SQL seed data
export const ROUTES: Record<string, Route> = {
    R001: {
        id: 'uuid-001', routeId: 'R001', vesselType: 'Container',
        fuelType: 'HFO', year: 2024, ghgIntensity: 91.0,
        fuelConsumption: 5000, distance: 12000,
        totalEmissions: 4500, isBaseline: true,
    },
    R002: {
        id: 'uuid-002', routeId: 'R002', vesselType: 'BulkCarrier',
        fuelType: 'LNG', year: 2024, ghgIntensity: 88.0,
        fuelConsumption: 4800, distance: 11500,
        totalEmissions: 4200, isBaseline: false,
    },
    R003: {
        id: 'uuid-003', routeId: 'R003', vesselType: 'Tanker',
        fuelType: 'MGO', year: 2024, ghgIntensity: 93.5,
        fuelConsumption: 5100, distance: 12500,
        totalEmissions: 4700, isBaseline: false,
    },
    R004: {
        id: 'uuid-004', routeId: 'R004', vesselType: 'RoRo',
        fuelType: 'HFO', year: 2025, ghgIntensity: 89.2,
        fuelConsumption: 4900, distance: 11800,
        totalEmissions: 4300, isBaseline: false,
    },
};

// Mock repository builders — each returns a jest.Mocked version
// with sensible defaults you can override per test

export function mockRouteRepo(
    overrides: Partial<RouteRepository> = {}
): jest.Mocked<RouteRepository> {
    return {
        findAll: jest.fn().mockResolvedValue(Object.values(ROUTES)),
        findById: jest.fn().mockImplementation(
            (id: string) => Promise.resolve(ROUTES[id] ?? null)
        ),
        findBaseline: jest.fn().mockResolvedValue(ROUTES.R001),
        setBaseline: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as jest.Mocked<RouteRepository>;
}

export function mockComplianceRepo(
    overrides: Partial<ComplianceRepository> = {}
): jest.Mocked<ComplianceRepository> {
    return {
        findByShipAndYear: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(
            (c) => Promise.resolve({ ...c, id: 'uuid-sc', computedAt: new Date() })
        ),
        getTotalBankedForShip: jest.fn().mockResolvedValue(0),
        ...overrides,
    } as jest.Mocked<ComplianceRepository>;
}

export function mockBankRepo(
    overrides: Partial<BankRepository> = {}
): jest.Mocked<BankRepository> {
    return {
        findByShipAndYear: jest.fn().mockResolvedValue([]),
        getTotalBanked: jest.fn().mockResolvedValue(0),
        save: jest.fn().mockImplementation(
            (e) => Promise.resolve({ ...e, id: 'uuid-be', createdAt: new Date() })
        ),
        deductAmount: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as jest.Mocked<BankRepository>;
}

export function mockPoolRepo(
    overrides: Partial<PoolRepository> = {}
): jest.Mocked<PoolRepository> {
    return {
        save: jest.fn().mockImplementation(
            (pool, members) => Promise.resolve({
                pool: { ...pool, id: 'uuid-pool', createdAt: new Date() },
                members: members.map(m => ({ ...m, poolId: 'uuid-pool' })),
            })
        ),
        ...overrides,
    } as jest.Mocked<PoolRepository>;
}

// Compliance snapshot factory
export function makeCompliance(
    shipId: string,
    cbGco2eq: number,
    year = 2024
): ShipCompliance {
    return {
        id: `sc-${shipId}`,
        shipId,
        year,
        cbGco2eq,
        computedAt: new Date(),
    };
}

// Bank entry factory
export function makeBankEntry(
    shipId: string,
    amount: number,
    year = 2024
): BankEntry {
    return {
        id: `be-${shipId}`,
        shipId,
        year,
        amountGco2eq: amount,
        createdAt: new Date(),
    };
}
