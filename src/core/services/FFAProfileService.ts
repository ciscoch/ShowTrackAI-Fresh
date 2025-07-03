import {
  FFAStudentProfile,
  FFAEducatorProfile, 
  FFAInstitutionProfile,
  SAEProject,
  FFA_DEGREE_REQUIREMENTS
} from '../models/FFAProfiles';
import { storageService, STORAGE_KEYS } from './StorageService';

interface DegreeProgress {
  degree: keyof typeof FFA_DEGREE_REQUIREMENTS;
  progress: number;
  completedRequirements: string[];
  missingRequirements: string[];
  canApply: boolean;
}

interface SAEAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalInvestment: number;
  totalRevenue: number;
  averageProjectDuration: number;
  skillsDeveloped: number;
  categoryDistribution: Record<string, number>;
  timeLogged: number;
}

interface ChapterAnalytics {
  membershipStats: {
    totalMembers: number;
    activeMembers: number;
    newMembers: number;
    graduatingSeniors: number;
  };
  degreeStats: {
    greenhand: number;
    chapter: number;
    state: number;
    american: number;
  };
  saeStats: SAEAnalytics;
  competitionStats: {
    participatingMembers: number;
    awardsWon: number;
    stateQualifiers: number;
    nationalQualifiers: number;
  };
  academicStats: {
    averageGPA: number;
    collegeIntention: number;
    scholarshipsAwarded: number;
    totalScholarshipAmount: number;
  };
}

class FFAProfileService {
  
  // Student Profile Management
  async createStudentProfile(profileData: Omit<FFAStudentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<FFAStudentProfile> {
    const profile: FFAStudentProfile = {
      id: Date.now().toString(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const profiles = await this.getAllStudentProfiles();
    profiles.push(profile);
    await storageService.saveData(STORAGE_KEYS.FFA_PROFILES, { students: profiles });
    
    return profile;
  }

  async updateStudentProfile(id: string, updates: Partial<FFAStudentProfile>): Promise<void> {
    const profiles = await this.getAllStudentProfiles();
    const index = profiles.findIndex(p => p.id === id);
    
    if (index !== -1) {
      profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date(),
      };
      await storageService.saveData(STORAGE_KEYS.FFA_PROFILES, { students: profiles });
    }
  }

  async getAllStudentProfiles(): Promise<FFAStudentProfile[]> {
    const data = await storageService.loadData<{ students: FFAStudentProfile[] }>(STORAGE_KEYS.FFA_PROFILES);
    return data?.students || [];
  }

  async getStudentProfile(id: string): Promise<FFAStudentProfile | null> {
    const profiles = await this.getAllStudentProfiles();
    return profiles.find(p => p.id === id) || null;
  }

  // SAE Project Management
  async createSAEProject(projectData: Omit<SAEProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<SAEProject> {
    const project: SAEProject = {
      id: Date.now().toString(),
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add project to student profile
    const student = await this.getStudentProfile(project.studentId);
    if (student) {
      const updatedSAEProjects = [
        ...student.saeProjects,
        {
          id: project.id,
          title: project.title,
          type: project.type,
          category: project.category,
          startDate: project.startDate,
          endDate: project.endDate,
          isActive: project.isActive,
          supervisor: project.supervisor.name,
          description: project.description,
          goals: project.goals.map(g => g.description),
          achievements: [], // Will be updated as goals are completed
          financialSummary: {
            totalInvestment: project.financial.initialInvestment,
            totalRevenue: 0, // Will be calculated from revenue entries
            netProfit: project.financial.netProfit,
          },
        }
      ];
      
      await this.updateStudentProfile(project.studentId, {
        saeProjects: updatedSAEProjects
      });
    }

    return project;
  }

  // Degree Progress Analysis
  async analyzeDegreeProgress(studentId: string): Promise<DegreeProgress[]> {
    const student = await this.getStudentProfile(studentId);
    if (!student) return [];

    const progressAnalysis: DegreeProgress[] = [];

    // Analyze each degree level
    Object.entries(FFA_DEGREE_REQUIREMENTS).forEach(([degreeKey, degreeInfo]) => {
      const degree = degreeKey as keyof typeof FFA_DEGREE_REQUIREMENTS;
      const requirements = degreeInfo.requirements;
      const completedRequirements: string[] = [];
      const missingRequirements: string[] = [];

      // Check each requirement (simplified logic for demo)
      requirements.forEach(requirement => {
        let isCompleted = false;

        // Example requirement checking logic
        if (requirement.includes('agricultural education')) {
          isCompleted = student.academics.agriculturalEducationCredits > 0;
        } else if (requirement.includes('SAE')) {
          isCompleted = student.saeProjects.length > 0;
        } else if (requirement.includes('FFA Creed')) {
          isCompleted = student.degrees.greenhand.earned;
        } else if (requirement.includes('community service')) {
          // Would check community service hours in real implementation
          isCompleted = Math.random() > 0.5; // Demo data
        } else if (requirement.includes('invest') || requirement.includes('work')) {
          // Check SAE financial requirements
          const totalInvestment = student.saeProjects.reduce((sum, project) => 
            sum + (project.financialSummary?.totalInvestment || 0), 0
          );
          
          if (degree === 'chapter') {
            isCompleted = totalInvestment >= 150;
          } else if (degree === 'state') {
            isCompleted = totalInvestment >= 1000;
          } else if (degree === 'american') {
            isCompleted = totalInvestment >= 10000;
          }
        }

        if (isCompleted) {
          completedRequirements.push(requirement);
        } else {
          missingRequirements.push(requirement);
        }
      });

      const progress = (completedRequirements.length / requirements.length) * 100;
      const canApply = missingRequirements.length === 0;

      progressAnalysis.push({
        degree,
        progress,
        completedRequirements,
        missingRequirements,
        canApply,
      });
    });

    return progressAnalysis;
  }

  // SAE Analytics
  async calculateSAEAnalytics(studentId: string): Promise<SAEAnalytics> {
    const student = await this.getStudentProfile(studentId);
    if (!student) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalInvestment: 0,
        totalRevenue: 0,
        averageProjectDuration: 0,
        skillsDeveloped: 0,
        categoryDistribution: {},
        timeLogged: 0,
      };
    }

    const projects = student.saeProjects;
    const activeProjects = projects.filter(p => p.isActive).length;
    const completedProjects = projects.filter(p => !p.isActive).length;
    
    const totalInvestment = projects.reduce((sum, project) => 
      sum + (project.financialSummary?.totalInvestment || 0), 0
    );
    
    const totalRevenue = projects.reduce((sum, project) => 
      sum + (project.financialSummary?.totalRevenue || 0), 0
    );

    // Calculate average project duration
    const completedProjectDurations = projects
      .filter(p => !p.isActive && p.endDate)
      .map(p => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate!);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
      });
    
    const averageProjectDuration = completedProjectDurations.length > 0 
      ? completedProjectDurations.reduce((sum, duration) => sum + duration, 0) / completedProjectDurations.length
      : 0;

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    projects.forEach(project => {
      categoryDistribution[project.category] = (categoryDistribution[project.category] || 0) + 1;
    });

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalInvestment,
      totalRevenue,
      averageProjectDuration,
      skillsDeveloped: 0, // Would calculate from AET skills in real implementation
      categoryDistribution,
      timeLogged: 0, // Would calculate from time tracking data
    };
  }

  // Chapter Analytics (for educators)
  async calculateChapterAnalytics(educatorId: string): Promise<ChapterAnalytics> {
    const educator = await this.getEducatorProfile(educatorId);
    if (!educator) {
      throw new Error('Educator not found');
    }

    const allStudents = await this.getAllStudentProfiles();
    const chapterStudents = allStudents.filter(student => 
      educator.currentStudents.includes(student.id)
    );

    // Membership stats
    const membershipStats = {
      totalMembers: chapterStudents.length,
      activeMembers: chapterStudents.filter(s => s.membershipType === 'Active').length,
      newMembers: chapterStudents.filter(s => {
        const joinYear = new Date().getFullYear();
        return s.graduationYear - 4 === joinYear; // Assuming 4-year program
      }).length,
      graduatingSeniors: chapterStudents.filter(s => 
        s.graduationYear === new Date().getFullYear()
      ).length,
    };

    // Degree stats
    const degreeStats = {
      greenhand: chapterStudents.filter(s => s.degrees.greenhand.earned).length,
      chapter: chapterStudents.filter(s => s.degrees.chapterDegree.earned).length,
      state: chapterStudents.filter(s => s.degrees.stateDegree.earned).length,
      american: chapterStudents.filter(s => s.degrees.americanDegree.earned).length,
    };

    // SAE aggregated stats
    const allSAEProjects = chapterStudents.flatMap(s => s.saeProjects);
    const saeStats: SAEAnalytics = {
      totalProjects: allSAEProjects.length,
      activeProjects: allSAEProjects.filter(p => p.isActive).length,
      completedProjects: allSAEProjects.filter(p => !p.isActive).length,
      totalInvestment: allSAEProjects.reduce((sum, p) => sum + (p.financialSummary?.totalInvestment || 0), 0),
      totalRevenue: allSAEProjects.reduce((sum, p) => sum + (p.financialSummary?.totalRevenue || 0), 0),
      averageProjectDuration: 0, // Would calculate properly
      skillsDeveloped: 0,
      categoryDistribution: {},
      timeLogged: 0,
    };

    // Competition stats
    const allCompetitions = chapterStudents.flatMap(s => s.competitions);
    const competitionStats = {
      participatingMembers: chapterStudents.filter(s => s.competitions.length > 0).length,
      awardsWon: allCompetitions.filter(c => c.placement && c.placement <= 3).length,
      stateQualifiers: allCompetitions.filter(c => c.level === 'State').length,
      nationalQualifiers: allCompetitions.filter(c => c.level === 'National').length,
    };

    // Academic stats
    const studentsWithGPA = chapterStudents.filter(s => s.academics.gpa);
    const averageGPA = studentsWithGPA.length > 0
      ? studentsWithGPA.reduce((sum, s) => sum + (s.academics.gpa || 0), 0) / studentsWithGPA.length
      : 0;

    const totalScholarships = chapterStudents.flatMap(s => s.academics.scholarshipsReceived);
    const academicStats = {
      averageGPA,
      collegeIntention: chapterStudents.filter(s => s.academics.collegeInterest && s.academics.collegeInterest.length > 0).length,
      scholarshipsAwarded: totalScholarships.length,
      totalScholarshipAmount: totalScholarships.reduce((sum, scholarship) => sum + scholarship.amount, 0),
    };

    return {
      membershipStats,
      degreeStats,
      saeStats,
      competitionStats,
      academicStats,
    };
  }

  // Educator Profile Management
  async createEducatorProfile(profileData: Omit<FFAEducatorProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<FFAEducatorProfile> {
    const profile: FFAEducatorProfile = {
      id: Date.now().toString(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to storage (simplified for demo)
    return profile;
  }

  async getEducatorProfile(id: string): Promise<FFAEducatorProfile | null> {
    // Would load from storage in real implementation
    return null;
  }

  // Degree Application Processing
  async processDegreeApplication(
    studentId: string, 
    degree: keyof typeof FFA_DEGREE_REQUIREMENTS
  ): Promise<{ approved: boolean; feedback: string }> {
    const progressAnalysis = await this.analyzeDegreeProgress(studentId);
    const degreeProgress = progressAnalysis.find(p => p.degree === degree);
    
    if (!degreeProgress) {
      return { approved: false, feedback: 'Invalid degree type' };
    }

    if (!degreeProgress.canApply) {
      return {
        approved: false,
        feedback: `Missing requirements: ${degreeProgress.missingRequirements.join(', ')}`
      };
    }

    // Auto-approve if all requirements met (in real system, this would go through review process)
    const student = await this.getStudentProfile(studentId);
    if (student) {
      const degreeUpdate = {
        ...student.degrees,
        [degree]: { earned: true, dateEarned: new Date() }
      };
      
      await this.updateStudentProfile(studentId, { degrees: degreeUpdate });
    }

    return {
      approved: true,
      feedback: `Congratulations! Your ${FFA_DEGREE_REQUIREMENTS[degree].name} application has been approved.`
    };
  }

  // Report Generation
  async generateStudentProgressReport(studentId: string): Promise<string> {
    const student = await this.getStudentProfile(studentId);
    const degreeProgress = await this.analyzeDegreeProgress(studentId);
    const saeAnalytics = await this.calculateSAEAnalytics(studentId);

    if (!student) return 'Student not found';

    let report = `FFA Student Progress Report\n`;
    report += `Student: ${student.firstName} ${student.lastName}\n`;
    report += `Chapter: ${student.chapterNumber} - ${student.schoolName}\n`;
    report += `Graduation Year: ${student.graduationYear}\n\n`;

    // Degree Progress
    report += `DEGREE PROGRESS:\n`;
    degreeProgress.forEach(degree => {
      report += `${FFA_DEGREE_REQUIREMENTS[degree.degree].name}: ${degree.progress.toFixed(1)}% complete\n`;
      if (degree.canApply) {
        report += `  ✅ Ready to apply!\n`;
      } else {
        report += `  📋 Missing: ${degree.missingRequirements.slice(0, 2).join(', ')}\n`;
      }
    });

    // SAE Summary
    report += `\nSAE PROJECT SUMMARY:\n`;
    report += `Total Projects: ${saeAnalytics.totalProjects}\n`;
    report += `Active Projects: ${saeAnalytics.activeProjects}\n`;
    report += `Total Investment: $${saeAnalytics.totalInvestment.toFixed(2)}\n`;
    report += `Total Revenue: $${saeAnalytics.totalRevenue.toFixed(2)}\n`;

    // Academic Info
    if (student.academics.gpa) {
      report += `\nACADEMIC PERFORMANCE:\n`;
      report += `GPA: ${student.academics.gpa.toFixed(2)}\n`;
      report += `Agricultural Education Credits: ${student.academics.agriculturalEducationCredits}\n`;
    }

    return report;
  }
}

export const ffaProfileService = new FFAProfileService();
export type { DegreeProgress, SAEAnalytics, ChapterAnalytics };