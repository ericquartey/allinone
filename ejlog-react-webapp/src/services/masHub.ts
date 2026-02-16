import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { MAS_DOTNET_HUB_BASE_URL } from '../config/api';
import type { HubEntityUpdatedEvent } from '../types/masAdapter';

const MAS_HUB_BASE = MAS_DOTNET_HUB_BASE_URL.replace(/\/$/, '');
const MAS_HUB_URL = `${MAS_HUB_BASE}/hubs/data`;

type EntityUpdatedHandler = (event: HubEntityUpdatedEvent) => void;

class MasHubService {
  private connection = new HubConnectionBuilder()
    .withUrl(MAS_HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  private entityUpdatedHandlers = new Set<EntityUpdatedHandler>();

  async connect(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) return;
    await this.connection.start();
    this.connection.on('EntityUpdated', (event: HubEntityUpdatedEvent) => {
      this.entityUpdatedHandlers.forEach((handler) => handler(event));
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection.state === HubConnectionState.Disconnected) return;
    await this.connection.stop();
  }

  onEntityUpdated(handler: EntityUpdatedHandler): () => void {
    this.entityUpdatedHandlers.add(handler);
    return () => {
      this.entityUpdatedHandlers.delete(handler);
    };
  }
}

export const masHubService = new MasHubService();
