import { useEffect, useState } from 'react';
import type { IBalanceCheckpoint } from '@finapp/shared/models/balance_checkpoint';

import { Trash2, AlertTriangle } from 'lucide-react';

interface CheckpointTimelineProps {
  userId: string;
  accountId: string;
}

export function CheckpointTimeline({ userId, accountId }: CheckpointTimelineProps) {
  const [checkpoints, setCheckpoints] = useState<IBalanceCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchCheckpoints() {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts/${accountId}/checkpoints`);
      if (!res.ok) throw new Error('Failed to fetch checkpoints');
      const data = await res.json();
      setCheckpoints(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId && accountId) {
      fetchCheckpoints();
    }
  }, [userId, accountId]);

  async function handleDelete(checkpointId: string) {
    if (!confirm('Are you sure you want to delete this checkpoint? This will also remove the associated reconciliation adjustment transaction.')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts/${accountId}/checkpoints/${checkpointId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete checkpoint');

      // Refresh list
      fetchCheckpoints();
    } catch (err: any) {
      alert('Error deleting checkpoint: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-[#09090b] p-6 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-[#09090b] p-6">
        <div className="text-red-400 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (checkpoints.length === 0) {
    return (
      <div className="w-80 border-l border-zinc-800 bg-[#09090b] p-6">
        <div className="text-zinc-500 text-sm text-center">No checkpoints found</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-zinc-800 bg-[#09090b] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h3 className="font-medium text-zinc-200">Reconciliation History</h3>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="relative pl-4 border-l-2 border-zinc-800 space-y-8">
          {checkpoints.map((checkpoint) => {
            const isInvalid = checkpoint.validation && !checkpoint.validation.isValid;
            const difference = checkpoint.validation?.difference || 0;

            return (
              <div key={checkpoint.id} className="relative group">
                {/* Dot on the line */}
                <div className={`absolute -left-[21px] top-2 w-3 h-3 rounded-full border-2 border-[#09090b] ${isInvalid ? 'bg-yellow-500' : 'bg-emerald-500'}`} />

                {/* Card */}
                <div className={`border rounded p-3 transition-colors ${isInvalid ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                  <div className="flex justify-between items-start">
                    <div className={`text-xs font-medium mb-1 ${isInvalid ? 'text-yellow-500' : 'text-zinc-400'}`}>
                      {new Date(checkpoint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <button
                      onClick={() => handleDelete(checkpoint.id)}
                      className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Checkpoint"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-sm font-bold text-zinc-100">
                    {checkpoint.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </div>

                  <div className="text-xs text-zinc-500 mt-1 capitalize flex justify-between items-center">
                    <span>{checkpoint.type.toLowerCase()}</span>
                  </div>

                  {isInvalid && (
                    <div className="mt-2 pt-2 border-t border-yellow-500/20 text-xs text-yellow-500 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Discrepancy</div>
                        <div className="opacity-80">
                          {difference > 0 ? 'Missing ' : 'Extra '}
                          {Math.abs(difference).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
