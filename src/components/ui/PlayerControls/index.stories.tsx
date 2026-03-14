import type { Meta, StoryObj } from '@storybook/react-vite';
import { useAudioStore } from '@/stores/audioStore';
import { PlayerControls } from '.';

const meta = {
  title: 'UI/PlayerControls',
  component: PlayerControls,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PlayerControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onLoadFile: () => {},
    onStop: () => {},
  },
  decorators: [
    (Story) => {
      useAudioStore.setState({ playbackState: 'idle' });
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
