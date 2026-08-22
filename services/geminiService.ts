type GeminiOperation =
  | 'analyzeAppFeasibility'
  | 'getComplexCoordinationAdvice'
  | 'getRouteInsights'
  | 'getMatchingExplanation';

const GEMINI_API_BASE_URL = (import.meta.env.VITE_GEMINI_API_BASE_URL || '').replace(/\/$/, '');

async function requestGemini<T>(operation: GeminiOperation, input: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${GEMINI_API_BASE_URL}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation, ...input }),
  });

  if (!response.ok) {
    throw new Error(`Gemini backend returned ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Uses the server-side Gemini proxy for complex feasibility analysis. */
export const analyzeAppFeasibility = async (prompt: string) => {
  try {
    const result = await requestGemini<{ text: string }>('analyzeAppFeasibility', { prompt });
    return result.text;
  } catch (error) {
    console.error('Feasibility analysis error:', error);
    return 'Failed to analyze feasibility. AI features are temporarily unavailable.';
  }
};

/** Uses the server-side Gemini proxy for complex coordination advice. */
export const getComplexCoordinationAdvice = async (chatHistory: string, query: string) => {
  try {
    const result = await requestGemini<{ text: string }>('getComplexCoordinationAdvice', {
      chatHistory,
      query,
    });
    return result.text;
  } catch (error) {
    console.error('Coordination advisor error:', error);
    return "I'm having trouble thinking through this right now. Please try again.";
  }
};

/** Uses the server-side Gemini proxy for route verification and point-of-interest discovery. */
export const getRouteInsights = async (origin: string, destination: string, lat?: number, lng?: number) => {
  try {
    return await requestGemini<{ text: string; links: Array<{ title: string; uri: string }> }>(
      'getRouteInsights',
      { origin, destination, lat, lng },
    );
  } catch (error) {
    console.error('Route insight error:', error);
    return { text: 'Could not fetch map insights at this time.', links: [] };
  }
};

/** Uses the server-side Gemini proxy for quick route-match explanations. */
export const getMatchingExplanation = async (riderRequest: string, availableRoutes: unknown[]) => {
  try {
    const result = await requestGemini<{ text: string }>('getMatchingExplanation', {
      riderRequest,
      availableRoutes,
    });
    return result.text;
  } catch (error) {
    console.error('Matching error:', error);
    return 'Matching logic currently unavailable.';
  }
};
