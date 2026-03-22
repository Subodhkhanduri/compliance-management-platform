import axios, { AxiosInstance } from 'axios';
import { ApiPort } from '../../core/ports/ApiPort';
import { Route, RouteFilters } from '../../core/domain/Route';
import { ComplianceCB, AdjustedCB, ComparisonResult } from '../../core/domain/Compliance';
import { BankRecords, BankSurplusResult, ApplyBankedResult } from '../../core/domain/Banking';
import { PoolResult, AdjustedCBEntry } from '../../core/domain/Pool';

export class HttpApiAdapter implements ApiPort {
    private readonly http: AxiosInstance;

    constructor(baseURL: string) {
        this.http = axios.create({
            baseURL,
            timeout: 10_000,
            headers: { 'Content-Type': 'application/json' },
        });

        // Unwrap { data: ... } envelope from every response
        this.http.interceptors.response.use(
            res => res,
            err => {
                const message =
                    err.response?.data?.error ??
                    err.message ??
                    'Unknown error';
                return Promise.reject(new Error(message));
            }
        );
    }

    async getRoutes(filters?: RouteFilters): Promise<Route[]> {
        const params = new URLSearchParams();
        if (filters?.vesselType) params.set('vesselType', filters.vesselType);
        if (filters?.fuelType) params.set('fuelType', filters.fuelType);
        if (filters?.year) params.set('year', String(filters.year));

        const { data } = await this.http.get(`/routes?${params}`);
        return data.data;
    }

    async setBaseline(routeId: string): Promise<Route> {
        const { data } = await this.http.post(`/routes/${routeId}/baseline`);
        return data.data;
    }

    async getComparison(): Promise<ComparisonResult> {
        const { data } = await this.http.get('/routes/comparison');
        return data.data;
    }

    async getComplianceCB(shipId: string, year: number): Promise<ComplianceCB> {
        const { data } = await this.http.get(
            `/compliance/cb?shipId=${shipId}&year=${year}`
        );
        return data.data;
    }

    async getAdjustedCB(shipId: string, year: number): Promise<AdjustedCB> {
        const { data } = await this.http.get(
            `/compliance/adjusted-cb?shipId=${shipId}&year=${year}`
        );
        return data.data;
    }

    async getBankingRecords(shipId: string, year: number): Promise<BankRecords> {
        const { data } = await this.http.get(
            `/banking/records?shipId=${shipId}&year=${year}`
        );
        return data.data;
    }

    async bankSurplus(
        shipId: string,
        year: number,
        amount: number
    ): Promise<BankSurplusResult> {
        const { data } = await this.http.post('/banking/bank', {
            shipId, year, amount,
        });
        return data.data;
    }

    async applyBanked(
        shipId: string,
        year: number,
        amount: number
    ): Promise<ApplyBankedResult> {
        const { data } = await this.http.post('/banking/apply', {
            shipId, year, amount,
        });
        return data.data;
    }

    async getAdjustedCBForShips(
        shipIds: string[],
        year: number
    ): Promise<AdjustedCBEntry[]> {
        const results = await Promise.all(
            shipIds.map(id => this.getAdjustedCB(id, year))
        );
        return results;
    }

    async createPool(year: number, memberShipIds: string[]): Promise<PoolResult> {
        const { data } = await this.http.post('/pools', { year, memberShipIds });
        return data.data;
    }
}
