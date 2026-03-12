# Instrucciones para Agente IA - Fase 4: Tracking de Tiempo y Sincronización en Tiempo Real

**Rol:** Desarrollador Full-Stack Senior.
**Objetivo:** Implementar la lógica del cronómetro para el registro preciso de horas facturables y establecer una conexión WebSocket para que los cambios en los tableros se reflejen instantáneamente para todos los miembros del equipo.

## 1. Arquitectura de Tiempo Real y Sincronización



```mermaid
sequenceDiagram
    participant Usuario_Local
    participant Servidor_Node
    participant Igor_Remoto

    Usuario_Local->>Servidor_Node: Mueve tarea de Por Hacer a En Progreso
    Servidor_Node->>Servidor_Node: Actualiza Base de Datos
    Servidor_Node-->>Usuario_Local: OK HTTP 200
    Servidor_Node->>Igor_Remoto: Evento WS task_moved_event
    Igor_Remoto->>Igor_Remoto: Actualiza UI de React
2. Tracking de Tiempo Backend Core
Controladores de Tiempo: Implementa los endpoints para gestionar la tabla REGISTRO_TIEMPO creada en la Fase 2.

POST /api/tasks/:taskId/time/start: Crea un registro con hora_inicio tomando la hora actual del servidor y hora_fin nulo.

PUT /api/tasks/:taskId/time/stop: Busca el registro activo del usuario para esa tarea y actualiza la hora_fin con la hora actual.

POST /api/tasks/:taskId/time/manual: Permite ingresar un bloque de tiempo cerrado especificando inicio y fin, vital para correcciones u olvidos.

Validaciones de Negocio: Un usuario no debe tener dos cronómetros corriendo simultáneamente a nivel global. Si inicia uno nuevo, el anterior debe detenerse automáticamente.

3. Componente de Cronómetro Frontend
UI del Timer: Dentro de la TaskCard y el modal de detalle de la tarea, agrega un componente visual de cronómetro. Debe mostrar horas, minutos y segundos actualizándose en tiempo real.

Persistencia del Estado: El estado global de React debe saber qué tarea tiene el timer activo. Si se está registrando tiempo en una tarea específica del proyecto "Dashboard Vulnerabilidades DXC", el indicador visual debe mantenerse activo e ininterrumpido incluso si el usuario navega hacia la vista principal de proyectos.

Resiliencia de Pestañas: Si el usuario cierra la pestaña por accidente y vuelve a entrar, el frontend debe consultar al backend el estado del timer activo y reanudar la cuenta visual calculando la diferencia entre la hora_inicio devuelta por la API y la hora actual del navegador.

4. WebSockets para Colaboración en Vivo
Configuración del Servidor: Integra socket.io en el servidor Node.js. Es fundamental asegurar la conexión WebSocket validando el mismo token JWT que utilizan las peticiones HTTP RESTful.

Salas por Proyecto: Configura "Rooms" en Socket.io. Cuando un usuario entra a la ruta /project/:id, el frontend debe emitir un evento para unirse exclusivamente a esa sala. De esta forma, los eventos de un proyecto no sobrecargan a los usuarios que están viendo otro tablero distinto.

Eventos Base a Emitir y Escuchar:

task_moved_event: Emitido al completar un drag and drop.

task_created_event: Emitido cuando alguien agrega una nueva tarjeta al tablero.

task_updated_event: Emitido al modificar el título, descripción o responsable.

Entregables Esperados:
Endpoints de tracking de tiempo testeados y manejando casos extremos.

Componente React de cronómetro resiliente a recargas de página.

Servidor y cliente WebSocket configurados con autenticación y salas.

Sincronización comprobable: Al abrir dos navegadores diferentes en el mismo proyecto, los movimientos de tarjetas deben replicarse sin latencia perceptible.