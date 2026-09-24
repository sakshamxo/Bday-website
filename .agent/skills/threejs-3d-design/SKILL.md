---
name: threejs-3d-design
description: Guidelines for vanilla Three.js, HTML5 Canvas 3D scenes, lighting, procedural geometric animations, interactive mouse-tilt effects, and performance optimization for plain JavaScript projects. Trigger when building 3D canvas backgrounds, interactive gift boxes, balloons, or spatial visual effects.
---

# Vanilla Three.js & 3D Web Standards (HTML / CSS / JS)

## 1. Setup & Canvas Lifecycle
Load Three.js via ES Module in your HTML:
```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
    }
  }
</script>
```

Always bind renderer resizing and cap the pixel ratio to avoid GPU exhaustion:

```JavaScript
import * as THREE from 'three';

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

window.addEventListener('resize', () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});```

## 2. Animation Loop & Frame Independence
Always use clock.getDelta() to ensure smooth, hardware-independent rotational motion:
```JavaScript
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (window.celebrationMesh) {
    window.celebrationMesh.rotation.y += delta * 0.5;
  }

  renderer.render(scene, camera);
}
animate();```

## 3. Celebratory Lighting & Materials
Use a 3-point festive lighting setup:
```JavaScript
// Warm base
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Key directional light
const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);

// Festive back/rim light (pink/purple accent)
const rimLight = new THREE.PointLight(0xec4899, 2.5, 10);
rimLight.position.set(-4, -2, -2);
scene.add(rimLight);```

## 4. Performance Optimizations (Mobile Readiness)
To prevent mobile thermal throttling:
```JavaScript
// Limit geometry complexity for low-end devices
const maxPolyCount = 40000; // Keep total tris below this

// Auto-dispose buffers when removing objects
mesh.geometry.dispose();
mesh.material.dispose();

// Throttle shadow rendering (only on high-end devices)
renderer.shadowMap.type = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent)
  ? THREE.BasicShadowMap
      : THREE.VSMShadowMap;```

## 5. Interactive Mouse / Pointer Tilt
Smoothly rotate the 3D scene towards the user's cursor using linear interpolation:
```JavaScript
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function updatePointerReaction() {
  targetX += (mouseX - targetX) * 0.05;
  targetY += (mouseY - targetY) * 0.05;

  if (window.sceneGroup) {
    window.sceneGroup.rotation.y = targetX * 0.4;
    window.sceneGroup.rotation.x = -targetY * 0.4;
  }
}```   


