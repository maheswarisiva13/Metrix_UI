/**
 * useRipple — adds a ripple effect to any button ref on click
 */
import { useCallback } from 'react';

export const useRipple = () => {
  const createRipple = useCallback((event) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();

    circle.style.width  = circle.style.height = `${diameter}px`;
    circle.style.left   = `${event.clientX - rect.left  - radius}px`;
    circle.style.top    = `${event.clientY - rect.top   - radius}px`;
    circle.classList.add('ripple');

    // Remove any previous ripple
    const existing = button.querySelector('.ripple');
    if (existing) existing.remove();

    button.appendChild(circle);
    circle.addEventListener('animationend', () => circle.remove());
  }, []);

  return createRipple;
};