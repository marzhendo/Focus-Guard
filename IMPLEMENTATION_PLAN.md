# FocusGuard - Implementation Plan

## PHASE 1: Scaffolding & Static UI Layout
**Goal:** Build the static visual shell of the dashboard.
- [ ] Initialize `index.html` with Tailwind CSS integration.
- [ ] Setup the CSS variables or Tailwind config for the exact Color Palette (#39FF14, #EF4444, #12161D, #020617).
- [ ] Build the Main Grid Layout (Sidebar on the left, Main Dashboard Area on the right).
- [ ] Create the central component: The giant Digital Timer reading "25:00".
- [ ] Create the bottom-right component: The Webcam Video Feed card (placeholder styling for now).
- [ ] Add control buttons (Start Focus, Pause, Abort).

## PHASE 2: Pomodoro Engine & State Management (`pomodoro.js`)
**Goal:** Make the timer functional and establish the core states.
- [ ] Define global states: `IDLE`, `FOCUS_ACTIVE`, `BREAK_TIME`, `ALERT`.
- [ ] Implement `setInterval` logic to countdown from 25:00 to 00:00.
- [ ] Implement auto-transition to a 5:00 Break timer when the Focus session ends.
- [ ] Connect the timer logic to `ui.js` so the DOM updates every second.
- [ ] Ensure changing states updates the UI theme (e.g., switching timer text from Neon Green to Soft Blue during break).

## PHASE 3: AI Model Integration (`ai.js`)
**Goal:** Connect the Teachable Machine model and webcam.
- [ ] Import `@tensorflow/tfjs` and `@teachablemachine/image` via script tags.
- [ ] Write initialization function to request webcam permissions and load the provided model URL.
- [ ] Pipe the webcam stream into the bottom-right UI video element.
- [ ] Create the `predict()` loop utilizing `requestAnimationFrame`.
- **CRITICAL:** The prediction loop must ONLY analyze frames if the global state from Phase 2 is `FOCUS_ACTIVE`.

## PHASE 4: Distraction Logic & UI Feedback (`ui.js` & `ai.js`)
**Goal:** Trigger the red alert state when a distraction is detected.
- [ ] In the prediction loop, check the probability of the "Terdistraksi" (Distracted) class.
- [ ] If probability > 0.85, start a hidden counter.
- [ ] If the distraction persists for > 5 seconds, trigger the `ALERT` state.
- [ ] Update `ui.js` to handle the `ALERT` state:
      - Change the entire UI theme to Red Warning (red borders, red timer).
      - Display the "DISTRACTION DETECTED" overlay message.
      - Play an audio beep (optional but recommended).
- [ ] Auto-revert to `FOCUS_ACTIVE` state immediately when the user's face is detected as focused again.

## PHASE 5: Polish & Edge Cases
**Goal:** Finalize the application for the demo.
- [ ] Ensure Glassmorphism CSS effects are rendering correctly.
- [ ] Handle window resizing (Responsive design).
- [ ] Add console logs for debugging state transitions.
- [ ] Final code cleanup and commenting.