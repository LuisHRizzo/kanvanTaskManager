1. Enfoque conceptual (lo importante de verdad)

Tu producto no es un “generador de PRD”.

👉 Es un sistema de extracción de conocimiento + estructuración + claridad de producto.

Pensalo como:

“Un analista funcional senior encapsulado en IA que sabe hacer las preguntas correctas.”

🧩 2. Cómo estructurar el flujo (la clave del éxito)

No hagas un solo prompt gigante.

Hacé un flujo iterativo tipo wizard, donde cada paso construye contexto.

📌 Etapas recomendadas
Contexto del producto
Problema
Usuarios
Solución
Features
Casos de uso
Requerimientos funcionales
No funcionales
Métricas de éxito
Roadmap / alcance
🤖 3. Diseño del sistema de prompts (MUY importante)

Te propongo un enfoque profesional:

🧱 A. Prompt base (System Prompt)

Este define el “cerebro” del analista.

You are a Senior Product Manager and Functional Analyst with 15+ years of experience.

Your goal is to help the user build a complete, clear and high-quality Product Requirements Document (PRD).

You must:
- Ask precise, structured and context-aware questions
- Detect ambiguities and request clarification
- Challenge weak ideas constructively
- Think step-by-step before moving forward
- Never assume missing information

You will guide the user through a structured process:
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
- Ask one question at a time (or a small batch if needed)
- After each answer, briefly summarize understanding
- Adapt next question based on previous answers
- Keep responses concise but insightful
🧩 B. Prompt por etapa (ejemplo)
🧠 Etapa 1: Contexto
Current Stage: Product Context

Goal:
Understand the general idea of the product.

Ask:
- What is the name of the product?
- In one sentence, what does it do?
- Is this a new product or an iteration of an existing one?
- What industry does it belong to?

Output:
- A short structured summary
- Then move to next stage only if enough clarity
🔥 Etapa 2: Problema
Current Stage: Problem Definition

Goal:
Clearly define the problem being solved.

Ask:
- What specific problem are you solving?
- Who experiences this problem?
- How is it currently being solved?
- Why are current solutions insufficient?

If answers are vague:
→ Ask follow-up questions

Output:
- Problem Statement (clear, concise, testable)
🧪 C. Prompt generador de PRD final

Cuando ya tengas todo:

Using all the collected information, generate a complete Product Requirements Document (PRD).

Structure:

# Product Requirements Document

## 1. Overview
## 2. Problem Statement
## 3. Users & Personas
## 4. Solution Description
## 5. Features
## 6. Use Cases
## 7. Functional Requirements
## 8. Non-Functional Requirements
## 9. Success Metrics
## 10. Roadmap / Scope

Rules:
- Be clear, structured, and professional
- Avoid fluff
- Use bullet points where appropriate
- Ensure internal consistency
🏗️ 4. Arquitectura recomendada (para tu caso real)

Dado que venís trabajando con Next.js + APIs:

🧩 Frontend (Next.js)
Wizard UI (step-by-step)
Chat UI opcional
Estado persistido (Zustand o similar)
🧠 Backend
Endpoint /api/prd/step
Endpoint /api/prd/generate
🧠 IA Layer
Mantener:
conversation_state
stage
answers
🧬 5. Modelo de datos sugerido
type PRDSession = {
  id: string
  stage: number
  answers: {
    context?: {}
    problem?: {}
    users?: {}
    solution?: {}
    features?: {}
    useCases?: {}
    functionalReqs?: {}
    nonFunctionalReqs?: {}
    metrics?: {}
    roadmap?: {}
  }
}
⚡ 6. Diferencial que te va a hacer destacar

Si querés que esto sea MUY bueno:

🔥 Agregá:
✅ Validación de calidad de respuestas
✅ “Esto está flojo porque…” (feedback de IA)
✅ Ejemplos automáticos
✅ Reescritura profesional
✅ Modo:
“Startup”
“Enterprise”
“MVP rápido”
🧠 7. Bonus: Meta-prompt (para mejorar tu herramienta)

Podés hacer que la IA mejore sus propias preguntas:

Analyze the current answers provided by the user.

Identify:
- Missing information
- Ambiguities
- Weak definitions

Then:
- Ask the most valuable next question to improve the PRD quality