import type { FC } from 'react';
import styles from './styles.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const Slider: FC<SliderProps> = ({ label, value, min, max, step, onChange, formatValue }) => {
  const displayValue = formatValue ? formatValue(value) : value.toFixed(2);

  return (
    <label className={styles.wrapper}>
      <span className={styles.labelRow}>
        <span>{label}</span>
        <span className={styles.value}>{displayValue}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={styles.input}
      />
    </label>
  );
};

export { Slider };
