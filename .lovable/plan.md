

## Analysis: Claude Agent's `joncoach-office.jsx`

This file is an alternative implementation of the same JonCoach Office concept. Here's what's useful vs. what you already have:

### Already Covered (No Action Needed)
- Agent definitions, colors, tasks, chat panel, CRT effects, header bar — your current app already has all of this, and with richer system prompts.

### Valuable Improvements to Port Over

**1. Richer Agent States (typing / reading / idle / waiting)**
Your current agents only have a static `status` field. The Claude version has **dynamic, randomly cycling states** (typing, reading, idle, waiting) that drive visual changes — monitor screen content changes, arms animate when typing, status glow shifts color. This makes the office feel alive.

**2. Better Pixel Character Design**
The Claude version has more detailed characters: separate head with emoji avatar, body with gradient, **animated arms that move when typing**, legs, and a wooden desk with a monitor that shows different content per state (code lines when typing, a document icon when reading, a blinking dot when idle/waiting).

**3. Status Bar at the Bottom**
A row of pill-shaped agent buttons at the bottom showing each agent's live state with colored dots. Quick way to see all agent statuses and click to open chat — acts as a secondary navigation.

**4. Live Active/Waiting Counters in Header**
Your header shows static counts from `agent.status`. The Claude version derives counts from the **live dynamic state** (how many are currently typing vs waiting), making the header responsive to what's actually happening.

**5. Room Decorations**
Small touches: plant emojis in corners, coffee cup, clipboard, "JON'S OFFICE" floor label, room wall border — adds personality to the office floor.

### Plan

1. **Add dynamic agent state system** — Create a `useAgentState` hook that cycles agents through typing/reading/idle/waiting states on intervals, with bob animation and blink timing. Update `PixelAgent` to use these states for visual changes (monitor content, arm animation, status glow).

2. **Enhance PixelAgent visuals** — Add emoji avatars to agent data, gradient head/body rendering, animated arms on typing state, wooden desk styling, and state-dependent monitor content (code lines / document / blinking dot).

3. **Add bottom status bar** — Row of pill buttons below the office floor showing each agent name + live state dot, clickable to open chat.

4. **Make header counters dynamic** — Derive active/waiting counts from live agent states instead of static `status` field.

5. **Add room decorations** — Plant emojis, coffee cup, clipboard in corners, "JON'S OFFICE" label, subtle room wall border.

All changes stay within the existing React + TypeScript + Tailwind architecture. The agent data in `agents.ts` gets a new `avatar` field; everything else is component-level updates.

