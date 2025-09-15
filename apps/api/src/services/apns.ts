import { SignJWT } from 'jose';
import { readFileSync } from 'fs';
import { config } from '../config';

export interface APNsPayload {
  type: 'apns';
  deviceToken: string;
  topic: string;
  env: 'sandbox' | 'production';
}

export class APNsService {
  private static getApnsUrl(env: 'sandbox' | 'production'): string {
    return env === 'production' 
      ? 'https://api.push.apple.com:443'
      : 'https://api.sandbox.push.apple.com:443';
  }

  private static async createJWT(): Promise<string> {
    if (!config.apnsAuthKeyP8) {
      throw new Error('APNS_AUTH_KEY_P8 not configured');
    }

    const privateKey = readFileSync(config.apnsAuthKeyP8, 'utf8');
    const now = Math.floor(Date.now() / 1000);

    return new SignJWT({
      iss: config.apnsTeamId,
      iat: now,
    })
      .setProtectedHeader({
        alg: 'ES256',
        kid: config.apnsKeyId,
      })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600) // 1 hour
      .sign(await import('jose').then(jose => jose.importPKCS8(privateKey, 'ES256')));
  }

  private static async sendWithToken(payload: APNsPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const jwt = await this.createJWT();
      const url = `${this.getApnsUrl(payload.env)}/3/device/${payload.deviceToken}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'apns-topic': payload.topic,
          'apns-push-type': 'background',
          'apns-priority': '5',
          'apns-expiration': '0',
        },
        body: JSON.stringify({}), // Empty payload for pass updates
      });

      if (response.status === 200) {
        return { success: true };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `APNs error ${response.status}: ${errorText}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `APNs request failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private static async sendWithCert(payload: APNsPayload): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement certificate-based authentication
    // This would require implementing HTTP/2 client with TLS certificate
    return { 
      success: false, 
      error: 'Certificate-based APNs not yet implemented' 
    };
  }

  private static async sendMock(payload: APNsPayload): Promise<{ success: boolean; error?: string }> {
    console.log('APNs Mock Mode - Would send push notification:', {
      deviceToken: payload.deviceToken,
      topic: payload.topic,
      env: payload.env,
      timestamp: new Date().toISOString(),
    });
    
    return { success: true };
  }

  /**
   * Send APNs push notification
   */
  static async sendPush(payload: APNsPayload): Promise<{ success: boolean; error?: string }> {
    switch (config.apnsMode) {
      case 'token':
        return this.sendWithToken(payload);
      case 'cert':
        return this.sendWithCert(payload);
      case 'mock':
        return this.sendMock(payload);
      default:
        return { 
          success: false, 
          error: `Unknown APNs mode: ${config.apnsMode}` 
        };
    }
  }

  /**
   * Check if APNs is properly configured
   */
  static isConfigured(): boolean {
    switch (config.apnsMode) {
      case 'token':
        return !!(config.apnsTeamId && config.apnsKeyId && config.apnsAuthKeyP8);
      case 'cert':
        return !!(config.apnsCertP12 && config.apnsCertPassword);
      case 'mock':
        return true;
      default:
        return false;
    }
  }
}
