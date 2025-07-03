/**
 * SAE - Animal Systems Framework
 * Comprehensive implementation of Supervised Agricultural Experience standards
 * aligned with national AFNR (Agriculture, Food & Natural Resources) curriculum
 */

// Career Ready Practices (CRP) - Level 1 Universal Skills
export interface CareerReadyPractice {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'leadership' | 'communication' | 'critical_thinking' | 'technical' | 'financial';
}

// AFNR Cluster Skills (CS) - Level 2 Agriculture Foundation
export interface ClusterSkill {
  id: string;
  code: string;
  title: string;
  description: string;
  requiredHours: number;
}

// Animal Systems Standards (AS) - Level 3 Specialized Competencies
export interface AnimalSystemStandard {
  id: string;
  code: string;
  title: string;
  description: string;
  requiredHours: number;
  competencies: Competency[];
  careerConnections: string[];
}

export interface Competency {
  id: string;
  title: string;
  description: string;
  performanceIndicators: string[];
  assessmentCriteria: string[];
}

// SAE Experience Types
export type SAEType = 'foundational' | 'placement' | 'entrepreneurship' | 'research' | 'school_based';

export interface SAEPathway {
  type: SAEType;
  title: string;
  description: string;
  focusAreas: string[];
  requiredStandards: string[];
  minimumHours: number;
  exampleProjects: string[];
}

// Student Progress Tracking
export interface StudentSAEProfile {
  studentId: string;
  gradeLevel: number;
  programYear: number;
  careerInterests: string[];
  timeCommitment: 'light' | 'moderate' | 'intensive' | 'full_time';
  initialAssessment: SkillAssessment;
  currentPathway: SAEPathway | null;
  standardsProgress: StandardProgress[];
  totalHours: number;
  achievements: Achievement[];
}

export interface SkillAssessment {
  livestockCare: number; // 1-5 scale
  animalNutrition: number;
  animalHealth: number;
  animalBreeding: number;
  farmBusiness: number;
  researchSkills: number;
  leadership: number;
  financialManagement: number;
}

export interface StandardProgress {
  standardCode: string;
  requiredHours: number;
  completedHours: number;
  masteryLevel: 'novice' | 'developing' | 'proficient' | 'advanced' | 'mastered';
  competenciesCompleted: string[];
  lastActivity: Date;
}

export interface Achievement {
  id: string;
  type: 'badge' | 'certificate' | 'degree' | 'award';
  title: string;
  earnedDate: Date;
  standardsRelated: string[];
}

// FFA Integration
export interface FFADegreeProgress {
  currentDegree: 'discovery' | 'greenhand' | 'chapter' | 'state' | 'american';
  requirements: DegreeRequirement[];
  eligibleForNext: boolean;
  nextDegreeProgress: number; // percentage
}

export interface DegreeRequirement {
  id: string;
  description: string;
  required: number;
  completed: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export class SAEFramework {
  // Career Ready Practices (CRP) Standards
  private readonly careerReadyPractices: CareerReadyPractice[] = [
    {
      id: 'crp_01',
      code: 'CRP.01',
      title: 'Act as a responsible and contributing citizen',
      description: 'Career-ready individuals understand the obligations and responsibilities of being a member of a community',
      category: 'leadership'
    },
    {
      id: 'crp_02',
      code: 'CRP.02',
      title: 'Apply appropriate academic and technical skills',
      description: 'Career-ready individuals readily access and use the knowledge and skills acquired through experience and education',
      category: 'technical'
    },
    {
      id: 'crp_04',
      code: 'CRP.04',
      title: 'Communicate clearly and effectively',
      description: 'Career-ready individuals communicate thoughts, ideas, and action plans with clarity',
      category: 'communication'
    },
    {
      id: 'crp_08',
      code: 'CRP.08',
      title: 'Utilize critical thinking to make sense of problems',
      description: 'Career-ready individuals readily recognize problems in the workplace and community',
      category: 'critical_thinking'
    },
    {
      id: 'crp_09',
      code: 'CRP.09',
      title: 'Model integrity, ethical leadership and effective management',
      description: 'Career-ready individuals consistently act in ways that align personal and community-held ideals',
      category: 'leadership'
    },
    {
      id: 'crp_11',
      code: 'CRP.11',
      title: 'Use technology to enhance productivity',
      description: 'Career-ready individuals find and maximize the productive value of existing and new technology',
      category: 'technical'
    },
    {
      id: 'crp_12',
      code: 'CRP.12',
      title: 'Work productively in teams while using cultural competence',
      description: 'Career-ready individuals positively contribute to every team',
      category: 'leadership'
    }
  ];

  // Animal Systems Standards (AS)
  private readonly animalSystemStandards: AnimalSystemStandard[] = [
    {
      id: 'as_01',
      code: 'AS.01',
      title: 'Analyze historic and current trends impacting the animal systems industry',
      description: 'Evaluate trends in animal agriculture production, processing, and consumption',
      requiredHours: 20,
      competencies: [
        {
          id: 'as_01_01',
          title: 'Historical Development',
          description: 'Evaluate the development and implications of animal origin, domestication and distribution',
          performanceIndicators: [
            'Research and summarize major domestication events',
            'Analyze geographic distribution of livestock species',
            'Evaluate cultural significance of animals in agriculture'
          ],
          assessmentCriteria: [
            'Accurately identifies domestication timelines',
            'Explains distribution patterns',
            'Demonstrates cultural understanding'
          ]
        }
      ],
      careerConnections: ['Animal Scientist', 'Agricultural Historian', 'Industry Analyst']
    },
    {
      id: 'as_02',
      code: 'AS.02',
      title: 'Utilize best-practice protocols based upon animal behaviors',
      description: 'Recognize and explain animal behaviors for safe handling and optimal performance',
      requiredHours: 40,
      competencies: [
        {
          id: 'as_02_01',
          title: 'Animal Behavior Recognition',
          description: 'Identify normal and abnormal animal behaviors',
          performanceIndicators: [
            'Document animal behavior patterns',
            'Recognize signs of stress or illness',
            'Implement appropriate handling techniques'
          ],
          assessmentCriteria: [
            'Correctly identifies behavior patterns',
            'Demonstrates safe handling practices',
            'Shows appropriate response to animal cues'
          ]
        },
        {
          id: 'as_02_02',
          title: 'Animal Welfare Protocols',
          description: 'Design and implement animal welfare protocols',
          performanceIndicators: [
            'Create facility inspection checklists',
            'Develop handling procedures',
            'Monitor welfare indicators'
          ],
          assessmentCriteria: [
            'Protocols meet industry standards',
            'Documentation is thorough',
            'Welfare improvements are measurable'
          ]
        }
      ],
      careerConnections: ['Animal Behaviorist', 'Welfare Auditor', 'Livestock Handler']
    },
    {
      id: 'as_03',
      code: 'AS.03',
      title: 'Design and provide proper animal nutrition',
      description: 'Formulate feed rations to maximize animal performance while maintaining health',
      requiredHours: 35,
      competencies: [
        {
          id: 'as_03_01',
          title: 'Nutritional Requirements',
          description: 'Analyze nutritional needs based on species, age, and production stage',
          performanceIndicators: [
            'Calculate nutrient requirements',
            'Evaluate feed ingredients',
            'Balance rations for optimal performance'
          ],
          assessmentCriteria: [
            'Accurate nutrient calculations',
            'Appropriate ingredient selection',
            'Cost-effective ration formulation'
          ]
        }
      ],
      careerConnections: ['Animal Nutritionist', 'Feed Mill Manager', 'Livestock Producer']
    },
    {
      id: 'as_04',
      code: 'AS.04',
      title: 'Apply principles of animal reproduction',
      description: 'Evaluate animals for breeding readiness and implement breeding programs',
      requiredHours: 20,
      competencies: [
        {
          id: 'as_04_01',
          title: 'Reproductive Management',
          description: 'Manage breeding programs to optimize genetic improvement',
          performanceIndicators: [
            'Evaluate breeding stock',
            'Maintain breeding records',
            'Monitor reproductive performance'
          ],
          assessmentCriteria: [
            'Sound breeding decisions',
            'Complete record keeping',
            'Improved herd genetics'
          ]
        }
      ],
      careerConnections: ['Reproductive Specialist', 'Geneticist', 'Breeding Manager']
    },
    {
      id: 'as_05',
      code: 'AS.05',
      title: 'Evaluate environmental factors affecting animal performance',
      description: 'Design facilities and management systems for optimal animal comfort',
      requiredHours: 25,
      competencies: [
        {
          id: 'as_05_01',
          title: 'Environmental Control',
          description: 'Monitor and adjust environmental conditions',
          performanceIndicators: [
            'Measure temperature and humidity',
            'Assess ventilation systems',
            'Implement climate control strategies'
          ],
          assessmentCriteria: [
            'Accurate environmental monitoring',
            'Appropriate adjustments made',
            'Animal comfort maintained'
          ]
        }
      ],
      careerConnections: ['Facility Designer', 'Environmental Consultant', 'Farm Manager']
    },
    {
      id: 'as_06',
      code: 'AS.06',
      title: 'Classify, evaluate and select animals',
      description: 'Apply selection criteria to choose animals for specific purposes',
      requiredHours: 15,
      competencies: [
        {
          id: 'as_06_01',
          title: 'Animal Evaluation',
          description: 'Judge animals based on breed standards and production goals',
          performanceIndicators: [
            'Identify breed characteristics',
            'Evaluate conformation',
            'Select for production traits'
          ],
          assessmentCriteria: [
            'Accurate breed identification',
            'Consistent evaluation criteria',
            'Sound selection decisions'
          ]
        }
      ],
      careerConnections: ['Livestock Judge', 'Breed Inspector', 'Auction Manager']
    },
    {
      id: 'as_07',
      code: 'AS.07',
      title: 'Apply principles of effective animal health care',
      description: 'Implement preventive health programs and treat common conditions',
      requiredHours: 30,
      competencies: [
        {
          id: 'as_07_01',
          title: 'Health Management',
          description: 'Maintain animal health through prevention and treatment',
          performanceIndicators: [
            'Administer vaccines',
            'Recognize disease symptoms',
            'Maintain health records'
          ],
          assessmentCriteria: [
            'Proper administration techniques',
            'Accurate symptom identification',
            'Complete health documentation'
          ]
        }
      ],
      careerConnections: ['Veterinarian', 'Veterinary Technician', 'Herd Health Specialist']
    },
    {
      id: 'as_08',
      code: 'AS.08',
      title: 'Analyze environmental factors associated with production',
      description: 'Evaluate and implement sustainable production practices',
      requiredHours: 15,
      competencies: [
        {
          id: 'as_08_01',
          title: 'Sustainable Practices',
          description: 'Implement environmentally responsible production methods',
          performanceIndicators: [
            'Monitor resource usage',
            'Implement waste management',
            'Practice conservation methods'
          ],
          assessmentCriteria: [
            'Reduced environmental impact',
            'Efficient resource utilization',
            'Compliance with regulations'
          ]
        }
      ],
      careerConnections: ['Environmental Consultant', 'Sustainability Manager', 'Conservation Specialist']
    }
  ];

  // SAE Pathways
  private readonly saePathways: SAEPathway[] = [
    {
      type: 'foundational',
      title: 'Foundational SAE',
      description: 'Required activities that provide a foundation for all students',
      focusAreas: [
        'Career Exploration & Planning',
        'Employability Skills',
        'Personal Financial Management',
        'Workplace Safety',
        'Agricultural Literacy'
      ],
      requiredStandards: ['CRP.01', 'CRP.04', 'CRP.08'],
      minimumHours: 45,
      exampleProjects: [
        'Career research and interviews',
        'Personal budget development',
        'Safety certification completion'
      ]
    },
    {
      type: 'entrepreneurship',
      title: 'Ownership/Entrepreneurship SAE',
      description: 'Student owns and operates an agricultural business',
      focusAreas: [
        'Livestock Production',
        'Companion Animal Services',
        'Specialized Production',
        'Value-Added Products'
      ],
      requiredStandards: ['AS.02', 'AS.03', 'AS.05', 'AS.07'],
      minimumHours: 200,
      exampleProjects: [
        'Beef cattle operation',
        'Sheep breeding program',
        'Show pig enterprise',
        'Pet care business'
      ]
    },
    {
      type: 'placement',
      title: 'Placement/Internship SAE',
      description: 'Student works for an agricultural employer',
      focusAreas: [
        'Veterinary Clinics',
        'Livestock Farms',
        'Feed Mills',
        'Animal Research Facilities'
      ],
      requiredStandards: ['AS.02', 'AS.07', 'CRP.04', 'CRP.12'],
      minimumHours: 150,
      exampleProjects: [
        'Veterinary assistant internship',
        'Dairy farm employment',
        'Feed store customer service',
        'Research lab assistant'
      ]
    },
    {
      type: 'research',
      title: 'Research/Experimentation SAE',
      description: 'Student conducts scientific research in agriculture',
      focusAreas: [
        'Animal Nutrition Studies',
        'Breeding Program Analysis',
        'Health Protocol Testing',
        'Environmental Impact Research'
      ],
      requiredStandards: ['AS.03', 'AS.04', 'AS.08', 'CRP.08'],
      minimumHours: 140,
      exampleProjects: [
        'Feed efficiency trials',
        'Genetic selection studies',
        'Disease prevention research',
        'Sustainability assessments'
      ]
    },
    {
      type: 'school_based',
      title: 'School-Based Enterprise SAE',
      description: 'Student manages school agricultural facilities',
      focusAreas: [
        'School Farm Management',
        'Livestock Show Team',
        'Veterinary Science Lab',
        'Aquaculture Systems'
      ],
      requiredStandards: ['AS.02', 'AS.05', 'AS.06', 'AS.07'],
      minimumHours: 125,
      exampleProjects: [
        'Managing school livestock',
        'Operating greenhouse',
        'Running school store',
        'Maintaining lab animals'
      ]
    }
  ];

  // Assessment and Progress Methods
  public assessStudentSkills(assessment: SkillAssessment): string[] {
    const recommendations: string[] = [];
    
    // Analyze skill levels and recommend pathways
    if (assessment.livestockCare >= 3 && assessment.farmBusiness >= 2) {
      recommendations.push('entrepreneurship');
    }
    if (assessment.animalHealth >= 3 || assessment.researchSkills >= 3) {
      recommendations.push('placement', 'research');
    }
    if (assessment.leadership >= 4) {
      recommendations.push('school_based');
    }
    
    return recommendations;
  }

  public calculateStandardProgress(
    completedHours: number,
    requiredHours: number,
    competenciesCompleted: number,
    totalCompetencies: number
  ): StandardProgress['masteryLevel'] {
    const hoursProgress = completedHours / requiredHours;
    const competencyProgress = competenciesCompleted / totalCompetencies;
    const overallProgress = (hoursProgress * 0.6) + (competencyProgress * 0.4);
    
    if (overallProgress >= 1.0) return 'mastered';
    if (overallProgress >= 0.85) return 'advanced';
    if (overallProgress >= 0.70) return 'proficient';
    if (overallProgress >= 0.40) return 'developing';
    return 'novice';
  }

  public generatePersonalizedPlan(profile: StudentSAEProfile): SAEPathway[] {
    const availablePathways = this.saePathways.filter(pathway => {
      // All students must complete foundational
      if (pathway.type === 'foundational') return true;
      
      // Filter based on time commitment
      if (profile.timeCommitment === 'light' && pathway.minimumHours > 150) return false;
      if (profile.timeCommitment === 'moderate' && pathway.minimumHours > 200) return false;
      
      // Match with career interests
      return pathway.focusAreas.some(area => 
        profile.careerInterests.some(interest => 
          area.toLowerCase().includes(interest.toLowerCase())
        )
      );
    });
    
    return availablePathways;
  }

  public checkFFADegreeEligibility(profile: StudentSAEProfile): FFADegreeProgress {
    const totalHours = profile.totalHours;
    const leadershipActivities = profile.achievements.filter(a => 
      a.type === 'badge' && a.title.includes('Leadership')
    ).length;
    
    let currentDegree: FFADegreeProgress['currentDegree'] = 'discovery';
    let nextDegreeProgress = 0;
    
    if (totalHours >= 300 && leadershipActivities >= 2) {
      currentDegree = 'state';
      nextDegreeProgress = Math.min((totalHours / 600) * 100, 100);
    } else if (totalHours >= 45) {
      currentDegree = 'chapter';
      nextDegreeProgress = Math.min((totalHours / 300) * 100, 100);
    } else if (totalHours >= 15) {
      currentDegree = 'greenhand';
      nextDegreeProgress = Math.min((totalHours / 45) * 100, 100);
    }
    
    const requirements: DegreeRequirement[] = [
      {
        id: 'sae_hours',
        description: 'SAE Hours Completed',
        required: currentDegree === 'chapter' ? 300 : 45,
        completed: totalHours,
        status: totalHours >= 45 ? 'completed' : 'in_progress'
      },
      {
        id: 'leadership_roles',
        description: 'Leadership Activities',
        required: 2,
        completed: leadershipActivities,
        status: leadershipActivities >= 2 ? 'completed' : 'in_progress'
      },
      {
        id: 'skills_mastery',
        description: 'Standards Mastered',
        required: 6,
        completed: profile.standardsProgress.filter(s => s.masteryLevel === 'mastered').length,
        status: profile.standardsProgress.filter(s => s.masteryLevel === 'mastered').length >= 6 ? 'completed' : 'in_progress'
      }
    ];
    
    return {
      currentDegree,
      requirements,
      eligibleForNext: requirements.every(r => r.status === 'completed'),
      nextDegreeProgress
    };
  }

  // Integration with ShowTrackAI Journal System
  public mapJournalToSAEActivity(journalEntry: any): {
    standards: string[];
    competencies: string[];
    hours: number;
    evidenceType: string;
  } {
    const standards: string[] = [];
    const competencies: string[] = [];
    
    // Map based on AET skills and activities
    if (journalEntry.aetSkills?.includes('feeding_nutrition')) {
      standards.push('AS.03');
      competencies.push('as_03_01');
    }
    
    if (journalEntry.aetSkills?.includes('animal_health')) {
      standards.push('AS.07');
      competencies.push('as_07_01');
    }
    
    if (journalEntry.aetSkills?.includes('facilities_equipment')) {
      standards.push('AS.05');
      competencies.push('as_05_01');
    }
    
    // Evidence type based on journal content
    let evidenceType = 'activity_log';
    if (journalEntry.photos?.length > 0) evidenceType = 'photo_documentation';
    if (journalEntry.feedData?.feeds?.length > 0) evidenceType = 'data_collection';
    
    return {
      standards,
      competencies,
      hours: journalEntry.duration / 60, // Convert minutes to hours
      evidenceType
    };
  }

  // Getters for framework data
  public getCareerReadyPractices(): CareerReadyPractice[] {
    return this.careerReadyPractices;
  }

  public getAnimalSystemStandards(): AnimalSystemStandard[] {
    return this.animalSystemStandards;
  }

  public getSAEPathways(): SAEPathway[] {
    return this.saePathways;
  }

  public getStandardByCode(code: string): AnimalSystemStandard | undefined {
    return this.animalSystemStandards.find(s => s.code === code);
  }

  public getPathwayByType(type: SAEType): SAEPathway | undefined {
    return this.saePathways.find(p => p.type === type);
  }
}

// Export singleton instance
export const saeFramework = new SAEFramework();