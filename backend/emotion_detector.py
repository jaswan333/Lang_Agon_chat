"""
Emotion Detection Layer for VoiceAI Chatbot
Detects user emotions from text to adapt response style
"""

import re

def detect_emotion(text):
    """
    Detect emotion from user text using keyword matching and patterns
    Returns: emotion string (frustrated, happy, confused, urgent, sad, excited, neutral)
    """
    if not text:
        return "neutral"
    
    text = text.lower().strip()
    
    # Frustrated indicators
    frustrated_patterns = [
        r"not working", r"doesn't work", r"won't work", r"broken", r"error", r"bug",
        r"again", r"still", r"keep", r"always", r"never works", r"stupid", r"hate",
        r"annoying", r"frustrated", r"irritating", r"terrible", r"awful"
    ]
    
    # Happy indicators  
    happy_patterns = [
        r"wow", r"great", r"awesome", r"amazing", r"perfect", r"excellent", r"fantastic",
        r"love", r"thank you", r"thanks", r"wonderful", r"brilliant", r"nice", r"good job",
        r"worked", r"success", r"finally", r"yay", r"cool"
    ]
    
    # Confused indicators
    confused_patterns = [
        r"don't understand", r"confused", r"what does", r"how does", r"what is",
        r"explain", r"clarify", r"unclear", r"lost", r"stuck", r"help me understand",
        r"what means", r"i'm lost", r"no idea", r"don't get it"
    ]
    
    # Urgent indicators
    urgent_patterns = [
        r"quickly", r"urgent", r"asap", r"immediately", r"fast", r"hurry", r"rush",
        r"deadline", r"emergency", r"right now", r"need now", r"time sensitive"
    ]
    
    # Sad indicators
    sad_patterns = [
        r"sad", r"depressed", r"down", r"upset", r"disappointed", r"failed",
        r"give up", r"hopeless", r"can't do", r"impossible", r"too hard"
    ]
    
    # Excited indicators
    excited_patterns = [
        r"excited", r"can't wait", r"looking forward", r"eager", r"pumped",
        r"thrilled", r"amazing project", r"new feature", r"let's do"
    ]
    
    # Check punctuation for intensity
    exclamation_count = text.count('!')
    question_count = text.count('?')
    caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
    
    # Score emotions
    scores = {
        "frustrated": 0,
        "happy": 0, 
        "confused": 0,
        "urgent": 0,
        "sad": 0,
        "excited": 0
    }
    
    # Pattern matching
    for pattern in frustrated_patterns:
        if re.search(pattern, text):
            scores["frustrated"] += 1
            
    for pattern in happy_patterns:
        if re.search(pattern, text):
            scores["happy"] += 1
            
    for pattern in confused_patterns:
        if re.search(pattern, text):
            scores["confused"] += 1
            
    for pattern in urgent_patterns:
        if re.search(pattern, text):
            scores["urgent"] += 1
            
    for pattern in sad_patterns:
        if re.search(pattern, text):
            scores["sad"] += 1
            
    for pattern in excited_patterns:
        if re.search(pattern, text):
            scores["excited"] += 1
    
    # Punctuation analysis
    if exclamation_count >= 2:
        scores["frustrated"] += 1
        scores["excited"] += 1
        
    if question_count >= 2:
        scores["confused"] += 1
        
    if caps_ratio > 0.3:  # More than 30% caps
        scores["frustrated"] += 1
        scores["urgent"] += 1
    
    # Find highest scoring emotion
    max_emotion = max(scores, key=scores.get)
    max_score = scores[max_emotion]
    
    # Return emotion only if score > 0, otherwise neutral
    return max_emotion if max_score > 0 else "neutral"


def get_personality_prompt(emotion, language="en"):
    """
    Get personality-adapted system prompt based on detected emotion
    """
    
    # Personality modes for different emotions
    personality_modes = {
        "frustrated": {
            "en": "You are a calm, patient AI assistant. The user seems frustrated. Respond with empathy, break down solutions into clear steps, and reassure them that the problem can be solved. Use a gentle, supportive tone.",
            "ta": "நீங்கள் ஒரு அமைதியான, பொறுமையான AI உதவியாளர். பயனர் விரக்தியடைந்துள்ளார். அனுதாபத்துடன் பதிலளித்து, தீர்வுகளை தெளிவான படிகளாக பிரித்து, பிரச்சனை தீர்க்கப்படும் என்று உறுதியளிக்கவும்.",
            "hi": "आप एक शांत, धैर्यवान AI सहायक हैं। उपयोगकर्ता निराश लग रहा है। सहानुभूति के साथ जवाब दें, समाधान को स्पष्ट चरणों में बांटें, और उन्हें आश्वासन दें कि समस्या हल हो सकती है।"
        },
        
        "happy": {
            "en": "You are an energetic, enthusiastic AI assistant. The user is happy! Match their positive energy, celebrate their success, and keep the momentum going with encouraging responses.",
            "ta": "நீங்கள் ஒரு ஆற்றல் மிக்க, உற்சாகமான AI உதவியாளர். பயனர் மகிழ்ச்சியாக இருக்கிறார்! அவர்களின் நேர்மறை ஆற்றலுடன் ஒத்துப்போங்கள், அவர்களின் வெற்றியைக் கொண்டாடுங்கள்.",
            "hi": "आप एक ऊर्जावान, उत्साही AI सहायक हैं। उपयोगकर्ता खुश है! उनकी सकारात्मक ऊर्जा से मेल खाएं, उनकी सफलता का जश्न मनाएं।"
        },
        
        "confused": {
            "en": "You are a patient teacher AI assistant. The user is confused and needs clear explanation. Use simple language, provide examples, break complex concepts into smaller parts, and check their understanding.",
            "ta": "நீங்கள் ஒரு பொறுமையான ஆசிரியர் AI உதவியாளர். பயனர் குழப்பத்தில் இருக்கிறார். எளிய மொழியைப் பயன்படுத்தி, உதாரணங்கள் கொடுத்து, சிக்கலான கருத்துகளை சிறிய பகுதிகளாகப் பிரிக்கவும்.",
            "hi": "आप एक धैर्यवान शिक्षक AI सहायक हैं। उपयोगकर्ता भ्रमित है। सरल भाषा का उपयोग करें, उदाहरण दें, जटिल अवधारणाओं को छोटे भागों में बांटें।"
        },
        
        "urgent": {
            "en": "You are a direct, efficient AI assistant. The user needs quick help. Provide concise, actionable answers. Get straight to the point without unnecessary explanations.",
            "ta": "நீங்கள் ஒரு நேரடியான, திறமையான AI உதவியாளர். பயனருக்கு விரைவான உதவி தேவை. சுருக்கமான, செயல்படக்கூடிய பதில்களை வழங்கவும். தேவையற்ற விளக்கங்கள் இல்லாமல் நேரடியாக சொல்லுங்கள்.",
            "hi": "आप एक प्रत्यक्ष, कुशल AI सहायक हैं। उपयोगकर्ता को तुरंत मदद चाहिए। संक्षिप्त, कार्यात्मक उत्तर दें। अनावश्यक स्पष्टीकरण के बिना सीधे मुद्दे पर आएं।"
        },
        
        "sad": {
            "en": "You are a compassionate, supportive AI assistant. The user seems down. Offer encouragement, positive perspective, and gentle guidance. Be extra kind and understanding.",
            "ta": "நீங்கள் ஒரு இரக்கமுள்ள, ஆதரவான AI உதவியாளர். பயனர் வருத்தமாக இருக்கிறார். ஊக்கம், நேர்மறை பார்வை மற்றும் மென்மையான வழிகாட்டுதலை வழங்கவும்.",
            "hi": "आप एक दयालु, सहायक AI सहायक हैं। उपयोगकर्ता उदास लग रहा है। प्रोत्साहन, सकारात्मक दृष्टिकोण और कोमल मार्गदर्शन प्रदान करें।"
        },
        
        "excited": {
            "en": "You are an enthusiastic AI assistant. The user is excited about something! Share their enthusiasm, provide detailed helpful information, and fuel their passion for learning.",
            "ta": "நீங்கள் ஒரு உற்சாகமான AI உதவியாளர். பயனர் ஏதோ ஒன்றைப் பற்றி உற்சாகமாக இருக்கிறார்! அவர்களின் உற்சாகத்தைப் பகிர்ந்து கொள்ளுங்கள், விரிவான உதவிகரமான தகவல்களை வழங்குங்கள்.",
            "hi": "आप एक उत्साही AI सहायक हैं। उपयोगकर्ता किसी बात को लेकर उत्साहित है! उनके उत्साह को साझा करें, विस्तृत सहायक जानकारी प्रदान करें।"
        },
        
        "neutral": {
            "en": "You are a helpful, professional AI assistant. Provide clear, informative responses while maintaining a friendly and approachable tone.",
            "ta": "நீங்கள் ஒரு உதவிகரமான, தொழில்முறை AI உதவியாளர். நட்பு மற்றும் அணுகக்கூடிய தொனியை பராமரிக்கும் போது தெளிவான, தகவல் நிறைந்த பதில்களை வழங்கவும்.",
            "hi": "आप एक सहायक, पेशेवर AI सहायक हैं। मित्रवत और सुलभ स्वर बनाए रखते हुए स्पष्ट, जानकारीपूर्ण उत्तर प्रदान करें।"
        }
    }
    
    return personality_modes.get(emotion, personality_modes["neutral"]).get(language, personality_modes["neutral"]["en"])


def get_emotion_emoji(emotion):
    """Get emoji representation of emotion for UI display"""
    emotion_emojis = {
        "frustrated": "😤",
        "happy": "😊", 
        "confused": "🤔",
        "urgent": "⚡",
        "sad": "😔",
        "excited": "🤩",
        "neutral": "🙂"
    }
    return emotion_emojis.get(emotion, "🙂")


def get_emotion_color(emotion):
    """Get color code for emotion display in UI"""
    emotion_colors = {
        "frustrated": "#ef4444",  # red
        "happy": "#22c55e",       # green
        "confused": "#f59e0b",    # amber
        "urgent": "#8b5cf6",      # purple
        "sad": "#6b7280",         # gray
        "excited": "#ec4899",     # pink
        "neutral": "#3b82f6"      # blue
    }
    return emotion_colors.get(emotion, "#3b82f6")