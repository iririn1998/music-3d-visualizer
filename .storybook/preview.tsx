import React from 'react';
import type { Preview } from '@storybook/react-vite';

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
      <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
