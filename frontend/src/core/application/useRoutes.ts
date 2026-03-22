import { useState, useEffect, useCallback } from 'react';
import { Route, RouteFilters } from '../domain/Route';
import { ApiPort } from '../ports/ApiPort';

export function useRoutes(api: ApiPort) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<RouteFilters>({});

    const fetchRoutes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getRoutes(filters);
            setRoutes(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load routes');
        } finally {
            setLoading(false);
        }
    }, [api, filters]);

    const handleSetBaseline = useCallback(async (routeId: string) => {
        try {
            await api.setBaseline(routeId);
            await fetchRoutes();   // refresh table after baseline change
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to set baseline');
        }
    }, [api, fetchRoutes]);

    useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

    return { routes, loading, error, filters, setFilters, handleSetBaseline };
}
