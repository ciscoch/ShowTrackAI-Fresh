/**
 * AI Analysis Service for ShowTrackAI Agricultural Education Platform
 * 
 * Integrates with OpenAI GPT-4 Vision and Chat models to provide:
 * - Health photo analysis
 * - Weight prediction from photos
 * - Personalized learning recommendations
 * - Feed efficiency analysis
 * - Educational content generation
 */

import OpenAI from 'openai';

export interface PhotoAnalysisResult {
  analysis: string;
  confidenceScore: number;
  educationalPoints: string[];
  recommendedActions: string[];
  severityAssessment: number;
  bodyConditionScore?: number;
  healthIndicators?: string[];
  suggestedFollowUp?: string[];
}

export interface WeightPredictionResult {
  estimatedWeight: number;
  confidenceRange: [number, number];
  confidenceScore: number;
  bodyConditionScore?: number;
  estimationNotes: string;
  methodology: string;
}

export interface LearningRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'nutrition' | 'health' | 'education' | 'documentation' | 'skills' | 'general';
  estimatedDuration: string;
  requiredResources: string[];
  learningOutcomes: string[];
  aetStandards?: string[];
  ffaCompetencies?: string[];
}

export interface FeedAnalysisResult {
  insights: string[];
  recommendations: string[];
  trends: {
    fcrTrend: 'improving' | 'stable' | 'declining';
    costTrend: 'improving' | 'stable' | 'declining';
    efficiencyTrend: 'improving' | 'stable' | 'declining';
  };
  benchmarkComparison: {
    industryAverage: number;
    performanceCategory: 'excellent' | 'good' | 'average' | 'poor';
    percentileRank: number;
  };
  actionableInsights: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class AiAnalysisService {
  private openai: OpenAI;
  private isInitialized: boolean = false;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('OpenAI API key not provided - AI analysis features will be disabled');
      this.isInitialized = false;
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.isInitialized = true;
  }

  async getStatus(): Promise<boolean> {
    if (!this.isInitialized) return false;
    
    try {
      // Test API connectivity with a simple request
      await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      console.error('OpenAI API status check failed:', error);
      return false;
    }
  }

  /**
   * Analyze health photos using GPT-4 Vision
   */
  async analyzeHealthPhoto(
    photoUrl: string,
    symptoms: string[],
    notes: string,
    animalSpecies: string = 'livestock'
  ): Promise<PhotoAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('AI Analysis Service not initialized - missing API key');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are a veterinary AI assistant helping FFA students learn about animal health. 
            Analyze the photo and provide educational guidance for ${animalSpecies}. Focus on:
            1. Observable physical signs and body condition
            2. Potential health conditions (educational, not diagnostic)
            3. Recommended monitoring and care steps
            4. When to consult a veterinarian
            5. Learning opportunities for the student
            6. Body condition scoring (1-9 scale)
            7. Normal vs abnormal findings
            
            Always emphasize that this is educational guidance and not veterinary diagnosis.
            Encourage students to consult with their instructor or veterinarian for serious concerns.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Student observations for ${animalSpecies}:
                Symptoms noted: ${symptoms.length > 0 ? symptoms.join(', ') : 'None reported'}
                Additional notes: ${notes || 'None provided'}
                
                Please analyze this image and provide educational guidance, including:
                - Observable physical characteristics
                - Body condition assessment (1-9 scale)
                - Any concerning signs
                - Educational learning points
                - Recommended next steps
                - When to seek professional help`
              },
              {
                type: "image_url",
                image_url: {
                  url: photoUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1200,
        temperature: 0.3, // Lower temperature for more consistent medical guidance
      });

      const analysis = response.choices[0].message.content || '';
      
      return {
        analysis,
        confidenceScore: this.extractConfidenceScore(analysis),
        educationalPoints: this.extractEducationalPoints(analysis),
        recommendedActions: this.extractRecommendedActions(analysis),
        severityAssessment: this.assessSeverity(analysis, symptoms),
        bodyConditionScore: this.extractBodyConditionScore(analysis),
        healthIndicators: this.extractHealthIndicators(analysis),
        suggestedFollowUp: this.extractFollowUpActions(analysis)
      };
    } catch (error) {
      console.error('AI photo analysis error:', error);
      throw new Error('Failed to analyze photo: ' + error.message);
    }
  }

  /**
   * Predict animal weight from photo
   */
  async predictWeight(
    photoUrl: string,
    species: string,
    breed?: string,
    age?: number,
    gender?: string
  ): Promise<WeightPredictionResult> {
    if (!this.isInitialized) {
      throw new Error('AI Analysis Service not initialized - missing API key');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert livestock weight estimation specialist. 
            Analyze the photo and estimate the animal's weight based on:
            - Body condition score (1-9 scale)
            - Frame size and skeletal structure
            - Muscle development
            - Species and breed-specific characteristics
            - Age and gender considerations
            - Visible physical proportions
            
            Provide weight estimates in pounds with confidence ranges.
            Include your methodology and key visual indicators used.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Animal details:
                Species: ${species}
                ${breed ? `Breed: ${breed}` : ''}
                ${age ? `Age: ${age} months` : ''}
                ${gender ? `Gender: ${gender}` : ''}
                
                Please estimate this animal's weight and provide:
                - Estimated weight in pounds
                - Confidence range (low-high)
                - Body condition score (1-9)
                - Key visual indicators used
                - Methodology explanation
                - Confidence level in your estimate`
              },
              {
                type: "image_url",
                image_url: {
                  url: photoUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 600,
        temperature: 0.2,
      });

      const estimation = response.choices[0].message.content || '';
      const weightData = this.parseWeightEstimation(estimation);
      
      return {
        estimatedWeight: weightData.weight,
        confidenceRange: weightData.range,
        confidenceScore: weightData.confidence,
        bodyConditionScore: weightData.bcs,
        estimationNotes: estimation,
        methodology: this.extractMethodology(estimation)
      };
    } catch (error) {
      console.error('Weight prediction error:', error);
      throw new Error('Failed to predict weight: ' + error.message);
    }
  }

  /**
   * Generate personalized learning recommendations
   */
  async generateLearningRecommendations(
    userId: string,
    memoryContext: any,
    activities: any[],
    competencies: any[]
  ): Promise<LearningRecommendation[]> {
    if (!this.isInitialized) {
      throw new Error('AI Analysis Service not initialized - missing API key');
    }

    try {
      const prompt = `Based on this FFA student's agricultural education progress, generate 5 personalized learning recommendations:

STUDENT CONTEXT:
Memory Context: ${JSON.stringify(memoryContext, null, 2)}
Recent Activities: ${JSON.stringify(activities.slice(0, 10), null, 2)}
Competency Levels: ${JSON.stringify(competencies, null, 2)}

REQUIREMENTS:
Generate 5 specific, actionable learning recommendations that:
1. Address identified skill gaps
2. Build on current strengths and interests
3. Align with FFA curriculum standards and AET competencies
4. Include hands-on, practical activities
5. Progress toward advanced competencies
6. Consider individual learning style and pace
7. Include time estimates and required resources

FORMAT each recommendation as:
- Title: Clear, engaging title
- Description: Detailed explanation (100-150 words)
- Priority: high/medium/low
- Category: nutrition/health/education/documentation/skills/general
- Duration: Estimated time to complete
- Resources: List of required materials/tools
- Learning Outcomes: Expected skills/knowledge gained
- AET Standards: Relevant standards codes
- FFA Competencies: Related FFA competencies

Focus on practical, engaging activities that match the student's current level and interests.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert agricultural education specialist creating personalized learning paths for FFA students. Focus on practical, engaging activities that build real-world skills."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';
      return this.parseRecommendations(content);
    } catch (error) {
      console.error('Learning recommendations error:', error);
      throw new Error('Failed to generate recommendations: ' + error.message);
    }
  }

  /**
   * Analyze feed efficiency trends and provide insights
   */
  async analyzeFeedEfficiency(
    animalId: string,
    feedData: any[],
    species: string,
    targetGoals?: any
  ): Promise<FeedAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('AI Analysis Service not initialized - missing API key');
    }

    try {
      const prompt = `Analyze this feed efficiency data for a ${species} in an FFA student's SAE project:

FEED DATA:
${JSON.stringify(feedData, null, 2)}

TARGET GOALS:
${targetGoals ? JSON.stringify(targetGoals, null, 2) : 'No specific targets set'}

ANALYSIS REQUIREMENTS:
1. Identify key trends in feed conversion ratio (FCR)
2. Cost efficiency analysis and trends
3. Compare to industry standards for ${species}
4. Identify performance patterns and anomalies
5. Provide specific, actionable recommendations
6. Educational opportunities from the data
7. Short-term and long-term optimization strategies

SPECIES-SPECIFIC CONSIDERATIONS:
- Typical FCR ranges for ${species}
- Seasonal variations and factors
- Common management practices
- Cost optimization strategies
- Performance benchmarks

Provide insights that help the student learn about feed management, cost control, and livestock performance optimization.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an animal nutrition expert helping FFA students optimize feed efficiency and understand livestock performance data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const content = response.choices[0].message.content || '';
      return this.parseFeedAnalysis(content);
    } catch (error) {
      console.error('Feed efficiency analysis error:', error);
      throw new Error('Failed to analyze feed efficiency: ' + error.message);
    }
  }

  /**
   * Generate educational content based on activity or observation
   */
  async generateEducationalContent(
    topic: string,
    context: any,
    learningLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<{
    content: string;
    keyPoints: string[];
    activities: string[];
    resources: string[];
    assessmentQuestions: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('AI Analysis Service not initialized - missing API key');
    }

    try {
      const prompt = `Create educational content for FFA students about: ${topic}

CONTEXT:
${JSON.stringify(context, null, 2)}

LEARNING LEVEL: ${learningLevel}

REQUIREMENTS:
1. Create engaging, educational content (300-500 words)
2. Include 5-7 key learning points
3. Suggest 3-5 hands-on activities
4. Recommend relevant resources
5. Provide 3-5 assessment questions
6. Align with FFA curriculum standards
7. Include real-world applications
8. Use age-appropriate language

Make the content practical, engaging, and directly applicable to SAE projects.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an agricultural education expert creating engaging, practical content for FFA students."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.6,
      });

      const content = response.choices[0].message.content || '';
      return this.parseEducationalContent(content);
    } catch (error) {
      console.error('Educational content generation error:', error);
      throw new Error('Failed to generate educational content: ' + error.message);
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private extractConfidenceScore(analysis: string): number {
    const confidenceMatch = analysis.match(/(\d+)%\s*confiden/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]) / 100;
    }
    
    // Infer confidence from certainty language
    const certaintyWords = {
      'definitely': 0.9,
      'clearly': 0.9,
      'obviously': 0.9,
      'likely': 0.7,
      'probably': 0.7,
      'appears': 0.6,
      'seems': 0.6,
      'possibly': 0.5,
      'might': 0.5,
      'could': 0.4,
      'uncertain': 0.3,
      'unclear': 0.3
    };

    const lowerAnalysis = analysis.toLowerCase();
    for (const [word, confidence] of Object.entries(certaintyWords)) {
      if (lowerAnalysis.includes(word)) {
        return confidence;
      }
    }
    
    return 0.6; // Default confidence
  }

  private extractEducationalPoints(analysis: string): string[] {
    const points: string[] = [];
    const lines = analysis.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (
        trimmed.includes('learn') || 
        trimmed.includes('observe') || 
        trimmed.includes('note') ||
        trimmed.includes('important') ||
        trimmed.includes('remember') ||
        trimmed.includes('key')
      )) {
        points.push(trimmed);
      }
    });
    
    return points.slice(0, 6); // Top 6 educational points
  }

  private extractRecommendedActions(analysis: string): string[] {
    const actions: string[] = [];
    const actionWords = ['should', 'recommend', 'suggest', 'monitor', 'check', 'consult', 'consider', 'try'];
    const lines = analysis.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && actionWords.some(word => trimmed.toLowerCase().includes(word))) {
        actions.push(trimmed);
      }
    });
    
    return actions.slice(0, 5);
  }

  private assessSeverity(analysis: string, symptoms: string[]): number {
    let severity = 1; // Base severity
    
    // Check for emergency keywords
    const emergencyWords = ['emergency', 'immediate', 'urgent', 'critical', 'severe', 'serious'];
    const lowerAnalysis = analysis.toLowerCase();
    
    emergencyWords.forEach(word => {
      if (lowerAnalysis.includes(word)) {
        severity = Math.max(severity, 4);
      }
    });
    
    // Check symptom count and severity
    if (symptoms.length > 3) severity = Math.max(severity, 3);
    
    const concerningSymptoms = [
      'not eating', 'lethargy', 'difficulty breathing', 'unusual discharge',
      'severe pain', 'bleeding', 'swelling', 'fever', 'dehydration'
    ];
    
    symptoms.forEach(symptom => {
      if (concerningSymptoms.some(cs => symptom.toLowerCase().includes(cs))) {
        severity = Math.max(severity, 3);
      }
    });
    
    return Math.min(severity, 5);
  }

  private extractBodyConditionScore(analysis: string): number | undefined {
    const bcsMatch = analysis.match(/body condition score[:\s]*(\d+(?:\.\d+)?)/i);
    if (bcsMatch) {
      const score = parseFloat(bcsMatch[1]);
      return score >= 1 && score <= 9 ? score : undefined;
    }
    
    // Look for BCS abbreviation
    const bcsAbbrevMatch = analysis.match(/BCS[:\s]*(\d+(?:\.\d+)?)/i);
    if (bcsAbbrevMatch) {
      const score = parseFloat(bcsAbbrevMatch[1]);
      return score >= 1 && score <= 9 ? score : undefined;
    }
    
    return undefined;
  }

  private extractHealthIndicators(analysis: string): string[] {
    const indicators: string[] = [];
    const healthTerms = [
      'body condition', 'muscle development', 'fat coverage', 'skin condition',
      'coat quality', 'eye clarity', 'posture', 'gait', 'breathing',
      'appetite', 'hydration', 'temperature'
    ];
    
    const lowerAnalysis = analysis.toLowerCase();
    healthTerms.forEach(term => {
      if (lowerAnalysis.includes(term)) {
        indicators.push(term);
      }
    });
    
    return indicators;
  }

  private extractFollowUpActions(analysis: string): string[] {
    const actions: string[] = [];
    const followUpWords = ['follow up', 'monitor', 'watch', 'continue', 'recheck', 'schedule'];
    const lines = analysis.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && followUpWords.some(word => trimmed.toLowerCase().includes(word))) {
        actions.push(trimmed);
      }
    });
    
    return actions.slice(0, 3);
  }

  private parseWeightEstimation(estimation: string): any {
    const weightMatch = estimation.match(/(\d+(?:\.\d+)?)\s*(?:pounds|lbs|lb)/i);
    const rangeMatch = estimation.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    const bcsMatch = estimation.match(/body condition score[:\s]*(\d+(?:\.\d+)?)/i);
    const confidenceMatch = estimation.match(/(\d+)%\s*confiden/i);
    
    return {
      weight: weightMatch ? parseFloat(weightMatch[1]) : null,
      range: rangeMatch ? [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])] : null,
      bcs: bcsMatch ? parseFloat(bcsMatch[1]) : null,
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.7,
    };
  }

  private extractMethodology(estimation: string): string {
    const methodologyKeywords = ['based on', 'using', 'methodology', 'approach', 'estimated by'];
    const lines = estimation.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (methodologyKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
        return trimmed;
      }
    }
    
    return 'Visual assessment based on body condition and proportions';
  }

  private parseRecommendations(content: string): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];
    const sections = content.split(/\d+\.\s+/);
    
    sections.forEach((section, index) => {
      if (section.trim() && index > 0) {
        const lines = section.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const title = lines[0].trim();
          const description = lines.slice(1).join(' ').trim();
          
          recommendations.push({
            id: `rec_${Date.now()}_${index}`,
            title,
            description,
            priority: index <= 2 ? 'high' : 'medium',
            category: this.categorizeRecommendation(section),
            estimatedDuration: this.extractDuration(section),
            requiredResources: this.extractResources(section),
            learningOutcomes: this.extractLearningOutcomes(section),
            aetStandards: this.extractAETStandards(section),
            ffaCompetencies: this.extractFFACompetencies(section)
          });
        }
      }
    });
    
    return recommendations;
  }

  private categorizeRecommendation(text: string): 'nutrition' | 'health' | 'education' | 'documentation' | 'skills' | 'general' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('feed') || lowerText.includes('nutrition')) return 'nutrition';
    if (lowerText.includes('health') || lowerText.includes('veterinary')) return 'health';
    if (lowerText.includes('skill') || lowerText.includes('learn')) return 'education';
    if (lowerText.includes('record') || lowerText.includes('document')) return 'documentation';
    if (lowerText.includes('practice') || lowerText.includes('technique')) return 'skills';
    
    return 'general';
  }

  private extractDuration(text: string): string {
    const durationMatch = text.match(/(\d+)\s*(hour|day|week|month)/i);
    return durationMatch ? `${durationMatch[1]} ${durationMatch[2]}s` : '1-2 hours';
  }

  private extractResources(text: string): string[] {
    const resourceKeywords = ['need', 'require', 'use', 'tool', 'equipment', 'material'];
    const resources: string[] = [];
    
    const lines = text.split('\n');
    lines.forEach(line => {
      if (resourceKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        resources.push(line.trim());
      }
    });
    
    return resources.length > 0 ? resources : ['Basic supplies', 'Recording materials'];
  }

  private extractLearningOutcomes(text: string): string[] {
    const outcomeKeywords = ['learn', 'understand', 'develop', 'improve', 'master'];
    const outcomes: string[] = [];
    
    const lines = text.split('\n');
    lines.forEach(line => {
      if (outcomeKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        outcomes.push(line.trim());
      }
    });
    
    return outcomes.length > 0 ? outcomes : ['Practical skill development'];
  }

  private extractAETStandards(text: string): string[] {
    const aetMatch = text.match(/AS\.\d+\.\d+\.\d+/g);
    return aetMatch || [];
  }

  private extractFFACompetencies(text: string): string[] {
    const ffaMatch = text.match(/FFA\.\d+\.\d+/g);
    return ffaMatch || [];
  }

  private parseFeedAnalysis(content: string): FeedAnalysisResult {
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    const lines = content.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.toLowerCase().includes('trend') || trimmed.toLowerCase().includes('insight')) {
        currentSection = 'insights';
      } else if (trimmed.toLowerCase().includes('recommend') || trimmed.toLowerCase().includes('suggest')) {
        currentSection = 'recommendations';
      }
      
      if (currentSection === 'insights' && !trimmed.match(/^\d+\./)) {
        insights.push(trimmed);
      } else if (currentSection === 'recommendations' && !trimmed.match(/^\d+\./)) {
        recommendations.push(trimmed);
      }
    });
    
    return {
      insights,
      recommendations,
      trends: this.extractTrends(content),
      benchmarkComparison: this.extractBenchmarks(content),
      actionableInsights: this.extractActionableInsights(content)
    };
  }

  private extractTrends(content: string): any {
    const lowerContent = content.toLowerCase();
    
    return {
      fcrTrend: lowerContent.includes('improving fcr') || lowerContent.includes('better conversion') ? 'improving' :
                lowerContent.includes('declining fcr') || lowerContent.includes('worse conversion') ? 'declining' : 'stable',
      costTrend: lowerContent.includes('lower cost') || lowerContent.includes('cost savings') ? 'improving' :
                 lowerContent.includes('higher cost') || lowerContent.includes('increased cost') ? 'declining' : 'stable',
      efficiencyTrend: lowerContent.includes('more efficient') || lowerContent.includes('better efficiency') ? 'improving' :
                       lowerContent.includes('less efficient') || lowerContent.includes('worse efficiency') ? 'declining' : 'stable'
    };
  }

  private extractBenchmarks(content: string): any {
    const industryMatch = content.match(/industry average[:\s]*(\d+(?:\.\d+)?)/i);
    const percentileMatch = content.match(/(\d+)(?:th|st|nd|rd)?\s*percentile/i);
    
    return {
      industryAverage: industryMatch ? parseFloat(industryMatch[1]) : 6.5,
      performanceCategory: this.determinePerformanceCategory(content),
      percentileRank: percentileMatch ? parseInt(percentileMatch[1]) : 50
    };
  }

  private determinePerformanceCategory(content: string): 'excellent' | 'good' | 'average' | 'poor' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('excellent') || lowerContent.includes('outstanding')) return 'excellent';
    if (lowerContent.includes('good') || lowerContent.includes('above average')) return 'good';
    if (lowerContent.includes('poor') || lowerContent.includes('below average')) return 'poor';
    
    return 'average';
  }

  private extractActionableInsights(content: string): any {
    const lines = content.split('\n');
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.toLowerCase().includes('immediate') || trimmed.toLowerCase().includes('now')) {
        immediate.push(trimmed);
      } else if (trimmed.toLowerCase().includes('short term') || trimmed.toLowerCase().includes('next week')) {
        shortTerm.push(trimmed);
      } else if (trimmed.toLowerCase().includes('long term') || trimmed.toLowerCase().includes('future')) {
        longTerm.push(trimmed);
      }
    });
    
    return { immediate, shortTerm, longTerm };
  }

  private parseEducationalContent(content: string): any {
    const lines = content.split('\n');
    const keyPoints: string[] = [];
    const activities: string[] = [];
    const resources: string[] = [];
    const assessmentQuestions: string[] = [];
    
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (trimmed.toLowerCase().includes('key point') || trimmed.toLowerCase().includes('important')) {
        currentSection = 'keyPoints';
      } else if (trimmed.toLowerCase().includes('activit') || trimmed.toLowerCase().includes('exercise')) {
        currentSection = 'activities';
      } else if (trimmed.toLowerCase().includes('resource') || trimmed.toLowerCase().includes('reference')) {
        currentSection = 'resources';
      } else if (trimmed.toLowerCase().includes('question') || trimmed.toLowerCase().includes('assessment')) {
        currentSection = 'assessmentQuestions';
      }
      
      if (currentSection && !trimmed.match(/^\d+\./) && !trimmed.toLowerCase().includes('key point') && 
          !trimmed.toLowerCase().includes('activit') && !trimmed.toLowerCase().includes('resource') && 
          !trimmed.toLowerCase().includes('question')) {
        
        switch (currentSection) {
          case 'keyPoints':
            keyPoints.push(trimmed);
            break;
          case 'activities':
            activities.push(trimmed);
            break;
          case 'resources':
            resources.push(trimmed);
            break;
          case 'assessmentQuestions':
            assessmentQuestions.push(trimmed);
            break;
        }
      }
    });
    
    return {
      content,
      keyPoints,
      activities,
      resources,
      assessmentQuestions
    };
  }
}

export default AiAnalysisService;