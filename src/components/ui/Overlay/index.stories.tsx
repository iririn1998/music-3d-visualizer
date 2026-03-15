import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAudioStore } from '@/stores/audioStore';
import { useErrorStore } from '@/stores/errorStore';
import { useThemeStore } from '@/stores/themeStore';
import { Overlay } from '.';

const meta = {
  title: 'UI/Overlay',
  component: Overlay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onLoadFile: () => {},
    onPlay: () => {},
    onStop: () => {},
  },
  decorators: [
    (Story) => {
      useAudioStore.setState({ playbackState: 'idle', mode: 'core', sensitivity: 1.0 });
      useThemeStore.setState({ preset: 'neonPink' });
      useErrorStore.setState({ errors: [] });
      return <Story />;
    },
  ],
};
