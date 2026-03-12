require('dotenv').config();
const { User, Project, ProjectMember, Task } = require('./models');
const sequelize = require('./config/database');

const seedData = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos resincronizada');

    const luis = await User.create({
      email: 'luis@empresa.com',
      password: 'password123',
      name: 'Luis'
    });
    console.log('✅ Usuario Luis creado');

    const igor = await User.create({
      email: 'igor@empresa.com',
      password: 'password123',
      name: 'Igor'
    });
    console.log('✅ Usuario Igor creado');

    const project1 = await Project.create({
      name: 'App Nativa Mercedes-Benz',
      description: 'Desarrollo de aplicación móvil nativa para gestión de flota de vehículos Mercedes-Benz',
      ownerId: luis.id
    });
    await ProjectMember.create({ projectId: project1.id, userId: luis.id, role: 'owner' });
    await ProjectMember.create({ projectId: project1.id, userId: igor.id, role: 'member' });
    console.log('✅ Proyecto App Nativa Mercedes-Benz creado');

    const project2 = await Project.create({
      name: 'Dashboard Vulnerabilidades DXC',
      description: 'Dashboard para monitoreo de vulnerabilidades de seguridad para cliente DXC Technology',
      ownerId: luis.id
    });
    await ProjectMember.create({ projectId: project2.id, userId: luis.id, role: 'owner' });
    console.log('✅ Proyecto Dashboard Vulnerabilidades DXC creado');

    const project3 = await Project.create({
      name: 'Control de Accesos PAE',
      description: 'Sistema de control de accesos para Programa de Ayuda Estratégica (PAE)',
      ownerId: igor.id
    });
    await ProjectMember.create({ projectId: project3.id, userId: igor.id, role: 'owner' });
    await ProjectMember.create({ projectId: project3.id, userId: luis.id, role: 'member' });
    console.log('✅ Proyecto Control de Accesos PAE creado');

    const project4 = await Project.create({
      name: 'Facturación Horizont',
      description: 'Sistema de facturación para empresa Horizont',
      ownerId: luis.id
    });
    await ProjectMember.create({ projectId: project4.id, userId: luis.id, role: 'owner' });
    console.log('✅ Proyecto Facturación Horizont creado');

    await Task.create({ title: 'Diseñar arquitectura de la app', description: 'Crear documento de arquitectura técnica', status: 'completada', order: 0, projectId: project1.id, assigneeId: luis.id });
    await Task.create({ title: 'Implementar autenticación OAuth2', description: 'Integrar autenticación con Mercedes Me', status: 'en_progreso', order: 1, projectId: project1.id, assigneeId: luis.id });
    await Task.create({ title: 'Desarrollar módulo de geolocalización', description: 'Tracking en tiempo real de vehículos', status: 'pendiente', order: 2, projectId: project1.id, assigneeId: igor.id });
    await Task.create({ title: 'Configurar notificaciones push', description: 'Integrar Firebase Cloud Messaging', status: 'pendiente', order: 3, projectId: project1.id });
    await Task.create({ title: 'Testing de integración', description: 'Pruebas end-to-end del flujo completo', status: 'pendiente', order: 4, projectId: project1.id });

    await Task.create({ title: 'Configurar pipeline CI/CD', description: 'Setup de Jenkins para escaneo de vulnerabilidades', status: 'completada', order: 0, projectId: project2.id, assigneeId: luis.id });
    await Task.create({ title: 'Integrar API de vulnerabilidades', description: 'Conectar con servicios de scanning', status: 'en_progreso', order: 1, projectId: project2.id, assigneeId: luis.id });
    await Task.create({ title: 'Crear alertas automáticas', description: 'Notificaciones por email y Slack', status: 'pendiente', order: 2, projectId: project2.id });

    await Task.create({ title: 'Análisis de requisitos', description: 'Reuniones con stakeholders de PAE', status: 'completada', order: 0, projectId: project3.id, assigneeId: igor.id });
    await Task.create({ title: 'Diseño de Hardware', description: 'Selección de lectores de tarjeta y tornos', status: 'en_progreso', order: 1, projectId: project3.id, assigneeId: igor.id });
    await Task.create({ title: 'Desarrollo API de gestión', description: 'Endpoints para altas, bajas y modificaciones', status: 'pendiente', order: 2, projectId: project3.id, assigneeId: luis.id });
    await Task.create({ title: 'Interfaz de administración', description: 'Panel web para gestión de empleados', status: 'pendiente', order: 3, projectId: project3.id });

    await Task.create({ title: 'Modelado de datos', description: 'Diseño de schema para facturas y clientes', status: 'completada', order: 0, projectId: project4.id, assigneeId: luis.id });
    await Task.create({ title: 'Generación de PDFs', description: 'Librería para crear facturas en PDF', status: 'pendiente', order: 1, projectId: project4.id });
    await Task.create({ title: 'Integración con banco', description: 'API para pagos online', status: 'pendiente', order: 2, projectId: project4.id });

    console.log('✅ Tareas creadas');
    console.log('\n📋 Credenciales de prueba:');
    console.log('   Luis: luis@empresa.com / password123');
    console.log('   Igor: igor@empresa.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedData();