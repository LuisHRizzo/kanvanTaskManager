# Instrucciones para Agente IA - Fase 5: Integraciones Complejas con Google Calendar, Meet y Archivos

**Rol:** Desarrollador Full-Stack Especialista en APIs de Terceros.
**Objetivo:** Conectar el sistema con Google Workspace para sincronización de calendarios y generación de videollamadas de Google Meet, además de habilitar la subida y descarga de documentos adjuntos a las tareas utilizando el almacenamiento local del contenedor Docker.

## 1. Arquitectura de Integración de Google y Archivos



```mermaid
sequenceDiagram
    participant Cliente_React
    participant API_Node
    participant API_Google_Calendar

    Cliente_React->>API_Node: Solicita crear reunion y agregar invitados
    API_Node->>API_Google_Calendar: POST evento con conferenceDataVersion 1
    API_Google_Calendar-->>API_Node: Retorna datos del evento y link de Meet
    API_Node->>API_Node: Guarda link y evento en BD
    API_Node-->>Cliente_React: Actualiza Tarea con boton de Meet
2. Integración con Google Calendar y Google Meet
Configuración OAuth2 y Scopes:
Google Cloud Console: Configura las credenciales OAuth2. El backend necesitará el scope https://www.googleapis.com/auth/calendar.events para poder leer, crear y modificar eventos.

Tokens: Almacena el refresh_token de cada usuario de forma segura en la base de datos para no pedirles que inicien sesión en Google constantemente.

Endpoints de Calendario y Llamadas:
Crear Evento con Meet: Implementa el endpoint POST /api/tasks/:taskId/calendar. Este endpoint debe recibir la fecha, la hora y un array de correos electrónicos.

Generación de Meet: En el cuerpo de la petición a la API de Google, debes incluir el objeto conferenceData con createRequest para que Google genere un enlace de Meet único.

Invitados: Añade el array de correos al objeto attendees. Por ejemplo, debe permitir agendar una revisión de código con Igor o una reunión de seguimiento con el equipo de Visual Latina ingresando sus emails, y Google les enviará la invitación oficial.

Sincronización: Guarda el google_event_id y el enlace de Meet en la tabla TAREA para poder referenciarlos luego.

Webhooks de Google: Configura un endpoint POST /api/webhooks/google-calendar para recibir notificaciones push si el usuario cambia la fecha del evento directamente desde su aplicación de Google Calendar, actualizando así la fecha de vencimiento en nuestra base de datos PostgreSQL.

3. Gestión de Documentos Adjuntos
Backend (Multer y Docker Volumes):
Middleware de Subida: Utiliza la librería multer en Node.js para manejar peticiones multipart/form-data.

Almacenamiento Local: Configura Multer para guardar los archivos físicamente en un directorio específico dentro del contenedor, por ejemplo /app/uploads. Este directorio debe estar mapeado a un volumen persistente en el docker-compose.yml para no perder los archivos si el contenedor se reinicia.

Registro en BD: Al subir un archivo exitosamente, crea un registro en la tabla DOCUMENTO vinculando el tarea_id, el nombre original del archivo y la ruta interna generada.

Endpoint de Descarga: Crea la ruta GET /api/documents/:documentId/download que utilice res.download() de Express para servir el archivo protegido por el middleware de autenticación JWT.

Frontend (Subida y UI):
Zona Drag & Drop: En el modal de detalle de la tarea, implementa una zona donde el usuario pueda arrastrar y soltar archivos PDF, imágenes o documentos.

Botón de Meet: Si una tarea tiene un enlace de Google Meet asociado, muestra un botón prominente "Unirse a la llamada" en la tarjeta de la tarea y en su detalle.

Formulario de Reunión: Añade un pequeño formulario dentro de la tarea para fijar la fecha, hora y un input de texto para añadir múltiples correos electrónicos y generar la reunión.

Entregables Esperados:
Flujo OAuth2 completo y almacenamiento de tokens.

Creación de eventos en Calendar con generación exitosa de links de Meet e invitaciones por correo.

Subida de archivos funcionando y guardándose en el volumen de Docker correcto.

UI del frontend actualizada para mostrar adjuntos y botones de videollamada.