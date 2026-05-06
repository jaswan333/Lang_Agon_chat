import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_response(text, lang_instruction=""):
    messages = []
    if lang_instruction:
        messages.append({"role": "system", "content": lang_instruction})
    messages.append({"role": "user", "content": text})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    return response.choices[0].message.content
