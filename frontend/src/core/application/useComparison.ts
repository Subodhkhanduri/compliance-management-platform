import { useState, useEffect } from 'react';
import { ComparisonResult } from '../domain/Compliance';
import { ApiPort } from '../ports/ApiPort';

export function useComparison(api: ApiPort) {
    const [data, setData] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.getComparison()
            .then(setData)
            .catch(e => setError(e instanceof Error ? e.message : 'Failed to load comparison'))
            .finally(() => setLoading(false));
    }, [api]);

    return { data, loading, error };
}
