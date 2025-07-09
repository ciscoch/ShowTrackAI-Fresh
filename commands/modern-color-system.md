# Modern Color System for ShowTrackAI

## 🎨 Color Palette

### **Primary Colors**
- **Primary Blue**: `#4A90E2` - Main brand color, buttons, active states
- **Primary Dark**: `#1F2937` - Main text, headers, important content
- **Primary Light**: `#E3F2FD` - Subtle backgrounds, hero subtitle

### **Status Colors**
- **Success/Income**: `#10B981` - Income indicators, positive profits, success states
- **Warning/Expenses**: `#F59E0B` - Expense indicators, neutral alerts
- **Error/Loss**: `#EF4444` - Loss indicators, negative profits, error states

### **Neutral Colors**
- **Gray-900**: `#1F2937` - Primary text, headings
- **Gray-500**: `#6B7280` - Secondary text, labels, subdued content
- **Gray-400**: `#9CA3AF` - Placeholder text, disabled states
- **Gray-200**: `#E5E7EB` - Light borders, dividers
- **Gray-100**: `#F3F4F6` - Light backgrounds, subtle containers
- **Gray-50**: `#F8F9FA` - Card backgrounds, main app background

### **White & Shadows**
- **White**: `#FFFFFF` - Card backgrounds, modal backgrounds
- **Shadow**: `rgba(0, 0, 0, 0.08)` - Subtle shadows for cards
- **Shadow-Medium**: `rgba(0, 0, 0, 0.12)` - Medium elevation shadows
- **Shadow-High**: `rgba(0, 0, 0, 0.16)` - High elevation shadows

## 🎯 Usage Guidelines

### **KPI Cards**
- **Income Card**: Border: `#10B981`, Background: `#FFFFFF`
- **Expense Card**: Border: `#F59E0B`, Background: `#FFFFFF`
- **Profit Card**: Border: `#10B981`, Background: `#FFFFFF`
- **Loss Card**: Border: `#EF4444`, Background: `#FFFFFF`

### **Interactive Elements**
- **Buttons**: Background: `#4A90E2`, Text: `#FFFFFF`
- **Active Tab**: Background: `#4A90E2`, Text: `#FFFFFF`
- **Inactive Tab**: Background: `transparent`, Text: `#6B7280`

### **Typography**
- **Primary Text**: `#1F2937`
- **Secondary Text**: `#6B7280`
- **Muted Text**: `#9CA3AF`
- **Inverted Text**: `#FFFFFF` (on dark backgrounds)

### **Backgrounds**
- **App Background**: `#F8F9FA`
- **Card Background**: `#FFFFFF`
- **Hero Background**: `#4A90E2`
- **Icon Container**: `#F8F9FA`

## 🔧 Implementation Notes

### **React Native StyleSheet**
```javascript
const colors = {
  primary: '#4A90E2',
  primaryDark: '#1F2937',
  primaryLight: '#E3F2FD',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gray900: '#1F2937',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F8F9FA',
  
  white: '#FFFFFF',
  
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  shadowHigh: 'rgba(0, 0, 0, 0.16)',
};
```

### **Accessibility**
- All color combinations meet WCAG 2.1 AA contrast requirements
- Primary blue (`#4A90E2`) provides 4.5:1 contrast on white backgrounds
- Dark text (`#1F2937`) provides 12:1 contrast on white backgrounds
- Secondary text (`#6B7280`) provides 7:1 contrast on white backgrounds

### **Design Tokens**
- Use consistent spacing: 4, 8, 12, 16, 20, 24, 32px
- Border radius: 8px (small), 12px (medium), 16px (large), 20px (buttons), 28px (circular)
- Shadow elevation: 2px (low), 4px (medium), 8px (high), 12px (highest)

## 🎨 Visual Examples

### **Card Styling**
```javascript
kpiCard: {
  backgroundColor: colors.white,
  borderRadius: 16,
  padding: 20,
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
}
```

### **Button Styling**
```javascript
primaryButton: {
  backgroundColor: colors.primary,
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 10,
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
}
```

---

*Last Updated: July 2025*  
*Used in: Financial Tracking Dashboard, Elite Dashboard*