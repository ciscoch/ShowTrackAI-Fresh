export interface AETMapping {
  id: string;
  activity: string;
  category: string;
  skills: AETSkill[];
  careerReadinessStandards: string[];
  description: string;
}

export interface AETSkill {
  id: string;
  name: string;
  description: string;
  category: AETCategory;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  careerCluster: string;
}

export type AETCategory = 
  | 'Agricultural Production Systems'
  | 'Animal Health Management'
  | 'Feed and Nutrition Management'
  | 'Agricultural Mechanics and Technology'
  | 'Record Keeping and Business Management'
  | 'Marketing and Sales'
  | 'Leadership and Personal Development'
  | 'Risk Management';

export const AET_SKILLS_DATABASE: AETSkill[] = [
  // Animal Health Management
  {
    id: 'ah001',
    name: 'Disease Prevention and Control',
    description: 'Implement preventive health programs and identify disease symptoms',
    category: 'Animal Health Management',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  {
    id: 'ah002', 
    name: 'Vaccination Protocols',
    description: 'Administer vaccinations according to veterinary protocols',
    category: 'Animal Health Management',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  // Feed and Nutrition Management
  {
    id: 'fn001',
    name: 'Feed Ration Calculation',
    description: 'Calculate balanced feed rations based on nutritional requirements',
    category: 'Feed and Nutrition Management',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  {
    id: 'fn002',
    name: 'Feed Quality Assessment',
    description: 'Evaluate feed quality and nutritional content',
    category: 'Feed and Nutrition Management',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  // Record Keeping and Business Management
  {
    id: 'rb001',
    name: 'Financial Record Keeping',
    description: 'Maintain accurate financial records and analyze profitability',
    category: 'Record Keeping and Business Management',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Business Management & Administration'
  },
  {
    id: 'rb002',
    name: 'Performance Data Analysis',
    description: 'Collect and analyze animal performance data',
    category: 'Record Keeping and Business Management',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Science, Technology, Engineering & Mathematics'
  },
  // Agricultural Production Systems
  {
    id: 'ap001',
    name: 'Facility Management',
    description: 'Design and maintain livestock facilities for optimal production',
    category: 'Agricultural Production Systems',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  // Agricultural Mechanics and Technology
  {
    id: 'am001',
    name: 'Equipment Operation and Maintenance',
    description: 'Operate and maintain agricultural equipment safely and efficiently',
    category: 'Agricultural Mechanics and Technology',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Agriculture, Food & Natural Resources'
  },
  // Marketing and Sales
  {
    id: 'ms001',
    name: 'Market Analysis',
    description: 'Analyze market trends and pricing for livestock products',
    category: 'Marketing and Sales',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Marketing'
  },
  {
    id: 'ms002',
    name: 'Customer Relations',
    description: 'Develop and maintain customer relationships in agricultural business',
    category: 'Marketing and Sales',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Marketing'
  },
  // Leadership and Personal Development
  {
    id: 'ld001',
    name: 'Project Management',
    description: 'Plan, execute, and evaluate agricultural projects',
    category: 'Leadership and Personal Development',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Business Management & Administration'
  },
  {
    id: 'ld002',
    name: 'Communication Skills',
    description: 'Communicate effectively in agricultural business settings',
    category: 'Leadership and Personal Development',
    proficiencyLevel: 'Intermediate',
    careerCluster: 'Arts, A/V Technology & Communications'
  },
  // Risk Management
  {
    id: 'rm001',
    name: 'Insurance and Risk Assessment',
    description: 'Assess risks and implement appropriate insurance strategies',
    category: 'Risk Management',
    proficiencyLevel: 'Advanced',
    careerCluster: 'Finance'
  }
];

export const getSkillsByActivity = (activity: string): AETSkill[] => {
  const activityMappings: Record<string, string[]> = {
    'Feeding': ['fn001', 'fn002', 'rb002'],
    'Health Care': ['ah001', 'ah002', 'rb001'],
    'Record Keeping': ['rb001', 'rb002', 'ld001'],
    'Equipment Maintenance': ['am001', 'ap001'],
    'Show Preparation': ['ms001', 'ld002', 'ld001'],
    'Marketing': ['ms001', 'ms002', 'ld002'],
    'Training': ['ld001', 'ld002', 'ap001'],
    'Grooming': ['ah001', 'ld002'],
    'Exercise': ['ah001', 'ap001']
  };

  const skillIds = activityMappings[activity] || [];
  return AET_SKILLS_DATABASE.filter(skill => skillIds.includes(skill.id));
};