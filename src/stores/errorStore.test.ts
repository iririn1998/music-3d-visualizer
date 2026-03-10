import { describe, it, expect, beforeEach } from 'vitest';
import { useErrorStore } from './errorStore';

describe('errorStore', () => {
  beforeEach(() => {
    useErrorStore.setState({ errors: [] });
  });

  it('starts with no errors', () => {
    expect(useErrorStore.getState().errors).toEqual([]);
  });

  it('can push an error', () => {
    useErrorStore.getState().pushError({
      message: 'Test error',
      type: 'error',
      dismissible: true,
    });

    const errors = useErrorStore.getState().errors;
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Test error');
    expect(errors[0].type).toBe('error');
    expect(errors[0].dismissible).toBe(true);
    expect(errors[0].id).toBeDefined();
  });

  it('can push multiple errors', () => {
    useErrorStore.getState().pushError({
      message: 'Error 1',
      type: 'error',
      dismissible: true,
    });
    useErrorStore.getState().pushError({
      message: 'Warning 1',
      type: 'warning',
      dismissible: false,
    });

    const errors = useErrorStore.getState().errors;
    expect(errors).toHaveLength(2);
    expect(errors[0].id).not.toBe(errors[1].id);
  });

  it('can dismiss an error by id', () => {
    useErrorStore.getState().pushError({
      message: 'Error 1',
      type: 'error',
      dismissible: true,
    });
    useErrorStore.getState().pushError({
      message: 'Error 2',
      type: 'error',
      dismissible: true,
    });

    const firstId = useErrorStore.getState().errors[0].id;
    useErrorStore.getState().dismissError(firstId);

    const errors = useErrorStore.getState().errors;
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Error 2');
  });

  it('can clear all errors', () => {
    useErrorStore.getState().pushError({
      message: 'Error',
      type: 'error',
      dismissible: true,
    });
    useErrorStore.getState().pushError({
      message: 'Warning',
      type: 'warning',
      dismissible: false,
    });

    useErrorStore.getState().clearErrors();
    expect(useErrorStore.getState().errors).toEqual([]);
  });
});
