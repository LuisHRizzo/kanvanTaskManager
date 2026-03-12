# Instrucciones para Agente IA - Fase 3: Frontend Core React

**Rol:** Desarrollador Frontend Senior (React).
**Objetivo:** Construir la interfaz de usuario principal de la aplicación de gestión de proyectos, implementar el enrutamiento protegido, el estado global y la vista del tablero Kanban. Todo debe estar preparado para consumir la API REST desarrollada en la Fase 2 y listo para la futura integración de WebSockets.

## 1. Arquitectura de Componentes y Estado Global



```mermaid
graph TD
    App --> AuthProvider
    AuthProvider --> Router
    Router --> LoginView
    Router --> DashboardView
    Router --> ProjectView
    DashboardView --> ProjectCard
    ProjectView --> KanbanBoard
    KanbanBoard --> KanbanColumn
    KanbanColumn --> TaskCard
    TaskCard --> TimeTrackerButton
Tareas de Configuración:
Estructura Base: Utiliza Vite para inicializar el proyecto React. Configura Tailwind CSS para un estilizado rápido y limpio de los componentes.

Gestión de Estado: Implementa Zustand o Redux Toolkit para manejar el estado global, específicamente para almacenar los datos del usuario logueado, los proyectos disponibles y el estado actual de las tareas en el tablero activo.

Cliente HTTP: Configura Axios con interceptores. Cada petición saliente debe adjuntar automáticamente el JWT en los headers de autorización. Si una petición devuelve un error 401, el interceptor debe redirigir al usuario automáticamente a la vista de Login.

2. Enrutamiento y Vistas Principales
Implementa React Router para gestionar la navegación de la Single Page Application.

Rutas Requeridas:
/login: Formulario de inicio de sesión.

/dashboard: Ruta protegida. Muestra una cuadrícula con las tarjetas de los proyectos a los que el usuario tiene acceso, por ejemplo: "App Nativa Mercedes-Benz", "Dashboard Vulnerabilidades DXC", "Control de Accesos PAE" o "Facturación Horizont". Debe incluir de forma destacada un botón para "Crear Nuevo Proyecto".

/project/:id: Ruta protegida. Es la vista principal del tablero Kanban para un proyecto específico.

3. El Tablero Kanban Core Feature
Esta es la pieza central de la interfaz donde el equipo interactuará el mayor tiempo. Debe sentirse extremadamente fluido.

Tareas del Kanban:
Librería Drag and Drop: Integra @dnd-kit/core o una librería moderna y ligera similar para manejar la lógica espacial de arrastrar y soltar tarjetas.

Columnas Dinámicas: El tablero debe renderizar columnas basadas en los estados de las tareas, por ejemplo: Por Hacer, En Progreso, En Revisión, Completado.

Tarjetas de Tareas: Crea el componente TaskCard que muestre el título de la tarea, la persona asignada -ejemplo: Igor-, y la fecha de vencimiento. Debe tener un diseño en forma de tarjeta.

Acción de Mover: Al soltar una tarjeta en una nueva columna, el frontend debe actualizar el estado global inmediatamente implementando Optimistic UI Updates para que se sienta instantáneo, y en segundo plano disparar la petición PUT /api/tasks/:taskId al backend para persistir el nuevo estado en la base de datos PostgreSQL.

4. Formularios y Modales
Modal de Creación de Tarea: Un componente tipo modal accesible desde el tablero para añadir nuevas tareas a una columna específica. Debe permitir asignar responsables y una fecha límite de forma intuitiva.

Modal de Detalle de Tarea: Al hacer clic en una TaskCard, se debe abrir un modal expandido mostrando la descripción completa en texto enriquecido, una sección para el historial de tiempos -que dejaremos preparada para la Fase 4- y la sección de documentos adjuntos -preparada para la Fase 5-.

Entregables Esperados:
Proyecto Vite configurado con Tailwind CSS y rutas protegidas.

Implementación robusta del store global para manejar los tableros.

Vistas de Login, Dashboard de Proyectos y Tablero Kanban terminadas visualmente.

Componentes de arrastrar y soltar 100% funcionales, conectados a llamadas Axios hacia la API de Node.js.