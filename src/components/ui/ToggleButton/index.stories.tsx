import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton } from '.';

const meta = {
  title: 'UI/ToggleButton',
  component: ToggleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    active: false,
    onClick: () => {},
    children: 'Pulsing',
    title: 'Pulsing Core',
  },
};
