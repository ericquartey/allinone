import { useEffect } from 'react';
import { masHubService } from '../services/masHub';
import type { HubEntityUpdatedEvent } from '../types/masAdapter';

export function useMasHub(onEntityUpdated?: (event: HubEntityUpdatedEvent) => void): void {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connect = async () => {
      try {
        await masHubService.connect();
        if (onEntityUpdated) {
          unsubscribe = masHubService.onEntityUpdated(onEntityUpdated);
        }
      } catch (error) {
        console.error('[MAS HUB] Connessione fallita:', error);
      }
    };

    connect();

    return () => {
      if (unsubscribe) unsubscribe();
      masHubService.disconnect();
    };
  }, [onEntityUpdated]);
}
