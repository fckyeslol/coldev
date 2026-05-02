# CLAUDE.md — ColDev Engineering & UX Rules

## Core Behavior (Token Efficient)

1. Think before acting. Read existing files before writing code.
2. Be concise in output but thorough in reasoning.
3. Prefer editing over rewriting whole files.
4. Do not re-read files you have already read unless they may have changed.
5. Test your code before declaring done.
6. No sycophantic openers or closing fluff.
7. Keep solutions simple and direct.
8. User instructions always override this file.

---

## Product Context

ColDev es una red social para developers en Colombia construida con:
- Next.js (App Router)
- Supabase
- Vercel

El objetivo es que se sienta como una red social real, no un demo.

Prioriza:
- conexión entre usuarios
- interacción
- creación de contenido
- descubrimiento de perfiles
- retención

---

## Design Philosophy

La interfaz debe ser:

- limpia
- minimalista
- elegante
- moderna
- fácil de entender

Evita:
- saturación visual
- Uso de emojis
- elementos innecesarios
- UX confusa
- complejidad sin valor

Cada pantalla debe responder:
- ¿Qué puedo hacer aquí?
- ¿Qué está pasando?
- ¿Qué hago después?

---

## Animations & UI Feel

Las animaciones son clave.

Usar:
- transiciones suaves (150–300ms)
- fade, scale y slide sutil
- hover states elegantes
- skeleton loading
- feedback visual inmediato

Evitar:
- animaciones exageradas
- delays innecesarios
- efectos que distraigan

Las animaciones deben mejorar la comprensión, no solo decorar.

---

## UX Rules

Siempre incluir:

- loading states
- empty states útiles
- error states claros
- feedback inmediato al usuario
- navegación intuitiva
- botones con intención clara

El usuario nunca debe sentirse perdido.

---

## Mobile First

La app debe funcionar perfectamente en móvil.

Cuidar:
- navegación inferior (bottom nav)
- botones fáciles de tocar
- inputs accesibles
- links clickeables
- chats fluidos
- layouts sin overflow
- textos legibles

---

## Code Standards

- Usar TypeScript limpio
- Evitar `any`
- Componentes reutilizables
- No duplicar lógica
- Nombres claros
- Manejo correcto de errores
- Código organizado

Siempre asegurar:
```bash
npm run build