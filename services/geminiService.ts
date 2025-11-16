import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse, Chat, FunctionCall } from "@google/genai";
import type { LogAnalysisResult, ChatMessage, Alert, ChartData, ComplianceCheckResult, RegisteredPrompt, PromptVersion, UserFeedbackAnalysis, Metric } from '../types';
import { COST_CHART_DATA, LATENCY_CHART_DATA } from '../constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLogs = async (logs: string): Promise<LogAnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `
Analyze the following application logs. Extract key events, identify their severity (INFO, WARNING, ERROR, CRITICAL), and provide a concise summary. For errors or critical issues, suggest potential solutions.

Logs:
---
${logs}
---
`,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "A concise summary of the key events in the logs." },
                    events: {
                        type: Type.ARRAY,
                        description: "A list of structured log events.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                timestamp: { type: Type.STRING, description: "The timestamp of the log entry. If not available, use an approximation or the current time." },
                                severity: { type: Type.STRING, description: "The severity level of the log entry (e.g., INFO, WARNING, ERROR, CRITICAL, UNKNOWN)." },
                                message: { type: Type.STRING, description: "The main message or content of the log entry." },
                                suggestion: { type: Type.STRING, description: "A potential root cause or solution, especially for ERROR or CRITICAL events. Can be omitted if not applicable." }
                            },
                            required: ["timestamp", "severity", "message"]
                        }
                    }
                },
                required: ["summary", "events"]
            },
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) { jsonString = jsonString.substring(7, jsonString.length - 3).trim(); }
    
    return JSON.parse(jsonString) as LogAnalysisResult;
  } catch (error) {
    console.error("Error analyzing logs:", error);
    return { 
        summary: `An error occurred while analyzing the logs. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        events: []
    };
  }
};

export const getLogDetails = async (logMessage: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Provide a detailed technical explanation for the following application log error. Focus on:
1.  **Potential Root Causes:**
2.  **Debugging Steps:**
3.  **Code Examples (if applicable):**
Format your response in markdown. Log Error:
---
${logMessage}
---
`,
        config: { temperature: 0.3, thinkingConfig: { thinkingBudget: 32768 } },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting log details:", error);
    return `An error occurred while fetching details. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const optimizePrompt = async (systemInstruction: string, userPrompt: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Act as a prompt engineering expert. Analyze the following System Instruction and User Prompt. Provide a revised, improved version of the User Prompt. Explain your reasoning for the changes.
Original System Instruction:
---
${systemInstruction}
---
Original User Prompt:
---
${userPrompt}
---
Provide your analysis and the improved prompt in markdown format.`,
        config: { temperature: 0.5, thinkingConfig: { thinkingBudget: 32768 } },
    });
    return response.text;
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return `An error occurred while optimizing the prompt. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

interface RunPromptOptions {
  model?: string;
  systemInstruction: string;
  userPrompt: string;
  temperature?: number;
}

export const runPrompt = async ({ model = 'gemini-2.5-flash', systemInstruction, userPrompt, temperature = 0.7 }: RunPromptOptions): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: { systemInstruction: systemInstruction, temperature: temperature, maxOutputTokens: 2048 },
    });
    return response.text;
  } catch (error) {
    console.error("Error running prompt:", error);
    // Rethrow to be caught by the caller, allowing for specific UI error handling.
    throw error;
  }
};

export const analyzeAlert = async (alert: Alert): Promise<string> => {
  try {
    const contextString = JSON.stringify(alert.context, null, 2);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Act as a senior SRE. Analyze the following alert and its context to provide a root cause analysis.
**Alert:** ${alert.title} - ${alert.description}
**Context:**
\`\`\`json
${contextString}
\`\`\`
Your analysis should be in markdown and include: Summary, Likely Root Cause, Potential Impact, and Recommended Actions.`,
        config: { temperature: 0.3, thinkingConfig: { thinkingBudget: 32768 } },
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing alert:", error);
    return `An error occurred during analysis. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const rateResponseQuality = async (prompt: string, response: string): Promise<{ score: number; reasoning: string; }> => {
    try {
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the quality of the 'Response' based on the 'Original Prompt'. Provide a numerical score from 1 (poor) to 10 (excellent) and brief reasoning.
Prompt:
---
${prompt}
---
Response:
---
${response}
---`,
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "A quality score from 1 to 10." },
                        reasoning: { type: Type.STRING, description: "A brief justification for the score." }
                    },
                    required: ["score", "reasoning"]
                },
            },
        });
        let jsonString = geminiResponse.text.trim();
        if (jsonString.startsWith('```json')) { jsonString = jsonString.substring(7, jsonString.length - 3).trim(); }
        return JSON.parse(jsonString) as { score: number; reasoning: string; };
    } catch (error) {
        console.error("Error rating response quality:", error);
        return { score: 0, reasoning: "Failed to generate a quality score due to an error." };
    }
};

// --- CHAT SERVICE FUNCTIONS ---

const getCostDataFunctionDeclaration: FunctionDeclaration = {
  name: 'get_cost_data',
  description: 'Get the daily cost data for the last 7 days to display in a chart.',
  parameters: { type: Type.OBJECT, properties: {} },
};

const getLatencyDataFunctionDeclaration: FunctionDeclaration = {
  name: 'get_latency_data',
  description: 'Get the average latency data for the last 24 hours to display in a chart.',
  parameters: { type: Type.OBJECT, properties: {} },
};

export const availableFunctions: { [key: string]: () => any } = {
  get_cost_data: () => COST_CHART_DATA,
  get_latency_data: () => LATENCY_CHART_DATA,
};

export const startChat = (): Chat => {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: "You are a helpful GenAiOps Hub assistant. You can answer questions about project data by using the available tools. When a user asks for a chart or data, use the provided functions to get the data and inform the user that you are displaying it.",
      tools: [{
        functionDeclarations: [getCostDataFunctionDeclaration, getLatencyDataFunctionDeclaration]
      }]
    }
  });
  return chat;
};

export const sendMessage = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  const response = await chat.sendMessage({ message });
  return response;
};

export const sendFunctionResponse = async (chat: Chat, functionCall: FunctionCall, functionResult: any): Promise<GenerateContentResponse> => {
  const response = await chat.sendMessage({
      parts: [{
          functionResponse: {
              name: functionCall.name,
              response: functionResult,
          }
      }]
  });
  return response;
};


// --- NEW AI PM SERVICE FUNCTIONS ---

export const generateProblemStatement = async (businessGoal: string, userProblem: string, successMetrics: string): Promise<string> => {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `As an AI Product Manager, translate the following business inputs into a concise and actionable Machine Learning Problem Statement.

**Business Goal:** ${businessGoal}
**User Problem:** ${userProblem}
**Key Success Metrics:** ${successMetrics}

The ML Problem Statement should clearly define what the model needs to predict or generate to solve the user problem and achieve the business goal.`,
        config: { temperature: 0.4, thinkingConfig: { thinkingBudget: 32768 } },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating problem statement:", error);
    return `An error occurred. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateReportSummary = async (title: string, audience: 'Executive' | 'Marketing' | 'Technical', metrics: Metric[], notes: string): Promise<string> => {
  try {
     const metricsString = metrics.length > 0
        ? metrics.map(m => `- ${m.name}: ${m.value} (change: ${m.change})`).join('\n')
        : 'No specific metrics provided.';

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a concise, professional summary for a stakeholder report.

**Report Title:** ${title}
**Target Audience:** ${audience}
**Key Performance Metrics:**
${metricsString}
**Additional Notes/Context from Product Manager:**
${notes || 'None.'}

Your task is to synthesize this data into a narrative summary. Tailor the language and focus for the specified audience:
- For **Executives**, focus on business impact, ROI, cost implications, and strategic alignment.
- For **Marketing**, focus on user impact, adoption trends, and messaging opportunities.
- For **Technical** teams, include key performance metrics and their technical implications (e.g., latency affecting user experience).
Do not just list the metrics; explain what they mean in the context of the project's goals.
`,
        config: { temperature: 0.6 },
    });
    return response.text;
  } catch (error) {
    console.error("Error generating report summary:", error);
    return `An error occurred. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateReportInsights = async (title: string, audience: string, metrics: Metric[], notes: string): Promise<string[]> => {
  try {
     const metricsString = metrics.length > 0
        ? metrics.map(m => `- ${m.name}: ${m.value} (change: ${m.change})`).join('\n')
        : 'No specific metrics provided.';

     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following stakeholder report data and generate 3-4 key, actionable insights as bullet points.

**Report Title:** ${title}
**Target Audience:** ${audience}
**Key Performance Metrics:**
${metricsString}
**Additional Notes/Context:**
${notes || 'None.'}

Focus on the "so what?" of the data. What are the most important takeaways for the target audience? What decisions could be made based on this information?`,
        config: {
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    insights: {
                        type: Type.ARRAY,
                        description: "A list of 3-4 key, actionable insights as strings.",
                        items: {
                            type: Type.STRING
                        }
                    }
                },
                required: ["insights"]
            },
        },
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) { jsonString = jsonString.substring(7, jsonString.length - 3).trim(); }
    
    const parsed = JSON.parse(jsonString) as { insights: string[] };
    return parsed.insights;
  } catch (error) {
    console.error("Error generating report insights:", error);
    return [`An error occurred while generating insights: ${error instanceof Error ? error.message : 'Unknown error'}`];
  }
};

export const getComplianceSuggestions = async (failedChecks: ComplianceCheckResult[], prompt: RegisteredPrompt | PromptVersion): Promise<string> => {
  const checkDetails = failedChecks.map(c => `- **Policy:** ${c.policyName}\n  - **Reason:** ${c.details}`).join('\n');
  
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Act as an AI governance and prompt engineering expert. The following prompt has failed several compliance checks. Analyze the failed policies and the prompt content, then provide specific, actionable suggestions on how to modify the prompt to make it compliant.

**Failed Policies:**
${checkDetails}

**Original System Instruction:**
---
${prompt.systemInstruction}
---
**Original User Prompt:**
---
${prompt.userPrompt}
---

Your suggestions should be clear, concise, and formatted in markdown. Explain *why* each change is necessary.`,
        config: { temperature: 0.4, thinkingConfig: { thinkingBudget: 32768 } },
    });
    return response.text;
  } catch (error) {
    console.error("Error getting compliance suggestions:", error);
    return `An error occurred while generating suggestions. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const analyzeUserFeedback = async (feedbackText: string): Promise<UserFeedbackAnalysis> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following raw user feedback. Provide a concise overall summary, determine the overall sentiment (Positive, Neutral, or Negative), and extract the key themes. For each theme, provide a representative user quote and its specific sentiment.

Feedback:
---
${feedbackText}
---
`,
        config: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "A concise summary of the feedback." },
                    overallSentiment: { type: Type.STRING, description: "The overall sentiment: 'Positive', 'Neutral', or 'Negative'." },
                    themes: {
                        type: Type.ARRAY,
                        description: "A list of key themes found in the feedback.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                theme: { type: Type.STRING, description: "The name of the theme (e.g., 'Performance Issues', 'Feature Request')." },
                                quote: { type: Type.STRING, description: "A direct quote from the feedback that represents this theme." },
                                sentiment: { type: Type.STRING, description: "The sentiment of this specific theme: 'Positive', 'Neutral', or 'Negative'." }
                            },
                            required: ["theme", "quote", "sentiment"]
                        }
                    }
                },
                required: ["summary", "overallSentiment", "themes"]
            },
        },
    });
    
    let jsonString = response.text.trim();
    if (jsonString.startsWith('```json')) { jsonString = jsonString.substring(7, jsonString.length - 3).trim(); }
    
    return JSON.parse(jsonString) as UserFeedbackAnalysis;
  } catch (error) {
    console.error("Error analyzing user feedback:", error);
    // You could throw the error or return a default error object
    throw new Error('Failed to analyze user feedback.');
  }
};