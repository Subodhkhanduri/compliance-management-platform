// core/domain/PoolMember.ts
export interface PoolMember {
    readonly poolId: string;
    readonly shipId: string;
    readonly cbBefore: number;
    readonly cbAfter: number;
    readonly allocatedSurplus: number;
}
