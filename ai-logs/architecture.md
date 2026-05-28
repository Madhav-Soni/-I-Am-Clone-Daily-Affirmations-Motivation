## Prompt
I want to implement the Final Premium Polish + Social Sharing phase. Explain the architecture of what needs to be changed.

## Response
I have designed the architecture for the **Final Premium Polish + Social Sharing** phase, elevating "I AM WELL" to a production-grade, cinematic experience.

### Architectural Deliverables:
- **Cinematic Theme Engine**: The shareable card system will support five high-fidelity themes (**Aurora**, **Ember**, **Ocean**, **Void**, and **Minimal**). Each theme includes dynamic mood-based coloring, luxurious ambient glows, and premium typography.
- **Intelligent Adaptive Layouts**: Implement an adaptive typography system that automatically scales font sizes and line heights based on the length of the affirmation, ensuring every share card looks professionally designed.
- **Advanced Export System**: Build a robust `useAffirmationExport` hook that manages the full lifecycle of capturing, sharing, and saving. It supports high-resolution exports and direct "Save to Photo Library" functionality with proper permission handling.
- **Immersive Preview Experience**: The share modal features a real-time theme picker with smooth cross-fades, floating ambient backgrounds, and a "Capture Shimmer" micro-interaction that signals a successful export.
- **Emotional Continuity**: Navigation and haptic feedback are aligned throughout the **Library** and **Reveal** flows to maintain a slow, intentional, and premium wellness feel.

---

## Prompt
Give a prompt to Claude to make it understand the specification: I am in a contest, I do not need a long-lasting application, I just need to take screenshots and keep the app running for 1-2 days, and I really need to win it. So give some ideas and specify what's done, take the best sources from internet on what the judges want in a contest, and prepare the best architecture document to help me build the app.

Reference repositories:
- Template mobile reference: https://github.com/8xsocial/template-mobile
- My current repository: https://github.com/Madhav-Soni/-I-Am-Clone-Daily-Affirmations-Motivation

## Response
Here is the recommended prompt to instruct Claude on how to architecture and build this app for hackathon dominance:

### 1. Perceived Completeness over Scaling Depth
- **Pre-seed Data**: Pre-populate database models with realistic 14-day streak stats, 126 completed rituals, and a diverse history of saved affirmations so the app doesn't feel like an empty database.
- **Robust Fallbacks**: Configure immediate, premium offline mock affirmations in case AI APIs or network connections slow down during judging.

### 2. High-Impact Cinematic Micro-interactions
- **Typewriter Reveal**: Serve affirmations character-by-character with transport-independent delays to build emotional anticipation.
- **AI Thinking Indicators**: Include detailed multi-stage status messages ("Synthesizing emotional context...", "Tuning resonance cadence...") during the generation state.

### 3. README & Loom Presentation Architecture
- **Storytelling focus**: Frame the app not as a generic utility but as a cohesive "emotional ritual platform".
- **UX Screenshot Galleries**: Group visual documentation around major emotional milestones (check-in, reflection, cinematic reveal, library archive).
