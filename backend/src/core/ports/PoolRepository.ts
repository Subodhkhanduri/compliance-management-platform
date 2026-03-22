// core/ports/PoolRepository.ts
import { Pool } from '../domain/Pool';
import { PoolMember } from '../domain/PoolMember';

export interface PoolRepository {
    save(pool: Pool, members: PoolMember[]): Promise<void>;
    findById(poolId: string): Promise<{ pool: Pool; members: PoolMember[] } | null>;
}
