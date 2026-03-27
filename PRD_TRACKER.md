# PRD Builder - Seguimiento de Implementación

Este documento sirve como registro y checklist ("memoria") del progreso en la construcción de la herramienta de creación algorítmica de PRD con Inteligencia Artificial.

## Pendientes

### 1. Configuración de Base de Datos y Backend
- [x] Instalar `@google/genai` en el backend.
- [x] Crear el modelo `PRDSession` (`backend/src/models/PRDSession.js`).
- [x] Importar y relacionar `PRDSession` en la inicialización de la base de datos (Ej: `Project.hasOne(PRDSession)`).

### 2. Capa de Servicios de Inteligencia Artificial
- [x] Crear `backend/src/services/aiService.js`.
- [x] Implementar el "System Prompt" del Analista Senior (Etapas 1 al 10).
- [x] Desarrollar la función `evaluateAnswer(stage, context, userAnswer)`.
- [x] Desarrollar la función `generateFinalPRD(answers)`.

### 3. Rutas y Controladores
- [x] Crear `backend/src/controllers/prdController.js` (startSession, sendFeedback, generateDocument).
- [x] Crear `backend/src/routes/prdRoutes.js` e integrarlo en `app.js`.

### 4. Capa de Datos en Frontend
- [x] Extender `store.js` o crear `prdStore.js` con estado persistido o dinámico de la sesión actual de PRD.

### 5. Interfaz de Usuario (El "Wizard")
- [x] Crear la página principal `frontend/src/pages/PRDBuilder.jsx`.
- [x] Integrar un Chat dinámico y UI de wizard de 10 pasos.
- [x] Registrar la ruta `/prd/:id` en `frontend/src/App.jsx`.
- [x] Añadir botón "Generar PRD" en las opciones del proyecto en `Dashboard.jsx`.

### 6. Verificación y Pruebas
- [x] Verificar que una sesión guarda respuestas exitosamente en la BD.
- [x] Confirmar generación del documento MarkDown final tras completar los 10 pasos.

## Fase 2: Visualizador de Documentos PRD

### 1. Backend: Endpoints de Listado
- [x] Agregar la función `getSessionsByProject(req, res)` en `prdController.js`.
- [x] Registrar la ruta `GET /project/:projectId` en `prdRoutes.js`.

### 2. Frontend: Zustand Store
- [x] Añadir `projectSessions: []` en `prdStore.js`.
- [x] Implementar la acción `fetchProjectSessions(projectId)`.

### 3. Frontend: Sistema de Pestañas (ProjectView.jsx)
- [x] Modificar `ProjectView.jsx` para integrar el toggle "Tablero | Documentos PRD".
- [x] Crear el renderizado de lista de tarjetas PRD (fechas, progreso de etapa, botón de retomar/ver).
