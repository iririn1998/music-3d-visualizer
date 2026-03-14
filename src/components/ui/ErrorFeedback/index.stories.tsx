import type { Meta, StoryObj } from '@storybook/react-vite';
import { useErrorStore } from '@/stores/errorStore';
import { ErrorFeedback } from '.';

const meta = {
  title: 'UI/ErrorFeedback',
  component: ErrorFeedback,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorFeedback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useErrorStore.setState({
        errors: [
          {
            id: '1',
            message: 'ファイル形式が対応していません。',
            type: 'error',
            dismissible: true,
          },
          {
            id: '2',
            message: 'パフォーマンスが低下しています。',
            type: 'warning',
            dismissible: false,
          },
        ],
      });
      return <Story />;
    },
  ],
};
