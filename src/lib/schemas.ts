/**
 * Zod Validation Schemas
 *
 * Runtime validation schemas for all data types.
 */

import { z } from 'zod';

// ============================================
// Auth & User Schemas
// ============================================

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  fullName: z.string().max(100).optional(),
});

// ============================================
// Prediction Schemas
// ============================================

export const predictionProbabilitiesSchema = z.object({
  homeWin: z.number().min(0).max(1),
  draw: z.number().min(0).max(1),
  awayWin: z.number().min(0).max(1),
}).refine(
  (data) => {
    const sum = data.homeWin + data.draw + data.awayWin;
    return Math.abs(sum - 1.0) <= 0.1; // Allow 10% tolerance
  },
  {
    message: 'Probabilities must sum to 100% (±10%)',
  }
);

export const predictionResultSchema = z.object({
  matchId: z.string(),
  probabilities: predictionProbabilitiesSchema,
  summary: z.string(),
  detailedAnalysis: z.string(),
  keyFactors: z.array(z.string()),
  sources: z.array(z.object({
    title: z.string(),
    uri: z.string().url(),
  })),
  lastUpdated: z.string(),
});

export const scorerPredictionSchema = z.object({
  player: z.string(),
  team: z.string(),
  method: z.enum(['Shot', 'Header', 'Penalty', 'Free Kick', 'Own Goal', 'Unknown']),
  likelihood: z.string(),
});

export const detailedForecastResultSchema = z.object({
  matchId: z.string(),
  predictedScore: z.string(),
  totalGoals: z.string(),
  firstTeamToScore: z.string(),
  halfTimeWinner: z.enum(['Home', 'Draw', 'Away']),
  secondHalfWinner: z.enum(['Home', 'Draw', 'Away']),
  likelyScorers: z.array(scorerPredictionSchema),
  scoringMethodProbabilities: z.object({
    penalty: z.string(),
    freeKick: z.string(),
    cornerHeader: z.string(),
    ownGoal: z.string(),
    outsideBox: z.string(),
  }),
  redCards: z.string(),
  confidenceScore: z.enum(['High', 'Medium', 'Low']),
  reasoning: z.string(),
});

// ============================================
// Match Schemas
// ============================================

export const matchSchema = z.object({
  id: z.string(),
  sport: z.string(),
  league: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  startTime: z.string(),
  status: z.enum(['Scheduled', 'Live', 'Finished', 'Postponed']),
  score: z.string().optional(),
  minute: z.string().optional(),
});

// ============================================
// API Response Schemas
// ============================================

export const geminiResponseSchema = z.object({
  text: z.string(),
  candidates: z.array(z.object({
    groundingMetadata: z.object({
      groundingChunks: z.array(z.object({
        web: z.object({
          uri: z.string().url(),
          title: z.string(),
        }),
      })).optional(),
    }),
  })).optional(),
});

// ============================================
// Validation Helpers
// ============================================

export const validateAndParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: z.ZodError } => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  return { success: true, data: result.data };
};

export default {
  signInSchema,
  signUpSchema,
  predictionResultSchema,
  detailedForecastResultSchema,
  validateAndParse,
  safeParse,
};
