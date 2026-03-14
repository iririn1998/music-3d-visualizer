import { Color } from 'three';

export const STORYBOOK_TOKENS = {
  colors: {
    background: {
      primary: '#0a0a0f',
    },
  },
} as const;

export interface ColorPalette {
  primary: Color;
  secondary: Color;
  accent: Color;
}

export type ColorPreset = 'neonPink' | 'electricBlue' | 'cyberLime' | 'solarFlare';

export const COLOR_PRESETS: Record<ColorPreset, ColorPalette> = {
  neonPink: {
    primary: new Color('#ff44aa'),
    secondary: new Color('#ff66cc'),
    accent: new Color('#cc33ff'),
  },
  electricBlue: {
    primary: new Color('#4488ff'),
    secondary: new Color('#66ccff'),
    accent: new Color('#33ccff'),
  },
  cyberLime: {
    primary: new Color('#44ff88'),
    secondary: new Color('#88ff44'),
    accent: new Color('#ccff33'),
  },
  solarFlare: {
    primary: new Color('#ff8844'),
    secondary: new Color('#ffaa33'),
    accent: new Color('#ff4433'),
  },
};
