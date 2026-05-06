const RECORD_DURATION = 4000;

async function startRecording(lang) {
    const btn      = document.getElementById('micBtn');
    const hint     = document.getElementById('hintText');
    const status   = document.getElementById('botStatus');
    const timerBar = document.getElementById('timerBar');
    const timerFill= document.getElementById('timerFill');
    const micRing  = document.getElementById('micRing');

    // Request mic
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
        showError('Microphone access denied. Please allow mic permission in your browser.');
        return;
    }

    // UI: recording state
    btn.disabled = true;
    btn.classList.add('recording');
    micRing.classList.add('active');
    hint.textContent = '🔴 Recording... speak now';
    setStatus(status, 'Listening...', 'listening');

    // Timer bar animation
    timerBar.classList.add('visible');
    timerFill.style.transition = 'none';
    timerFill.style.width = '0%';
    requestAnimationFrame(() => {
        timerFill.style.transition = `width ${RECORD_DURATION}ms linear`;
        timerFill.style.width = '100%';
    });

    // Pick best supported format — prefer mp4/ogg which Groq handles better
    const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : 'audio/webm;codecs=opus';

    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks   = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        btn.classList.remove('recording');
        micRing.classList.remove('active');
        timerBar.classList.remove('visible');
        timerFill.style.width = '0%';
        hint.textContent = '⏳ Processing your voice...';
        setStatus(status, 'Thinking...', 'thinking');
        showTyping();

        if (chunks.length === 0) {
            removeTyping();
            showError('No audio captured. Please try again.');
            resetUI(btn, hint, status);
            return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', blob, `audio.${ext}`);

        try {
            const res = await fetch(`/${lang}`, { method: 'POST', body: formData });

            // Try to parse JSON regardless of status code for error messages
            let data;
            try { data = await res.json(); } catch { data = null; }

            removeTyping();

            if (!res.ok || (data && data.error)) {
                const msg = data?.error || `Server error ${res.status}`;
                showError('Error: ' + msg);
            } else if (data) {
                appendMessage('user', data.user || '(voice input)');
                appendMessage('bot',  data.bot  || '(no response)');
                if (data.audio) playAudio(data.audio);
            }
        } catch (err) {
            removeTyping();
            showError('Connection error — is the Flask server running?');
        }

        resetUI(btn, hint, status);
    };

    recorder.start();
    setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, RECORD_DURATION);
}

function appendMessage(role, text) {
    const container = document.getElementById('chatMessages');
    const isUser    = role === 'user';

    const wrapper = document.createElement('div');
    wrapper.className = `msg ${isUser ? 'user-msg' : 'bot-msg'}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = isUser ? '🧑' : '🤖';

    const content = document.createElement('div');
    content.className = 'msg-content';

    const name = document.createElement('div');
    name.className = 'msg-name';
    name.textContent = isUser ? 'You' : 'AI Assistant';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    content.appendChild(name);
    content.appendChild(bubble);
    content.appendChild(time);
    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg bot-msg';
    div.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    div.appendChild(avatar);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function showError(msg) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'error-bubble';
    div.textContent = msg;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function playAudio(base64) {
    try {
        const audio = new Audio('data:audio/mpeg;base64,' + base64);
        audio.play().catch(() => showError('Audio playback blocked. Click anywhere on the page first.'));
    } catch {
        showError('Could not play audio response.');
    }
}

function setStatus(el, text, state) {
    if (!el) return;
    el.innerHTML = `<span class="status-dot-sm" style="background:${
        state === 'listening' ? '#3b82f6' :
        state === 'thinking'  ? '#f59e0b' : '#22c55e'
    }"></span> ${text}`;
}

function resetUI(btn, hint, status) {
    btn.disabled = false;
    hint.textContent = 'Click mic to start recording (4 seconds)';
    setStatus(status, 'Online', 'online');
}
