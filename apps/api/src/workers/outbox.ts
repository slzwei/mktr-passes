import { UpdateService } from '../services/update.service';
import { APNsService, APNsPayload } from '../services/apns';

export class OutboxWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private intervalMs: number = 5000) {}

  /**
   * Start the outbox worker
   */
  start(): void {
    if (this.isRunning) {
      console.log('Outbox worker is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting outbox worker (interval: ${this.intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      await this.processOutbox();
    }, this.intervalMs);
  }

  /**
   * Stop the outbox worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Outbox worker is not running');
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Outbox worker stopped');
  }

  /**
   * Process pending outbox entries
   */
  private async processOutbox(): Promise<void> {
    try {
      // Reset failed entries for retry
      await UpdateService.resetFailedEntriesForRetry();

      // Get pending entries
      const entries = await UpdateService.getPendingOutboxEntries(10);

      if (entries.length === 0) {
        return; // No pending entries
      }

      console.log(`Processing ${entries.length} outbox entries`);

      // Process each entry
      for (const entry of entries) {
        await this.processEntry(entry);
      }
    } catch (error) {
      console.error('Error processing outbox:', error);
    }
  }

  /**
   * Process a single outbox entry
   */
  private async processEntry(entry: any): Promise<void> {
    try {
      const payload = entry.payload as APNsPayload;

      if (payload.type !== 'apns') {
        console.warn(`Unknown payload type: ${payload.type}`);
        await UpdateService.markOutboxFailed(entry.id, `Unknown payload type: ${payload.type}`);
        return;
      }

      // Send APNs push
      const result = await APNsService.sendPush(payload);

      if (result.success) {
        await UpdateService.markOutboxSent(entry.id);
        console.log(`Successfully sent push for entry ${entry.id}`);
      } else {
        await UpdateService.markOutboxFailed(entry.id, result.error || 'Unknown error');
        console.error(`Failed to send push for entry ${entry.id}: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await UpdateService.markOutboxFailed(entry.id, errorMessage);
      console.error(`Error processing entry ${entry.id}:`, error);
    }
  }

  /**
   * Process outbox once (for testing)
   */
  async processOnce(): Promise<void> {
    await this.processOutbox();
  }

  /**
   * Get worker health status
   */
  getHealthStatus(): { ok: boolean; running: boolean; interval: number } {
    return {
      ok: true,
      running: this.isRunning,
      interval: this.intervalMs
    };
  }
}

// Export singleton instance
export const outboxWorker = new OutboxWorker();
