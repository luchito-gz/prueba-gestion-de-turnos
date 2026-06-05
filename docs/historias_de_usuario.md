# Historias de Usuario — TurnoIA

## HU-01: Reserva de turno por texto en WhatsApp

**Como** paciente/cliente,  
**quiero** enviar un mensaje de texto por WhatsApp solicitando un turno,  
**para** reservar una cita sin necesidad de llamar por teléfono.

### Criterios de aceptación:

- [ ] El bot saluda al usuario y le pide nombre y fecha/hora deseada.
- [ ] El bot verifica disponibilidad en la agenda del profesional.
- [ ] Si hay disponibilidad, confirma el turno con fecha, hora y profesional.
- [ ] Si NO hay disponibilidad, ofrece los 3 horarios más cercanos.
- [ ] El turno queda registrado en la base de datos con estado "confirmado".
- [ ] El bot envía un mensaje de confirmación con un resumen del turno.

**Prioridad:** P1 - Alta  
**Sprint estimado:** Sprint 2  
**Asignado a:** [nombre del integrante]

---

## HU-02: Reserva de turno por audio en WhatsApp

**Como** paciente/cliente,  
**quiero** enviar un audio por WhatsApp pidiendo un turno,  
**para** no tener que escribir y poder hacerlo hablando.

### Criterios de aceptación:

- [ ] El bot detecta que recibió un audio (formato ogg).
- [ ] El audio se envía a Whisper API y se obtiene el texto transcripto.
- [ ] El bot identifica la intención "reservar turno" en el texto.
- [ ] Se inicia el mismo flujo de reserva que con texto (HU-01).
- [ ] Si el audio no se entiende, el bot pide al usuario que repita o escriba.

**Prioridad:** P1 - Alta  
**Sprint estimado:** Sprint 2  
**Asignado a:** [nombre del integrante]

---

## HU-03: Recordatorio automático 24h antes

**Como** paciente/cliente,  
**quiero** recibir un recordatorio por WhatsApp 24 horas antes de mi turno,  
**para** no olvidarme y poder cancelar a tiempo si no puedo asistir.

### Criterios de aceptación:

- [ ] El sistema revisa cada hora si hay turnos dentro de las próximas 24h.
- [ ] Se envía un mensaje de recordatorio con fecha, hora y profesional.
- [ ] El mensaje incluye opciones: "Confirmo" o "Cancelar".
- [ ] Si responde "Cancelar", se libera el turno (ver HU-04).
- [ ] No se envía más de un recordatorio por turno.

**Prioridad:** P1 - Alta  
**Sprint estimado:** Sprint 3  
**Asignado a:** [nombre del integrante]

## HU-04: Cancelación/Reprogramación

**Como** paciente/cliente,  
**quiero** cancelar o reprogramar un turno enviando un audio o texto de Whatsapp.
**para** evitar perder el turno y hacer toda la gestion desde cero.

### Criterios de aceptación:

- [ ] El bot detecta que recibió un audio o un texto.
- [ ] El bot verifica los turnos del paciente y los enumera para que eliga la opción correcta.
- [ ] El bot pregunta si quiere Cancelar o Reprogramar.
- [ ] Si responde "Cancelar", se libera el turno.
- [ ] Si responde "Reprogramar", el bot verifica disponibilidad en la agenda del profesional.
- [ ] Si hay disponibilidad, confirma el turno con fecha, hora y profesional.
- [ ] Si NO hay disponibilidad, ofrece los 3 horarios más cercanos.
- [ ] El turno queda registrado en la base de datos con estado "confirmado".
- [ ] El bot envía un mensaje de confirmación con un resumen del turno.

## HU-05: Panel web - Login

Completar..

## HU-06: Panel web - Agenda diaria

Completar..

## HU-06: Panel web - Detalle de turno

Completar..

Completar al menos 10 HU
