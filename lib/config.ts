/**
 * Application Configuration
 *
 * Centralized configuration for models, tokens, and other settings.
 * Values can be overridden via environment variables.
 */

// Default model names (can be overridden via env vars)
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Model Configuration
 *
 * Maps semantic model names (VISION, ANALYSIS, EXPLANATION) to actual Claude model IDs.
 * This allows you to:
 * - Use different models for different tasks
 * - Quickly switch models via environment variables
 * - Test cheaper models in development
 */
export const MODELS = {
  /**
   * VISION: Used for extracting data from medical bill images/PDFs
   * Requires vision capabilities (document + image support)
   */
  VISION:
    process.env.ANTHROPIC_MODEL_VISION ||
    process.env.ANTHROPIC_MODEL ||
    DEFAULT_MODEL,

  /**
   * ANALYSIS: Used for detecting billing errors and analyzing charges
   * Can use a more powerful model for better accuracy
   */
  ANALYSIS:
    process.env.ANTHROPIC_MODEL_ANALYSIS ||
    process.env.ANTHROPIC_MODEL ||
    DEFAULT_MODEL,

  /**
   * EXPLANATION: Used for translating medical codes to plain English
   * Can potentially use a cheaper/faster model since it's simpler
   */
  EXPLANATION:
    process.env.ANTHROPIC_MODEL_EXPLANATION ||
    process.env.ANTHROPIC_MODEL ||
    DEFAULT_MODEL,
};

/**
 * Token Limits
 *
 * Maximum tokens for each model type.
 * Adjust these based on your needs and cost considerations.
 */
export const TOKEN_LIMITS = {
  VISION: parseInt(process.env.ANTHROPIC_MAX_TOKENS_VISION || '8192'),
  // Note: claude-sonnet-4-5 max output is 64000, but 16384 is sufficient for analysis
  ANALYSIS: parseInt(process.env.ANTHROPIC_MAX_TOKENS_ANALYSIS || '16384'),
  EXPLANATION: parseInt(process.env.ANTHROPIC_MAX_TOKENS_EXPLANATION || '4096'),
};

/**
 * Configuration Summary (for debugging)
 */
export function getConfigSummary() {
  return {
    models: MODELS,
    tokenLimits: TOKEN_LIMITS,
  };
}
