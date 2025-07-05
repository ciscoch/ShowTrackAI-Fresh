import { qrCodeService } from '../../../core/services/QRCodeService';
import { ObserverPermissions } from '../../../core/models/QRCode';

export class DemoAccessGenerator {
  /**
   * Generate demo observer access for testing
   */
  static async generateDemoAccess(): Promise<string> {
    try {
      // Use the demo student profile ID from the existing demo profiles
      const demoStudentId = 'freemium_student'; // This matches the ProfileStore demo
      
      const demoPermissions: ObserverPermissions = {
        viewAnimals: true,
        viewJournal: true,
        viewFinancials: true,
        viewHealthRecords: true,
        viewProgress: true,
        receiveNotifications: true,
        viewCompetencies: true,
      };

      // Generate observer access
      const observerAccess = await qrCodeService.generateObserverAccess(
        demoStudentId,
        'parent',
        'Demo Parent',
        'parent@demo.com',
        demoPermissions,
        30 // 30 days expiration
      );

      // Generate QR code data
      const qrCodeData = await qrCodeService.generateQRCodeData(demoStudentId, observerAccess);
      
      // Return the access token for easy testing
      return observerAccess.accessToken;
    } catch (error) {
      console.error('Failed to generate demo access:', error);
      throw error;
    }
  }

  /**
   * Generate a demo QR code JSON string for testing
   */
  static async generateDemoQRCodeJSON(): Promise<string> {
    try {
      const accessToken = await this.generateDemoAccess();
      
      const qrCodeJSON = JSON.stringify({
        accessToken: accessToken,
        studentName: "Alex Johnson",
        projectName: "Alex Johnson's FFA Project",
      });
      
      return qrCodeJSON;
    } catch (error) {
      console.error('Failed to generate demo QR code JSON:', error);
      throw error;
    }
  }

  /**
   * Create sample data for the demo student to make the observer dashboard interesting
   */
  static async createDemoStudentData(): Promise<void> {
    try {
      // This would populate the demo student with sample animals, journal entries, etc.
      // For now, we'll rely on the existing demo data from ProfileStore
      console.log('Demo student data created (using existing ProfileStore demo data)');
    } catch (error) {
      console.error('Failed to create demo student data:', error);
    }
  }

  /**
   * Get a ready-to-use demo access token for quick testing
   */
  static getQuickDemoToken(): string {
    // Return a pre-generated token format that matches our service
    return 'qr_1704067200000_demo123456789';
  }

  /**
   * Get demo QR code JSON data for testing
   */
  static getQuickDemoQRCodeJSON(): string {
    return JSON.stringify({
      accessToken: this.getQuickDemoToken(),
      studentName: "Alex Johnson",
      projectName: "Alex Johnson's FFA Project",
    });
  }
}