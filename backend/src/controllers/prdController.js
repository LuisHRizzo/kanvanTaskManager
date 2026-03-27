const PRDSession = require('../models/PRDSession');
const Project = require('../models/Project');
const { evaluateAnswer, generateFinalPRD } = require('../services/aiService');

const stageKeys = [
  'context', 'problem', 'users', 'solution', 'features', 
  'useCases', 'functionalReqs', 'nonFunctionalReqs', 'metrics', 'roadmap'
];

exports.createSession = async (req, res) => {
  try {
    const { projectId } = req.body;
    
    // Check project exists and user has access (simplified access check)
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const session = await PRDSession.create({
      projectId,
      stage: 1,
      answers: {},
      contextHistory: []
    });

    // Generate first greeting
    const firstQuestion = await evaluateAnswer(1, [], null);
    
    // Save to context history
    const newContext = [
      { role: 'ai', text: firstQuestion }
    ];
    await session.update({ contextHistory: newContext });

    res.status(201).json({ session, message: firstQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creando la sesión de PRD' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PRDSession.findByPk(id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
};

exports.getSessionsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project existence and permissions if needed
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

    const sessions = await PRDSession.findAll({
      where: { projectId },
      order: [['updatedAt', 'DESC']]
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Error listando las sesiones' });
  }
};

exports.chat = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    const session = await PRDSession.findByPk(id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

    let history = session.contextHistory || [];
    
    const aiResponse = await evaluateAnswer(session.stage, history, message);

    // Append to history
    history.push({ role: 'user', text: message });
    history.push({ role: 'ai', text: aiResponse });

    await session.update({ contextHistory: history });

    res.json({ reply: aiResponse, history: session.contextHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error comunicándose con la IA' });
  }
};

exports.advanceStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary } = req.body; // User's confirmed summary for the stage
    
    const session = await PRDSession.findByPk(id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

    if (session.stage > 10) return res.status(400).json({ error: 'Etapas completadas' });

    const key = stageKeys[session.stage - 1];
    
    const answers = { ...session.answers, [key]: summary };
    const nextStage = session.stage + 1;
    
    // Reset context history for the new stage
    let nextQuestion = null;
    let newContext = [];

    if (nextStage <= 10) {
      nextQuestion = await evaluateAnswer(nextStage, [], null);
      newContext = [{ role: 'ai', text: nextQuestion }];
    }

    await session.update({
      stage: nextStage,
      answers,
      contextHistory: newContext
    });

    res.json({ session, nextQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al avanzar de etapa' });
  }
};

exports.generateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await PRDSession.findByPk(id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });

    const finalDoc = await generateFinalPRD(session.answers);
    
    await session.update({ finalDocument: finalDoc });

    res.json({ document: finalDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al generar el documento PRD' });
  }
};
