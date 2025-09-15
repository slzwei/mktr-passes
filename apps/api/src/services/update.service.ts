import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UpdateService {
  /**
   * Bump the update tag for a pass (monotonically increasing)
   */
  static async bumpPassUpdateTag(passId: string): Promise<string> {
    const pass = await prisma.pass.findUnique({
      where: { id: passId },
      select: { lastUpdateTag: true },
    });

    if (!pass) {
      throw new Error(`Pass with id ${passId} not found`);
    }

    // Convert current tag to number, increment, and convert back to string
    const currentTag = parseInt(pass.lastUpdateTag) || 0;
    const newTag = (currentTag + 1).toString();

    await prisma.pass.update({
      where: { id: passId },
      data: {
        lastUpdateTag: newTag,
        lastUpdatedAt: new Date(),
      },
    });

    return newTag;
  }

  /**
   * Enqueue push notifications for all devices registered to a pass
   */
  static async enqueuePassPushes(passId: string): Promise<void> {
    const pass = await prisma.pass.findUnique({
      where: { id: passId },
      include: {
        registrations: {
          include: {
            device: true,
          },
        },
      },
    });

    if (!pass) {
      throw new Error(`Pass with id ${passId} not found`);
    }

    // Create outbox entries for each registered device
    const outboxEntries = pass.registrations.map((registration: any) => ({
      passId,
      payload: {
        type: 'apns',
        deviceToken: registration.device.pushToken,
        topic: process.env.APNS_TOPIC || 'pass.your.bundle.id',
        env: process.env.APNS_ENV || 'sandbox',
      },
      status: 'pending',
      attempts: 0,
    }));

    if (outboxEntries.length > 0) {
      await prisma.updateOutbox.createMany({
        data: outboxEntries,
      });
    }
  }

  /**
   * Get pending outbox entries for processing
   */
  static async getPendingOutboxEntries(limit: number = 10) {
    return prisma.updateOutbox.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Mark outbox entry as sent
   */
  static async markOutboxSent(id: string): Promise<void> {
    await prisma.updateOutbox.update({
      where: { id },
      data: {
        status: 'sent',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark outbox entry as failed
   */
  static async markOutboxFailed(id: string, error: string): Promise<void> {
    await prisma.updateOutbox.update({
      where: { id },
      data: {
        status: 'failed',
        lastError: error,
        attempts: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Reset failed entries for retry (with exponential backoff)
   */
  static async resetFailedEntriesForRetry(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await prisma.updateOutbox.updateMany({
      where: {
        status: 'failed',
        attempts: {
          lt: 3, // Max 3 attempts
        },
        updatedAt: {
          lt: oneHourAgo, // Wait at least 1 hour before retry
        },
      },
      data: {
        status: 'pending',
        lastError: null,
      },
    });
  }
}
