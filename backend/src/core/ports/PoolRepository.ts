import { Pool } from '../domain/Pool';
import { PoolMember } from '../domain/PoolMember';

export interface PoolRepository {
    save(
        pool: Omit<Pool, 'id' | 'createdAt'>,
        members: Omit<PoolMember, 'poolId'>[]
    ): Promise<{ pool: Pool; members: PoolMember[] }>;
}
