export const appLogger = {
  error: (message: string, context?: unknown) => {
    console.error(`[ProbablePlay] ${message}`, context ?? '');
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[ProbablePlay] ${message}`, context ?? '');
  },
  info: (message: string, context?: unknown) => {
    console.info(`[ProbablePlay] ${message}`, context ?? '');
  }
};
