import { Journal } from '../models/Journal';
import { Animal } from '../models/Animal';

class DemoDataService {
  
  generateDemoJournalEntries(profileType: 'freemium_student' | 'elite_student'): Omit<Journal, 'id' | 'createdAt' | 'updatedAt'>[] {
    const baseEntries = [
      {
        title: 'Morning Animal Check',
        description: 'Performed daily health assessment of all animals. Checked water levels, feed quality, and overall behavior patterns.',
        category: 'Health Check',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        duration: 45,
        aetSkills: ['livestock_health', 'observation', 'record_keeping'],
        notes: 'All animals appear healthy. Noticed slight lameness in cattle #A003 - scheduled vet check.',
        weather: 'Clear, 68°F',
        location: 'Main barn and pasture',
        objectives: ['Animal Husbandry Skills', 'Problem Solving'],
        learningOutcomes: ['Improved observation skills', 'Early disease detection'],
        challenges: 'Difficult to catch cattle #A003 for closer inspection',
        improvements: 'Need to work on animal handling techniques',
        userId: 'demo-user'
      },
      {
        title: 'Feed Preparation and Distribution',
        description: 'Mixed custom feed blend based on nutritional requirements. Distributed feed to all animals according to feeding schedule.',
        category: 'Feeding',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        duration: 90,
        aetSkills: ['nutrition', 'feed_management', 'time_management'],
        notes: 'Adjusted protein content for growing cattle. Sheep are responding well to new hay mix.',
        weather: 'Overcast, 72°F',
        location: 'Feed room and pastures',
        objectives: ['Animal Husbandry Skills', 'Time Management'],
        learningOutcomes: ['Better understanding of nutritional needs', 'Improved efficiency'],
        challenges: 'Ran out of mineral supplement mid-feeding',
        improvements: 'Better inventory management needed',
        userId: 'demo-user'
      },
      {
        title: 'Equipment Maintenance',
        description: 'Cleaned and maintained water systems, repaired fence section, and serviced feed mixer.',
        category: 'Equipment Maintenance',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        duration: 120,
        aetSkills: ['mechanical_skills', 'maintenance', 'safety'],
        notes: 'Replaced water valve in east pasture. Feed mixer needs new belts next month.',
        weather: 'Sunny, 75°F',
        location: 'Various farm locations',
        objectives: ['Technology Use', 'Problem Solving', 'Safety Practices'],
        learningOutcomes: ['Basic plumbing skills', 'Preventive maintenance importance'],
        challenges: 'Didn\'t have the right tools initially',
        improvements: 'Create better tool organization system',
        userId: 'demo-user'
      }
    ];

    if (profileType === 'elite_student') {
      // Add more advanced entries for Elite students
      return [
        ...baseEntries,
        {
          title: 'Breeding Program Planning',
          description: 'Analyzed genetic data and performance records to plan next breeding season. Used AI to predict offspring characteristics.',
          category: 'Breeding',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          duration: 180,
          aetSkills: ['genetics', 'data_analysis', 'ai_technology', 'planning'],
          notes: 'Identified optimal breeding pairs based on genetic diversity and performance metrics.',
          weather: 'Indoor work',
          location: 'Office/computer lab',
          objectives: ['Business Management', 'Technology Use', 'Critical Thinking'],
          learningOutcomes: ['Advanced genetics understanding', 'AI tool proficiency'],
          challenges: 'Complex genetic algorithms were difficult to interpret',
          improvements: 'Need more training on genetic software',
          userId: 'demo-user'
        },
        {
          title: 'Market Analysis and Financial Planning',
          description: 'Researched current market prices, analyzed feed costs, and projected profitability for next quarter.',
          category: 'Market Research',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          duration: 150,
          aetSkills: ['market_analysis', 'financial_planning', 'business_strategy'],
          notes: 'Identified opportunity to direct-market premium beef to local restaurants.',
          weather: 'Indoor work',
          location: 'Office',
          objectives: ['Business Management', 'Financial Literacy', 'Communication'],
          learningOutcomes: ['Market timing strategies', 'Value-added marketing'],
          challenges: 'Difficult to predict feed price volatility',
          improvements: 'Develop relationships with multiple feed suppliers',
          userId: 'demo-user'
        },
        {
          title: 'Competition Preparation - County Fair',
          description: 'Trained show cattle, practiced showmanship techniques, and prepared competition documentation.',
          category: 'Competition Prep',
          date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          duration: 240,
          aetSkills: ['showmanship', 'animal_training', 'presentation', 'documentation'],
          notes: 'Cattle are responding well to halter training. Need to work on standing positions.',
          weather: 'Sunny, 78°F',
          location: 'Show ring and barn',
          objectives: ['Leadership', 'Communication', 'Quality Assurance'],
          learningOutcomes: ['Public speaking confidence', 'Competition standards'],
          challenges: 'Nervous about speaking to judges',
          improvements: 'Practice presentation skills with family',
          userId: 'demo-user'
        }
      ];
    }

    return baseEntries;
  }

  generateDemoAnimals(profileType: 'freemium_student' | 'elite_student'): Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>[] {
    const baseAnimals = [
      {
        name: 'Bessie',
        species: 'Cattle',
        breed: 'Angus',
        tagNumber: 'A001',
        projectType: 'Market',
        birthDate: new Date('2023-03-15'),
        gender: 'Female',
        color: 'Black',
        weight: 850,
        healthStatus: 'Healthy',
        vaccinations: ['BVD', 'IBR', 'PI3'],
        notes: 'Champion bloodline, excellent temperament',
        photos: [],
        userId: 'demo-user'
      },
      {
        name: 'Thunder',
        species: 'Cattle',
        breed: 'Hereford',
        tagNumber: 'A002',
        projectType: 'Breeding',
        birthDate: new Date('2022-05-20'),
        gender: 'Male',
        color: 'Red with white face',
        weight: 1200,
        healthStatus: 'Healthy',
        vaccinations: ['BVD', 'IBR', 'PI3', 'Clostridial'],
        notes: 'Excellent sire potential, calm disposition',
        photos: [],
        userId: 'demo-user'
      },
      {
        name: 'Woolly',
        species: 'Sheep',
        breed: 'Suffolk',
        tagNumber: 'S001',
        projectType: 'Market',
        birthDate: new Date('2024-01-10'),
        gender: 'Female',
        color: 'Black face, white body',
        weight: 120,
        healthStatus: 'Healthy',
        vaccinations: ['CDT'],
        notes: 'Fast growing, good muscle development',
        photos: [],
        userId: 'demo-user'
      }
    ];

    if (profileType === 'elite_student') {
      // Add more animals for Elite students (unlimited)
      return [
        ...baseAnimals,
        {
          name: 'Daisy',
          species: 'Cattle',
          breed: 'Holstein',
          tagNumber: 'A003',
          projectType: 'Dairy',
          birthDate: new Date('2022-08-12'),
          gender: 'Female',
          color: 'Black and white',
          weight: 1100,
          healthStatus: 'Monitoring',
          vaccinations: ['BVD', 'IBR', 'PI3', 'Lepto'],
          notes: 'High milk production, slight lameness detected',
          photos: [],
          userId: 'demo-user'
        },
        {
          name: 'Porky',
          species: 'Swine',
          breed: 'Yorkshire',
          tagNumber: 'P001',
          projectType: 'Market',
          birthDate: new Date('2024-02-28'),
          gender: 'Barrow',
          color: 'White',
          weight: 180,
          healthStatus: 'Healthy',
          vaccinations: ['Mycoplasma', 'Circovirus'],
          notes: 'Excellent feed conversion, ready for market soon',
          photos: [],
          userId: 'demo-user'
        },
        {
          name: 'Bucky',
          species: 'Goats',
          breed: 'Boer',
          tagNumber: 'G001',
          projectType: 'Breeding',
          birthDate: new Date('2023-04-05'),
          gender: 'Male',
          color: 'Red and white',
          weight: 160,
          healthStatus: 'Healthy',
          vaccinations: ['CDT', 'Caseous lymphadenitis'],
          notes: 'Excellent conformation, proven sire',
          photos: [],
          userId: 'demo-user'
        }
      ];
    }

    return baseAnimals;
  }

  async populateDemoData(profileType: 'freemium_student' | 'elite_student') {
    // This would be called after profile creation to populate demo data
    console.log(`🎮 Populating demo data for ${profileType}`);
    
    // Note: In a real implementation, we would use the stores directly
    // For now, this serves as a data template that could be used by the stores
    
    const demoJournalEntries = this.generateDemoJournalEntries(profileType);
    const demoAnimals = this.generateDemoAnimals(profileType);
    
    console.log(`Generated ${demoJournalEntries.length} journal entries and ${demoAnimals.length} animals`);
    
    return {
      journalEntries: demoJournalEntries,
      animals: demoAnimals
    };
  }
}

export const demoDataService = new DemoDataService();