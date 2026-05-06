🎤 Multilingual Voice Chatbot (Tamil 🇮🇳 | English 🇬🇧 | Hindi 🇮🇳)
📌 Project Description

This project is a Voice-Based Multilingual Chatbot where users can:

🎙️ Speak in Tamil, English, or Hindi
💬 Interact with an AI chatbot
🔊 Receive voice responses in the same selected language

👉 Each language runs as a separate chat system (no language detection used).

🎯 Features
✅ Separate chat interfaces for Tamil, English, Hindi
✅ Voice input using microphone
✅ AI-generated responses
✅ Voice output using gTTS
✅ Simple & attractive UI
✅ Easy-to-understand modular structure
🏗️ System Architecture
[ User (Select Language) ]
            ↓
     [ Record Voice ]
            ↓
  [ Speech-to-Text (Whisper) ]
            ↓
     [ AI Chat Processing ]
            ↓
   [ Text-to-Speech (gTTS) ]
            ↓
        [ Audio Output ]
🛠️ Tech Stack
🔹 Backend
Python
Flask
🔹 AI & Audio Processing
Whisper (Speech-to-Text)
OpenAI API (Chatbot)
gTTS (Text-to-Speech)
🔹 Frontend
HTML
CSS (Modern UI)
JavaScript (Audio recording + API calls)
📂 Project Structure
voice-chatbot/
│
├── backend/
│   ├── app.py
│   ├── stt.py
│   ├── chatbot.py
│   ├── tts.py
│   └── routes/
│       ├── tamil.py
│       ├── english.py
│       └── hindi.py
│
├── frontend/
│   ├── index.html        # Language selection
│   ├── tamil.html
│   ├── english.html
│   ├── hindi.html
│   ├── style.css
│   └── script.js
│
├── requirements.txt
└── README.md
⚙️ Setup Instructions
1️⃣ Clone the Repository
git clone https://github.com/your-username/voice-chatbot.git
cd voice-chatbot
2️⃣ Create Virtual Environment
python -m venv venv

Activate:

venv\Scripts\activate     # Windows
source venv/bin/activate  # Mac/Linux
3️⃣ Install Dependencies
pip install -r requirements.txt
4️⃣ Add API Key

Create .env file:

OPENAI_API_KEY=your_api_key_here
📦 requirements.txt
flask
openai
whisper
gtts
pydub
python-dotenv
🔧 Backend Implementation
🔹 Speech-to-Text (stt.py)
import whisper

model = whisper.load_model("base")

def speech_to_text(audio_path):
    result = model.transcribe(audio_path)
    return result["text"]
🔹 Chatbot (chatbot.py)
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def get_response(text):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": text}]
    )
    return response['choices'][0]['message']['content']
🔹 Text-to-Speech (tts.py)
from gtts import gTTS

def generate_voice(text, lang):
    file_path = "output.mp3"
    tts = gTTS(text=text, lang=lang)
    tts.save(file_path)
    return file_path
🌐 Flask API (app.py)
from flask import Flask, request, send_file
from stt import speech_to_text
from chatbot import get_response
from tts import generate_voice

app = Flask(__name__)

def process_chat(audio, lang):
    text = speech_to_text(audio)
    response = get_response(text)
    audio_file = generate_voice(response, lang)
    return audio_file

@app.route("/tamil", methods=["POST"])
def tamil():
    audio = request.files["audio"]
    return send_file(process_chat(audio, "ta"))

@app.route("/english", methods=["POST"])
def english():
    audio = request.files["audio"]
    return send_file(process_chat(audio, "en"))

@app.route("/hindi", methods=["POST"])
def hindi():
    audio = request.files["audio"]
    return send_file(process_chat(audio, "hi"))

if __name__ == "__main__":
    app.run(debug=True)
🎨 Frontend Implementation
🔹 index.html (Language Selection)
<h1>Select Language</h1>
<a href="tamil.html">Tamil</a>
<a href="english.html">English</a>
<a href="hindi.html">Hindi</a>
🔹 Example Chat Page (tamil.html)
<h2>தமிழ் Chat</h2>
<button onclick="startRecording()">🎤 Speak</button>
<audio id="responseAudio" controls></audio>

<script src="script.js"></script>
🔹 script.js
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    let chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", blob);

        const response = await fetch("/tamil", {
            method: "POST",
            body: formData
        });

        const audioBlob = await response.blob();
        document.getElementById("responseAudio").src = URL.createObjectURL(audioBlob);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 4000);
}
🔹 style.css (Simple Attractive UI)
body {
    font-family: Arial;
    text-align: center;
    background: linear-gradient(to right, #667eea, #764ba2);
    color: white;
}

button {
    padding: 15px 25px;
    font-size: 18px;
    border: none;
    border-radius: 10px;
    background: #ff7eb3;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #ff4e91;
}
▶️ Running the Project
Start Backend
cd backend
python app.py
Open Frontend

Open frontend/index.html in browser.

🧪 Testing Flow
Open index page
Select language (Tamil / English / Hindi)
Click 🎤 Speak
Speak your query
Hear AI response in same language
🚧 Known Limitations
gTTS requires internet
Tamil voice may sound robotic
No real-time streaming (fixed recording duration)
🔮 Future Enhancements
🎤 Real-time voice streaming
🤖 Offline AI models
📱 Mobile app version
🎨 Advanced UI (React + animations)
🏁 Conclusion

This project demonstrates:

End-to-end voice AI pipeline
Multilingual chatbot design
Practical use of STT + TTS