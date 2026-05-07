from flask import Blueprint, request, jsonify
import sys, os, base64
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from stt import speech_to_text
from chatbot import get_response
from tts import generate_voice

hindi_bp = Blueprint("hindi", __name__)

@hindi_bp.route("/hindi", methods=["POST"])
def hindi():
    try:
        audio = request.files["audio"]
        ext = os.path.splitext(audio.filename)[1] or ".webm"
        audio_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), f"temp_audio{ext}")
        audio.save(audio_path)
        user_text = speech_to_text(audio_path, language="hi")
        print(f"[HINDI STT] >>> {user_text}")
        
        # Get emotion-aware response
        ai_result = get_response(user_text, "You are a helpful assistant. Always reply in Hindi language only. Never use any other language.", "hi")
        response_text = ai_result["response"]
        
        audio_file = generate_voice(response_text, "hi")
        with open(audio_file, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
            
        return jsonify({
            "user": user_text, 
            "bot": response_text, 
            "audio": audio_b64,
            "emotion": ai_result["emotion"],
            "emoji": ai_result["emoji"],
            "color": ai_result["color"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
