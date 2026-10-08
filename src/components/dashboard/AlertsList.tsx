import React from 'react';
import { SystemAlert } from '../../types/dashboard';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface AlertsListProps {
  alerts: SystemAlert[];
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">System & Safety Alerts</h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated telemetry diagnostics</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      </div>

      <div className="space-y-2.5 my-1">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'CRITICAL';
          const isWarning = alert.severity === 'WARNING';
          const isSuccess = alert.severity === 'SUCCESS';

          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border flex items-start gap-3 transition ${
                isCritical
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  : isWarning
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  : isSuccess
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                  : 'bg-industrial-950/60 border-industrial-border text-slate-300'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isCritical ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Info className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-white truncate">{alert.title}</h4>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{alert.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{alert.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-slate-500 border-t border-industrial-border/60 pt-2.5 mt-2 flex items-center justify-between">
        <span>Channel: <strong>LINE-01 / SENSOR_BUS</strong></span>
        <button className="text-cyan-400 hover:underline">Clear resolved</button>
      </div>
    </div>
  );
};
