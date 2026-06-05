# Cambio de Metodología: De Cascada a Ágil — TurnoIA

**Documento interno del Grupo 2 — Desarrollo de Software 2026**
Propósito: reflexión de equipo y preparación para el parcial con la profesora.

---

## 1. Qué estábamos haciendo mal (metodología en cascada)

La metodología en cascada propone un orden estricto y lineal: primero se define todo lo que se va a construir, luego se diseña, luego se programa, y recién al final se entrega algo que funcione. No se entrega nada hasta que esté "todo listo".

Sin saberlo, el equipo estaba aplicando cascada. Los sprints existían en el papel, pero el primer entregable funcional iba a ser el sistema completo: chatbot con IA, integración WhatsApp, panel web, base de datos y recordatorios automáticos, todo junto al final de la cursada. Incluso durante las primeras semanas, las conversaciones giraban alrededor del chatbot con IA y la integración de audio, cuando todavía no había un login funcionando ni un turno guardado en la base de datos.

El síntoma más claro: si alguien hubiera pedido ver el sistema funcionando en la Semana 3, no había nada que mostrar.

---

## 2. Por qué es un problema

Entregar todo al final genera varios riesgos concretos:

**Riesgo técnico:** si un componente falla cerca de la fecha de entrega, no hay tiempo para corregirlo. En un sistema que integra FastAPI + PostgreSQL + React + Twilio + WhatsApp, las chances de que algo falle son altas. Con cascada, ese error se descubre tarde.

**Riesgo académico:** el evaluador no puede ver progreso durante la cursada. Si la entrega final tiene un bug bloqueante, la calificación refleja un sistema roto, no semanas de trabajo real.

**Sin feedback temprano:** la profesora puede detectar problemas de diseño o de metodología en la Semana 2 o 3. Si el primer entregable es en la Semana 10, ese feedback llega cuando ya es demasiado tarde para incorporarlo.

**Deuda técnica oculta:** cuando se construye todo de una vez sin entregas intermedias, los problemas de integración entre capas (por ejemplo, entre el frontend y el backend, o entre el chatbot y la base de datos) se acumulan y se descubren todos juntos al final.

---

## 3. Qué cambió (metodología ágil)

Ágil no es solo "trabajar en sprints". El cambio real está en la mentalidad: **entregar algo que funcione lo antes posible, y mejorar sobre eso.**

En términos concretos para TurnoIA, el cambio implicó:

**Entregas semanales desplegadas en producción.** Cada semana hay algo nuevo que funciona en la URL real del proyecto, no solo en la computadora de un integrante.

**Prioridad al MVP visible.** El panel web (login, agenda, turnos) fue lo primero, porque es lo que más valor entrega y lo más fácil de demostrar. El chatbot con IA vino después, cuando la base ya estaba sólida.

**Backlog reordenado por dependencias reales.** El orden de construcción pasó a ser:

- **Bloque A — Panel web:** autenticación, agenda, CRUD de turnos. Es el núcleo, lo que define si el sistema funciona.
- **Bloque B — Datos:** modelos de BD, migraciones, API de disponibilidad, datos demo. Consolida la base de datos como fuente de verdad.
- **Bloque C — Chatbot:** webhook WhatsApp, máquina de estados, creación de turnos desde WhatsApp. Agrega el canal secundario sobre una base ya probada.
- **Bloque D — IA avanzada:** Whisper STT, recordatorios automáticos. Mejoras que se agregan cuando el núcleo ya está estable.

**Definición de Done por semana.** Cada semana tiene un entregable mínimo verificable: algo que se puede abrir en el navegador o probar desde el celular, no solo código que "técnicamente compila".

---

## 4. Evidencia del cambio en este proyecto

| Semana | Fechas | Qué se entregó | Verificación |
|---|---|---|---|
| **Semana 1** | 5–11 mayo | Login + JWT + multitenancy + agenda diaria + crear/editar/cancelar turnos desplegado en Vercel | https://proyecto-saa-s-ia.vercel.app |
| **Semana 2** | 12–18 mayo | Seed con datos reales en Supabase (Dr. García, profesionales, clientes, turnos) + API disponibilidad con slots de 30 minutos + fixes CORS y SAEnum para PostgreSQL | `GET /api/disponibilidad?profesional_id=1&fecha=2026-05-14` |
| **Semana 3** | 19–25 mayo | Webhook WhatsApp (Twilio) + máquina de estados completa del chatbot (6 estados, manejo de errores, creación de turno en BD) + auditoría .env + documentación actualizada | `POST /api/webhook/whatsapp` + demo desde WhatsApp Sandbox |

Cada entrega de la tabla está commiteada y desplegada en producción. No es trabajo en progreso: es software que funciona.

---

## 5. Comparativa: cascada vs ágil aplicada al proyecto

| Aspecto | Cascada (lo que hacíamos) | Ágil (lo que hacemos ahora) |
|---|---|---|
| **Orden de desarrollo** | Chatbot con IA primero, luego el resto | Panel web → datos → chatbot → IA avanzada |
| **Primer entregable** | Sistema completo al final de la cursada | Panel funcional en Vercel en la Semana 1 |
| **Manejo de errores** | Se descubren al integrar todo junto al final | Se detectan semana a semana, con tiempo para corregir |
| **Visibilidad del progreso** | No hay nada que mostrar hasta el final | Cada semana hay una URL funcionando |
| **Respuesta al feedback de la profesora** | Tarde (semana 9 o 10) | Temprana (semana 2 o 3), con tiempo para ajustar |
| **Riesgo de entrega final** | Alto — un bug puede hundir todo | Bajo — el sistema ya fue probado semana a semana |
| **Motivación del equipo** | Baja — semanas sin ver resultados visibles | Alta — cada semana hay algo nuevo que funciona |

---

## 6. Lecciones aprendidas

**1. El MVP no es el sistema completo simplificado — es el núcleo mínimo que demuestra que la idea funciona.**
En TurnoIA el MVP fue: login + crear un turno + verlo en la agenda. Todo lo demás (WhatsApp, IA, recordatorios) son capas que se agregan sobre ese núcleo. Identificar eso al principio habría ahorrado semanas de discusión sobre funcionalidades que aún no eran prioritarias.

**2. Desplegar a producción desde el principio obliga a hacer las cosas bien.**
Cuando el código solo vive en la computadora de un integrante, es fácil ignorar problemas de configuración, variables de entorno o compatibilidad. Al desplegar en Railway y Vercel desde la Semana 1, esos problemas aparecieron temprano y fueron mucho más simples de resolver.

**3. Un backlog ordenado por dependencias reales es más útil que un backlog ordenado por "lo más interesante".**
El chatbot con IA es la funcionalidad más llamativa del proyecto. Pero sin autenticación, sin modelos de BD y sin endpoint de disponibilidad, el chatbot no puede funcionar. El backlog ágil respeta esas dependencias; la cascada las ignora.

**4. Las iteraciones cortas reducen el riesgo, no lo aumentan.**
Parece que entregar parcialmente es arriesgado porque "no está todo". En realidad es lo contrario: cada entrega pequeña es una verificación de que el sistema funciona. Al final del proyecto, el riesgo acumulado es mínimo porque cada componente ya fue probado en producción.

---

## 7. Glosario rápido para el parcial

**Sprint:** período de tiempo fijo (en este proyecto, una semana) en el que el equipo se compromete a entregar un conjunto de funcionalidades. Al final del sprint hay un producto funcionando, no trabajo en progreso.

**Backlog:** lista priorizada de todo lo que se quiere construir. No es una lista de tareas para hacer de una vez; es un inventario ordenado del que se toma lo más importante para cada sprint.

**MVP (Minimum Viable Product — Producto Mínimo Viable):** la versión más pequeña del producto que tiene valor real para el usuario. En TurnoIA: login + agenda + crear turnos. No es una demo ni un prototipo; es software funcional, aunque incompleto.

**Iteración:** ciclo de trabajo que produce un resultado verificable. En metodología ágil, cada sprint es una iteración. Al final de cada iteración hay algo nuevo que funciona.

**Entregable:** resultado concreto y verificable de un sprint. En este proyecto, un entregable es una URL que funciona o un endpoint que responde correctamente, no un documento ni un diagrama.

**Metodología ágil:** conjunto de valores y principios (definidos en el Manifiesto Ágil, 2001) que priorizan: individuos sobre procesos, software funcionando sobre documentación exhaustiva, colaboración con el cliente sobre negociación de contratos, y respuesta al cambio sobre seguir un plan. No es ausencia de planificación; es planificación adaptativa en ciclos cortos.

**Metodología en cascada (Waterfall):** enfoque de desarrollo donde cada fase (análisis → diseño → implementación → pruebas → entrega) se completa antes de pasar a la siguiente. El software funciona solo al final del proceso. Útil cuando los requisitos son completamente estables; problemático en proyectos universitarios o startups donde los requisitos evolucionan.

**Scrum:** marco de trabajo ágil que organiza el trabajo en sprints, con roles definidos (Product Owner, Scrum Master, equipo de desarrollo) y ceremonias específicas (planning, daily, review, retrospectiva). TurnoIA aplica algunos elementos de Scrum (sprints, backlog) de forma simplificada.

**Kanban:** sistema de gestión visual del trabajo donde las tareas se mueven entre columnas (Por hacer → En progreso → Hecho). Se enfoca en el flujo continuo en lugar de sprints fijos. Complementario a Scrum.

**Deploy continuo (Continuous Deployment):** práctica donde cada cambio aprobado en el repositorio se despliega automáticamente a producción. En TurnoIA: cada push a `main` lanza un nuevo deploy en Railway (backend) y Vercel (frontend) sin intervención manual.
