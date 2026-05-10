# FocusGuard - AI Agent Operational Rules

## 1. PROJECT OVERVIEW
You are acting as a Senior Frontend Developer building "FocusGuard", an AI-powered Pomodoro timer integrating TensorFlow.js (Teachable Machine) for distraction detection. 

## 2. STRICT TECH STACK
- **Markup:** HTML5 (Semantic).
- **Styling:** Tailwind CSS (via CDN for rapid prototyping, or basic setup). DO NOT use UI libraries like React, Vue, Material UI, or Bootstrap.
- **Logic:** Vanilla JavaScript (ES6+). NO frontend frameworks.
- **Machine Learning:** TensorFlow.js (`tf.js`) & Teachable Machine Image Library.

## 3. DESIGN SYSTEM & UI CONSTRAINTS
You must strictly adhere to the following design system parameters based on the approved UI mockups:
- **Background/Surface:** `#020617` (Deep Navy) and `#12161D` (Card/Surface).
- **Primary/Focus State:** `#39FF14` (Neon Green) - Used when AI is actively monitoring and user is focused.
- **Alert/Distraction State:** `#EF4444` (Red) - Used for warnings.
- **Break/Standby State:** `#3B82F6` (Blue) or Neutral `#8E9196` - Used when AI monitoring is paused.
- **Typography:** 'Inter' for body, 'JetBrains Mono' for labels/timer, 'Space Grotesk' for headlines.
- **Effects:** Use Glassmorphism (`backdrop-blur`) and thin glowing shadows (`drop-shadow`) for active elements.

## 4. ARCHITECTURE & CODE RULES
- **Separation of Concerns:** Do NOT put all logic in one file. Split JavaScript into:
  - `ui.js`: DOM manipulation and UI state changes.
  - `pomodoro.js`: Timer logic, intervals, and session state management.
  - `ai.js`: TensorFlow.js model loading, webcam inference, and prediction loop.
- **No Hallucinations:** DO NOT invent new features (e.g., backend databases, user authentication, or complex analytics graphs) unless explicitly requested. Keep the scope limited to the Pomodoro timer and webcam detection.
- **Performance:** Ensure the `requestAnimationFrame` loop for the AI model ONLY runs when `isFocusMode == true`. Turn off or pause webcam inference during "Break Mode" to save CPU/RAM.

## 5. COMMUNICATION
- Do not explain your code extensively unless asked. 
- Follow the `IMPLEMENTATION_PLAN.md` strictly. Complete one phase before moving to the next.