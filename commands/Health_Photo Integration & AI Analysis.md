## 📸 **Photo Integration & AI Analysis**

### **Computer Vision Health Assessment**
```python
# Health photo analysis pipeline
class HealthPhotoAnalyzer:
    def __init__(self):
        self.models = {
            'eye_condition': EyeConditionCNN(),
            'manure_analysis': ManureClassifier(),
            'skin_condition': SkinLesionDetector(),
            'gait_analysis': MovementAnalyzer()
        }
    
    def analyze_health_photo(self, image_path, photo_type):
        """
        Analyze health-related photos for condition assessment
        """
        results = {
            'photo_type': photo_type,
            'analysis_timestamp': datetime.now(),
            'detected_conditions': [],
            'confidence_scores': {},
            'recommendations': []
        }
        
        if photo_type == 'eye':
            results.update(self._analyze_eye_condition(image_path))
        elif photo_type == 'manure':
            results.update(self._analyze_manure_sample(image_path))
        elif photo_type == 'skin':
            results.update(self._analyze_skin_condition(image_path))
        elif photo_type == 'unknown':
            results.update(self._analyze_unknown_condition(image_path))
        
        return results
    
    def _analyze_unknown_condition(self, image_path):
        """Analyze photos when condition is unknown - provide suggestions"""
        analysis = {
            'possible_conditions': [],
            'body_systems_affected': [],
            'urgency_indicators': [],
            'photo_quality_assessment': {},
            'suggested_additional_photos': [],
            'recommended_actions': []
        }
        
        # Run general health assessment
        general_health = self._general_health_screening(image_path)
        analysis['possible_conditions'] = general_health.get('potential_issues', [])
        
        # Assess urgency based on visual cues
        urgency_score = self._assess_urgency_from_photo(image_path)
        if urgency_score > 0.8:
            analysis['urgency_indicators'].append('Immediate veterinary attention recommended')
        elif urgency_score > 0.6:
            analysis['urgency_indicators'].append('Monitor closely, consult teacher/vet within 24 hours')
        else:
            analysis['urgency_indicators'].append('Continue monitoring, document changes')
        
        # Suggest additional documentation
        analysis['suggested_additional_photos'] = self._suggest_additional_photos(image_path)
        
        return analysis
    
    def _general_health_screening(self, image_path):
        """Run general health screening for unknown conditions"""
        # Multi-model approach to identify potential issues
        screening_results = {
            'anatomical_abnormalities': self._detect_anatomical_changes(image_path),
            'color_variations': self._analyze_color_patterns(image_path),
            'texture_changes': self._assess_texture_abnormalities(image_path),
            'size_irregularities': self._detect_size_changes(image_path)
        }
        
        # Aggregate findings into potential conditions
        potential_issues = self._correlate_findings_to_conditions(screening_results)
        
        return {'potential_issues': potential_issues}
    
    def _suggest_additional_photos(self, image_path):
        """Suggest additional photos that would help with diagnosis"""
        suggestions = []
        
        # Analyze current photo to determine what's missing
        current_view = self._identify_photo_perspective(image_path)
        
        if current_view != 'full_body':
            suggestions.append('Full body shot to assess overall condition')
        if current_view != 'close_up':
            suggestions.append('Close-up detail of the affected area')
        if not self._has_comparison_reference(image_path):
            suggestions.append('Photo of normal/unaffected area for comparison')
        
        return suggestions
    
    def _analyze_eye_condition(self, image_path):
        """Analyze eye photos for discharge, irritation, etc."""
        # Implementation for eye condition analysis
        # Returns: discharge_level, irritation_score, recommended_actions
        pass
```

### **Unknown Condition Mobile Interface**
```python
class UnknownConditionMobileUI:
    def __init__(self):
        self.guided_workflow = UnknownConditionWorkflow()
        self.photo_validator = PhotoQualityValidator()
        self.offline_queue = OfflineSubmissionQueue()
    
    def start_unknown_condition_workflow(self):
        """Start guided workflow for documenting unknown conditions"""
        workflow_steps = [
            'initial_observation',
            'photo_documentation',
            'description_capture',
            'priority_assessment',
            'submission_options'
        ]
        
        return self._create_guided_workflow(workflow_steps)
    
    def _create_guided_workflow(self, steps):
        """Create step-by-step guided workflow"""
        workflow = {
            'current_step': 0,
            'total_steps': len(steps),
            'steps': []
        }
        
        for i, step in enumerate(steps):
            step_config = self._get_step_configuration(step)
            step_config['step_number'] = i + 1
            workflow['steps'].append(step_config)
        
        return workflow
    
    def _get_step_configuration(self, step_name):
        """Get configuration for specific workflow step"""
        step_configs = {
            'initial_observation': {
                'title': 'What did you notice?',
                'description': 'Tell us what made you concerned about this animal',
                'input_type': 'multiple_choice_with_other',
                'options': [
                    'Animal looks different than usual',
                    'Unusual behavior or movement',
                    'Changes in eating or drinking',
                    'Something visible on the animal',
                    'Animal seems uncomfortable or in pain',
                    'Other (describe below)'
                ],
                'required': True
            },
            'photo_documentation': {
                'title': 'Document with Photos',
                'description': 'Take clear photos to help experts identify the issue',
                'photo_types': [
                    {'type': 'primary_concern', 'required': True, 'label': 'Main area of concern'},
                    {'type': 'full_animal', 'required': True, 'label': 'Full animal view'},
                    {'type': 'comparison', 'required': False, 'label': 'Normal area for comparison'},
                    {'type': 'additional', 'required': False, 'label': 'Additional angles'}
                ],
                'photo_tips': [
                    'Use good lighting (natural light preferred)',
                    'Keep camera steady for clear focus',
                    'Take photos from multiple angles',
                    'Include size reference if possible'
                ]
            },
            'description_capture': {
                'title': 'Describe What You See',
                'description': 'Provide detailed description of your observations',
                'input_fields': [
                    {'name': 'when_first_noticed', 'type': 'date_select', 'label': 'When did you first notice this?'},
                    {'name': 'changes_over_time', 'type': 'text', 'label': 'Has it changed since you first noticed?'},
                    {'name': 'detailed_description', 'type': 'textarea', 'label': 'Detailed description of what you observe'},
                    {'name': 'animal_behavior', 'type': 'text', 'label': 'How is the animal acting?'},
                    {'name': 'eating_drinking', 'type': 'select', 'label': 'Eating and drinking normally?', 'options': ['Yes', 'No', 'Reduced', 'Unknown']}
                ]
            },
            'priority_assessment': {
                'title': 'How urgent is this?',
                'description': 'Help us understand how quickly this needs attention',
                'urgency_levels': [
                    {'level': 'emergency', 'label': 'Emergency - Animal in distress', 'color': 'red'},
                    {'level': 'urgent', 'label': 'Urgent - Needs attention today', 'color': 'orange'},
                    {'level': 'concern', 'label': 'Concerned - Should be checked soon', 'color': 'yellow'},
                    {'level': 'monitor', 'label': 'Monitoring - Will watch for changes', 'color': 'green'}
                ]
            },
            'submission_options': {
                'title': 'Get Help',
                'description': 'Choose how you\'d like to get help with this unknown condition',
                'help_options': [
                    {'type': 'ai_analysis', 'label': 'AI Analysis (Immediate)', 'description': 'Get immediate AI suggestions'},
                    {'type': 'teacher_review', 'label': 'Teacher Review (24 hours)', 'description': 'Your teacher will review and respond'},
                    {'type': 'expert_consult', 'label': 'Expert Consultation (48-72 hours)', 'description': 'Veterinary expert will provide diagnosis'},
                    {'type': 'monitor_only', 'label': 'Just Monitor', 'description': 'Save record and monitor for changes'}
                ]
            }
        }
        
        return step_configs.get(step_name, {})
    
    def handle_offline_unknown_condition(self, condition_data):
        """Handle unknown condition submission when offline"""
        offline_submission = {
            'submission_id': generate_uuid(),
            'animal_id': condition_data['animal_id'],
            'photos': condition_data['photos'],  # Stored locally
            'description': condition_data['description'],
            'priority_level': condition_data['priority_level'],
            'timestamp': datetime.now(),
            'sync_status': 'pending',
            'help_requested': condition_data['help_options']
        }
        
        # Store locally for sync when online
        self.offline_queue.add_submission(offline_submission)
        
        # Provide offline guidance if emergency
        if condition_data['priority_level'] == 'emergency':
            return self._provide_offline_emergency_guidance()
        
        return {
            'status': 'saved_offline',
            'message': 'Your observation has been saved and will be submitted when you\'re back online',
            'local_id': offline_submission['submission_id']
        }
    
    def _provide_offline_emergency_guidance(self):
        """Provide emergency guidance when offline"""
        return {
            'status': 'emergency_offline',
            'immediate_actions': [
                'Contact your teacher or farm manager immediately',
                'If animal appears to be in severe distress, contact a veterinarian',
                'Monitor the animal closely',
                'Keep other animals away if condition might be contagious',
                'Your photos and notes are saved and will be sent when back online'
            ],
            'emergency_contacts': 'Check your emergency contact list in app settings'
        }
```
```

### **Unknown Condition Workflow**
```python
class UnknownConditionManager:
    def __init__(self):
        self.ai_analyzer = HealthPhotoAnalyzer()
        self.expert_network = ExpertReviewNetwork()
        self.educational_matcher = EducationalCaseMatcher()
    
    def process_unknown_condition(self, health_record_id, photos, student_description):
        """Process unknown condition submission from student"""
        
        # Create unknown condition review record
        review_record = {
            'health_record_id': health_record_id,
            'student_description': student_description,
            'photos': photos,
            'priority_level': self._assess_priority_level(student_description, photos),
            'submission_timestamp': datetime.now()
        }
        
        # Run AI analysis for initial suggestions
        ai_analysis = self._run_ai_screening(photos)
        review_record['ai_suggestions'] = ai_analysis
        
        # Determine review pathway
        if review_record['priority_level'] == 'emergency':
            return self._emergency_pathway(review_record)
        elif review_record['priority_level'] == 'urgent':
            return self._urgent_pathway(review_record)
        else:
            return self._standard_pathway(review_record)
    
    def _assess_priority_level(self, description, photos):
        """Assess priority level based on description and photos"""
        emergency_keywords = [
            'bleeding', 'can\'t stand', 'seizure', 'difficulty breathing',
            'severe pain', 'not eating for days', 'high fever'
        ]
        
        urgent_keywords = [
            'swelling', 'limping', 'discharge', 'unusual behavior',
            'not eating', 'lethargy', 'coughing'
        ]
        
        description_lower = description.lower()
        
        if any(keyword in description_lower for keyword in emergency_keywords):
            return 'emergency'
        elif any(keyword in description_lower for keyword in urgent_keywords):
            return 'urgent'
        else:
            return 'monitor'
    
    def _emergency_pathway(self, review_record):
        """Handle emergency unknown conditions"""
        response = {
            'immediate_actions': [
                'Contact veterinarian immediately',
                'Isolate animal if contagious symptoms present',
                'Monitor vital signs',
                'Document any changes'
            ],
            'contact_info': self._get_emergency_contacts(review_record['location']),
            'follow_up': 'Teacher and veterinarian will be notified immediately'
        }
        
        # Send immediate notifications
        self._send_emergency_notifications(review_record)
        
        return response
    
    def _standard_pathway(self, review_record):
        """Handle standard unknown condition review"""
        
        # Find similar cases for educational value
        similar_cases = self.educational_matcher.find_similar_cases(
            review_record['photos'], 
            review_record['student_description']
        )
        
        # Assign to appropriate reviewer (teacher, expert, AI)
        reviewer = self._assign_reviewer(review_record)
        
        response = {
            'review_assigned_to': reviewer['name'],
            'expected_response_time': reviewer['response_time'],
            'similar_cases': similar_cases,
            'learning_activities': self._suggest_learning_activities(review_record),
            'monitoring_instructions': self._generate_monitoring_instructions(review_record)
        }
        
        return response
    
    def _suggest_learning_activities(self, review_record):
        """Suggest educational activities while waiting for expert review"""
        activities = [
            {
                'type': 'research',
                'title': 'Research Similar Conditions',
                'description': 'Look up conditions with similar symptoms in the disease database',
                'estimated_time': '15-20 minutes'
            },
            {
                'type': 'observation',
                'title': 'Detailed Monitoring Log',
                'description': 'Create detailed observation schedule to track changes',
                'estimated_time': 'Ongoing'
            },
            {
                'type': 'comparison',
                'title': 'Compare with Healthy Animals',
                'description': 'Take photos of healthy animals for comparison',
                'estimated_time': '10 minutes'
            }
        ]
        
        return activities

class ExpertReviewNetwork:
    def __init__(self):
        self.expert_pool = {
            'teachers': [],
            'veterinarians': [],
            'specialists': [],
            'ai_consultants': []
        }
    
    def assign_expert_reviewer(self, unknown_condition_review):
        """Assign appropriate expert based on condition and availability"""
        
        # Determine expertise needed
        required_expertise = self._determine_expertise_needed(unknown_condition_review)
        
        # Find available expert
        available_expert = self._find_available_expert(required_expertise)
        
        # Create review assignment
        assignment = {
            'expert_id': available_expert['id'],
            'expertise_level': available_expert['expertise_level'],
            'estimated_response_time': available_expert['avg_response_time'],
            'assignment_timestamp': datetime.now()
        }
        
        return assignment
    
    def submit_expert_diagnosis(self, review_id, expert_id, diagnosis):
        """Submit expert diagnosis and recommendations"""
        
        expert_response = {
            'review_id': review_id,
            'expert_id': expert_id,
            'diagnosis': diagnosis['condition_name'],
            'confidence_level': diagnosis['confidence'],
            'treatment_recommendations': diagnosis['treatments'],
            'educational_explanation': diagnosis['student_explanation'],
            'follow_up_required': diagnosis.get('follow_up', False),
            'response_timestamp': datetime.now()
        }
        
        # Save expert response
        self._save_expert_response(expert_response)
        
        # Notify student and teacher
        self._notify_stakeholders(expert_response)
        
        # Create learning opportunity
        self._create_learning_case_study(expert_response)
        
        return expert_response

class EducationalCaseMatcher:
    def __init__(self):
        self.case_database = {}
        self.similarity_threshold = 0.7
    
    def find_similar_cases(self, photos, description):
        """Find similar cases for educational purposes"""
        
        # Analyze current case
        case_features = self._extract_case_features(photos, description)
        
        # Search database for similar cases
        similar_cases = []
        for case_id, case_data in self.case_database.items():
            similarity_score = self._calculate_similarity(case_features, case_data['features'])
            
            if similarity_score > self.similarity_threshold:
                similar_cases.append({
                    'case_id': case_id,
                    'similarity_score': similarity_score,
                    'condition': case_data['final_diagnosis'],
                    'outcome': case_data['outcome'],
                    'educational_notes': case_data['learning_points']
                })
        
        # Sort by similarity and return top matches
        similar_cases.sort(key=lambda x: x['similarity_score'], reverse=True)
        return similar_cases[:5]  # Return top 5 matches
    
    def add_resolved_case_to_database(self, case_data):
        """Add resolved unknown condition to educational database"""
        # This builds the database over time for better educational matching
        educational_case = {
            'original_photos': case_data['photos'],
            'student_description': case_data['description'],
            'final_diagnosis': case_data['expert_diagnosis'],
            'expert_explanation': case_data['expert_notes'],
            'learning_points': case_data['educational_takeaways'],
            'resolution_time': case_data['resolution_time'],
            'features': self._extract_case_features(case_data['photos'], case_data['description'])
        }
        
        self.case_database[case_data['case_id']] = educational_case
```
