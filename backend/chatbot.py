import os
from groq import Groq
from dotenv import load_dotenv
from emotion_detector import detect_emotion, get_personality_prompt

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_response(text, lang_instruction="", language="en"):
    """
    Get AI response with emotion-aware personality adaptation
    
    Args:
        text: User input text
        lang_instruction: Base language instruction
        language: Language code (en, ta, hi)
    
    Returns:
        dict: {"response": str, "emotion": str, "emoji": str, "color": str}
    """
    
    # Detect emotion from user text
    emotion = detect_emotion(text)
    
    # Get personality-adapted system prompt
    emotion_prompt = get_personality_prompt(emotion, language)
    
    # Combine base language instruction with emotion-aware prompt
    system_prompt = f"{lang_instruction}\n\n{emotion_prompt}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": text}
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    
    from emotion_detector import get_emotion_emoji, get_emotion_color
    
    return {
        "response": response.choices[0].message.content,
        "emotion": emotion,
        "emoji": get_emotion_emoji(emotion),
        "color": get_emotion_color(emotion)
    }
