import posthog from 'posthog-js';

export type AnalyticsProps = Record<string, unknown>;

export function isAnalyticsOptedOut(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem('optOut') === 'true';
}

export function getClientInfo(): AnalyticsProps {
  if (typeof window === 'undefined') return {};
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };

  return {
    client_user_agent: nav.userAgent,
    client_platform: nav.platform,
    client_device_memory_gb: nav.deviceMemory,
    client_hardware_concurrency: nav.hardwareConcurrency,
    client_connection_type: nav.connection?.effectiveType,
    client_screen_width: window.screen?.width,
    client_screen_height: window.screen?.height,
  };
}

export function captureEvent(eventName: string, properties: AnalyticsProps = {}) {
  if (typeof window === 'undefined') return;
  if (isAnalyticsOptedOut()) return;
  posthog.capture(eventName, properties);
}

