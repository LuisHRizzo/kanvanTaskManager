Markdown
# Instrucciones para Agente IA - Fase 2: Backend Core y Base de Datos

**Rol:** Desarrollador Backend Senior (Node.js / Express / PostgreSQL).
**Objetivo:** Implementar la capa de datos, la autenticación y los endpoints CRUD fundamentales para el sistema de gestión de proyectos, preparándolo para las futuras integraciones de WebSockets, tracking de tiempo y Google Calendar.

## 1. Diseño de la Base de Datos Relacional



A continuación se presenta el Diagrama Entidad-Relación. **Importante:** Utiliza un ORM moderno como Prisma o Sequelize para modelar esto en Node.js.

```mermaid
erDiagram
    USUARIO ||--o{ PROYECTO_USUARIO : pertenece
    USUARIO ||--o{ TAREA : asignado_a
    USUARIO ||--o{ REGISTRO_TIEMPO : registra
    PROYECTO ||--o{ PROYECTO_USUARIO : tiene
    PROYECTO ||--o{ TAREA : contiene
    TAREA ||--o{ REGISTRO_TIEMPO : genera
    TAREA ||--o{ DOCUMENTO : adjunta

    USUARIO {
        int id PK
        string email
        string password_hash
        string nombre
        string google_oauth_token
    }

    PROYECTO {
        int id PK
        string nombre
        string descripcion
        datetime fecha_creacion
    }

    PROYECTO_USUARIO {
        int id PK
        int usuario_id FK
        int proyecto_id FK
        string rol 
    }

    TAREA {
        int id PK
        int proyecto_id FK
        int asignado_a FK
        string titulo
        text descripcion
        string estado 
        datetime fecha_vencimiento
    }

    REGISTRO_TIEMPO {
        int id PK
        int tarea_id FK
        int usuario_id FK
        datetime hora_inicio
        datetime hora_fin
    }

    DOCUMENTO {
        int id PK
        int tarea_id FK
        string url_archivo
        string nombre_original
    }
Tareas de Modelado:
Inicializar el ORM: Configura la conexión a la base de datos PostgreSQL tomando las credenciales de las variables de entorno definidas en el docker-compose.yml.

Migraciones: Genera el código para crear estas tablas con sus respectivas claves foráneas e índices para búsquedas rápidas por proyecto_id y usuario_id.

Seed Data: Crea un script de seeding para poblar la base de datos y facilitar las pruebas del Frontend. Incluye:

Usuarios de prueba: "Luis" y "Igor".

Proyectos realistas: "App Nativa Mercedes-Benz", "Dashboard Vulnerabilidades DXC", "Control de Accesos PAE", "Facturación Horizont".

Genera al menos 5 tareas distribuidas en diferentes estados dentro de cada proyecto.

2. Autenticación y Autorización
Debemos asegurar que cada usuario solo vea los proyectos a los que pertenece.

Tareas de Seguridad:
Registro y Login: Crea los endpoints POST /api/auth/register y POST /api/auth/login. Las contraseñas deben estar hasheadas con bcrypt.

JWT: Tras un login exitoso, el backend debe emitir un JSON Web Token.

Middleware de Autenticación: Escribe un middleware que intercepte todas las rutas protegidas, valide el JWT, y adjunte el usuario_id al objeto de la petición HTTP.

Middleware de Autorización: Escribe un middleware que verifique si el usuario autenticado tiene permisos sobre el proyecto_id solicitado en la ruta, consultando la tabla intermedia PROYECTO_USUARIO.

3. Endpoints RESTful (CRUD Core)
Desarrolla los controladores y rutas para gestionar la lógica de negocio principal. Todas estas rutas deben estar protegidas por el middleware de JWT.

Proyectos:
GET /api/projects -> Devuelve los proyectos donde el usuario logueado es miembro.

POST /api/projects -> Crea un nuevo proyecto y automáticamente asigna al creador como miembro con rol de administrador.

GET /api/projects/:id -> Devuelve los detalles del proyecto, validando acceso.

Tareas:
GET /api/projects/:id/tasks -> Lista todas las tareas de un tablero específico.

POST /api/projects/:id/tasks -> Crea una tarea nueva en la columna por defecto.

PUT /api/tasks/:taskId -> Actualiza título, descripción, estado o asignación. Este endpoint será vital luego para mover las tarjetas en el Kanban.

DELETE /api/tasks/:taskId -> Elimina una tarea lógicamente o físicamente.

Entregables Esperados:
Archivos de configuración del ORM y modelos.

Script de migraciones y seeding.

Controladores de Autenticación y middlewares.

Controladores de Proyectos y Tareas.

Archivo de rutas indexadas e integradas en app.js o server.js.