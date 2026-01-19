
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * Uses Gemini 3 Pro with Thinking Mode for complex feasibility and market analysis.
 * Adheres to the user's specific instruction: ThinkingBudget 32768, No maxOutputTokens.
 */
export const analyzeAppFeasibility = async (prompt: string) => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Feasibility analysis error:", error);
    return "Failed to analyze feasibility. Please check your API key.";
  }
};

/**
 * Uses Gemini 3 Pro with Thinking Mode for complex coordination advice (luggage, pets, timing).
 */
export const getComplexCoordinationAdvice = async (chatHistory: string, query: string) => {
  const ai = getGeminiClient();
  const prompt = `
    Context: You are PathMate AI, a smart carpooling assistant.
    Recent Chat History: ${chatHistory}
    User Query: ${query}
    
    Task: Provide a detailed, thoughtful solution to this complex coordination problem. 
    Think through logistical constraints like vehicle size, traffic, and safety.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Coordination advisor error:", error);
    return "I'm having trouble thinking through this right now. Please try again.";
  }
};

/**
 * Uses Gemini 2.5 Flash with Google Maps tool for route verification and point of interest discovery
 */
export const getRouteInsights = async (origin: string, destination: string, lat?: number, lng?: number) => {
  const ai = getGeminiClient();
  const prompt = `I am planning a trip from ${origin} to ${destination}. Suggest some safe meetup points, popular landmarks, and top-rated restaurants near these locations. Check current local traffic conditions or area safety if possible.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
          }
        }
      },
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text,
      links: chunks.map((c: any) => ({
        title: c.maps?.title || "Map Link",
        uri: c.maps?.uri || "#"
      }))
    };
  } catch (error) {
    console.error("Route insight error:", error);
    return { text: "Could not fetch map insights at this time.", links: [] };
  }
};

/**
 * Quick smart matching using Gemini 3 Flash
 */
export const getMatchingExplanation = async (riderRequest: string, availableRoutes: any[]) => {
  const ai = getGeminiClient();
  const prompt = `
    Rider Request: ${riderRequest}
    Available Routes: ${JSON.stringify(availableRoutes)}
    
    Explain which route is the best match for the rider and why, considering direction and timing. Keep it conversational and brief.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Matching error:", error);
    return "Matching logic currently unavailable.";
  }
};
