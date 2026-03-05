import React, { createContext, useContext, useState, useMemo } from 'react';
import { mockPreBatchData } from '../../../data/synthetic/mockPreBatchData';

const PreBatchContext = createContext();

export function PreBatchProvider({ children }) {
    const [claims, setClaims] = useState(mockPreBatchData.claims);
    const [metrics, setMetrics] = useState(mockPreBatchData.metrics);
    const [selectedClaimId, setSelectedClaimId] = useState(null);

    // Filter Logic
    const [filters, setFilters] = useState({
        search: '',
        status: 'all', // all, passed, autofixed, review, blocked
        payer: 'all'
    });

    // Derived State: Active Claim
    const selectedClaim = useMemo(() =>
        claims.find(c => c.id === selectedClaimId),
        [claims, selectedClaimId]);

    // Derived State: Filtered Claims
    const filteredClaims = useMemo(() => {
        return claims.filter(claim => {
            const matchesSearch = claim.patient.toLowerCase().includes(filters.search.toLowerCase()) ||
                claim.id.toLowerCase().includes(filters.search.toLowerCase());
            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'passed' && claim.status === 'Passed') ||
                (filters.status === 'autofixed' && claim.status === 'Auto-Fixed') ||
                (filters.status === 'review' && claim.status === 'Review Required') ||
                (filters.status === 'blocked' && claim.status === 'Blocked');
            const matchesPayer = filters.payer === 'all' || claim.payer === filters.payer;

            return matchesSearch && matchesStatus && matchesPayer;
        });
    }, [claims, filters]);

    // Action: Auto-Fix a Claim
    const applyAutoFix = (claimId, issueId) => {
        setClaims(prev => prev.map(claim => {
            if (claim.id === claimId) {
                // Mark specific issue as 'applied'
                const updatedIssues = claim.issues.map(issue =>
                    issue.id === issueId ? { ...issue, applied: true } : issue
                );

                // If all issues are resolved, update status
                const allResolved = updatedIssues.every(i => i.applied || i.autoFixAvailable);
                // Simple logic: if we applied the fix, let's assume it worked for now and set to Auto-Fixed

                return {
                    ...claim,
                    issues: updatedIssues,
                    status: 'Auto-Fixed',
                    batchReady: true
                };
            }
            return claim;
        }));

        // Update Metrics (Simulated)
        setMetrics(prev => ({
            ...prev,
            batchReadiness: Math.min(100, prev.batchReadiness + 1),
            statusBreakdown: {
                ...prev.statusBreakdown,
                reviewRequired: prev.statusBreakdown.reviewRequired - 1,
                autoFixed: prev.statusBreakdown.autoFixed + 1
            }
        }));
    };

    // Action: Apply All High Confidence Fixes
    const applyAllHighConfidenceFixes = () => {
        setClaims(prev => prev.map(claim => {
            const hasHighConfidence = claim.issues.some(i => i.confidenceScore > 0.9 && i.autoFixAvailable && !i.applied);
            if (hasHighConfidence) {
                return {
                    ...claim,
                    status: 'Auto-Fixed',
                    batchReady: true,
                    issues: claim.issues.map(i => i.confidenceScore > 0.9 ? { ...i, applied: true } : i)
                };
            }
            return claim;
        }));
    };

    const value = {
        claims,
        filteredClaims,
        metrics,
        selectedClaimId,
        setSelectedClaimId,
        selectedClaim,
        filters,
        setFilters,
        applyAutoFix,
        applyAllHighConfidenceFixes
    };

    return (
        <PreBatchContext.Provider value={value}>
            {children}
        </PreBatchContext.Provider>
    );
}

export function usePreBatch() {
    const context = useContext(PreBatchContext);
    if (!context) {
        throw new Error('usePreBatch must be used within a PreBatchProvider');
    }
    return context;
}
