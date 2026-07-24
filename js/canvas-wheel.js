import { hexToHsl, hslToHex } from './color-converter.js';
import { textOn, nameColor } from './palette-utils.js';

export function renderColorWheel(canvas, palette) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = width / 2 - 2;
  const innerRadius = outerRadius * 0.36;

  context.clearRect(0, 0, width, height);
  const segments = 72;

  for (let index = 0; index < segments; index++) {
    const angleStart = (index / segments) * Math.PI * 2 - Math.PI / 2;
    const angleEnd = ((index + 1) / segments) * Math.PI * 2 - Math.PI / 2;
    const hue = (index / segments) * 360;
    const gradient = context.createRadialGradient(
      centerX, centerY, innerRadius, centerX, centerY, outerRadius
    );
    gradient.addColorStop(0, hslToHex(hue, 100, 62));
    gradient.addColorStop(0.5, hslToHex(hue, 100, 44));
    gradient.addColorStop(1, hslToHex(hue, 90, 18));
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, outerRadius, angleStart, angleEnd);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();
  }

  for (let index = 0; index < segments; index++) {
    const angle = (index / segments) * Math.PI * 2 - Math.PI / 2;
    context.beginPath();
    context.moveTo(
      centerX + innerRadius * Math.cos(angle),
      centerY + innerRadius * Math.sin(angle)
    );
    context.lineTo(
      centerX + outerRadius * Math.cos(angle),
      centerY + outerRadius * Math.sin(angle)
    );
    context.strokeStyle = 'rgba(0,0,0,.18)';
    context.lineWidth = 0.6;
    context.stroke();
  }

  const innerGradient = context.createRadialGradient(
    centerX - innerRadius * 0.25,
    centerY - innerRadius * 0.3,
    0,
    centerX,
    centerY,
    innerRadius
  );
  innerGradient.addColorStop(0, 'rgba(255,255,255,.96)');
  innerGradient.addColorStop(0.4, 'rgba(210,90,70,.72)');
  innerGradient.addColorStop(0.72, 'rgba(110,15,15,.88)');
  innerGradient.addColorStop(1, 'rgba(20,2,2,.97)');
  context.beginPath();
  context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  context.fillStyle = innerGradient;
  context.fill();

  palette.forEach((color, index) => {
    const [hue, saturation] = hexToHsl(color);
    const radius = innerRadius + (outerRadius - innerRadius) * (0.25 + saturation / 220);
    const angle = (hue / 360) * Math.PI * 2 - Math.PI / 2;
    const pointX = centerX + radius * Math.cos(angle);
    const pointY = centerY + radius * Math.sin(angle);
    context.beginPath();
    context.arc(pointX, pointY, 9, 0, Math.PI * 2);
    context.fillStyle = 'rgba(0,0,0,.35)';
    context.fill();
    context.beginPath();
    context.arc(pointX, pointY, 8, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = 'rgba(255,255,255,.9)';
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = textOn(color);
    context.font = 'bold 8.5px Inter';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(index + 1), pointX, pointY);
  });
}

export function renderWheelSideList(listElement, stripElement, palette, onCopy) {
  if (listElement) {
    listElement.innerHTML = palette
      .map(
        (color) => `
      <div class="wci" data-copy="${color}">
        <div class="wci-sw" style="background:${color}"></div>
        <div>
          <div class="wci-hex">${color.toUpperCase()}</div>
          <div class="wci-name">${nameColor(color)}</div>
        </div>
      </div>`
      )
      .join('');
    listElement.querySelectorAll('[data-copy]').forEach((element) => {
      element.addEventListener('click', () => onCopy(element.dataset.copy));
    });
  }
  if (stripElement) {
    stripElement.innerHTML = palette
      .map(
        (color) =>
          `<div class="ws-sw" style="background:${color}" data-copy="${color}"><span>${color.toUpperCase()}</span></div>`
      )
      .join('');
    stripElement.querySelectorAll('[data-copy]').forEach((element) => {
      element.addEventListener('click', () => onCopy(element.dataset.copy));
    });
  }
}
