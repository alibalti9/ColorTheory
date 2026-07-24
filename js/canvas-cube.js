import { hexToOklch } from './color-converter.js';

let rotationX = -18;
let rotationY = 24;
let scale = 1;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };
let velocityX = 0;
let velocityY = 0;
let eventsInitialized = false;

export function renderCubeView(sphereElement, legendElement, palette) {
  if (!sphereElement) return;
  sphereElement.innerHTML = `<div class="color-space-sphere" aria-label="Interactive OKLCH color-space sphere">
    <div class="color-space-sphere__equator"></div><div class="color-space-sphere__meridian"></div>
    ${palette.map((color, index) => pointMarkup(color, index)).join('')}
  </div>`;

  if (legendElement) {
    legendElement.innerHTML = palette.map((color, index) =>
      `<div class="cl-item"><div class="cl-dot" style="background:${color}"></div><span class="cl-hex">${index + 1}. ${color.toUpperCase()}</span></div>`
    ).join('');
  }
  applyTransform(sphereElement);
}

function pointMarkup(color, index) {
  const [lightness, chroma, hue] = hexToOklch(color);
  const angle = (hue * Math.PI) / 180;
  // L is vertical, while C/H use a circular plane that narrows at the poles.
  const availableRadius = Math.sqrt(Math.max(0, 1 - (lightness * 2 - 1) ** 2)) * 128;
  const radius = Math.min(1, chroma / 0.32) * availableRadius;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = (0.5 - lightness) * 260;
  const label = `${color.toUpperCase()} | L ${(lightness * 100).toFixed(0)} C ${chroma.toFixed(3)} H ${hue.toFixed(0)}`;
  return `<button class="oklch-point" style="--x:${x.toFixed(1)}px;--y:${y.toFixed(1)}px;--z:${z.toFixed(1)}px;--point:${color}" title="${label}"><span>${index + 1}</span></button>`;
}

function applyTransform(element) {
  if (element) element.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${scale})`;
}

export function initCubeEvents(sceneElement) {
  if (!sceneElement || eventsInitialized) return;
  eventsInitialized = true;
  const getSphere = () => document.getElementById('cube3d');

  sceneElement.addEventListener('pointerdown', (event) => {
    isDragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    velocityX = velocityY = 0;
    sceneElement.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener('pointermove', (event) => {
    if (!isDragging) return;
    velocityY = (event.clientX - lastPointer.x) * 0.38;
    velocityX = (event.clientY - lastPointer.y) * 0.38;
    rotationY += velocityY;
    rotationX += velocityX;
    lastPointer = { x: event.clientX, y: event.clientY };
    applyTransform(getSphere());
  });
  window.addEventListener('pointerup', () => { isDragging = false; });
  sceneElement.addEventListener('wheel', (event) => {
    scale = Math.max(0.55, Math.min(1.65, scale - event.deltaY * 0.001));
    applyTransform(getSphere());
    event.preventDefault();
  }, { passive: false });

  (function momentum() {
    if (!isDragging && (Math.abs(velocityX) > 0.04 || Math.abs(velocityY) > 0.04)) {
      rotationX += velocityX;
      rotationY += velocityY;
      velocityX *= 0.9;
      velocityY *= 0.9;
      applyTransform(getSphere());
    }
    requestAnimationFrame(momentum);
  })();
}

export function resetCubeView() {
  rotationX = -18;
  rotationY = 24;
  scale = 1;
}
