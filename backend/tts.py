from gtts import gTTS
import os

def generate_voice(text, lang):
    file_path = os.path.join(os.path.dirname(__file__), "output.mp3")
    tts = gTTS(text=text, lang=lang)
    tts.save(file_path)
    return file_path
