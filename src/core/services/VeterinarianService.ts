import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VeterinarianProfile,
  VetOnboardingProgress,
  VetWorkflowState,
  OnboardingStep,
  StepProgress,
  ActiveCase,
  PendingCase,
  VetNotification,
  WorkflowTask,
  PerformanceAlert,
  createNewVeterinarianProfile,
  VetPersonalInfo,
  VetProfessionalInfo,
  AgricultureSpecialty,
  AETStandard
} from '../models/VeterinarianProfile';

class VeterinarianService {
  private readonly STORAGE_KEYS = {
    VETERINARIANS: 'veterinarian_profiles',
    ONBOARDING: 'veterinarian_onboarding',
    WORKFLOWS: 'veterinarian_workflows',
    CASE_ASSIGNMENTS: 'veterinarian_case_assignments',
    PERFORMANCE_DATA: 'veterinarian_performance'
  };

  // Profile Management
  async createVeterinarianProfile(
    personalInfo: VetPersonalInfo,
    professionalInfo: VetProfessionalInfo
  ): Promise<VeterinarianProfile> {
    const profile = createNewVeterinarianProfile(personalInfo, professionalInfo);
    
    await this.saveVeterinarianProfile(profile);
    await this.initializeOnboarding(profile.id);
    
    return profile;
  }

  async getVeterinarianProfile(veterinarianId: string): Promise<VeterinarianProfile | null> {
    const profiles = await this.loadVeterinarianProfilesInternal();
    return profiles.find(p => p.id === veterinarianId) || null;
  }

  async updateVeterinarianProfile(
    veterinarianId: string,
    updates: Partial<VeterinarianProfile>
  ): Promise<VeterinarianProfile> {
    const profiles = await this.loadVeterinarianProfilesInternal();
    const profileIndex = profiles.findIndex(p => p.id === veterinarianId);
    
    if (profileIndex === -1) {
      throw new Error('Veterinarian profile not found');
    }

    const updatedProfile = {
      ...profiles[profileIndex],
      ...updates,
      updatedAt: new Date()
    };

    profiles[profileIndex] = updatedProfile;
    await this.saveAllVeterinarianProfiles(profiles);
    
    return updatedProfile;
  }

  async getVeterinariansBySpecialty(specialty: AgricultureSpecialty): Promise<VeterinarianProfile[]> {
    const profiles = await this.loadVeterinarianProfilesInternal();
    return profiles.filter(profile => 
      profile.status === 'active' &&
      profile.specializations.some(spec => spec.specialty === specialty)
    );
  }

  async getAvailableVeterinarians(): Promise<VeterinarianProfile[]> {
    const profiles = await this.loadVeterinarianProfilesInternal();
    const now = new Date();
    
    return profiles.filter(profile => {
      if (profile.status !== 'active') return false;
      
      const dayOfWeek = now.toLocaleLowerCase() as keyof typeof profile.availability.schedule;
      const todaySchedule = profile.availability.schedule[dayOfWeek];
      
      return todaySchedule.available && todaySchedule.shifts.length > 0;
    });
  }

  // Onboarding Management
  async initializeOnboarding(veterinarianId: string): Promise<VetOnboardingProgress> {
    const onboardingProgress: VetOnboardingProgress = {
      veterinarianId,
      currentStep: 'personal_info',
      completedSteps: [],
      stepProgress: this.initializeStepProgress(),
      startedAt: new Date()
    };

    await this.saveOnboardingProgress(onboardingProgress);
    return onboardingProgress;
  }

  async updateOnboardingStep(
    veterinarianId: string,
    step: OnboardingStep,
    progress: Partial<StepProgress>
  ): Promise<VetOnboardingProgress> {
    const onboardingData = await this.loadOnboardingProgress();
    const veterinarianOnboarding = onboardingData.find(o => o.veterinarianId === veterinarianId);
    
    if (!veterinarianOnboarding) {
      throw new Error('Onboarding progress not found');
    }

    // Update step progress
    veterinarianOnboarding.stepProgress[step] = {
      ...veterinarianOnboarding.stepProgress[step],
      ...progress,
      ...(progress.status === 'completed' && { completedAt: new Date() })
    };

    // Update completed steps
    if (progress.status === 'completed' && !veterinarianOnboarding.completedSteps.includes(step)) {
      veterinarianOnboarding.completedSteps.push(step);
    }

    // Advance to next step if current step is completed
    if (progress.status === 'completed') {
      const nextStep = this.getNextOnboardingStep(step);
      if (nextStep && !veterinarianOnboarding.completedSteps.includes(nextStep)) {
        veterinarianOnboarding.currentStep = nextStep;
        veterinarianOnboarding.stepProgress[nextStep].status = 'in_progress';
        veterinarianOnboarding.stepProgress[nextStep].startedAt = new Date();
      } else {
        // All steps completed
        veterinarianOnboarding.completedAt = new Date();
      }
    }

    await this.saveAllOnboardingProgress(onboardingData);
    return veterinarianOnboarding;
  }

  async getOnboardingProgress(veterinarianId: string): Promise<VetOnboardingProgress | null> {
    const onboardingData = await this.loadOnboardingProgress();
    return onboardingData.find(o => o.veterinarianId === veterinarianId) || null;
  }

  async verifyLicense(veterinarianId: string, licenseNumber: string, state: string): Promise<boolean> {
    // Simulate license verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification logic (in production, this would call actual verification APIs)
    const isValid = licenseNumber.length >= 6 && state.length === 2;
    
    if (isValid) {
      await this.updateOnboardingStep(veterinarianId, 'license_verification', {
        status: 'completed',
        notes: 'License verified successfully'
      });
    } else {
      await this.updateOnboardingStep(veterinarianId, 'license_verification', {
        status: 'failed',
        notes: 'License verification failed'
      });
    }
    
    return isValid;
  }

  async verifyEducation(veterinarianId: string, institution: string, degree: string): Promise<boolean> {
    // Simulate education verification
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isValid = institution.length > 0 && degree.includes('Veterinary');
    
    if (isValid) {
      await this.updateOnboardingStep(veterinarianId, 'education_verification', {
        status: 'completed',
        notes: 'Education credentials verified'
      });
    } else {
      await this.updateOnboardingStep(veterinarianId, 'education_verification', {
        status: 'failed',
        notes: 'Education verification failed'
      });
    }
    
    return isValid;
  }

  // Workflow Management
  async getVeterinarianWorkflow(veterinarianId: string): Promise<VetWorkflowState> {
    const workflows = await this.loadWorkflowStates();
    let workflow = workflows.find(w => w.veterinarianId === veterinarianId);
    
    if (!workflow) {
      workflow = await this.createWorkflowState(veterinarianId);
    }
    
    return workflow;
  }

  async createWorkflowState(veterinarianId: string): Promise<VetWorkflowState> {
    const workflow: VetWorkflowState = {
      veterinarianId,
      currentCases: [],
      pendingCases: [],
      schedule: [],
      notifications: [],
      tasksToComplete: [],
      performanceAlerts: []
    };

    const workflows = await this.loadWorkflowStates();
    workflows.push(workflow);
    await this.saveAllWorkflowStates(workflows);
    
    return workflow;
  }

  async assignCaseToVeterinarian(
    veterinarianId: string,
    caseDetails: Omit<ActiveCase, 'status'>
  ): Promise<ActiveCase> {
    const workflows = await this.loadWorkflowStates();
    const workflow = workflows.find(w => w.veterinarianId === veterinarianId);
    
    if (!workflow) {
      throw new Error('Veterinarian workflow not found');
    }

    const activeCase: ActiveCase = {
      ...caseDetails,
      status: 'scheduled'
    };

    workflow.currentCases.push(activeCase);
    
    // Create notification
    const notification: VetNotification = {
      id: this.generateId(),
      type: caseDetails.urgencyLevel === 'emergency' ? 'urgent_case' : 'new_case',
      title: `New ${caseDetails.urgencyLevel} consultation assigned`,
      message: `You have been assigned a ${caseDetails.consultationType} consultation scheduled for ${caseDetails.scheduledTime.toLocaleString()}`,
      createdAt: new Date(),
      actionRequired: true,
      actionUrl: `/consultation/${caseDetails.caseId}`,
      priority: caseDetails.urgencyLevel === 'emergency' ? 'urgent' : 'medium'
    };

    workflow.notifications.push(notification);
    
    await this.saveAllWorkflowStates(workflows);
    
    // Send notification to veterinarian
    await this.sendNotification(veterinarianId, notification);
    
    return activeCase;
  }

  async updateCaseStatus(
    veterinarianId: string,
    caseId: string,
    status: ActiveCase['status']
  ): Promise<void> {
    const workflows = await this.loadWorkflowStates();
    const workflow = workflows.find(w => w.veterinarianId === veterinarianId);
    
    if (!workflow) {
      throw new Error('Veterinarian workflow not found');
    }

    const caseIndex = workflow.currentCases.findIndex(c => c.caseId === caseId);
    if (caseIndex !== -1) {
      workflow.currentCases[caseIndex].status = status;
      
      if (status === 'completed') {
        // Move to completed cases and create follow-up tasks if needed
        const completedCase = workflow.currentCases.splice(caseIndex, 1)[0];
        await this.handleCompletedCase(veterinarianId, completedCase);
      }
    }
    
    await this.saveAllWorkflowStates(workflows);
  }

  async addWorkflowTask(
    veterinarianId: string,
    task: Omit<WorkflowTask, 'id' | 'status'>
  ): Promise<WorkflowTask> {
    const workflows = await this.loadWorkflowStates();
    const workflow = workflows.find(w => w.veterinarianId === veterinarianId);
    
    if (!workflow) {
      throw new Error('Veterinarian workflow not found');
    }

    const newTask: WorkflowTask = {
      ...task,
      id: this.generateId(),
      status: 'pending'
    };

    workflow.tasksToComplete.push(newTask);
    await this.saveAllWorkflowStates(workflows);
    
    return newTask;
  }

  async completeWorkflowTask(veterinarianId: string, taskId: string): Promise<void> {
    const workflows = await this.loadWorkflowStates();
    const workflow = workflows.find(w => w.veterinarianId === veterinarianId);
    
    if (!workflow) {
      throw new Error('Veterinarian workflow not found');
    }

    const taskIndex = workflow.tasksToComplete.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      workflow.tasksToComplete[taskIndex].status = 'completed';
    }
    
    await this.saveAllWorkflowStates(workflows);
  }

  // Case Routing and Assignment
  async findBestVeterinarianForCase(
    caseRequirements: {
      specialty: AgricultureSpecialty;
      urgencyLevel: 'routine' | 'urgent' | 'emergency';
      studentLevel: 'beginner' | 'intermediate' | 'advanced';
      educationalObjectives: AETStandard[];
      preferredConsultationType: 'video' | 'phone' | 'text' | 'photo_review';
      scheduledTime: Date;
    }
  ): Promise<VeterinarianProfile[]> {
    const availableVeterinarians = await this.getAvailableVeterinarians();
    
    // Score veterinarians based on case requirements
    const scoredVeterinarians = availableVeterinarians.map(vet => ({
      veterinarian: vet,
      score: this.calculateMatchingScore(vet, caseRequirements)
    }));

    // Sort by score (highest first) and return top matches
    return scoredVeterinarians
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(sv => sv.veterinarian);
  }

  private calculateMatchingScore(
    veterinarian: VeterinarianProfile,
    requirements: any
  ): number {
    let score = 0;

    // Specialty match (40 points)
    const hasSpecialty = veterinarian.specializations.some(
      spec => spec.specialty === requirements.specialty
    );
    if (hasSpecialty) score += 40;

    // Student level preference (20 points)
    if (veterinarian.preferences.studentInteraction.studentLevelPreferences.includes(requirements.studentLevel)) {
      score += 20;
    }

    // Educational focus alignment (20 points)
    const educationalMatch = requirements.educationalObjectives.some(objective =>
      veterinarian.preferences.educationalFocus.primaryAreas.includes(objective)
    );
    if (educationalMatch) score += 20;

    // Performance metrics (20 points)
    const performanceScore = Math.min(
      veterinarian.performance.clientSatisfaction.overallRating * 4,
      20
    );
    score += performanceScore;

    // Availability bonus (10 points)
    const currentCaseLoad = veterinarian.performance.consultationStats.totalConsultations;
    const maxCases = veterinarian.availability.maxCasesPerDay;
    if (currentCaseLoad < maxCases * 0.8) {
      score += 10;
    }

    // Emergency availability bonus (10 points)
    if (requirements.urgencyLevel === 'emergency' && veterinarian.availability.emergencyAvailability.available) {
      score += 10;
    }

    return score;
  }

  // Performance Monitoring
  async updateVeterinarianPerformance(
    veterinarianId: string,
    metrics: {
      consultationCompleted?: boolean;
      responseTime?: number;
      satisfaction?: number;
      educationalObjectivesAchieved?: number;
    }
  ): Promise<void> {
    const profile = await this.getVeterinarianProfile(veterinarianId);
    if (!profile) return;

    if (metrics.consultationCompleted) {
      profile.performance.consultationStats.totalConsultations += 1;
      profile.performance.consultationStats.completionRate = 
        (profile.performance.consultationStats.completionRate * (profile.performance.consultationStats.totalConsultations - 1) + 1) / 
        profile.performance.consultationStats.totalConsultations;
    }

    if (metrics.responseTime) {
      const totalConsultations = profile.performance.consultationStats.totalConsultations;
      profile.performance.consultationStats.averageResponseTime = 
        ((profile.performance.consultationStats.averageResponseTime * (totalConsultations - 1)) + metrics.responseTime) / 
        totalConsultations;
    }

    if (metrics.satisfaction) {
      const currentRating = profile.performance.clientSatisfaction.overallRating;
      const totalRatings = profile.performance.consultationStats.totalConsultations;
      profile.performance.clientSatisfaction.overallRating = 
        ((currentRating * (totalRatings - 1)) + metrics.satisfaction) / totalRatings;
    }

    if (metrics.educationalObjectivesAchieved) {
      profile.performance.educationalMetrics.learningObjectivesAchieved += metrics.educationalObjectivesAchieved;
    }

    await this.updateVeterinarianProfile(veterinarianId, { performance: profile.performance });
    
    // Check for performance alerts
    await this.checkPerformanceAlerts(veterinarianId, profile);
  }

  private async checkPerformanceAlerts(
    veterinarianId: string,
    profile: VeterinarianProfile
  ): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Response time alert
    if (profile.performance.consultationStats.averageResponseTime > profile.availability.responseTimeCommitment * 1.5) {
      alerts.push({
        id: this.generateId(),
        type: 'response_time',
        severity: 'warning',
        message: 'Average response time exceeds commitment',
        metric: 'averageResponseTime',
        currentValue: profile.performance.consultationStats.averageResponseTime,
        expectedValue: profile.availability.responseTimeCommitment,
        actionItems: [
          'Review schedule and availability',
          'Consider adjusting response time commitment',
          'Optimize workflow processes'
        ],
        createdAt: new Date()
      });
    }

    // Satisfaction alert
    if (profile.performance.clientSatisfaction.overallRating < 4.0) {
      alerts.push({
        id: this.generateId(),
        type: 'satisfaction',
        severity: 'critical',
        message: 'Client satisfaction below threshold',
        metric: 'overallRating',
        currentValue: profile.performance.clientSatisfaction.overallRating,
        expectedValue: 4.0,
        actionItems: [
          'Review recent consultation feedback',
          'Schedule coaching session',
          'Update communication techniques'
        ],
        createdAt: new Date()
      });
    }

    if (alerts.length > 0) {
      const workflow = await this.getVeterinarianWorkflow(veterinarianId);
      workflow.performanceAlerts.push(...alerts);
      
      const workflows = await this.loadWorkflowStates();
      const workflowIndex = workflows.findIndex(w => w.veterinarianId === veterinarianId);
      if (workflowIndex !== -1) {
        workflows[workflowIndex] = workflow;
        await this.saveAllWorkflowStates(workflows);
      }
    }
  }

  // Educational Integration
  async trackEducationalOutcome(
    veterinarianId: string,
    studentId: string,
    caseId: string,
    outcomes: {
      objectivesAchieved: AETStandard[];
      skillsAssessed: string[];
      studentEngagement: number;
      learningEvidence: string[];
    }
  ): Promise<void> {
    const profile = await this.getVeterinarianProfile(veterinarianId);
    if (!profile) return;

    // Update educational metrics
    profile.performance.educationalMetrics.learningObjectivesAchieved += outcomes.objectivesAchieved.length;
    profile.performance.educationalMetrics.studentsSupported += 1;
    profile.performance.educationalMetrics.assessmentParticipation += outcomes.skillsAssessed.length;
    
    // Calculate educational outcome success rate
    const currentSuccess = profile.performance.educationalMetrics.educationalOutcomeSuccess;
    const totalStudents = profile.performance.educationalMetrics.studentsSupported;
    const newSuccessRate = ((currentSuccess * (totalStudents - 1)) + outcomes.studentEngagement) / totalStudents;
    profile.performance.educationalMetrics.educationalOutcomeSuccess = newSuccessRate;

    await this.updateVeterinarianProfile(veterinarianId, { performance: profile.performance });

    // Create follow-up task for educational documentation
    await this.addWorkflowTask(veterinarianId, {
      type: 'educational',
      title: 'Document Educational Outcomes',
      description: `Complete educational assessment documentation for case ${caseId}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      priority: 'medium',
      relatedCaseId: caseId,
      estimatedTime: 30
    });
  }

  // Utility Methods
  private async handleCompletedCase(veterinarianId: string, completedCase: ActiveCase): Promise<void> {
    // Update performance metrics
    await this.updateVeterinarianPerformance(veterinarianId, {
      consultationCompleted: true
    });

    // Create follow-up documentation task
    await this.addWorkflowTask(veterinarianId, {
      type: 'documentation',
      title: 'Complete Case Documentation',
      description: `Finalize documentation for ${completedCase.consultationType} consultation`,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      priority: 'high',
      relatedCaseId: completedCase.caseId,
      estimatedTime: 20
    });

    // Schedule follow-up if educational objectives were involved
    if (completedCase.educationalObjectives.length > 0) {
      await this.addWorkflowTask(veterinarianId, {
        type: 'educational',
        title: 'Educational Follow-up',
        description: 'Follow up on student learning outcomes and provide additional resources',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        priority: 'medium',
        relatedCaseId: completedCase.caseId,
        estimatedTime: 15
      });
    }
  }

  private async sendNotification(veterinarianId: string, notification: VetNotification): Promise<void> {
    // In a real implementation, this would send push notifications, emails, SMS, etc.
    console.log(`Notification sent to veterinarian ${veterinarianId}:`, notification);
  }

  private initializeStepProgress(): Record<OnboardingStep, StepProgress> {
    const steps: OnboardingStep[] = [
      'personal_info',
      'professional_info',
      'license_verification',
      'education_verification',
      'insurance_verification',
      'specialization_assessment',
      'platform_training',
      'educational_training',
      'trial_consultations',
      'final_approval'
    ];

    const stepProgress: Record<OnboardingStep, StepProgress> = {} as any;
    
    steps.forEach(step => {
      stepProgress[step] = {
        status: 'not_started',
        documentsRequired: this.getRequiredDocuments(step),
        documentsSubmitted: []
      };
    });

    // First step should be in progress
    stepProgress.personal_info.status = 'in_progress';
    stepProgress.personal_info.startedAt = new Date();

    return stepProgress;
  }

  private getRequiredDocuments(step: OnboardingStep): string[] {
    const documentMap: Record<OnboardingStep, string[]> = {
      personal_info: ['photo_id', 'profile_photo'],
      professional_info: ['clinic_information', 'professional_references'],
      license_verification: ['veterinary_license', 'license_verification_form'],
      education_verification: ['diploma', 'transcripts'],
      insurance_verification: ['malpractice_insurance_certificate'],
      specialization_assessment: ['certification_documents', 'experience_portfolio'],
      platform_training: ['training_completion_certificate'],
      educational_training: ['educational_methodology_assessment'],
      trial_consultations: ['trial_consultation_reports'],
      final_approval: ['background_check', 'final_interview_notes']
    };

    return documentMap[step] || [];
  }

  private getNextOnboardingStep(currentStep: OnboardingStep): OnboardingStep | null {
    const stepOrder: OnboardingStep[] = [
      'personal_info',
      'professional_info',
      'license_verification',
      'education_verification',
      'insurance_verification',
      'specialization_assessment',
      'platform_training',
      'educational_training',
      'trial_consultations',
      'final_approval'
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null;
  }

  // Public method to access loadVeterinarianProfiles
  async loadVeterinarianProfiles(): Promise<VeterinarianProfile[]> {
    return this.loadVeterinarianProfilesInternal();
  }

  // Storage Operations
  private async loadVeterinarianProfilesInternal(): Promise<VeterinarianProfile[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.VETERINARIANS);
      return data ? JSON.parse(data, this.dateReviver) : [];
    } catch (error) {
      console.error('Failed to load veterinarian profiles:', error);
      return [];
    }
  }

  private async saveVeterinarianProfile(profile: VeterinarianProfile): Promise<void> {
    const profiles = await this.loadVeterinarianProfilesInternal();
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    
    if (existingIndex !== -1) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    await this.saveAllVeterinarianProfiles(profiles);
  }

  private async saveAllVeterinarianProfiles(profiles: VeterinarianProfile[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.VETERINARIANS, JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save veterinarian profiles:', error);
      throw error;
    }
  }

  private async loadOnboardingProgress(): Promise<VetOnboardingProgress[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.ONBOARDING);
      return data ? JSON.parse(data, this.dateReviver) : [];
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
      return [];
    }
  }

  private async saveOnboardingProgress(progress: VetOnboardingProgress): Promise<void> {
    const allProgress = await this.loadOnboardingProgress();
    const existingIndex = allProgress.findIndex(p => p.veterinarianId === progress.veterinarianId);
    
    if (existingIndex !== -1) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }
    
    await this.saveAllOnboardingProgress(allProgress);
  }

  private async saveAllOnboardingProgress(progressList: VetOnboardingProgress[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.ONBOARDING, JSON.stringify(progressList));
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
      throw error;
    }
  }

  private async loadWorkflowStates(): Promise<VetWorkflowState[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.WORKFLOWS);
      return data ? JSON.parse(data, this.dateReviver) : [];
    } catch (error) {
      console.error('Failed to load workflow states:', error);
      return [];
    }
  }

  private async saveAllWorkflowStates(workflows: VetWorkflowState[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save workflow states:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }

  // Demo Data Creation
  async createDemoVeterinarians(): Promise<void> {
    const demoVets = [
      {
        personalInfo: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@vetconnect.edu',
          phone: '(555) 123-4567',
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Spouse',
            phone: '(555) 123-4568'
          },
          profilePhoto: 'demo://vet_photos/sarah_johnson.jpg',
          biography: 'Dr. Sarah Johnson is a board-certified large animal veterinarian with over 10 years of experience in agricultural education and livestock health management.',
          languages: ['English', 'Spanish'],
          timeZone: 'America/Chicago'
        },
        professionalInfo: {
          clinicInfo: {
            name: 'Prairie Animal Health Center',
            address: {
              street: '123 Agriculture Drive',
              city: 'Ames',
              state: 'IA',
              zipCode: '50011',
              country: 'USA'
            },
            phone: '(515) 555-0123',
            website: 'www.prairieanimalhealthcenter.com',
            type: 'large_animal' as const,
            services: ['Large Animal Medicine', 'Herd Health', 'Emergency Services']
          },
          primaryLicense: {
            licenseNumber: 'IA-VET-2019-001',
            state: 'Iowa',
            issuedDate: new Date('2019-01-15'),
            expirationDate: new Date('2025-01-15'),
            status: 'active' as const,
            boardName: 'Iowa Board of Veterinary Medicine',
            verificationStatus: 'verified' as const,
            verificationDate: new Date('2023-01-15')
          },
          additionalLicenses: [],
          professionalHistory: [],
          malpracticeInsurance: {
            provider: 'AVMA Professional Liability Insurance Trust',
            policyNumber: 'PLIT-2023-001234',
            coverageAmount: 2000000,
            expirationDate: new Date('2024-12-31'),
            status: 'active' as const,
            telemedicineIncluded: true
          }
        }
      }
    ];

    for (const vetData of demoVets) {
      const profile = await this.createVeterinarianProfile(
        vetData.personalInfo,
        vetData.professionalInfo
      );
      
      // Complete onboarding for demo
      const onboardingSteps: OnboardingStep[] = [
        'personal_info',
        'professional_info',
        'license_verification',
        'education_verification',
        'insurance_verification',
        'specialization_assessment',
        'platform_training',
        'educational_training',
        'trial_consultations',
        'final_approval'
      ];

      for (const step of onboardingSteps) {
        await this.updateOnboardingStep(profile.id, step, { status: 'completed' });
      }

      // Update profile to active status
      await this.updateVeterinarianProfile(profile.id, { status: 'active' });
    }
  }
}

export const veterinarianService = new VeterinarianService();