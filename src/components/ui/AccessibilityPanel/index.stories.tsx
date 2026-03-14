import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAccessibilityStore } from '@/stores/accessibilityStore';
import { AccessibilityPanel } from '.';

const meta = {
  title: 'UI/AccessibilityPanel',
  component: AccessibilityPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AccessibilityPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useAccessibilityStore.setState({
        shakeEnabled: true,
        shakeIntensity: 0.5,
        reducedMotion: false,
      });
      return (
        <div
          style={{ position: 'relative', width: '100vw', height: '100vh', background: '#0a0a0f' }}
        >
          <Story />
        </div>
      );
    },
  ],
};
