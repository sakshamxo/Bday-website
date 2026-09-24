---
name: motion-animations
description: Standards for native CSS transitions, keyframe animations, GSAP / Web Animations API, particle celebration triggers (canvas-confetti), and card micro-interactions in vanilla HTML/CSS/JS. Trigger when adding hover states, staggered card entrances, countdown animations, or celebration effects.
---

# Web Motion & Micro-Interaction Standards (HTML / CSS / JS)

## 1. Physics-Driven CSS Transitions
Never use raw `linear` or standard `ease` for interactive elements. Use custom cubic-beziers:

```css
:root {
  /* Snappy spring-like feedback */
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  /* Smooth natural entrance */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-quick: 180ms;
  --duration-medium: 350ms;
}

/* Tactile button interaction */
.btn-celebrate {
  transition: transform var(--duration-quick) var(--ease-spring),
              box-shadow var(--duration-quick) ease;
}

.btn-celebrate:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.35);
}

.btn-celebrate:active {
  transform: translateY(0) scale(0.97);
}

2. Staggered Card Reveals (Vanilla JS + CSS)
Add staggered animations to dynamic lists or birthday cards using CSS custom properties:

CSS
.card {
  opacity: 0;
  transform: translateY(20px);
  animation: revealCard var(--duration-medium) var(--ease-out-quint) forwards;
  animation-delay: calc(var(--index, 0) * 80ms);
}

@keyframes revealCard {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
JavaScript
// Attach the stagger index dynamically in JS
document.querySelectorAll('.card').forEach((card, index) => {
  card.style.setProperty('--index', index);
});
3. Celebration Particle Triggers (canvas-confetti)
Include confetti via CDN:

HTML
<script src="[https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js](https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js)"></script>
Trigger a celebration burst when reaching zero on a countdown or clicking a wish button:

JavaScript
function launchCelebrationConfetti() {
  const defaults = {
    spread: 65,
    ticks: 80,
    gravity: 1.1,
    decay: 0.94,
    startVelocity: 30,
    colors: ['#ec4899', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6']
  };

  // Left cannon
  confetti({
    ...defaults,
    particleCount: 50,
    angle: 60,
    origin: { x: 0.15, y: 0.7 }
  });

  // Right cannon
  confetti({
    ...defaults,
    particleCount: 50,
    angle: 120,
    origin: { x: 0.85, y: 0.7 }
  });
}
4. Accessibility Check (Reduced Motion)
Always respect user motion preference in CSS:

CSS
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}