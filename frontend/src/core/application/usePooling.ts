import { useState, useCallback } from 'react';
import { ApiPort } from '../ports/ApiPort';
import { AdjustedCBEntry, PoolResult } from '../domain/Pool';

export function usePooling(api: ApiPort) {
    const [members, setMembers] = useState<AdjustedCBEntry[]>([]);
    const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMembers = useCallback(async (shipIds: string[], year: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getAdjustedCBForShips(shipIds, year);
            setMembers(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load pool members');
        } finally {
            setLoading(false);
        }
    }, [api]);

    const poolSum = members.reduce((s, m) => s + m.adjustedCb, 0);
    const isValidPool = poolSum >= 0 && members.length >= 2;

    const createPool = useCallback(async (year: number, shipIds: string[]) => {
        setCreating(true);
        setError(null);
        try {
            const result = await api.createPool(year, shipIds);
            setPoolResult(result);
            return result;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Pool creation failed');
        } finally {
            setCreating(false);
        }
    }, [api]);

    return {
        members, poolResult, loading, creating,
        error, poolSum, isValidPool,
        loadMembers, createPool,
    };
}
