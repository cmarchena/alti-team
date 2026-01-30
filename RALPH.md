# RALPH - dev

> **Ralph Wiggum**: Un método simple pero efectivo para hacer que AI coding agents trabajen en tu backlog mientras duermes.
> Basado en: https://ghuntley.com/ralph/ y https://youtu.be/_IK18goX4X8

## 🎯 Qué es Ralph

Ralph es un **bash loop** que permite que un coding agent (Kilo Code, Claude Code, Cursor, etc.) trabaje a través de un backlog de tareas de forma autónoma.

**Descripción del proyecto**: POC gestiób de equipos y proyectos

### Por qué Ralph funciona

En lugar de crear planes multi-fase complejos, Ralph funciona como un ingeniero real:

1. Mira el backlog (prd.json)
2. Elige la tarea de mayor prioridad
3. La completa
4. Commitea
5. Vuelve al paso 1

**Es literalmente un for loop.**

## 🚀 Setup Rápido

### Estructura de archivos

```
plans/
├── prd.json          # Tus user stories / tareas
├── progress.txt      # Memoria del LLM entre iteraciones
├── ralph.sh          # Loop principal (AFK mode)
└── ralph-once.sh     # Una iteración (human-in-the-loop)
```

### Ejecutar Ralph

```bash
# Modo AFK (automático, máximo 10 iteraciones)
./plans/ralph.sh 10

# Modo Human-in-the-loop (una iteración a la vez)
./plans/ralph-once.sh
```

## 📋 Cómo usar Ralph

### 1. Define tus tareas en prd.json

Edita `plans/prd.json` con tus user stories:

```json
[
  {
    "id": "feat-001",
    "title": "Add user authentication",
    "description": "Users should be able to log in with email/password",
    "acceptanceCriteria": [
      "Login form is displayed",
      "Users can submit credentials",
      "Successful login redirects to dashboard",
      "Failed login shows error message"
    ],
    "passes": false,
    "priority": "high"
  }
]
```

### 2. Ejecuta Ralph

```bash
# Deja que trabaje solo
./plans/ralph.sh 20

# O ve paso a paso
./plans/ralph-once.sh
```

### 3. Revisa el código

Cada iteración crea un git commit. Revisa:
- Los commits en git log
- El archivo progress.txt para ver qué hizo
- El prd.json para ver qué marcó como completo

## 🎯 Principios de Ralph

### 1. Tareas Pequeñas

**Malo:**
```json
{
  "title": "Build entire authentication system",
  "passes": false
}
```

**Bueno:**
```json
[
  { "title": "Add login form UI", "passes": false },
  { "title": "Connect login to API", "passes": false },
  { "title": "Add error handling", "passes": false },
  { "title": "Add session management", "passes": false }
]
```

**Por qué**: El LLM funciona mejor con contextos pequeños. Una tarea grande = contexto inflado = código peor.

### 2. Feedback Loops Robustos

Ralph funciona mejor cuando tiene formas de verificar que el código funciona:

- ✅ Linting
- ✅ E2E tests (Playwright via MCP si es posible)
- ✅ CI que debe mantenerse verde

**Regla de oro**: Si Ralph commitea código roto, no sabrá de dónde vino porque perdió el contexto.

### 3. Commits Frecuentes

Cada iteración = 1 git commit.

Esto permite:
- Ver exactamente qué hizo en cada paso
- Revertir fácilmente si algo sale mal
- Que el LLM vea el historial git para contexto

### 4. progress.txt es la memoria

El LLM **debe** usar progress.txt para:
- Recordar decisiones arquitectónicas
- Dejar notas para la siguiente iteración
- Documentar blockers o cosas que aprendió

**Importante**: Usa "append", no "update". Queremos un log histórico.

## 🛠️ Trabajando con Kilo Code

### Prompt Inicial

Cuando inicies una sesión, dale este contexto a Kilo Code:

\`\`\`
Este proyecto usa Ralph para AI coding agents.

Lee estos archivos para entender el contexto:
1. RALPH.md - Este archivo
2. plans/prd.json - Las tareas pendientes
3. plans/progress.txt - Lo que se ha hecho

Estoy ejecutando ralph.sh que te llamará en un loop.
Tu trabajo es:
1. Elegir la tarea de mayor prioridad del prd.json
2. Implementarla completamente
3. Marcarla como "passes": true
4. Append tus learnings a progress.txt
5. Hacer un git commit
\`\`\`

### Prompts Comunes

**Agregar nueva feature al backlog:**
\`\`\`
Agrega esta user story al prd.json:

Título: [FEATURE_NAME]
Descripción: [DESCRIPCIÓN]
Acceptance Criteria:
- [Criterio 1]
- [Criterio 2]

Asegúrate de que sea una tarea pequeña y atómica.
\`\`\`

**Dividir tarea grande:**
\`\`\`
La tarea [TASK_ID] en prd.json es muy grande.
Divídela en 3-5 subtareas más pequeñas.
Reemplaza esa tarea con las subtareas en el prd.json.
\`\`\`

**Review de progreso:**
\`\`\`
Resume lo que se ha logrado hasta ahora:
1. Lee progress.txt
2. Cuenta cuántas tareas están "passes": true
3. Identifica blockers o problemas recurrentes
\`\`\`

## 🚨 Troubleshooting

### Ralph se queda en un loop infinito

**Síntomas:**
- Hace commits pero no marca tareas como completas
- Trabaja en la misma tarea repetidamente

**Solución:**
1. Para el loop (Ctrl+C)
2. Revisa progress.txt - ¿hay algún error?
3. Revisa los últimos commits - ¿qué intentó hacer?
4. Simplifica la tarea en prd.json o divídela en partes más pequeñas
5. Ejecuta ralph-once.sh para ir paso a paso

### Los tests fallan en CI

**Síntomas:**
- Ralph commitea código
- CI se pone rojo
- Ralph no se da cuenta

**Solución:**
1. Agrega verificación explícita en el prompt de ralph.sh
2. Considera ejecutar tests localmente antes de cada commit
3. Usa git hooks para prevenir commits rotos

### El código es de baja calidad

**Síntomas:**
- Funciona pero es difícil de mantener
- Muchos code smells

**Solución:**
1. Haz las tareas más pequeñas
2. Agrega más feedback loops (linting, formatting)
3. Considera human-in-the-loop para features complejas
4. Agrega code review guidelines al prompt

## 📚 Recursos

- [Ralph original](https://ghuntley.com/ralph/)
- [Video explicativo](https://youtu.be/_IK18goX4X8)
- [Anthropic: Effective Harnesses for Long-running Agents](https://www.anthropic.com/research/effective-harnesses)

## 💡 Tips Pro

1. **Usa ralph-once.sh al principio** - Aprende qué hace Ralph antes de dejarlo solo
2. **Invierte en tests** - Más tests = más confianza en modo AFK
3. **Tareas pequeñas siempre** - Una tarea compleja = múltiples tareas pequeñas
4. **Lee progress.txt regularmente** - Es tu ventana a lo que piensa el LLM
5. **Commitea el prd.json** - Para que el LLM vea su evolución en git history

## 🎓 Filosofía

> "El dev branch es siempre más loco que el main branch. Estamos experimentando aquí."

Ralph no es magia. Es simplemente una forma más intuitiva de trabajar con coding agents que refleja cómo los ingenieros reales trabajan con un kanban board.

En lugar de ser un "planner anal retentivo", con Ralph eres un **product designer** enfocado en QUÉ necesita hacerse, no CÓMO.

---

**Última actualización**: $(date +"%Y-%m-%d")
**Herramienta AI**: $AI_TOOL
