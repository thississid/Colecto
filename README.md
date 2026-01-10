# Colecto — A Personal Thought System

## Overview

Colecto is a lightweight, local-first personal system for writing, remembering, and organizing thoughts over time.

**It is not** a traditional notes app.  
**It is not** a task manager.  
**It is not** a second-brain clone.

Colecto is closer to a **personal operating system for thought** — a quiet space where ideas, notes, memories, and fragments are allowed to exist without pressure to be "organized" or "productive" in the moment.

It is designed for **people who think by writing**.

---

## Core Philosophy

### 1. Your thoughts are the source of truth

Colecto does not own your data.  
Your notes live as **real files in real folders** on your machine.

- You can open them without Colecto.
- You can move them, back them up, sync them, or ignore the app entirely.

The system exists to support your thinking, not to trap it.

### 2. Writing comes before structure

Colecto assumes that **structure emerges after thinking**, not before.

You don't start by choosing:
- a template
- a category
- a database

**You start by writing.**

Folders, links, tasks, and references exist, but they never block the act of writing. They are optional layers added only when needed.

### 3. Silence is a feature

Colecto is intentionally quiet.

There are:
- **no notifications**
- **no reminders** demanding attention
- **no productivity pressure**

The interface stays out of the way.  
The system speaks only when you ask it to.

---

## What Colecto Does

### A calm writing environment

Colecto provides a focused, distraction-free space for writing:
- Minimal UI
- Terminal-like, system-oriented aesthetic
- Clear visual hierarchy
- Writing-first layout

It feels less like an app and more like entering a private console where thoughts can be typed without judgement.

### A living folder of thoughts

You point Colecto at a folder on your machine.

Inside that folder live:
- notes
- fragments
- ideas
- logs
- unfinished thoughts

Colecto reflects that folder, rather than abstracting it away.  
What you see in the app matches what exists on disk.

### Effortless creation and continuity

Creating a new note is immediate.

There is no friction:
- no naming pressure
- no forced metadata
- no setup

Notes are meant to be **written quickly** and **revisited slowly**.

### Passive safety and memory

Colecto quietly protects your thoughts.

As you write, the system maintains safe versions of your notes in the background.  
Nothing is destructive.  
Nothing is irreversible.

This creates psychological safety:
> You can think freely because nothing is lost.

### Contextual remembrance (OSCI)

Colecto is designed to help you **remember what you once thought**, not just what you once wrote.

Through a memory layer (OSCI), the system can:
- recall related thoughts
- surface older notes when relevant
- reconnect ideas separated by time

This is not about searching keywords.  
It is about **re-entering a mental context**.

### Thoughts that become actions (without forcing it)

If a thought naturally turns into:
- a task
- a reminder
- an event

Colecto can recognize that and quietly reflect it elsewhere (like a calendar).

But tasks are not the center of the system.  
They are **byproducts of thinking**, not the goal.

---

## What Colecto Is Not

- It is **not** a productivity dashboard
- It is **not** a collaboration tool
- It is **not** a cloud-first service
- It is **not** trying to "optimize" your life
- It does **not** gamify thinking

Colecto respects that thinking is:
- nonlinear
- messy
- cyclical
- deeply personal

---

## Intended Audience

Colecto is built for:
- developers who think by writing
- writers who think in fragments
- researchers, engineers, and creators
- people who value **long-term memory** over **short-term output**

It is especially suited for people who keep notes for years and want to return to old versions of themselves.

---

## Emotional Goal

The ideal feeling when opening Colecto is:

> **"This is my space.  
> I can think here."**

No urgency.  
No pressure.  
No performance.

Just **continuity of thought**.

---

## In One Sentence

Colecto is a personal, local-first system for writing, remembering, and safely evolving your thoughts over time — designed to feel like a quiet operating system rather than a productivity app.

---

## Development

### Run locally
```bash
npm install
npm run dev
```

### Build for production
```bash
npm run package
```

This creates a distributable macOS app (DMG and ZIP) in the `release/` folder.

---

## License

MIT
