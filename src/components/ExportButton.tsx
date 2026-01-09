/**
 * Export Button Component
 *
 * Pro feature button to export prediction history as CSV or JSON.
 * Shows upgrade modal for free users.
 */

import React, { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UpgradeModal } from '../UpgradeModal';
import { exportPredictions } from '../../utils/export';
import { historyService } from '../../../services/historyService';
import { Toast } from '../Toast';
import type { ToastType } from '../Toast';

interface ExportButtonProps {
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ className = '' }) => {
  const { isPro } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const handleExport = (format: 'csv' | 'json') => {
    if (!isPro) {
      setShowUpgrade(true);
      return;
    }

    try {
      const history = historyService.getHistory();
      exportPredictions(history, format);
      setToast({ type: 'success', message: `Exported predictions as ${format.toUpperCase()}` });
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to export data' });
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => (isPro ? setIsOpen(!isOpen) : setShowUpgrade(true))}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && isPro && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20">
              <div className="p-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                  <div>
                    <div className="text-sm text-white">Export as CSV</div>
                    <div className="text-xs text-slate-400">Spreadsheet compatible</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                >
                  <FileJson className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="text-sm text-white">Export as JSON</div>
                    <div className="text-xs text-slate-400">Full data format</div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          feature="Export your prediction history"
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default ExportButton;
