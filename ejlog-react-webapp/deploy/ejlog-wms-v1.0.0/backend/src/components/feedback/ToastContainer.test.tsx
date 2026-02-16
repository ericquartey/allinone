import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ToastProvider, useToast, TOAST_TYPES } from './ToastContainer';

// Test component that uses the toast hook
const TestComponent = ({ onToastReady }) => {
  const toast = useToast();

  React.useEffect(() => {
    if (onToastReady) {
      onToastReady(toast);
    }
  }, [toast, onToastReady]);

  return (
    <div>
      <button onClick={() => toast.success('Success message')}>Show Success</button>
      <button onClick={() => toast.error('Error message')}>Show Error</button>
      <button onClick={() => toast.warning('Warning message')}>Show Warning</button>
      <button onClick={() => toast.info('Info message')}>Show Info</button>
    </div>
  );
};

describe('ToastContainer', () => {
  // ==============================================================================
  // ToastProvider Tests
  // ==============================================================================
  describe('ToastProvider', () => {
    it('should render children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child component</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide toast context to children', () => {
      let toastContext = null;

      const onToastReady = (toast) => {
        toastContext = toast;
      };

      render(
        <ToastProvider>
          <TestComponent onToastReady={onToastReady} />
        </ToastProvider>
      );

      expect(toastContext).not.toBeNull();
      expect(toastContext).toHaveProperty('success');
      expect(toastContext).toHaveProperty('error');
      expect(toastContext).toHaveProperty('warning');
      expect(toastContext).toHaveProperty('info');
      expect(toastContext).toHaveProperty('addToast');
      expect(toastContext).toHaveProperty('removeToast');
    });

    it('should render toast container with correct attributes', () => {
      render(
        <ToastProvider>
          <div>Content</div>
        </ToastProvider>
      );

      const container = document.querySelector('[aria-live="polite"]');
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute('aria-atomic', 'true');
    });
  });

  // ==============================================================================
  // useToast Hook Tests
  // ==============================================================================
  describe('useToast Hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within ToastProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return toast methods when used inside ToastProvider', () => {
      let toastMethods = null;

      const onToastReady = (toast) => {
        toastMethods = toast;
      };

      render(
        <ToastProvider>
          <TestComponent onToastReady={onToastReady} />
        </ToastProvider>
      );

      expect(typeof toastMethods.success).toBe('function');
      expect(typeof toastMethods.error).toBe('function');
      expect(typeof toastMethods.warning).toBe('function');
      expect(typeof toastMethods.info).toBe('function');
    });
  });

  // ==============================================================================
  // Toast Display Tests
  // ==============================================================================
  describe('Toast Display', () => {
    it('should display success toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Success');
      await user.click(button);

      expect(await screen.findByText('Success message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display error toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Error');
      await user.click(button);

      expect(await screen.findByText('Error message')).toBeInTheDocument();
    });

    it('should display warning toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Warning');
      await user.click(button);

      expect(await screen.findByText('Warning message')).toBeInTheDocument();
    });

    it('should display info toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show Info');
      await user.click(button);

      expect(await screen.findByText('Info message')).toBeInTheDocument();
    });

    it('should display multiple toasts simultaneously', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));
      await user.click(screen.getByText('Show Warning'));

      expect(await screen.findByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  // ==============================================================================
  // Toast Auto-dismiss Tests
  // ==============================================================================
  describe('Toast Auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it('should auto-dismiss toast after default duration', async () => {
      const user = userEvent.setup({ delay: null });

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      expect(await screen.findByText('Success message')).toBeInTheDocument();

      // Fast-forward past default duration (5000ms) + animation (300ms)
      act(() => {
        vi.advanceTimersByTime(5300);
      });

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('should auto-dismiss toast after custom duration', async () => {
      let toastMethods = null;

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      act(() => {
        toastMethods.success('Custom duration toast', 2000);
      });

      expect(await screen.findByText('Custom duration toast')).toBeInTheDocument();

      // Fast-forward past custom duration (2000ms) + animation (300ms)
      act(() => {
        vi.advanceTimersByTime(2300);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom duration toast')).not.toBeInTheDocument();
      });
    });
  });

  // ==============================================================================
  // Toast Dismiss Tests
  // ==============================================================================
  describe('Toast Manual Dismiss', () => {
    it('should dismiss toast when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      expect(await screen.findByText('Success message')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Chiudi notifica');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });

    it('should dismiss correct toast when multiple are shown', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));
      await user.click(screen.getByText('Show Error'));

      expect(await screen.findByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      const closeButtons = screen.getAllByLabelText('Chiudi notifica');
      await user.click(closeButtons[0]); // Close first toast

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });

      // Second toast should still be visible
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  // ==============================================================================
  // Toast Types Tests
  // ==============================================================================
  describe('Toast Types', () => {
    it('should have all toast types defined', () => {
      expect(TOAST_TYPES).toEqual({
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
      });
    });

    it('should apply correct styling for success toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      const toast = await screen.findByRole('alert');
      expect(toast).toHaveClass('bg-green-50');
      expect(toast).toHaveClass('text-green-800');
    });

    it('should apply correct styling for error toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Error'));

      const toast = await screen.findByRole('alert');
      expect(toast).toHaveClass('bg-red-50');
      expect(toast).toHaveClass('text-red-800');
    });

    it('should apply correct styling for warning toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Warning'));

      const toast = await screen.findByRole('alert');
      expect(toast).toHaveClass('bg-yellow-50');
      expect(toast).toHaveClass('text-yellow-800');
    });

    it('should apply correct styling for info toast', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Info'));

      const toast = await screen.findByRole('alert');
      expect(toast).toHaveClass('bg-blue-50');
      expect(toast).toHaveClass('text-blue-800');
    });
  });

  // ==============================================================================
  // addToast and removeToast Tests
  // ==============================================================================
  describe('addToast and removeToast', () => {
    it('should return toast id when adding a toast', async () => {
      let toastMethods = null;

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      const toastId = toastMethods.addToast('Test message');
      expect(toastId).toBeDefined();
      expect(typeof toastId).toBe('number');
    });

    it('should remove toast by id', async () => {
      let toastMethods = null;

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      const toastId = toastMethods.addToast('Test message to remove');
      expect(await screen.findByText('Test message to remove')).toBeInTheDocument();

      act(() => {
        toastMethods.removeToast(toastId);
      });

      await waitFor(() => {
        expect(screen.queryByText('Test message to remove')).not.toBeInTheDocument();
      });
    });
  });

  // ==============================================================================
  // Edge Cases
  // ==============================================================================
  describe('Edge Cases', () => {
    it('should handle empty message', async () => {
      let toastMethods = null;

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      act(() => {
        toastMethods.success('');
      });

      const toast = await screen.findByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('should handle very long messages', async () => {
      let toastMethods = null;
      const longMessage = 'A'.repeat(500);

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      act(() => {
        toastMethods.info(longMessage);
      });

      expect(await screen.findByText(longMessage)).toBeInTheDocument();
    });

    it('should handle rapid toast creation', async () => {
      let toastMethods = null;

      render(
        <ToastProvider>
          <TestComponent onToastReady={(toast) => { toastMethods = toast; }} />
        </ToastProvider>
      );

      await waitFor(() => expect(toastMethods).not.toBeNull());

      act(() => {
        for (let i = 0; i < 10; i++) {
          toastMethods.success(`Toast ${i}`);
        }
      });

      await waitFor(() => {
        const toasts = screen.getAllByRole('alert');
        expect(toasts).toHaveLength(10);
      });
    });
  });

  // ==============================================================================
  // Accessibility Tests
  // ==============================================================================
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      const container = document.querySelector('[aria-live="polite"]');
      expect(container).toHaveAttribute('aria-atomic', 'true');

      const toast = await screen.findByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('should have accessible close button', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Show Success'));

      const closeButton = await screen.findByLabelText('Chiudi notifica');
      expect(closeButton).toBeInTheDocument();
    });
  });
});
