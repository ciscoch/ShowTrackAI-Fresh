# 🤖 AI Agent Node Configuration Guide

## 📋 Overview

This guide provides detailed configuration for the **AI Agent** node in N8N, which combines multiple AI capabilities including OpenAI Chat Model, Zep Memory, and custom tools for agricultural education analysis.

---

## 🏗️ AI Agent Node Architecture

### **Node Connections (as shown in screenshot):**
```
AI Agent Node
├── 🧠 OpenAI Chat Model (GPT-4 Turbo)
├── 💾 Zep Memory (Student context retention)
├── 🔧 Custom Tools (4 specialized agricultural tools)
└── 📊 Embeddings (Text embedding for similarity)
```

---

## ⚙️ Detailed Node Configurations

### **1. AI Agent Node - Main Configuration**

#### **Basic Settings:**
```json
{
  "name": "Agricultural Education AI Agent",
  "description": "Expert AI agent for comprehensive agricultural education analysis, competency assessment, and personalized learning recommendations",
  "model": "gpt-4-turbo",
  "temperature": 0.3,
  "maxTokens": 2000
}
```

#### **System Instructions:**
```
You are an expert Agricultural Education AI Agent specializing in livestock management, animal health, and FFA competency standards (AS.07.01 - AS.07.04).

Your capabilities include:
- Deep analysis of agricultural learning activities
- FFA competency mapping and progression tracking
- Knowledge graph construction for agricultural concepts
- Personalized learning pathway generation
- Quality assessment of hands-on agricultural experiences

You work with high school FFA students learning through practical experiences with cattle, sheep, swine, goats, and poultry. Always provide structured, actionable insights that advance agricultural competency development.

When analyzing student activities, use your specialized tools:
1. agricultural_concept_extractor - for identifying agricultural concepts
2. ffa_competency_assessor - for mapping to FFA standards
3. learning_quality_analyzer - for assessing learning depth
4. recommendation_generator - for creating personalized recommendations

Always provide reasoning for your analysis and maintain high confidence in agricultural domain expertise.
```

#### **Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "student_activity": {
      "type": "string",
      "description": "The student's agricultural learning activity description"
    },
    "event_type": {
      "type": "string", 
      "description": "Type of agricultural activity (health_check, journal_entry, etc.)"
    },
    "competency_focus": {
      "type": "string",
      "description": "Target FFA competency standard (AS.07.01-AS.07.04)"
    },
    "animal_context": {
      "type": "string",
      "description": "Animal species involved in the activity"
    },
    "learning_environment": {
      "type": "string",
      "description": "Location where learning occurred (farm, lab, etc.)"
    }
  },
  "required": ["student_activity", "event_type"]
}
```

---

### **2. OpenAI Chat Model Configuration**

#### **Model Settings:**
- **Model**: `gpt-4-turbo` (for superior agricultural reasoning)
- **Temperature**: `0.3` (balanced creativity with accuracy)
- **Max Tokens**: `2000` (sufficient for detailed analysis)
- **Frequency Penalty**: `0.0`
- **Presence Penalty**: `0.0`

#### **Credentials:**
- **OpenAI API Key**: Your OpenAI API key with GPT-4 access
- **Organization ID**: (Optional) Your OpenAI organization ID

---

### **3. Zep Memory Configuration**

#### **Memory Settings:**
```json
{
  "sessionId": "student_{student_id}_{timestamp}",
  "apiUrl": "https://api.getzep.com",
  "memoryType": "perpetual_memory",
  "maxTokens": 4000,
  "returnMessages": true,
  "returnMetadata": true
}
```

#### **Session Management:**
- **Session ID Pattern**: `student_{student_id}_{session_timestamp}`
- **Memory Window**: 90 days for long-term learning progression
- **Entity Extraction**: Enabled for agricultural concepts
- **Relationship Building**: Enabled for competency progression

#### **Credentials:**
- **Zep API Key**: Your Zep Cloud API key
- **Project UUID**: Your Zep project identifier

---

### **4. Custom Tools Configuration**

#### **Tool 1: Agricultural Concept Extractor**
```json
{
  "name": "agricultural_concept_extractor",
  "description": "Extracts and categorizes agricultural concepts from learning activities",
  "parameters": {
    "type": "object",
    "properties": {
      "concepts": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {
              "type": "string",
              "description": "Name of the agricultural concept"
            },
            "category": {
              "type": "string",
              "enum": ["health", "nutrition", "reproduction", "management", "safety"],
              "description": "Category of agricultural knowledge"
            },
            "complexity": {
              "type": "string", 
              "enum": ["basic", "intermediate", "advanced"],
              "description": "Complexity level of the concept"
            },
            "confidence": {
              "type": "number",
              "minimum": 0,
              "maximum": 1,
              "description": "Confidence in concept identification"
            }
          },
          "required": ["name", "category", "complexity", "confidence"]
        }
      }
    },
    "required": ["concepts"]
  }
}
```

#### **Tool 2: FFA Competency Assessor**
```json
{
  "name": "ffa_competency_assessor",
  "description": "Maps learning activities to FFA competency standards and assesses demonstration level",
  "parameters": {
    "type": "object",
    "properties": {
      "competency_mapping": {
        "type": "object",
        "properties": {
          "primary_competency": {
            "type": "string",
            "enum": ["AS.07.01", "AS.07.02", "AS.07.03", "AS.07.04", "General"],
            "description": "Primary FFA competency demonstrated"
          },
          "demonstration_level": {
            "type": "string",
            "enum": ["observation", "application", "mastery"],
            "description": "Level of competency demonstration"
          },
          "sub_competencies": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Specific sub-competencies addressed"
          },
          "progression_indicator": {
            "type": "string",
            "description": "Student's progression toward competency mastery"
          }
        },
        "required": ["primary_competency", "demonstration_level"]
      }
    },
    "required": ["competency_mapping"]
  }
}
```

#### **Tool 3: Learning Quality Analyzer**
```json
{
  "name": "learning_quality_analyzer", 
  "description": "Assesses the quality and depth of agricultural learning experiences",
  "parameters": {
    "type": "object",
    "properties": {
      "quality_assessment": {
        "type": "object",
        "properties": {
          "depth_level": {
            "type": "string",
            "enum": ["surface", "strategic", "deep"],
            "description": "Depth of learning demonstrated"
          },
          "practical_application": {
            "type": "string",
            "enum": ["low", "medium", "high"],
            "description": "Level of hands-on practical application"
          },
          "critical_thinking": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Evidence of critical thinking and analysis"
          },
          "quality_score": {
            "type": "number",
            "minimum": 0,
            "maximum": 100,
            "description": "Overall quality score for the learning experience"
          }
        },
        "required": ["depth_level", "practical_application", "quality_score"]
      }
    },
    "required": ["quality_assessment"]
  }
}
```

#### **Tool 4: Recommendation Generator**
```json
{
  "name": "recommendation_generator",
  "description": "Generates personalized learning recommendations based on analysis", 
  "parameters": {
    "type": "object",
    "properties": {
      "recommendations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "Clear, actionable recommendation title"
            },
            "description": {
              "type": "string", 
              "description": "Detailed explanation of the recommended activity"
            },
            "priority": {
              "type": "string",
              "enum": ["high", "medium", "low"],
              "description": "Recommendation priority level"
            },
            "competency_alignment": {
              "type": "string",
              "description": "Which FFA competency this recommendation addresses"
            },
            "time_estimate": {
              "type": "string",
              "description": "Estimated time to complete the recommendation"
            }
          },
          "required": ["title", "description", "priority"]
        }
      }
    },
    "required": ["recommendations"]
  }
}
```

---

### **5. Embeddings Configuration**

#### **OpenAI Embeddings Settings:**
- **Model**: `text-embedding-ada-002`
- **Chunk Size**: `1000` tokens
- **Chunk Overlap**: `200` tokens
- **Use Case**: Semantic similarity for concept relationships

#### **Usage in Workflow:**
- Generate embeddings for student activities
- Store in vector database for similarity search
- Enable concept relationship mapping
- Support knowledge graph construction

---

## 🔗 Connection Flow

### **Input Data Flow:**
```
Webhook Input → Process & Enrich Event → AI Agent Node
                                          ↓
Student Memory Context ← Zep Memory ← Retrieve Student Memory
                                          ↓
AI Agent Analysis → Process Results → Store to Database
```

### **AI Agent Internal Flow:**
```
Input Processing → System Prompt → Tool Selection → Tool Execution → Result Synthesis → Output Generation
```

---

## 📊 Environment Variables

### **Required Environment Variables:**
```bash
# OpenAI Configuration
OPENAI_CREDENTIAL_ID=your-n8n-openai-credential-id
OPENAI_API_KEY=your-openai-api-key

# Zep Memory Configuration
ZEP_API_URL=https://api.getzep.com
ZEP_API_KEY=your-zep-api-key
ZEP_PROJECT_UUID=your-zep-project-uuid

# Supabase Configuration
SUPABASE_CREDENTIAL_ID=your-n8n-supabase-credential-id
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# N8N Webhook Configuration
N8N_WEBHOOK_BASE=https://your-n8n-instance.app.n8n.cloud/webhook-test
```

---

## 🧪 Testing Configuration

### **Test Input Example:**
```json
{
  "student_id": "test-student-123",
  "event_type": "health_check",
  "content": "Performed comprehensive health assessment on Holstein heifer #47. Observed normal vital signs: temperature 101.2°F, heart rate 72 bpm, respiratory rate 28 breaths/min. Animal showed excellent body condition score of 7/9. Checked for signs of mastitis using palpation technique learned in class. No abnormalities detected. Recorded findings in health logbook and noted improvement since last vaccination.",
  "competency": "AS.07.01",
  "animal_id": "heifer-47",
  "animal_species": "Cattle",
  "location": "Main Barn",
  "supervisor": "Dr. Johnson"
}
```

### **Expected AI Agent Response:**
```json
{
  "success": true,
  "data": {
    "concepts_extracted": 8,
    "quality_score": 92,
    "ai_confidence": 95,
    "competency_mapped": "AS.07.01",
    "tools_utilized": [
      "agricultural_concept_extractor",
      "ffa_competency_assessor", 
      "learning_quality_analyzer",
      "recommendation_generator"
    ],
    "recommendations_count": 3,
    "reasoning_provided": true
  }
}
```

---

## ⚡ Performance Optimization

### **Response Time Targets:**
- **AI Agent Processing**: <15 seconds
- **Tool Execution**: <5 seconds per tool
- **Memory Retrieval**: <3 seconds
- **Database Storage**: <2 seconds

### **Cost Management:**
- **Model Selection**: GPT-4 Turbo for optimal cost/performance
- **Token Optimization**: Structured prompts and responses
- **Caching**: Zep memory for context reuse
- **Batch Processing**: Multiple students in single workflow

---

## 🔍 Monitoring & Debugging

### **Key Metrics to Monitor:**
- Tool usage frequency and success rates
- Quality score distributions
- Competency mapping accuracy
- Recommendation acceptance rates
- Agent reasoning quality

### **Debug Information:**
- Tool execution logs
- Prompt/response pairs
- Error handling and fallbacks
- Memory session continuity

---

## 🎯 Success Criteria

### **AI Agent Performance Indicators:**
- **Tool Utilization**: All 4 tools used appropriately
- **Analysis Depth**: Quality scores >80 for detailed activities
- **Competency Accuracy**: >90% correct FFA standard mapping
- **Recommendation Relevance**: High student engagement with suggestions
- **Reasoning Quality**: Clear, educational explanations provided

---

**🌟 Your AI Agent will provide the most sophisticated agricultural education analysis available, combining multiple AI capabilities for comprehensive student assessment and personalized learning pathway generation!**