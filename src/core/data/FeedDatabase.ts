import { FeedItem } from '../models/Journal';

export interface FeedProduct {
  id: string;
  name: string;
  brand: string;
  category: 'grain' | 'pellets' | 'textured' | 'supplement' | 'mineral' | 'hay' | 'other';
  species: string[];
  proteinLevel?: string;
  description: string;
  isHay: boolean;
  hayType?: string;
}

export const FEED_DATABASE: FeedProduct[] = [
  // Purina Feed Products
  {
    id: 'purina_wind_rain_storm',
    name: 'Wind and Rain Storm All Season',
    brand: 'Purina',
    category: 'mineral',
    species: ['cattle'],
    description: 'Weather-resistant mineral supplement with balanced macro/micro minerals',
    isHay: false
  },
  {
    id: 'purina_natures_match_starter',
    name: "Nature's Match Starter-Grower",
    brand: 'Purina',
    category: 'pellets',
    species: ['pigs'],
    proteinLevel: '18%',
    description: 'Pelleted feed for 25-100 lb pigs',
    isHay: false
  },
  {
    id: 'purina_natures_match_finisher',
    name: "Nature's Match Grower-Finisher",
    brand: 'Purina',
    category: 'pellets',
    species: ['pigs'],
    proteinLevel: '16%',
    description: 'Pelleted feed for 100-250 lb pigs',
    isHay: false
  },
  {
    id: 'purina_goat_chow',
    name: 'Goat Chow',
    brand: 'Purina',
    category: 'textured',
    species: ['goats'],
    proteinLevel: '16%',
    description: 'Textured feed for all life stages',
    isHay: false
  },
  {
    id: 'purina_dairy_parlor_16',
    name: 'Dairy Parlor 16',
    brand: 'Purina',
    category: 'pellets',
    species: ['goats'],
    proteinLevel: '16%',
    description: 'For lactating dairy goats',
    isHay: false
  },
  {
    id: 'purina_dairy_parlor_18',
    name: 'Dairy Parlor 18',
    brand: 'Purina',
    category: 'pellets',
    species: ['goats'],
    proteinLevel: '18%',
    description: 'For lactating dairy goats',
    isHay: false
  },
  {
    id: 'purina_lamb_grower',
    name: 'Lamb Grower',
    brand: 'Purina',
    category: 'pellets',
    species: ['sheep'],
    proteinLevel: '14%',
    description: 'Complete pelleted feed for growing lambs',
    isHay: false
  },
  {
    id: 'purina_sheep_balancer',
    name: 'Sheep Balancer',
    brand: 'Purina',
    category: 'supplement',
    species: ['sheep'],
    proteinLevel: '36%',
    description: 'Protein supplement for all stages',
    isHay: false
  },
  {
    id: 'purina_high_octane_ultra_full',
    name: 'High Octane Ultra Full',
    brand: 'Purina',
    category: 'supplement',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: 'Show supplement for lower body fill',
    isHay: false
  },
  {
    id: 'purina_high_octane_heavy_weight',
    name: 'High Octane Heavy Weight',
    brand: 'Purina',
    category: 'supplement',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: '70% fat for energy and bloom',
    isHay: false
  },

  // Kent Feed Products
  {
    id: 'kent_show_cattle_elevate',
    name: 'Show Cattle Elevate',
    brand: 'Kent',
    category: 'textured',
    species: ['cattle'],
    description: 'Complete ration for developing show cattle 500-700 lbs',
    isHay: false
  },
  {
    id: 'kent_show_cattle_red_line',
    name: 'Show Cattle Red Line',
    brand: 'Kent',
    category: 'textured',
    species: ['cattle'],
    description: 'High energy finishing feed for cattle over 700 lbs',
    isHay: false
  },
  {
    id: 'kent_show_cattle_encore',
    name: 'Show Cattle Encore',
    brand: 'Kent',
    category: 'textured',
    species: ['cattle'],
    description: 'High fiber feed for extended show season',
    isHay: false
  },
  {
    id: 'kent_baby_beef_34',
    name: 'Baby Beef 34%',
    brand: 'Kent',
    category: 'supplement',
    species: ['cattle'],
    proteinLevel: '34%',
    description: 'High-quality protein supplement for all cattle classes',
    isHay: false
  },
  {
    id: 'kent_show_pig_delta_18',
    name: 'Show Pig Delta 18 BMD30 ClariFly',
    brand: 'Kent',
    category: 'pellets',
    species: ['pigs'],
    proteinLevel: '18%',
    description: 'Complete show feed with moderate lysine and fat',
    isHay: false
  },
  {
    id: 'kent_show_pig_omega_16',
    name: 'Show Pig Omega 16 BMD30 ClariFly',
    brand: 'Kent',
    category: 'pellets',
    species: ['pigs'],
    proteinLevel: '16%',
    description: 'Meal form for sustained muscling without excess fat',
    isHay: false
  },
  {
    id: 'kent_show_pig_big_pig_14',
    name: 'Show Pig Big Pig 14 BMD30 ClariFly',
    brand: 'Kent',
    category: 'pellets',
    species: ['pigs'],
    proteinLevel: '14%',
    description: 'Lower protein option for specific genetic lines',
    isHay: false
  },
  {
    id: 'kent_show_goat_full_bore_20r',
    name: 'Show Goat Full Bore 20R',
    brand: 'Kent',
    category: 'pellets',
    species: ['goats'],
    proteinLevel: '20%',
    description: 'Medicated pelleted feed with Rumensin for coccidiosis prevention',
    isHay: false
  },
  {
    id: 'kent_show_goat_full_bore_he_20r',
    name: 'Show Goat Full Bore HE 20R',
    brand: 'Kent',
    category: 'pellets',
    species: ['goats'],
    proteinLevel: '20%',
    description: 'High energy version for additional performance',
    isHay: false
  },
  {
    id: 'kent_show_lamb_gale_force_18dq',
    name: 'Show Lamb Gale Force 18DQ',
    brand: 'Kent',
    category: 'textured',
    species: ['sheep'],
    proteinLevel: '18%',
    description: 'Medicated textured feed for growth and muscle expression',
    isHay: false
  },
  {
    id: 'kent_show_lamb_gale_force_he_18dq',
    name: 'Show Lamb Gale Force HE 18DQ',
    brand: 'Kent',
    category: 'textured',
    species: ['sheep'],
    proteinLevel: '18%',
    description: 'High energy version for lambs on exercise programs',
    isHay: false
  },
  {
    id: 'kent_show_lamb_breeze_45dq',
    name: 'Show Lamb Breeze 45DQ',
    brand: 'Kent',
    category: 'supplement',
    species: ['sheep'],
    description: 'Starter and conditioning feed for young lambs',
    isHay: false
  },

  // Jacoby Feed Products
  {
    id: 'jacoby_red_tag_sheep_goat',
    name: 'Red Tag Sheep and Goat Developer',
    brand: 'Jacoby',
    category: 'pellets',
    species: ['sheep', 'goats'],
    description: 'Start to finish ration with Decoquinate for coccidiosis prevention',
    isHay: false
  },
  {
    id: 'jacoby_pink_tag_sheep_goat',
    name: 'Pink Tag Sheep and Goat Feed',
    brand: 'Jacoby',
    category: 'textured',
    species: ['sheep', 'goats'],
    description: 'Higher energy finishing feed with added barley',
    isHay: false
  },
  {
    id: 'jacoby_alpha_goat_show',
    name: 'Alpha Goat Show Feed',
    brand: 'Jacoby',
    category: 'pellets',
    species: ['goats'],
    proteinLevel: '13.5%',
    description: 'Medicated with Monensin - DO NOT FEED TO SHEEP',
    isHay: false
  },
  {
    id: 'jacoby_alpha_sheep_show',
    name: 'Alpha Sheep Show Feed',
    brand: 'Jacoby',
    category: 'pellets',
    species: ['sheep'],
    description: 'Growing sheep show feed',
    isHay: false
  },
  {
    id: 'jacoby_showmans_12_sheep',
    name: "Showman's 12% Medicated Growing Sheep",
    brand: 'Jacoby',
    category: 'pellets',
    species: ['sheep'],
    proteinLevel: '12%',
    description: 'Coccidiosis prevention for young sheep',
    isHay: false
  },

  // ShowBoss Supplements (Kent)
  {
    id: 'showboss_biomend',
    name: 'ShowBoss Biomend',
    brand: 'Kent',
    category: 'supplement',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: 'Gut health supplement with prebiotic and organic trace minerals',
    isHay: false
  },
  {
    id: 'showboss_final_drive',
    name: 'ShowBoss Final Drive',
    brand: 'Kent',
    category: 'supplement',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: 'High-protein supplement for muscle building',
    isHay: false
  },
  {
    id: 'showboss_fit_n_finish',
    name: 'ShowBoss Fit N Finish',
    brand: 'Kent',
    category: 'supplement',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    proteinLevel: '52%',
    description: 'Ultra-high protein for rapid appearance changes',
    isHay: false
  },
  {
    id: 'showboss_contour',
    name: 'ShowBoss Contour',
    brand: 'Kent',
    category: 'supplement',
    species: ['pigs'],
    description: 'High fat, high fiber for fuller appearance',
    isHay: false
  },

  // Common Grains and Hay
  {
    id: 'corn_whole',
    name: 'Whole Corn',
    brand: 'Local',
    category: 'grain',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: 'Whole kernel corn',
    isHay: false
  },
  {
    id: 'corn_cracked',
    name: 'Cracked Corn',
    brand: 'Local',
    category: 'grain',
    species: ['cattle', 'pigs', 'sheep', 'goats'],
    description: 'Cracked corn for easier digestion',
    isHay: false
  },
  {
    id: 'oats_whole',
    name: 'Whole Oats',
    brand: 'Local',
    category: 'grain',
    species: ['cattle', 'sheep', 'goats'],
    description: 'Whole oat grains',
    isHay: false
  },
  {
    id: 'barley',
    name: 'Barley',
    brand: 'Local',
    category: 'grain',
    species: ['cattle', 'sheep', 'goats'],
    description: 'Barley grain',
    isHay: false
  },
  {
    id: 'alfalfa_hay',
    name: 'Alfalfa Hay',
    brand: 'Local',
    category: 'hay',
    species: ['cattle', 'sheep', 'goats'],
    description: 'Premium alfalfa hay',
    isHay: true,
    hayType: 'alfalfa'
  },
  {
    id: 'timothy_hay',
    name: 'Timothy Hay',
    brand: 'Local',
    category: 'hay',
    species: ['cattle', 'sheep', 'goats'],
    description: 'Timothy grass hay',
    isHay: true,
    hayType: 'timothy'
  },
  {
    id: 'mixed_hay',
    name: 'Mixed Grass Hay',
    brand: 'Local',
    category: 'hay',
    species: ['cattle', 'sheep', 'goats'],
    description: 'Mixed grass hay',
    isHay: true,
    hayType: 'mixed_grass'
  }
];

export const FEED_BRANDS = [
  'Purina',
  'Kent',
  'Jacoby',
  'Southern States',
  'Nutrena',
  'Blue Seal', 
  'ADM Alliance',
  'Cargill',
  'MFA',
  'Pro-Pac',
  'Buckeye',
  'Triple Crown',
  'Standlee',
  'New Country Organics',
  'Manna Pro',
  'Sweet Feed Co.',
  'Bryant Premium',
  'Sunglo',
  'County Feeds',
  'Local',
  'Other'
];

export const FEED_UNITS = [
  { label: 'Pounds (lbs)', value: 'lbs' },
  { label: 'Kilograms (kg)', value: 'kg' },
  { label: 'Bales', value: 'bales' },
  { label: 'Flakes', value: 'flakes' },
  { label: 'Scoops', value: 'scoops' },
  { label: 'Ounces (oz)', value: 'oz' },
  { label: 'Cups', value: 'cups' }
];

export function getFeedsByBrand(brand: string): FeedProduct[] {
  return FEED_DATABASE.filter(feed => feed.brand === brand);
}

export function getFeedsBySpecies(species: string): FeedProduct[] {
  return FEED_DATABASE.filter(feed => feed.species.includes(species));
}

export function getFeedsByCategory(category: string): FeedProduct[] {
  return FEED_DATABASE.filter(feed => feed.category === category);
}

export function getFeedById(id: string): FeedProduct | undefined {
  return FEED_DATABASE.find(feed => feed.id === id);
}