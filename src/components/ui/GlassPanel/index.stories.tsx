import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlassPanel } from '.';

const meta = {
  title: 'UI/GlassPanel',
  component: GlassPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GlassPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <p style={{ color: 'white', padding: '8px' }}>GlassPanel の中身</p>,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}>
        <Story />
      </div>
    ),
  ],
};
