import Anthropic from '@anthropic-ai/sdk';

// Initialize clients for different API keys
export function getVisionClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY_VISION || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_VISION or ANTHROPIC_API_KEY not found in environment variables');
  }
  return new Anthropic({ apiKey });
}

export function getAnalysisClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY_ANALYSIS || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_ANALYSIS or ANTHROPIC_API_KEY not found in environment variables');
  }
  // Set timeout to 15 minutes for large bills with many line items
  return new Anthropic({
    apiKey,
    timeout: 15 * 60 * 1000, // 15 minutes in milliseconds
  });
}

export function getExplanationClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY_EXPLANATION || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY_EXPLANATION or ANTHROPIC_API_KEY not found in environment variables');
  }
  return new Anthropic({ apiKey });
}

// Helper to convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Detect media type from file
export function getMediaType(file: File): 'image/jpeg' | 'image/png' {
  const type = file.type;
  if (type === 'image/png') return 'image/png';
  // Note: Claude's vision API supports PDF as document type but we'll use image for simplicity
  // PDFs and JPEGs will be treated as JPEG
  return 'image/jpeg';
}

// Retry wrapper for Claude API calls with rate limit handling
export async function withRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: unknown) {
      // Check if it's a rate limit error (429)
      const isRateLimitError =
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 429;

      // Only retry on rate limit errors and if we have retries left
      if (isRateLimitError && attempt < maxRetries - 1) {
        // Try to get retry-after header, default to exponential backoff
        let retryAfter = 60; // Default 60 seconds

        if ('headers' in error && error.headers && typeof error.headers === 'object') {
          const headers = error.headers as Record<string, unknown>;
          const retryAfterHeader = headers['retry-after'];
          if (typeof retryAfterHeader === 'string') {
            retryAfter = parseInt(retryAfterHeader, 10) || 60;
          } else if (typeof retryAfterHeader === 'number') {
            retryAfter = retryAfterHeader;
          }
        }

        console.log(`Rate limit hit. Retrying in ${retryAfter} seconds... (Attempt ${attempt + 1}/${maxRetries})`);

        // Wait for the retry-after duration
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // For non-rate-limit errors or final retry, throw the error
      throw error;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

// Parse JSON response from Claude (handles markdown code blocks)
export function parseClaudeJSON<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', cleaned);
    throw new Error(`Invalid JSON response from Claude: ${error}`);
  }
}
