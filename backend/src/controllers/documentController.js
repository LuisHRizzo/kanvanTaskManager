const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const Task = require('../models/Task');

exports.uploadDocument = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Check task existence
    const task = await Task.findByPk(taskId);
    if (!task) {
      // If error occurs, we must manually delete the physical file multer uploaded
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Ningún archivo fue proporcionado' });
    }

    // Save metadata in DB
    const newDoc = await Document.create({
      taskId,
      originalName: req.file.originalname,
      filePath: req.file.filename, // we just save the unique name, the path is resolved via static routing
      mimeType: req.file.mimetype,
      size: req.file.size
    });

    res.status(201).json(newDoc);
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {} // cleanup on failure
    }
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Error al subir el documento' });
  }
};

exports.getDocumentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const documents = await Document.findAll({
      where: { taskId },
      order: [['createdAt', 'ASC']]
    });
    res.json(documents);
  } catch (error) {
    console.error('Get Documents Error:', error);
    res.status(500).json({ error: 'Error al listar los documentos' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { taskId, docId } = req.params;

    const document = await Document.findOne({ where: { id: docId, taskId } });
    if (!document) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Physical deletion
    const filePath = path.join(__dirname, '../../uploads', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // DB deletion
    await document.destroy();

    res.json({ message: 'Documento borrado exitosamente' });
  } catch (error) {
    console.error('Delete Document Error:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
};
