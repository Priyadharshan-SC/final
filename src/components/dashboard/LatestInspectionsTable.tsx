import React from 'react';
import { Inspection } from '../../types/inspection';
import { StatusBadge } from '../common/StatusBadge';
import { Eye, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LatestInspectionsTableProps {
  inspections: Inspection[];
}

export const LatestInspectionsTable: React.FC<LatestInspectionsTableProps> = ({ inspections }) => {
  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Latest Inspected Boards</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time inference log from Factory Line 01</p>
        </div>
        <Link
          to="/history"
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
        >
          View Full History <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-industrial-border/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Board ID</th>
              <th className="py-2.5 px-3">Preview</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Defect Type</th>
              <th className="py-2.5 px-3">Confidence</th>
              <th className="py-2.5 px-3">Latency</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-border/40 text-xs">
            {inspections.map((item) => (
              <tr key={item.id} className="hover:bg-industrial-800/40 transition group">
                <td className="py-3 px-3 font-mono font-semibold text-cyan-400">
                  <Link to={`/inspection/${item.id}`} className="hover:underline">
                    {item.boardId}
                  </Link>
                </td>
                <td className="py-3 px-3">
                  <div className="w-9 h-6 rounded bg-[#091A14] border border-emerald-800/60 flex items-center justify-center relative overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
                    {item.status === 'DEFECTIVE' && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-black" />
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={item.status} size="sm" />
                </td>
                <td className="py-3 px-3">
                  {item.defects.length > 0 ? (
                    <span className="text-rose-400 font-medium font-sans">
                      {item.defects[0].type}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">—</span>
                  )}
                </td>
                <td className="py-3 px-3 font-mono text-slate-300">
                  {item.confidence.toFixed(1)}%
                </td>
                <td className="py-3 px-3 font-mono text-slate-400">
                  {item.inferenceTimeMs} ms
                </td>
                <td className="py-3 px-3 text-right">
                  <Link
                    to={`/inspection/${item.id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 inline-flex transition"
                    title="View Inspection Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
