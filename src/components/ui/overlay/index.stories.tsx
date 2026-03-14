import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAccessibilityStore } from '@/stores/accessibilityStore';
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
    onStop: () => {},
  },
  decorators: [
    (Story) => {
      useAudioStore.setState({ playbackState: 'idle', mode: 'core', sensitivity: 1.0 });
      useThemeStore.setState({ preset: 'neonPink' });
      useAccessibilityStore.setState({
        shakeEnabled: true,
        shakeIntensity: 0.5,
        reducedMotion: false,
      });
      useErrorStore.setState({ errors: [] });
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
