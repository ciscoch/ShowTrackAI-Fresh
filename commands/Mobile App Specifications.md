## 📱 **Mobile App Specifications**

### **Offline Capability**
```python
class OfflineHealthRecording:
    def __init__(self):
        self.local_storage = SQLiteDatabase('health_records_offline.db')
        self.sync_queue = []
        self.photo_queue = []
    
    def record_health_observation_offline(self, observation_data):
        """Record health data when offline"""
        # Store locally with sync flag
        observation_data['sync_status'] = 'pending'
        observation_data['created_offline'] = True
        
        self.local_storage.insert_health_record(observation_data)
        self.sync_queue.append(observation_data['id'])
    
    def sync_when_online(self):
        """Sync offline records when connection restored"""
        for record_id in self.sync_queue:
            try:
                self._sync_record_to_cloud(record_id)
                self._mark_as_synced(record_id)
                self.sync_queue.remove(record_id)
            except SyncException as e:
                self._handle_sync_error(record_id, e)
    
    def compress_photos_for_sync(self, photo_path):
        """Compress photos for efficient syncing"""
        # Implement photo compression for mobile data savings
        pass
```

### **Field-Optimized UX**

#### **Interface Design Principles**
- **Large Touch Targets**: Minimum 44pt touch targets for use with work gloves
- **High Contrast**: Readable in bright sunlight conditions
- **Simple Navigation**: Minimal steps to record critical information
- **Voice Input**: Hands-free note taking capability
- **Quick Actions**: Swipe gestures for common actions

#### **Photo Capture Optimization**
```python
class FieldPhotoCapture:
    def __init__(self):
        self.photo_guidelines = {
            'eye_condition': {
                'distance': '6-12 inches',
                'lighting': 'natural_indirect',
                'angle': 'straight_on',
                'focus_point': 'center_of_eye'
            },
            'manure_sample': {
                'distance': '12-18 inches',
                'lighting': 'natural_direct',
                'angle': 'overhead',
                'include_scale': True
            }
        }
    
    def guide_photo_capture(self, photo_type):
        """Provide real-time guidance for photo capture"""
        guidelines = self.photo_guidelines.get(photo_type, {})
        
        # Show overlay with guidelines
        # Provide audio instructions
        # Auto-focus and exposure recommendations
        pass
    
    def validate_photo_quality_realtime(self, image_data):
        """Real-time photo quality assessment"""
        quality_score = self._assess_image_quality(image_data)
        
        if quality_score < 0.7:
            return {
                'acceptable': False,
                'suggestions': self._get_improvement_suggestions(image_data)
            }
        else:
            return {'acceptable': True}
```

### **Emergency Features**
```python
class EmergencyHealthFeatures:
    def __init__(self):
        self.emergency_contacts = {}
        self.emergency_protocols = {}
    
    def detect_emergency_condition(self, health_record):
        """Detect if health condition requires immediate attention"""
        emergency_indicators = [
            'temperature > 106',
            'severe_diarrhea + dehydration',
            'difficulty_breathing',
            'seizures',
            'inability_to_stand'
        ]
        
        # Check against emergency indicators
        # Return emergency level and recommendations
        pass
    
    def quick_vet_contact(self, animal_id, emergency_type):
        """Quick access to veterinary contacts"""
        # Get veterinarian contact info
        # Pre-fill emergency message
        # Include animal health summary
        pass
```

---
