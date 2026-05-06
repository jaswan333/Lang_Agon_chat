from flask import Blueprint, request, jsonify
import sys, os, base64
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from stt import speech_to_text
from chatbot import get_response
from tts import generate_voice

english_bp = Blueprint("english", __name__)

@english_bp.route("/english", methods=["POST"])
def english():
    try:
        audio = request.files["audio"]
        ext = os.path.splitext(audio.filename)[1] or ".webm"
        audio_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), f"temp_audio{ext}")
        audio.save(audio_path)
        user_text = speech_to_text(audio_path, language="en")
        response_text = get_response(user_text, "You are a helpful assistant. Always reply in English only.")
        audio_file = generate_voice(response_text, "en")
        with open(audio_file, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
        return jsonify({"user": user_text, "bot": response_text, "audio": audio_b64})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@english_bp.route("/english/text", methods=["POST"])
def english_text():
    try:
        data = request.get_json()
        user_text = data.get("text", "").strip()
        if not user_text:
            return jsonify({"error": "No text provided"}), 400
        response_text = get_response(user_text, "You are a helpful assistant. Always reply in English only.")
        audio_file = generate_voice(response_text, "en")
        with open(audio_file, "rb") as f:
            audio_b64 = base64.b64encode(f.read()).decode("utf-8")
        return jsonify({"bot": response_text, "audio": audio_b64})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
