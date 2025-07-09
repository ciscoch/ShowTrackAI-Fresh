/**
 * Clear ServiceFactory cache to use updated adapters
 * Run this in the app console or restart the app
 */

import { ServiceFactory } from '../src/core/services/adapters/ServiceFactory';

// Clear all service instances to force recreation with new adapters
ServiceFactory.clearInstances();

console.log('✅ ServiceFactory cache cleared - new adapters will be used');

// Initialize journal service to test
const journalService = ServiceFactory.getJournalService();
console.log('📝 Journal service initialized:', journalService.constructor.name);

export {};