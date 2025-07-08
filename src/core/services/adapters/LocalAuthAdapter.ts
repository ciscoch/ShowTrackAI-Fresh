/**
 * Local Auth Adapter for ShowTrackAI
 * Placeholder implementation for authentication management
 */

import { IAuthService } from '../interfaces/ServiceInterfaces';

export class LocalAuthAdapter implements IAuthService {
  async signIn(email: string, password: string): Promise<any> {
    return { user: { email } };
  }

  async signUp(email: string, password: string, metadata?: any): Promise<any> {
    return { user: { email } };
  }

  async signOut(): Promise<void> {
    // Placeholder
  }

  async getCurrentUser(): Promise<any | null> {
    return null;
  }

  async updatePassword(newPassword: string): Promise<void> {
    // Placeholder
  }

  async resetPassword(email: string): Promise<void> {
    // Placeholder
  }

  async verifyEmail(token: string): Promise<void> {
    // Placeholder
  }
}