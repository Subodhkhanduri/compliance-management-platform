// core/application/CreatePool.ts
export interface CreatePoolCommand {
    year: number;
    memberShipIds: string[];
}
// Returns: PoolMember[] with cbBefore/cbAfter after greedy allocation
