import * as Sentry from '@sentry/react';

/**
 * Localhost-only button from Sentry's onboarding "Verify" step. Sends a test
 * log and metric, then throws, so Sentry's dashboard shows the first event.
 */
export function SentryTestButton() {
  return (
    <button
      type="button"
      className="fixed right-4 bottom-4 z-[9999] rounded bg-red-600 px-3 py-2 text-sm text-white shadow"
      onClick={() => {
        // Send a log before throwing the error
        Sentry.logger.info('User triggered test error', {
          action: 'test_error_button_click',
        });
        // Send a test metric before throwing the error
        Sentry.metrics.count('test_counter', 1);
        throw new Error('This is your first error!');
      }}>
      Break the world
    </button>
  );
}
