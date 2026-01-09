/**
 * Toast Component Tests
 *
 * Tests for the Toast notification component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Toast, ToastProvider, useToast } from '../Toast';

describe('Toast Component', () => {
  it('should render success toast', () => {
    render(
      <Toast
        type="success"
        message="Operation successful"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render error toast', () => {
    render(
      <Toast
        type="error"
        message="Operation failed"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Operation failed')).toBeInTheDocument();
  });

  it('should render info toast', () => {
    render(
      <Toast
        type="info"
        message="Information message"
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Information message')).toBeInTheDocument();
  });

  it('should call onClose after duration', async () => {
    const onClose = vi.fn();
    render(
      <Toast
        type="success"
        message="Test message"
        onClose={onClose}
        duration={100}
      />
    );

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should not auto-dismiss if duration is 0', async () => {
    const onClose = vi.fn();
    render(
      <Toast
        type="success"
        message="Test message"
        onClose={onClose}
        duration={0}
      />
    );

    // Wait a bit and ensure onClose wasn't called
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ToastProvider / useToast', () => {
  it('should provide toast context', () => {
    const TestComponent = () => {
      const toast = useToast();
      return (
        <div>
          <button onClick={() => toast.success('Success!')}>Show Success</button>
          <button onClick={() => toast.error('Error!')}>Show Error</button>
          <button onClick={() => toast.info('Info!')}>Show Info</button>
        </div>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Success')).toBeInTheDocument();
    expect(screen.getByText('Show Error')).toBeInTheDocument();
    expect(screen.getByText('Show Info')).toBeInTheDocument();
  });

  it('should show toast when show is called', async () => {
    const TestComponent = () => {
      const toast = useToast();
      return (
        <button onClick={() => toast.show('success', 'Custom message')}>Show Toast</button>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText('Show Toast');
    button.click();

    await waitFor(() => {
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });
});
