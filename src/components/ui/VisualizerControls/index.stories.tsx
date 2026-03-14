import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAudioStore } from '@/stores/audioStore';
import { useThemeStore } from '@/stores/themeStore';
import { VisualizerControls } from '.';

const meta = {
  title: 'UI/VisualizerControls',
  component: VisualizerControls,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VisualizerControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useAudioStore.setState({ mode: 'core', sensitivity: 1.0 });
      useThemeStore.setState({ preset: 'neonPink' });
      return <Story />;
    },
  ],
};
