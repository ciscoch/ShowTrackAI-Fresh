# FFA Medical Follow-Up Notification System Configuration
# Comprehensive alert and notification management

import os
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# NOTIFICATION CONFIGURATION CLASSES
# ============================================================================

class NotificationType(Enum):
    """Types of notifications in the system"""
    TASK_ASSIGNED = "task_assigned"
    TASK_REMINDER = "task_reminder"
    TASK_OVERDUE = "task_overdue"
    HEALTH_CONCERN = "health_concern"
    ESCALATION_NEEDED = "escalation_needed"
    COMPLETION_REMINDER = "completion_reminder"
    EDUCATOR_DIGEST = "educator_digest"
    VETERINARY_CONSULTATION = "veterinary_consultation"
    SYSTEM_ALERT = "system_alert"
    EMERGENCY = "emergency"

class PriorityLevel(Enum):
    """Priority levels for notifications"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    EMERGENCY = "emergency"

class DeliveryChannel(Enum):
    """Available notification delivery channels"""
    PUSH_NOTIFICATION = "push"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    DASHBOARD = "dashboard"

@dataclass
class NotificationRule:
    """Configuration for notification delivery rules"""
    notification_type: NotificationType
    priority_level: PriorityLevel
    delivery_channels: List[DeliveryChannel]
    delay_minutes: int = 0
    retry_attempts: int = 3
    escalation_delay_hours: int = 24
    user_roles: List[str] = None
    conditions: Dict = None

# ============================================================================
# NOTIFICATION CONFIGURATION SETTINGS
# ============================================================================

class NotificationConfig:
    """Main notification system configuration"""
    
    # Default notification rules
    DEFAULT_RULES = [
        # Task assignment notifications
        NotificationRule(
            notification_type=NotificationType.TASK_ASSIGNED,
            priority_level=PriorityLevel.MEDIUM,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL],
            user_roles=['student'],
            delay_minutes=0
        ),
        
        # Task reminder notifications
        NotificationRule(
            notification_type=NotificationType.TASK_REMINDER,
            priority_level=PriorityLevel.MEDIUM,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION],
            user_roles=['student'],
            delay_minutes=0,  # Sent at scheduled time
            conditions={'hours_before_due': 24}
        ),
        
        # Overdue task notifications
        NotificationRule(
            notification_type=NotificationType.TASK_OVERDUE,
            priority_level=PriorityLevel.HIGH,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL],
            user_roles=['student', 'instructor'],
            delay_minutes=60,  # 1 hour after due time
            escalation_delay_hours=24
        ),
        
        # Health concern notifications
        NotificationRule(
            notification_type=NotificationType.HEALTH_CONCERN,
            priority_level=PriorityLevel.HIGH,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL],
            user_roles=['student', 'instructor'],
            delay_minutes=0,
            retry_attempts=5
        ),
        
        # Escalation notifications
        NotificationRule(
            notification_type=NotificationType.ESCALATION_NEEDED,
            priority_level=PriorityLevel.URGENT,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL, DeliveryChannel.SMS],
            user_roles=['instructor', 'veterinarian'],
            delay_minutes=0,
            retry_attempts=5
        ),
        
        # Emergency notifications
        NotificationRule(
            notification_type=NotificationType.EMERGENCY,
            priority_level=PriorityLevel.EMERGENCY,
            delivery_channels=[DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL, DeliveryChannel.SMS],
            user_roles=['student', 'instructor', 'veterinarian', 'parent'],
            delay_minutes=0,
            retry_attempts=10
        ),
        
        # Educator digest notifications
        NotificationRule(
            notification_type=NotificationType.EDUCATOR_DIGEST,
            priority_level=PriorityLevel.LOW,
            delivery_channels=[DeliveryChannel.EMAIL],
            user_roles=['instructor'],
            delay_minutes=0,
            conditions={'digest_frequency': 'daily'}
        ),
        
        # Veterinary consultation notifications
        NotificationRule(
            notification_type=NotificationType.VETERINARY_CONSULTATION,
            priority_level=PriorityLevel.MEDIUM,
            delivery_channels=[DeliveryChannel.EMAIL, DeliveryChannel.PUSH_NOTIFICATION],
            user_roles=['veterinarian'],
            delay_minutes=0
        )
    ]
    
    # Notification templates
    NOTIFICATION_TEMPLATES = {
        NotificationType.TASK_ASSIGNED: {
            'title': 'New Health Follow-up Task',
            'body': 'You have been assigned a new health follow-up task for {animal_name}: {task_title}',
            'action_text': 'View Task',
            'action_url': '/tasks/{task_id}'
        },
        
        NotificationType.TASK_REMINDER: {
            'title': 'Follow-up Reminder',
            'body': 'Your follow-up task "{task_title}" for {animal_name} is due {due_time}',
            'action_text': 'Complete Task',
            'action_url': '/tasks/{task_id}'
        },
        
        NotificationType.TASK_OVERDUE: {
            'title': 'Task Overdue',
            'body': 'Your follow-up task "{task_title}" for {animal_name} is now {overdue_time} overdue',
            'action_text': 'Update Now',
            'action_url': '/tasks/{task_id}',
            'urgency_indicator': True
        },
        
        NotificationType.HEALTH_CONCERN: {
            'title': 'Health Concern Detected',
            'body': 'A health concern has been identified for {animal_name}. Review needed: {concern_description}',
            'action_text': 'Review Case',
            'action_url': '/health-records/{record_id}',
            'urgency_indicator': True
        },
        
        NotificationType.ESCALATION_NEEDED: {
            'title': 'Escalation Required',
            'body': 'Student {student_name} needs assistance with {animal_name}. Issue: {escalation_reason}',
            'action_text': 'Assist Student',
            'action_url': '/educator/students/{student_id}',
            'urgency_indicator': True
        },
        
        NotificationType.EMERGENCY: {
            'title': 'EMERGENCY: Immediate Attention Required',
            'body': 'URGENT: {emergency_description} - {animal_name} ({student_name})',
            'action_text': 'Respond Now',
            'action_url': '/emergency/{alert_id}',
            'urgency_indicator': True,
            'sound': 'emergency_alert'
        },
        
        NotificationType.EDUCATOR_DIGEST: {
            'title': 'Daily Health Summary',
            'body': 'Your chapter has {active_cases} active health cases. {urgent_count} need immediate attention.',
            'action_text': 'View Dashboard',
            'action_url': '/educator/dashboard'
        },
        
        NotificationType.VETERINARY_CONSULTATION: {
            'title': 'Consultation Request',
            'body': 'Student {student_name} has requested veterinary consultation for {animal_name}',
            'action_text': 'Review Request',
            'action_url': '/consultations/{consultation_id}'
        }
    }
    
    # User notification preferences by role
    ROLE_PREFERENCES = {
        'student': {
            'default_channels': [DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL],
            'quiet_hours': {'start': '22:00', 'end': '07:00'},
            'digest_frequency': None,  # Students don't get digests
            'emergency_override': True  # Emergency notifications ignore quiet hours
        },
        
        'instructor': {
            'default_channels': [DeliveryChannel.PUSH_NOTIFICATION, DeliveryChannel.EMAIL],
            'quiet_hours': {'start': '23:00', 'end': '06:00'},
            'digest_frequency': 'daily',
            'digest_time': '08:00',
            'emergency_override': True,
            'sms_enabled': True
        },
        
        'veterinarian': {
            'default_channels': [DeliveryChannel.EMAIL, DeliveryChannel.SMS],
            'quiet_hours': None,  # Veterinarians available 24/7 for emergencies
            'digest_frequency': 'weekly',
            'digest_time': '09:00',
            'emergency_override': True,
            'consultation_immediate': True
        },
        
        'parent': {
            'default_channels': [DeliveryChannel.EMAIL, DeliveryChannel.SMS],
            'quiet_hours': {'start': '22:00', 'end': '07:00'},
            'digest_frequency': None,
            'emergency_override': True,
            'emergency_only': True  # Only receive emergency notifications
        }
    }
    
    # Escalation rules
    ESCALATION_RULES = {
        'task_overdue': {
            'trigger_delay_hours': 24,
            'escalation_chain': ['instructor', 'chapter_advisor', 'parent'],
            'max_escalations': 3
        },
        
        'health_concern': {
            'trigger_delay_hours': 4,
            'escalation_chain': ['instructor', 'veterinarian'],
            'max_escalations': 2
        },
        
        'emergency': {
            'trigger_delay_hours': 0,  # Immediate
            'escalation_chain': ['instructor', 'veterinarian', 'parent', 'chapter_advisor'],
            'max_escalations': 4,
            'parallel_notifications': True
        },
        
        'student_unresponsive': {
            'trigger_delay_hours': 48,
            'escalation_chain': ['instructor', 'parent'],
            'max_escalations': 2
        }
    }

# ============================================================================
# NOTIFICATION PROCESSOR
# ============================================================================

class NotificationProcessor:
    """Main notification processing engine"""
    
    def __init__(self, config: NotificationConfig = None):
        self.config = config or NotificationConfig()
        self.delivery_services = self._initialize_delivery_services()
    
    def _initialize_delivery_services(self):
        """Initialize notification delivery services"""
        return {
            DeliveryChannel.PUSH_NOTIFICATION: PushNotificationService(),
            DeliveryChannel.EMAIL: EmailService(),
            DeliveryChannel.SMS: SMSService(),
            DeliveryChannel.IN_APP: InAppNotificationService(),
            DeliveryChannel.DASHBOARD: DashboardNotificationService()
        }
    
    def create_notification(
        self,
        notification_type: NotificationType,
        user_id: int,
        data: Dict,
        priority_override: PriorityLevel = None
    ) -> Dict:
        """Create and queue notification for delivery"""
        
        # Get notification rule
        rule = self._get_notification_rule(notification_type, user_id)
        if not rule:
            logger.warning(f"No notification rule found for {notification_type}")
            return None
        
        # Override priority if specified
        if priority_override:
            rule.priority_level = priority_override
        
        # Get user preferences
        user_preferences = self._get_user_preferences(user_id)
        
        # Check if notification should be sent based on preferences
        if not self._should_send_notification(rule, user_preferences, data):
            logger.info(f"Notification skipped for user {user_id} based on preferences")
            return None
        
        # Create notification record
        notification = {
            'id': self._generate_notification_id(),
            'type': notification_type,
            'user_id': user_id,
            'priority': rule.priority_level,
            'data': data,
            'created_at': datetime.now(),
            'scheduled_delivery': self._calculate_delivery_time(rule, user_preferences),
            'delivery_channels': self._resolve_delivery_channels(rule, user_preferences),
            'retry_attempts': rule.retry_attempts,
            'status': 'pending'
        }
        
        # Queue for delivery
        return self._queue_notification(notification)
    
    def process_notification_queue(self):
        """Process pending notifications from queue"""
        pending_notifications = self._get_pending_notifications()
        
        for notification in pending_notifications:
            try:
                self._deliver_notification(notification)
            except Exception as e:
                logger.error(f"Failed to deliver notification {notification['id']}: {e}")
                self._handle_delivery_failure(notification, str(e))
    
    def _deliver_notification(self, notification: Dict):
        """Deliver notification through configured channels"""
        delivery_results = {}
        
        for channel in notification['delivery_channels']:
            try:
                service = self.delivery_services[channel]
                result = service.send_notification(notification)
                delivery_results[channel.value] = result
                
                if result.get('success'):
                    logger.info(f"Notification {notification['id']} delivered via {channel.value}")
                else:
                    logger.warning(f"Failed to deliver notification {notification['id']} via {channel.value}")
                    
            except Exception as e:
                logger.error(f"Error delivering notification via {channel.value}: {e}")
                delivery_results[channel.value] = {'success': False, 'error': str(e)}
        
        # Update notification status
        self._update_notification_status(notification['id'], delivery_results)
        
        return delivery_results
    
    def _get_notification_rule(self, notification_type: NotificationType, user_id: int) -> NotificationRule:
        """Get notification rule for type and user"""
        user_role = self._get_user_role(user_id)
        
        for rule in self.config.DEFAULT_RULES:
            if (rule.notification_type == notification_type and 
                (not rule.user_roles or user_role in rule.user_roles)):
                return rule
        
        return None
    
    def _should_send_notification(self, rule: NotificationRule, user_preferences: Dict, data: Dict) -> bool:
        """Determine if notification should be sent based on rules and preferences"""
        
        # Check if user has disabled this type of notification
        if not user_preferences.get('enabled', True):
            return False
        
        # Check quiet hours (unless emergency override)
        if (rule.priority_level != PriorityLevel.EMERGENCY and 
            not user_preferences.get('emergency_override', False)):
            if self._is_quiet_hours(user_preferences):
                return False
        
        # Check notification frequency limits
        if self._exceeds_frequency_limit(rule.notification_type, user_preferences):
            return False
        
        # Check custom conditions
        if rule.conditions:
            if not self._evaluate_conditions(rule.conditions, data):
                return False
        
        return True
    
    def _is_quiet_hours(self, user_preferences: Dict) -> bool:
        """Check if current time is within user's quiet hours"""
        quiet_hours = user_preferences.get('quiet_hours')
        if not quiet_hours:
            return False
        
        now = datetime.now().time()
        start_time = datetime.strptime(quiet_hours['start'], '%H:%M').time()
        end_time = datetime.strptime(quiet_hours['end'], '%H:%M').time()
        
        if start_time <= end_time:
            return start_time <= now <= end_time
        else:  # Quiet hours span midnight
            return now >= start_time or now <= end_time
    
    def create_escalation_notification(self, original_notification_id: str, escalation_level: int):
        """Create escalation notification when original is not acknowledged"""
        
        original = self._get_notification(original_notification_id)
        if not original:
            return None
        
        # Get escalation rule
        escalation_rule = self._get_escalation_rule(original['type'])
        if not escalation_rule:
            return None
        
        # Determine escalation target
        escalation_target = self._get_escalation_target(
            escalation_rule, 
            escalation_level,
            original['user_id']
        )
        
        if not escalation_target:
            logger.warning(f"No escalation target for level {escalation_level}")
            return None
        
        # Create escalation notification
        escalation_data = original['data'].copy()
        escalation_data['escalation_level'] = escalation_level
        escalation_data['original_notification_id'] = original_notification_id
        escalation_data['escalation_reason'] = 'No response to original notification'
        
        return self.create_notification(
            NotificationType.ESCALATION_NEEDED,
            escalation_target['user_id'],
            escalation_data,
            priority_override=PriorityLevel.URGENT
        )

# ============================================================================
# DELIVERY SERVICES
# ============================================================================

class PushNotificationService:
    """Push notification delivery service"""
    
    def __init__(self):
        self.fcm_key = os.getenv('FCM_SERVER_KEY')
        self.apns_config = self._load_apns_config()
    
    def send_notification(self, notification: Dict) -> Dict:
        """Send push notification"""
        try:
            user_devices = self._get_user_devices(notification['user_id'])
            
            if not user_devices:
                return {'success': False, 'error': 'No devices registered'}
            
            template = self._get_notification_template(notification)
            
            results = []
            for device in user_devices:
                if device['platform'] == 'ios':
                    result = self._send_apns(device['token'], template, notification)
                else:
                    result = self._send_fcm(device['token'], template, notification)
                
                results.append(result)
            
            success_count = sum(1 for r in results if r.get('success'))
            
            return {
                'success': success_count > 0,
                'delivered_count': success_count,
                'total_devices': len(user_devices),
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _send_fcm(self, device_token: str, template: Dict, notification: Dict) -> Dict:
        """Send FCM notification to Android device"""
        import requests
        
        headers = {
            'Authorization': f'key={self.fcm_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'to': device_token,
            'notification': {
                'title': template['title'],
                'body': template['body'],
                'sound': template.get('sound', 'default'),
                'badge': 1
            },
            'data': {
                'notification_id': notification['id'],
                'type': notification['type'].value,
                'action_url': template.get('action_url', ''),
                **notification['data']
            },
            'priority': 'high' if notification['priority'] in [PriorityLevel.URGENT, PriorityLevel.EMERGENCY] else 'normal'
        }
        
        response = requests.post(
            'https://fcm.googleapis.com/fcm/send',
            headers=headers,
            json=payload
        )
        
        return {
            'success': response.status_code == 200,
            'response': response.json() if response.status_code == 200 else None,
            'error': response.text if response.status_code != 200 else None
        }

class EmailService:
    """Email notification delivery service"""
    
    def __init__(self):
        self.smtp_config = self._load_smtp_config()
        self.template_engine = EmailTemplateEngine()
    
    def send_notification(self, notification: Dict) -> Dict:
        """Send email notification"""
        try:
            user_email = self._get_user_email(notification['user_id'])
            if not user_email:
                return {'success': False, 'error': 'No email address on file'}
            
            # Generate email content
            email_content = self.template_engine.render_email(
                notification['type'],
                notification['data']
            )
            
            # Send email
            result = self._send_email(
                to_email=user_email,
                subject=email_content['subject'],
                html_body=email_content['html'],
                text_body=email_content['text'],
                priority=notification['priority']
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Email notification error: {e}")
            return {'success': False, 'error': str(e)}

class SMSService:
    """SMS notification delivery service"""
    
    def __init__(self):
        self.twilio_client = self._initialize_twilio()
    
    def send_notification(self, notification: Dict) -> Dict:
        """Send SMS notification"""
        try:
            user_phone = self._get_user_phone(notification['user_id'])
            if not user_phone:
                return {'success': False, 'error': 'No phone number on file'}
            
            # Generate SMS content
            template = self._get_notification_template(notification)
            sms_body = self._format_sms_body(template, notification['data'])
            
            # Send SMS via Twilio
            message = self.twilio_client.messages.create(
                body=sms_body,
                from_=os.getenv('TWILIO_PHONE_NUMBER'),
                to=user_phone
            )
            
            return {
                'success': True,
                'message_sid': message.sid,
                'status': message.status
            }
            
        except Exception as e:
            logger.error(f"SMS notification error: {e}")
            return {'success': False, 'error': str(e)}

# ============================================================================
# DIGEST NOTIFICATION GENERATOR
# ============================================================================

class DigestGenerator:
    """Generate digest notifications for educators"""
    
    def generate_daily_digest(self, educator_id: int) -> Dict:
        """Generate daily digest for educator"""
        
        # Get educator's chapter data
        chapter_data = self._get_chapter_data(educator_id)
        
        # Calculate digest metrics
        digest_data = {
            'educator_name': chapter_data['educator_name'],
            'chapter_name': chapter_data['chapter_name'],
            'date': datetime.now().strftime('%B %d, %Y'),
            'total_active_cases': chapter_data['active_cases_count'],
            'urgent_cases': chapter_data['urgent_cases'],
            'overdue_tasks': chapter_data['overdue_tasks'],
            'completed_yesterday': chapter_data['completed_yesterday'],
            'upcoming_deadlines': chapter_data['upcoming_deadlines'],
            'student_engagement_summary': chapter_data['engagement_summary'],
            'alerts_requiring_attention': chapter_data['pending_alerts'],
            'recommendations': self._generate_recommendations(chapter_data)
        }
        
        return digest_data
    
    def _generate_recommendations(self, chapter_data: Dict) -> List[str]:
        """Generate actionable recommendations for educator"""
        recommendations = []
        
        if chapter_data['overdue_tasks_count'] > 3:
            recommendations.append(
                f"Consider contacting students with overdue tasks: {chapter_data['overdue_students']}"
            )
        
        if chapter_data['urgent_cases_count'] > 0:
            recommendations.append(
                "Review urgent health cases requiring immediate attention"
            )
        
        if chapter_data['low_engagement_students']:
            recommendations.append(
                f"Check in with students showing low engagement: {chapter_data['low_engagement_students']}"
            )
        
        if chapter_data['successful_completions'] > 5:
            recommendations.append(
                "Acknowledge students with successful task completions this week"
            )
        
        return recommendations

# ============================================================================
# EMERGENCY ALERT SYSTEM
# ============================================================================

class EmergencyAlertSystem:
    """Handle emergency health alerts with special protocols"""
    
    def __init__(self):
        self.emergency_contacts = self._load_emergency_contacts()
        self.notification_processor = NotificationProcessor()
    
    def trigger_emergency_alert(
        self,
        student_id: int,
        animal_id: int,
        emergency_description: str,
        severity_level: int = 5
    ) -> Dict:
        """Trigger emergency alert with immediate notification to all relevant parties"""
        
        emergency_data = {
            'student_id': student_id,
            'animal_id': animal_id,
            'emergency_description': emergency_description,
            'severity_level': severity_level,
            'timestamp': datetime.now().isoformat(),
            'alert_id': self._generate_alert_id()
        }
        
        # Get emergency contact list
        emergency_contacts = self._get_emergency_contacts(student_id)
        
        # Send immediate notifications to all contacts
        notification_results = []
        
        for contact in emergency_contacts:
            result = self.notification_processor.create_notification(
                NotificationType.EMERGENCY,
                contact['user_id'],
                emergency_data,
                priority_override=PriorityLevel.EMERGENCY
            )
            notification_results.append(result)
        
        # Log emergency alert
        self._log_emergency_alert(emergency_data, notification_results)
        
        return {
            'alert_id': emergency_data['alert_id'],
            'notifications_sent': len(notification_results),
            'emergency_contacts_notified': [c['name'] for c in emergency_contacts],
            'status': 'emergency_alert_triggered'
        }
    
    def _get_emergency_contacts(self, student_id: int) -> List[Dict]:
        """Get emergency contact list for student"""
        contacts = []
        
        # Student's instructor
        instructor = self._get_student_instructor(student_id)
        if instructor:
            contacts.append({
                'user_id': instructor['id'],
                'name': instructor['name'],
                'role': 'instructor',
                'contact_priority': 1
            })
        
        # Student's parents/guardians
        parents = self._get_student_parents(student_id)
        for parent in parents:
            contacts.append({
                'user_id': parent['id'],
                'name': parent['name'],
                'role': 'parent',
                'contact_priority': 1
            })
        
        # Chapter veterinarians
        veterinarians = self._get_chapter_veterinarians(student_id)
        for vet in veterinarians:
            contacts.append({
                'user_id': vet['id'],
                'name': vet['name'],
                'role': 'veterinarian',
                'contact_priority': 2
            })
        
        # Chapter advisor
        advisor = self._get_chapter_advisor(student_id)
        if advisor:
            contacts.append({
                'user_id': advisor['id'],
                'name': advisor['name'],
                'role': 'advisor',
                'contact_priority': 3
            })
        
        return sorted(contacts, key=lambda x: x['contact_priority'])

# ============================================================================
# NOTIFICATION ANALYTICS
# ============================================================================

class NotificationAnalytics:
    """Track and analyze notification effectiveness"""
    
    def calculate_delivery_metrics(self, time_period: int = 30) -> Dict:
        """Calculate notification delivery metrics"""
        
        metrics = {
            'total_notifications_sent': self._count_notifications_sent(time_period),
            'delivery_success_rate': self._calculate_delivery_success_rate(time_period),
            'channel_effectiveness': self._analyze_channel_effectiveness(time_period),
            'response_rates': self._calculate_response_rates(time_period),
            'escalation_frequency': self._calculate_escalation_frequency(time_period),
            'user_engagement': self._analyze_user_engagement(time_period)
        }
        
        return metrics
    
    def generate_notification_report(self) -> Dict:
        """Generate comprehensive notification system report"""
        
        report = {
            'system_health': self._assess_system_health(),
            'delivery_performance': self.calculate_delivery_metrics(),
            'user_satisfaction': self._measure_user_satisfaction(),
            'recommendations': self._generate_system_recommendations()
        }
        
        return report

# Configuration export
NOTIFICATION_CONFIG = NotificationConfig()
NOTIFICATION_PROCESSOR = NotificationProcessor(NOTIFICATION_CONFIG)
EMERGENCY_ALERT_SYSTEM = EmergencyAlertSystem()
DIGEST_GENERATOR = DigestGenerator()
NOTIFICATION_ANALYTICS = NotificationAnalytics()
