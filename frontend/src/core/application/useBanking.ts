import { useState, useCallback } from 'react';
import { ApiPort } from '../ports/ApiPort';
import { ComplianceCB } from '../domain/Compliance';
import { BankRecords } from '../domain/Banking';

export function useBanking(api: ApiPort) {
    const [cb, setCb] = useState<ComplianceCB | null>(null);
    const [records, setRecords] = useState<BankRecords | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = useCallback(async (shipId: string, year: number) => {
        setLoading(true);
        setError(null);
        try {
            const [cbData, bankData] = await Promise.all([
                api.getComplianceCB(shipId, year),
                api.getBankingRecords(shipId, year),
            ]);
            setCb(cbData);
            setRecords(bankData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load banking data');
        } finally {
            setLoading(false);
        }
    }, [api]);

    const bank = useCallback(async (shipId: string, year: number, amount: number) => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await api.bankSurplus(shipId, year, amount);
            setSuccess(`Banked ${amount.toLocaleString()} gCO₂eq successfully`);
            await loadData(shipId, year);
            return result;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Banking failed');
        } finally {
            setActionLoading(false);
        }
    }, [api, loadData]);

    const apply = useCallback(async (shipId: string, year: number, amount: number) => {
        setActionLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await api.applyBanked(shipId, year, amount);
            setSuccess(`Applied ${amount.toLocaleString()} gCO₂eq to deficit`);
            await loadData(shipId, year);
            return result;
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Apply failed');
        } finally {
            setActionLoading(false);
        }
    }, [api, loadData]);

    return { cb, records, loading, actionLoading, error, success, loadData, bank, apply };
}
