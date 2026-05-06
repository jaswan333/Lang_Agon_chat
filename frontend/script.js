// ── Theme ──────────────────────────────────────────────
function initTheme() {
    const saved = localStorage.getItem('voiceai_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('voiceai_theme', next);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── Chat History (resets on refresh — sessionStorage) ──
function saveMessage(lang, role, text, transcription) {
    const key = `chat_${lang}`;
    const history = JSON.parse(sessionStorage.getItem(key) || '[]');
    history.push({ role, text, transcription: transcription || null, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    sessionStorage.setItem(key, JSON.stringify(history));
}

// ── Core Recording Logic (improved silence detection) ──
let isRecording = false;
let mediaRecorder = null;
let audioContext = null;
let analyser = null;
let silenceTimer = null;
let animFrameId = null;

// Manual stop function
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

async function startRecording(lang) {
    if (isRecording) return;

    const btn       = document.getElementById('micBtn');
    const stopBtn   = document.getElementById('stopBtn');
    const hint      = document.getElementById('hintText');
    const status    = document.getElementById('botStatus');
    const timerBar  = document.getElementById('timerBar');
    const timerFill = document.getElementById('timerFill');
    const micRing   = document.getElementById('micRing');
    const waveform  = document.getElementById('waveform');

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
        showError('Microphone access denied. Please allow mic permission in your browser.');
        return;
    }

    isRecording = true;
    btn.style.display = 'none';
    stopBtn.style.display = 'flex';
    micRing.classList.add('active');
    hint.textContent = '🔴 Recording... (click stop or wait for auto-stop)';
    setStatus(status, 'Listening...', 'listening');

    // Timer bar
    timerBar.classList.add('visible');
    timerFill.style.transition = 'none';
    timerFill.style.width = '0%';
    requestAnimationFrame(() => {
        timerFill.style.transition = 'width 8s linear';
        timerFill.style.width = '100%';
    });

    // ── Waveform via Web Audio API ──
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    if (waveform) drawWaveform(waveform, analyser);

    // ── Improved auto-stop on silence ──
    const silenceThreshold = 15;   // Increased threshold for better detection
    const silenceDelay     = 1200; // Reduced delay for faster response
    let   speechDetected   = false;
    let   consecutiveSilence = 0;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function checkSilence() {
        if (!isRecording) return;
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        if (volume > silenceThreshold) {
            speechDetected = true;
            consecutiveSilence = 0;
            clearTimeout(silenceTimer);
            silenceTimer = null;
        } else if (speechDetected) {
            consecutiveSilence++;
            // Only start silence timer after consistent silence
            if (consecutiveSilence > 5 && !silenceTimer) {
                silenceTimer = setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, silenceDelay);
            }
        }
        requestAnimationFrame(checkSilence);
    }
    checkSilence();

    // Max 8s fallback (reduced from 15s)
    const maxTimer = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
    }, 8000);

    // ── MediaRecorder (core logic unchanged) ──
    const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : 'audio/webm;codecs=opus';
    const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    mediaRecorder.onstop = async () => {
        clearTimeout(maxTimer);
        clearTimeout(silenceTimer);
        silenceTimer = null;
        isRecording = false;
        stream.getTracks().forEach(t => t.stop());
        if (audioContext) { audioContext.close(); audioContext = null; }
        if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
        if (waveform) clearWaveform(waveform);

        btn.style.display = 'flex';
        stopBtn.style.display = 'none';
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

        // ── Send to backend (unchanged) ──
        const blob = new Blob(chunks, { type: mimeType });
        const formData = new FormData();
        formData.append('audio', blob, `audio.${ext}`);

        try {
            const res = await fetch(`/${lang}`, { method: 'POST', body: formData });
            let data;
            try { data = await res.json(); } catch { data = null; }
            removeTyping();

            if (!res.ok || (data && data.error)) {
                showError('Error: ' + (data?.error || `Server error ${res.status}`));
            } else if (data) {
                const userText = data.user || '(voice input)';
                const botText  = data.bot  || '(no response)';
                appendMessage('user', userText, null, lang);
                appendMessage('bot',  botText, userText, lang);   // pass transcription to bot bubble
                if (data.audio) playAudio(data.audio);            // core voice output unchanged
            }
        } catch {
            removeTyping();
            showError('Connection error — is the Flask server running?');
        }

        resetUI(btn, hint, status);
    };

    mediaRecorder.start();
}

// ── English keyboard input (send via text, still gets voice response) ──
async function sendTextInput(lang) {
    const input = document.getElementById('textInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const status = document.getElementById('botStatus');
    setStatus(status, 'Thinking...', 'thinking');
    showTyping();
    appendMessage('user', text, null, lang);

    try {
        const res = await fetch(`/${lang}/text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        let data;
        try { data = await res.json(); } catch { data = null; }
        removeTyping();

        if (!res.ok || (data && data.error)) {
            showError('Error: ' + (data?.error || `Server error ${res.status}`));
        } else if (data) {
            appendMessage('bot', data.bot || '(no response)', null, lang);
            if (data.audio) playAudio(data.audio);
        }
    } catch {
        removeTyping();
        showError('Connection error — is the Flask server running?');
    }

    const btn    = document.getElementById('micBtn');
    const hint   = document.getElementById('hintText');
    resetUI(btn, hint, status);
}

// ── Waveform Drawing ──────────────────────────────────
function drawWaveform(canvas, analyser) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
        animFrameId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, W, H);

        const barW = W / dataArray.length;
        dataArray.forEach((val, i) => {
            const barH = (val / 255) * H;
            const hue  = 210 + (val / 255) * 40;
            ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
            ctx.fillRect(i * barW, H - barH, barW - 1, barH);
        });
    }
    draw();
}

function clearWaveform(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Append Message ────────────────────────────────────
function appendMessage(role, text, transcription, lang) {
    const container = document.getElementById('chatMessages');
    const isUser    = role === 'user';

    if (lang) saveMessage(lang, role, text, transcription);

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

    content.appendChild(name);
    content.appendChild(bubble);

    // ── Response confidence: show transcription under bot bubble ──
    if (!isUser && transcription) {
        const conf = document.createElement('div');
        conf.className = 'transcription-tag';
        conf.innerHTML = `🎙️ Heard: <em>"${transcription}"</em>`;
        content.appendChild(conf);
    }

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    content.appendChild(time);

    wrapper.appendChild(avatar);
    wrapper.appendChild(content);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

// ── Typing Indicator ──────────────────────────────────
function showTyping() {
    const container = document.getElementById('chatMessages');
    if (document.getElementById('typingIndicator')) return;
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

// ── Audio Playback (core — unchanged) ─────────────────
function playAudio(base64) {
    try {
        const audio = new Audio('data:audio/mpeg;base64,' + base64);
        audio.play().catch(() => showError('Audio playback blocked. Click anywhere on the page first.'));
    } catch {
        showError('Could not play audio response.');
    }
}

// ── UI Helpers ────────────────────────────────────────
function setStatus(el, text, state) {
    if (!el) return;
    const color = state === 'listening' ? '#3b82f6' : state === 'thinking' ? '#f59e0b' : '#22c55e';
    el.innerHTML = `<span class="status-dot-sm" style="background:${color}"></span> ${text}`;
}

function resetUI(btn, hint, status) {
    if (btn) {
        btn.disabled = false;
        btn.style.display = 'flex';
    }
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) stopBtn.style.display = 'none';
    if (hint) hint.textContent = 'Click mic to start • or type below (English only)';
    setStatus(status, 'Online', 'online');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ── Init on page load ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Keyboard shortcut: Space to record (only on chat pages, not when typing)
    document.addEventListener('keydown', e => {
        const textInput = document.getElementById('textInput');
        if (e.code === 'Space' && document.activeElement !== textInput) {
            const micBtn = document.getElementById('micBtn');
            if (micBtn && !micBtn.disabled) micBtn.click();
        }
        if (e.code === 'Enter' && document.activeElement === textInput) {
            const lang = textInput.dataset.lang;
            if (lang) sendTextInput(lang);
        }
    });
});
