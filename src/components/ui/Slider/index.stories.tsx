import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '.';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Volume',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.05,
    onChange: () => {},
    formatValue: (value) => `${(value * 100).toFixed(0)}%`,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
};
