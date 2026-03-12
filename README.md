# 🗂️ Gestor de Proyectos

Aplicación web full-stack para gestión de proyectos y tareas con tablero Kanban, seguimiento de tiempo en tiempo real y generación de eventos en Google Calendar.

---

## 📋 Tabla de contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Variables de entorno](#-variables-de-entorno)
- [API Reference](#-api-reference)
- [Modelos de base de datos](#-modelos-de-base-de-datos)
- [WebSockets](#-websockets)
- [Integración Google Calendar](#-integración-google-calendar)

---

## ✨ Características

- **Autenticación JWT** — Registro e inicio de sesión con tokens seguros (7 días de expiración)
- **Gestión de proyectos** — Crear, editar y eliminar proyectos; invitar miembros por email
- **Tablero Kanban** — Columnas: *Por Hacer / En Progreso / En Revisión / Completada*, con drag & drop para mover y reordenar tareas
- **Seguimiento de tiempo** — Cronómetro por tarea, historial de sesiones y resumen total por usuario
- **Google Calendar vía URL** — Generar evento pre-rellenado (título, fecha, invitados) con un clic, sin necesidad de OAuth
- **Colaboración en tiempo real** — WebSockets (Socket.IO) para sincronizar cambios entre múltiples usuarios en el mismo proyecto
- **Despliegue con Docker** — Tres contenedores orquestados con Docker Compose: base de datos, backend y frontend

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │   Frontend   │   │   Backend    │   │  PostgreSQL  │ │
│  │  React/Vite  │◄──►  Node/Express│◄──►    (pg 15)  │ │
│  │  :5173       │   │    :3000     │   │    :5432     │ │
│  └──────────────┘   └──────────────┘   └─────────────┘ │
│         │                  │                            │
│         └──── Socket.IO ───┘                            │
└─────────────────────────────────────────────────────────┘
```

El backend expone una **API REST** en `/api/*` y un **servidor WebSocket** en el mismo puerto (3000). El frontend se comunica con la API usando Axios y con el socket usando socket.io-client.

---

## 🛠️ Stack tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js + Express | ^4.18 | Servidor HTTP y API REST |
| Sequelize | ^6.37 | ORM para PostgreSQL |
| PostgreSQL | 15-alpine | Base de datos principal |
| Socket.IO | ^4.8 | Comunicación en tiempo real |
| JSON Web Tokens | ^9.0 | Autenticación |
| bcryptjs | ^2.4 | Hash de contraseñas |
| Helmet + Morgan | — | Seguridad y logging |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | ^18.2 | UI declarativa |
| Vite | ^5.0 | Bundler y dev server |
| React Router DOM | ^6.21 | Navegación SPA |
| Zustand | ^4.4 | Estado global |
| @dnd-kit | ^6.1 | Drag and drop del Kanban |
| Axios | ^1.6 | Cliente HTTP |
| Socket.IO Client | ^4.8 | WebSockets |
| Tailwind CSS | ^3.4 | Estilos utilitarios |

---

## 📁 Estructura del proyecto

```
mi-gestor-proyectos/
├── docker-compose.yml          # Orquestación de los 3 servicios
│
├── backend/
│   ├── Dockerfile
│   ├── .env                    # Variables de entorno (ver sección de variables)
│   ├── package.json
│   └── src/
│       ├── app.js              # Entry point: Express + Socket.IO + sync BD
│       ├── seed.js             # Datos de prueba
│       ├── config/
│       │   └── database.js     # Conexión Sequelize
│       ├── models/
│       │   ├── index.js        # Asociaciones entre modelos
│       │   ├── User.js
│       │   ├── Project.js
│       │   ├── ProjectMember.js
│       │   ├── Task.js         # Incluye campo calendarUrl
│       │   ├── TimeEntry.js
│       │   └── Document.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   ├── taskController.js   # Incluye generateCalendarUrl
│       │   └── timeController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── projects.js
│       │   ├── tasks.js
│       │   └── time.js
│       ├── middleware/
│       │   └── auth.js         # Verificación JWT
│       └── socket/
│           └── index.js        # Eventos de Socket.IO
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx             # Rutas y ProtectedRoute
        ├── index.css
        ├── store/
        │   └── index.js        # Zustand: useAuthStore, useProjectStore
        ├── hooks/
        │   ├── useSocket.js    # WebSocket con deduplicación de eventos
        │   └── useTimeTracking.js
        ├── lib/
        │   └── api.js          # Instancia Axios con baseURL e interceptor JWT
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx   # Lista de proyectos
        │   ├── ProjectView.jsx # Tablero Kanban + formulario nueva tarea
        │   └── TimeReport.jsx
        └── components/
            ├── KanbanColumn.jsx
            ├── TaskCard.jsx
            ├── TaskModal.jsx   # Detalle, edición, timer, Google Calendar
            └── Timer.jsx
```

---

## 🚀 Instalación y ejecución

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo

### Levantar el proyecto

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd mi-gestor-proyectos

# Levantar todos los servicios
docker compose up
```

Los tres contenedores se inician en orden (`db` → `backend` → `frontend`). Al arrancar por primera vez el backend ejecuta `sequelize.sync({ alter: true })` para crear/actualizar las tablas automáticamente.

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API Backend | http://localhost:3000/api |
| Health check | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

### Cargar datos de prueba (opcional)

```bash
docker exec gestor_backend node src/seed.js
```

### Detener el proyecto

```bash
docker compose down          # Detiene sin borrar datos
docker compose down -v       # Detiene y borra el volumen de la BD
```

---

## 🔧 Variables de entorno

El archivo `backend/.env` contiene la configuración del servidor:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://admin:secretpassword@db:5432/gestor_proyectos_db
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

> **⚠️ En producción:** cambiar `JWT_SECRET` por un valor criptográficamente aleatorio y las credenciales de la base de datos en `docker-compose.yml`.

---

## 📡 API Reference

Todos los endpoints (excepto `/auth`) requieren el header:
```
Authorization: Bearer <token>
```

### Autenticación
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Crear cuenta (`name`, `email`, `password`) |
| `POST` | `/api/auth/login` | Iniciar sesión (`email`, `password`) → `{ user, token }` |
| `GET` | `/api/auth/me` | Usuario autenticado actual |

### Proyectos
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/projects` | Listar proyectos del usuario |
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/projects/:id` | Detalle de proyecto |
| `PUT` | `/api/projects/:id` | Actualizar proyecto |
| `DELETE` | `/api/projects/:id` | Eliminar proyecto |
| `POST` | `/api/projects/:id/members` | Agregar miembro por email |
| `DELETE` | `/api/projects/:id/members/:userId` | Eliminar miembro |

### Tareas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/tasks/project/:projectId` | Listar tareas del proyecto |
| `POST` | `/api/tasks/project/:projectId` | Crear tarea |
| `GET` | `/api/tasks/:taskId` | Detalle de tarea |
| `PUT` | `/api/tasks/:taskId` | Actualizar tarea |
| `DELETE` | `/api/tasks/:taskId` | Eliminar tarea |
| `PATCH` | `/api/tasks/:taskId/status` | Mover tarea (Kanban drag & drop) |
| `POST` | `/api/tasks/:taskId/calendar-url` | Generar URL de Google Calendar |

### Tiempo
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/time/:taskId/start` | Iniciar cronómetro |
| `POST` | `/api/time/:taskId/stop` | Detener cronómetro |
| `GET` | `/api/time/:taskId/entries` | Historial de sesiones |
| `GET` | `/api/time/:taskId/summary` | Resumen total por usuario |

---

## 🗄️ Modelos de base de datos

```
User
  id (UUID PK)
  name, email (unique), password (hashed)
  googleId, googleTokens (JSONB)

Project
  id (UUID PK)
  name, description
  ownerId → User

ProjectMember
  id (UUID PK)
  projectId → Project
  userId → User
  role

Task
  id (UUID PK)
  title, description
  status: pendiente | en_progreso | en_revision | completada
  order (INTEGER)
  dueDate (DATEONLY)
  calendarUrl (TEXT)        ← URL de Google Calendar generada
  assigneeId → User
  projectId → Project

TimeEntry
  id (UUID PK)
  startTime, endTime (TIMESTAMP)
  taskId → Task
  userId → User

Document
  id (UUID PK)
  originalName, filePath
  taskId → Task
```

---

## 🔌 WebSockets

El backend emite los siguientes eventos al room del proyecto (`join_project`):

| Evento | Payload | Cuándo se emite |
|---|---|---|
| `task_created` | Task completa con assignee | Al crear una tarea nueva |
| `task_updated` | Task actualizada | Al editar título/desc/fecha |
| `task_moved` | Task con nuevo status/order | Al mover en el Kanban |

El frontend escucha con `useSocket(projectId)` y actualiza el store de Zustand en tiempo real usando `useProjectStore.getState()` para evitar stale closures.

---

## 📅 Integración Google Calendar

No requiere credenciales de Google ni OAuth. Genera una URL de redirección que abre Google Calendar con el evento pre-rellenado.

### Endpoint
```http
POST /api/tasks/:taskId/calendar-url
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDateTime": "2026-03-15T13:00:00.000Z",
  "endDateTime":   "2026-03-15T14:00:00.000Z",
  "attendees":     ["igor@empresa.com", "equipo@empresa.com"],
  "timezone":      "America/Argentina/Buenos_Aires"
}
```

### Respuesta
```json
{
  "calendarUrl": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=..."
}
```

La URL se guarda en `task.calendarUrl` en PostgreSQL. En el modal de cada tarea aparece la sección **📅 Google Calendar** con un botón que abre el evento en una nueva pestaña; el usuario confirma haciendo clic en "Guardar" dentro de Google Calendar. Los invitados reciben la invitación oficial de Google.
