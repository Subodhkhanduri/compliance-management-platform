import { Route, RouteFilters } from '../domain/Route';
import {
    ComplianceCB,
    AdjustedCB,
    ComparisonResult,
} from '../domain/Compliance';
import {
    BankRecords,
    BankSurplusResult,
    ApplyBankedResult,
} from '../domain/Banking';
import { PoolResult, AdjustedCBEntry } from '../domain/Pool';

// Every method the frontend needs — one interface, one place
export interface ApiPort {
    // Routes
    getRoutes(filters?: RouteFilters): Promise<Route[]>;
    setBaseline(routeId: string): Promise<Route>;
    getComparison(): Promise<ComparisonResult>;

    // Compliance
    getComplianceCB(shipId: string, year: number): Promise<ComplianceCB>;
    getAdjustedCB(shipId: string, year: number): Promise<AdjustedCB>;

    // Banking
    getBankingRecords(shipId: string, year: number): Promise<BankRecords>;
    bankSurplus(shipId: string, year: number, amount: number): Promise<BankSurplusResult>;
    applyBanked(shipId: string, year: number, amount: number): Promise<ApplyBankedResult>;

    // Pooling
    getAdjustedCBForShips(shipIds: string[], year: number): Promise<AdjustedCBEntry[]>;
    createPool(year: number, memberShipIds: string[]): Promise<PoolResult>;
}
