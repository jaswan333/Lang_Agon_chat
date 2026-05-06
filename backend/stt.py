import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LANG_PROMPTS = {
    "ta": "இந்த ஆடியோ தமிழில் உள்ளது. தமிழ் மொழியில் மட்டும் transcribe செய்யவும்.",
    "hi": "यह ऑडियो हिंदी में है। केवल हिंदी में transcribe करें।",
    "en": "This audio is in English."
}

def speech_to_text(audio_path, language=None):
    with open(audio_path, "rb") as f:
        data = f.read()

    result = client.audio.transcriptions.create(
        file=(os.path.basename(audio_path), data, "audio/webm"),
        model="whisper-large-v3",
        language=language,
        prompt=LANG_PROMPTS.get(language, ""),
        response_format="text",
        temperature=0.0
    )
    return result
