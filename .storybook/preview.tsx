import React from 'react';
import type { Preview } from '@storybook/react-vite';
import { STORYBOOK_TOKENS } from '../src/types/theme';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          background: STORYBOOK_TOKENS.colors.background.primary,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
