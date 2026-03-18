📋 Plan de Implementación - Gestor de Proyectos
1. 🔧 Arreglar hook de tiempo de tarea
Problema identificado:

El timer no inicia al hacer clic en “Start”
No se registra el tiempo total correctamente
Causas probables:

El hook useTimeTracking resetea elapsedTime a 0 después de iniciar (setElapsedTime(0) en línea 44)
El backend podría no estar persistiendo correctamente los TimeEntry
Tareas:
1.1. Revisar el endpoint POST /time/:taskId/start en timeController.js
1.2. Verificar que el frontend reciba la entrada creada con startTime correcto
1.3. Corregir el setElapsedTime(0) en el hook para que calcule desde el startTime recibido
1.4. Validar que el TimeEntry se guarde con userId y taskId correctos
1.5. Testear el flujo completo: Start → correr timer → Stop → verificar registro en BD

2. 📊 Reorganizar proyectos en Kanban (Backlog, En Proceso, Esperando, Completados) + Filtro
Cambios requeridos:

Backend:
2.1. Actualizar modelo Project.js para agregar campo kanbanStatus (enum: backlog, en_proceso, esperando, completados)
2.2. Actualizar projectController.js para permitir cambiar el estado Kanban
2.3. Agregar ruta PATCH /api/projects/:id/kanban-status
2.4. Actualizar GET /api/projects para aceptar filtro por ?status=en_proceso

Frontend:
2.5. Crear componente ProjectKanbanBoard.jsx con 4 columnas
2.6. Implementar drag & drop para mover proyectos entre columnas
2.7. Agregar selector/filtro de estado en Dashboard.jsx
2.8. Actualizar useProjectStore para manejar updateProjectKanbanStatus
2.9. Modificar vista de lista de proyectos a vista Kanban (o agregar toggle)

3. 🔔 Implementar sistema de alertas
Infraestructura existente:

notificationService.js ya tiene funciones para push notifications
notificationScheduler.js ya programa recordatorios de tareas
Modelo NotificationPreference y DeviceToken existen
Tareas pendientes:
3.1. Frontend - UI de preferencias:

Crear componente NotificationSettings.jsx para configurar preferencias
Agregar página/ruta /settings/notifications
Permitir activar/desactivar: asignación de tareas, vencimientos, menciones
3.2. Frontend - Service Worker:

Implementar service-worker.js para recibir push notifications
Registrar el service worker en main.jsx
Manejar permisos de notificación del navegador
3.3. Frontend - Registro de tokens:

Suscribirse a push notifications y enviar token al backend
Endpoint: POST /api/notifications/register-device
3.4. Backend - Mejorar scheduler:

Verificar que startNotificationScheduler() se llame en app.js
Agregar recordatorios de tareas próximas (hoy, mañana)
Notificar cuando un proyecto cambia de estado Kanban
3.5. Backend - WebSockets:

Emitir evento notification_received cuando se crea notificación
Actualizar badge/contador en tiempo real en el frontend
3.6. UI de notificaciones:

Crear componente NotificationBell.jsx con dropdown de notificaciones
Marcar notificaciones como leídas
Historial de notificaciones
4. 📅 Mostrar “Para Hoy”: lista de tareas en tabla con estados según Kanban
Backend:
4.1. Crear endpoint GET /api/tasks/today que retorne:

Tareas con dueDate = hoy
Tareas asignadas al usuario
Ordenadas por prioridad/estado
Incluir estado Kanban del proyecto padre
4.2. Agregar filtro ?status=pendiente,en_proceso al endpoint

Frontend:
4.3. Crear página TodayView.jsx o componente TodayPanel.jsx
4.4. Implementar tabla con columnas: Tarea | Proyecto | Estado | Acciones
4.5. Agregar acceso rápido desde Dashboard o navbar
4.6. Permitir marcar tarea como completada directamente desde la tabla
4.7. Agregar filtro por estado Kanban en la tabla

5. 🔄 Mejorar exportación/sincronización con Google Tasks
Problema actual:

Al completar una tarea en el sistema, no se marca como completada en Google Tasks
Tareas:
5.1. Backend - Webhook/sync bidireccional:

Modificar taskController.js para escuchar cambios de estado a completada
Cuando status === 'completada', llamar a googleTasksService.updateTask() con status: 'completed'
Actualizar googleTaskId en la tarea local si no existe
5.2. Backend - Sync al importar:

En googleTasksService.js, agregar función syncTaskStatus(googleTaskId, localTaskId)
Verificar estado de tarea en Google Tasks al hacer fetch
Resolver conflictos (última modificación gana)
5.3. Backend - Webhook de Google (opcional):

Implementar endpoint POST /api/webhooks/google-tasks para recibir actualizaciones
Actualizar tarea local cuando Google notifique cambios
5.4. Frontend - UI de sync:

Mostrar estado de sincronización en TaskModal
Botón “Sincronizar ahora” para forzar sync manual
Indicador visual si hay discrepancias entre local y Google
5.5. Backend - Manejo de errores:

Reintentos si falla la API de Google
Log de errores de sincronización
Notificar al usuario si falla sync
📅 Orden de implementación sugerido
Prioridad	Feature	Complejidad	Dependencias
🔴 Alta	1. Arreglar hook de tiempo	Baja	Ninguna
🔴 Alta	3. Sistema de alertas	Media-Alta	1 (timer funcional)
🟡 Media	4. “Para Hoy”	Media	Ninguna
🟡 Media	5. Sync Google Tasks	Media	Ninguna
🟢 Baja	2. Kanban de proyectos	Media	Ninguna
📝 Notas adicionales
Tests: Agregar tests unitarios para controllers modificados
Migraciones: Crear scripts de migración para nuevos campos en BD
Documentación: Actualizar README.md con nuevos endpoints y features
Docker: No requiere cambios en la orquestación
