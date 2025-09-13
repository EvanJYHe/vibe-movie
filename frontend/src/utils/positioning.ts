import type { Position, Layout, PositionUnit } from '../types/timeline';

export interface CalculatedPosition {
  left: string;
  top: string;
  transform: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: string;
  wordWrap: 'normal' | 'break-word' | 'nowrap';
  lineHeight?: number;
}

export function calculatePosition(
  position?: Position,
  layout?: Layout
): CalculatedPosition {
  const defaultPosition: Position = {
    x: 50,
    y: 50,
    unit: '%',
    anchor: 'center'
  };

  const pos = position || defaultPosition;
  const unit = pos.unit || '%';
  const anchor = pos.anchor || 'center';

  let left = `${pos.x}${unit}`;
  let top = `${pos.y}${unit}`;
  let transform = '';

  switch (anchor) {
    case 'top-left':
      transform = 'translate(0, 0)';
      break;
    case 'top-center':
      transform = 'translate(-50%, 0)';
      break;
    case 'top-right':
      transform = 'translate(-100%, 0)';
      break;
    case 'center-left':
      transform = 'translate(0, -50%)';
      break;
    case 'center':
      transform = 'translate(-50%, -50%)';
      break;
    case 'center-right':
      transform = 'translate(-100%, -50%)';
      break;
    case 'bottom-left':
      transform = 'translate(0, -100%)';
      break;
    case 'bottom-center':
      transform = 'translate(-50%, -100%)';
      break;
    case 'bottom-right':
      transform = 'translate(-100%, -100%)';
      break;
    default:
      transform = 'translate(-50%, -50%)';
  }

  const result: CalculatedPosition = {
    left,
    top,
    transform,
    textAlign: layout?.textAlign || 'center',
    wordWrap: layout?.wordWrap || 'normal',
  };

  if (layout?.maxWidth) {
    const maxWidthUnit = layout.maxWidthUnit || '%';
    result.maxWidth = `${layout.maxWidth}${maxWidthUnit}`;
  }

  if (layout?.lineHeight) {
    result.lineHeight = layout.lineHeight;
  }

  return result;
}

export function convertUnit(
  value: number,
  fromUnit: PositionUnit,
  toUnit: PositionUnit,
  containerSize: number
): number {
  if (fromUnit === toUnit) return value;

  let valueInPx: number;

  switch (fromUnit) {
    case 'px':
      valueInPx = value;
      break;
    case '%':
      valueInPx = (value / 100) * containerSize;
      break;
    case 'vw':
      valueInPx = (value / 100) * 1920; // Assuming 1920px viewport width
      break;
    case 'vh':
      valueInPx = (value / 100) * 1080; // Assuming 1080px viewport height
      break;
    default:
      valueInPx = value;
  }

  switch (toUnit) {
    case 'px':
      return valueInPx;
    case '%':
      return (valueInPx / containerSize) * 100;
    case 'vw':
      return (valueInPx / 1920) * 100;
    case 'vh':
      return (valueInPx / 1080) * 100;
    default:
      return valueInPx;
  }
}

export function validatePosition(
  position: Position,
  containerWidth = 1920,
  containerHeight = 1080
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const unit = position.unit || '%';

  if (unit === '%') {
    if (position.x < 0 || position.x > 100) {
      errors.push('X position percentage must be between 0 and 100');
    }
    if (position.y < 0 || position.y > 100) {
      errors.push('Y position percentage must be between 0 and 100');
    }
  } else if (unit === 'px') {
    if (position.x < 0 || position.x > containerWidth) {
      errors.push(`X position in pixels must be between 0 and ${containerWidth}`);
    }
    if (position.y < 0 || position.y > containerHeight) {
      errors.push(`Y position in pixels must be between 0 and ${containerHeight}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createResponsivePosition(
  position: Position,
  targetWidth: number,
  targetHeight: number,
  originalWidth = 1920,
  originalHeight = 1080
): Position {
  if (position.unit === '%') {
    return position;
  }

  const xRatio = targetWidth / originalWidth;
  const yRatio = targetHeight / originalHeight;

  return {
    ...position,
    x: position.x * xRatio,
    y: position.y * yRatio
  };
}