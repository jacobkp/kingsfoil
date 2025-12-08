import { NextRequest, NextResponse } from 'next/server';
import { getExplanationClient, parseClaudeJSON, withRetry } from '@/lib/anthropic';
import { ExplainApiRequest } from '@/lib/types';
import { PROMPTS, formatPrompt } from '@/lib/prompts';
import { MODELS, TOKEN_LIMITS } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    console.log('[API /explain] Request received');
    const body: ExplainApiRequest = await request.json();
    const { line_items } = body;

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      console.error('[API /explain] ERROR: No line items provided or empty array');
      return NextResponse.json(
        { success: false, error: 'No line items provided' },
        { status: 400 }
      );
    }

    console.log('[API /explain] Explaining', line_items.length, 'line items...');
    // Call Claude to explain line items
    const client = getExplanationClient();
    const prompt = formatPrompt(PROMPTS.EXPLAIN_CODES, {
      LINE_ITEMS: JSON.stringify(line_items, null, 2),
    });

    const response = await withRetry(() =>
      client.messages.create({
        model: MODELS.EXPLANATION,
        max_tokens: TOKEN_LIMITS.EXPLANATION,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      })
    );

    // Extract text from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    console.log('[API /explain] Parsing explanations...');
    let result: { explanations: string[] };
    try {
      result = parseClaudeJSON<{ explanations: string[] }>(textContent.text);
      console.log('[API /explain] Successfully generated', result.explanations.length, 'explanations');
    } catch (parseError) {
      console.error('[API /explain] JSON parsing error:', parseError);
      console.error('[API /explain] Raw response:', textContent.text.substring(0, 500)); // Log first 500 chars
      return NextResponse.json(
        {
          success: false,
          error: 'We encountered an issue explaining the line items. Please try again.',
        },
        { status: 500 }
      );
    }

    // Validate we got the right number of explanations
    if (result.explanations.length !== line_items.length) {
      console.error(
        `[API /explain] Explanation count mismatch: Expected ${line_items.length} but got ${result.explanations.length}`
      );
      return NextResponse.json(
        {
          success: false,
          error: 'We encountered an issue explaining the line items. Please try again.',
        },
        { status: 500 }
      );
    }

    console.log('[API /explain] Success - returning explanations');
    return NextResponse.json({
      success: true,
      explanations: result.explanations,
    });
  } catch (error) {
    console.error('Explain API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'We encountered an issue explaining the line items. Please try again.',
      },
      { status: 500 }
    );
  }
}
