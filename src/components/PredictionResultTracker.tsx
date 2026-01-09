/**
 * Prediction Result Tracker Component
 *
 * Allows users to track actual match results and calculate prediction accuracy.
 * Displays in history view for completed matches.
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Edit2, Save, X } from 'lucide-react';
import { Match, MatchResult, PredictionResult } from '../../types';
import { historyService } from '../../../services/historyService';
import { Toast } from './Toast';
import type { ToastType } from './Toast';

interface PredictionResultTrackerProps {
  matchId: string;
  match: Match;
  prediction?: PredictionResult;
  existingResult?: MatchResult;
  onResultUpdated?: (matchId: string, result: MatchResult) => void;
}

export const PredictionResultTracker: React.FC<PredictionResultTrackerProps> = ({
  matchId,
  match,
  prediction,
  existingResult,
  onResultUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(!existingResult);
  const [homeScore, setHomeScore] = useState(existingResult?.homeScore.toString() || '');
  const [awayScore, setAwayScore] = useState(existingResult?.awayScore.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  // Determine if prediction was correct
  const getPredictionStatus = () => {
    if (!existingResult) return 'pending';

    const predictedWinner = getPredictedWinner(prediction);
    const actualWinner = getActualWinner(existingResult);

    return predictedWinner === actualWinner ? 'correct' : 'incorrect';
  };

  const getPredictedWinner = (pred?: PredictionResult): 'Home' | 'Draw' | 'Away' | null => {
    if (!pred) return null;
    const probs = pred.probabilities;
    if (probs.homeWin > probs.draw && probs.homeWin > probs.awayWin) return 'Home';
    if (probs.draw > probs.homeWin && probs.draw > probs.awayWin) return 'Draw';
    if (probs.awayWin > probs.homeWin && probs.awayWin > probs.draw) return 'Away';
    return 'Draw'; // default
  };

  const getActualWinner = (result: MatchResult): 'Home' | 'Draw' | 'Away' => {
    if (result.homeScore > result.awayScore) return 'Home';
    if (result.homeScore < result.awayScore) return 'Away';
    return 'Draw';
  };

  const handleSave = async () => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setToast({ type: 'error', message: 'Please enter valid scores' });
      return;
    }

    setIsSaving(true);

    try {
      const result: MatchResult = {
        homeScore: home,
        awayScore: away,
        winner: getActualWinner({ homeScore: home, awayScore: away, isFinished: true }),
        isFinished: true,
      };

      // Update in history service
      const updated = historyService.updateResult(matchId, result);

      if (updated) {
        setToast({ type: 'success', message: 'Result saved!' });
        setIsEditing(false);
        onResultUpdated?.(matchId, result);
      } else {
        setToast({ type: 'error', message: 'Failed to save result' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to save result' });
    } finally {
      setIsSaving(false);
    }
  };

  const status = getPredictionStatus();

  if (isEditing) {
    return (
      <>
        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-slate-400 text-sm">Result:</span>
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <span className="text-white">-</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg transition-colors disabled:opacity-50"
            title="Save result"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="p-2 text-slate-400 hover:bg-slate-600 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'pending' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-lg">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Pending</span>
        </div>
      )}

      {status === 'correct' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">
            {existingResult?.homeScore} - {existingResult?.awayScore} (Correct!)
          </span>
        </div>
      )}

      {status === 'incorrect' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">
            {existingResult?.homeScore} - {existingResult?.awayScore}
          </span>
        </div>
      )}

      <button
        onClick={() => setIsEditing(true)}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        title="Edit result"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

/**
 * Accuracy Badge Component
 *
 * Displays overall accuracy statistics
 */
interface AccuracyBadgeProps {
  correct: number;
  total: number;
}

export const AccuracyBadge: React.FC<AccuracyBadgeProps> = ({ correct, total }) => {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 70) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (percentage >= 50) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (percentage >= 30) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Needs Work', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const grade = getGrade();

  return (
    <div className={`px-4 py-2 ${grade.bg} rounded-xl border border-white/10`}>
      <div className="flex items-center gap-3">
        <div>
          <div className="text-2xl font-bold text-white">{percentage}%</div>
          <div className="text-xs text-slate-400">Accuracy</div>
        </div>
        <div className="h-8 w-px bg-slate-600"></div>
        <div>
          <div className={`text-sm font-medium ${grade.color}`}>{grade.label}</div>
          <div className="text-xs text-slate-400">{correct}/{total} correct</div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResultTracker;
