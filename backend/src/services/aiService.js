const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = 'gemini-2.5-flash';

const systemPrompt = `You are a Senior Product Manager and Functional Analyst with 15+ years of experience.
Your goal is to help the user build a complete, clear, and high-quality Product Requirements Document (PRD).

You will guide the user through a structured process, ONE stage at a time:
1. Product Context
2. Problem Definition
3. Users & Personas
4. Proposed Solution
5. Features
6. Use Cases
7. Functional Requirements
8. Non-Functional Requirements
9. Success Metrics
10. Scope & Roadmap

Rules:
- Respond in the user's language (Spanish preferred).
- Ask precise, structured, and context-aware questions.
- Ask one question or a small set of related questions at a time.
- If the user's answer is vague, challenge it constructively and ask for clarification.
- If the answer is sufficient, briefly summarize your understanding, confirm you are moving to the NEXT stage, and ask the first question for that next stage.
- Keep responses concise but insightful.
- When generating the final PRD, format it professionally using Markdown.`;

const stageGoals = [
  "Stage 1 (Context): Understand the product name, its elevator pitch, industry, and whether it's new or an iteration.",
  "Stage 2 (Problem): Clearly define the problem, the pain points, who experiences it, and why current solutions are insufficient.",
  "Stage 3 (Users): Identify target user personas, their roles, goals, and technical skill level.",
  "Stage 4 (Solution): Define the core solution logic, value proposition, and how it solves the problem from Stage 2.",
  "Stage 5 (Features): List the main epic features, distinguishing must-haves for MVP from nice-to-haves.",
  "Stage 6 (Use Cases): Detail specific user journeys or scenarios mapping how they will use the features.",
  "Stage 7 (Functional Req): Detail the technical rules: What the system must DO. (e.g. users must be able to reset password via email).",
  "Stage 8 (Non-Functional Req): Detail the technical constraints: Performance, security, scalability, compliance.",
  "Stage 9 (Success Metrics): Definable KPIs or OKRs to measure whether the product release is successful.",
  "Stage 10 (Roadmap/Scope): What is out of scope for the first release, and what happens in V2."
];

/**
 * Evaluates the user's input, provides feedback, and asks the next question.
 * @param {number} stage - The current stage (1-10)
 * @param {Array} contextHistory - Previous chat messages context
 * @param {string} userAnswer - The user's latest response
 * @returns {Promise<string>} - The AI's response text
 */
async function evaluateAnswer(stage, contextHistory, userAnswer) {
  try {
    const currentGoal = stageGoals[stage - 1];
    
    // Convert generic chat history format to Gemini format format
    const contents = [
      {
        role: "user",
        parts: [{ text: `Here are my guidelines based on your system instructions:\n\n${systemPrompt}\n\nWe are currently on ${currentGoal}. Focus specifically on achieving this stage's goal. Acknowledge previous context if necessary. Start the conversation.` }]
      },
      ...contextHistory.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }))
    ];

    if (userAnswer) {
      contents.push({
        role: "user",
        parts: [{ text: userAnswer }]
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw new Error('Error interacting with the AI service.');
  }
}

/**
 * Generates the final PRD document based on all collected answers.
 * @param {Object} answers - JSON object containing answers for all 10 stages
 * @returns {Promise<string>} - The Markdown formatted PRD
 */
async function generateFinalPRD(answers) {
  try {
    const prompt = `Using all the collected information below, generate a complete Product Requirements Document (PRD) in Spanish.

Information Collected via Interview:
${JSON.stringify(answers, null, 2)}

Structure it nicely in Markdown using these sections:
# Product Requirements Document
## 1. Contexto General (Overview)
## 2. Definición del Problema (Problem Statement)
## 3. Embudos y Usuarios (Users & Personas)
## 4. Descripción de la Solución (Solution Description)
## 5. Funcionalidades y Épicas (Features)
## 6. Casos de Uso (Use Cases)
## 7. Requisitos Funcionales (Functional Requirements)
## 8. Requisitos No Funcionales (Non-Functional Requirements)
## 9. Métricas de Éxito (Success Metrics)
## 10. Roadmap y Alcance (Roadmap / Scope)

Rules:
- Be clear, structured, and professional.
- Avoid fluff and filler words.
- Use formatting (bolding, lists) to make it scannable.
- Ensure internal consistency across all sections.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text;
  } catch (error) {
    console.error('Error generating final PRD:', error);
    throw new Error('Error al generar el documento final del PRD.');
  }
}

module.exports = {
  evaluateAnswer,
  generateFinalPRD
};
