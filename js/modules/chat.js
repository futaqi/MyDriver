import { db, ref, onValue, push, set } from '../firebase.js';

export function initChat() {
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatBox = document.getElementById('chatBox');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  const alarmModal = document.getElementById('alarmModal');
  const btnAcknowledgeAlarm = document.getElementById('btnAcknowledgeAlarm');

  // Web Audio Context untuk Synthetic HUD Beacon Sound
  let audioCtx = null;
  let alarmInterval = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playCyberSonarChime() {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function startAlarmSound() {
    if (alarmInterval) return;
    playCyberSonarChime();
    alarmInterval = setInterval(playCyberSonarChime, 900);
  }

  function stopAlarmSound() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  // Session Management
  let sessionId = localStorage.getItem('futaqi_driver_chat_session');
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('futaqi_driver_chat_session', sessionId);
  }

  // Chat Window Toggle
  chatToggleBtn.addEventListener('click', () => {
    initAudio(); // Unlock audio permission on user gesture
    chatBox.classList.toggle('hidden');
    if (!chatBox.classList.contains('hidden')) {
      chatInput.focus();
      scrollChat();
    }
  });

  chatCloseBtn.addEventListener('click', () => chatBox.classList.add('hidden'));

  // Listener Session Cloud
  const sessionRef = ref(db, `chats/${sessionId}`);
  onValue(sessionRef, (snapshot) => {
    const sessionData = snapshot.val();

    // 1. Check End-Trip Protocol
    if (sessionData && sessionData.status === 'completed') {
      stopAlarmSound();
      alarmModal.classList.add('hidden');
      localStorage.removeItem('futaqi_driver_chat_session'); // Bersihkan cache sesi
      
      // Buka form ulasan otomatis
      const reviewForm = document.getElementById('reviewForm');
      const toggleReviewBtn = document.getElementById('toggleReviewForm');
      reviewForm.classList.remove('hidden');
      toggleReviewBtn.textContent = 'TUTUP FORM';
      document.getElementById('reviewHubSection').scrollIntoView({ behavior: 'smooth' });
      alert('Perjalanan Anda telah selesai. Terima kasih! Silakan berikan ulasan Anda di bawah ini.');
      return;
    }

    // 2. Targeted Alarm
    if (sessionData && sessionData.alarm === true) {
      initAudio();
      startAlarmSound();
      alarmModal.classList.remove('hidden');
    } else {
      stopAlarmSound();
      alarmModal.classList.add('hidden');
    }

    // 3. Messages Stream
    chatMessages.innerHTML = '';
    const messages = sessionData ? (sessionData.messages || {}) : {};
    const keys = Object.keys(messages);

    if (keys.length === 0) {
      chatMessages.innerHTML = '<div class="text-center text-slate-500 text-[11px] mt-8">Halo! Ada yang bisa saya bantu untuk penjemputan Anda?</div>';
      return;
    }

    keys.forEach((k) => {
      const msg = messages[k];
      const isAdmin = msg.sender === 'admin';

      const msgDiv = document.createElement('div');
      msgDiv.className = `flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`;

      const bubble = document.createElement('div');
      bubble.className = `max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
        isAdmin 
          ? 'bg-slate-800 text-slate-100 border border-slate-700' 
          : 'bg-cyan-500 text-slate-950 font-medium'
      }`;
      bubble.textContent = msg.text;

      const timeSpan = document.createElement('span');
      timeSpan.className = 'text-[9px] text-slate-500 mt-0.5 px-1';
      timeSpan.textContent = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      msgDiv.appendChild(bubble);
      msgDiv.appendChild(timeSpan);
      chatMessages.appendChild(msgDiv);
    });

    scrollChat();
  });

  // Acknowledge Alarm Button
  btnAcknowledgeAlarm.addEventListener('click', () => {
    stopAlarmSound();
    alarmModal.classList.add('hidden');
    set(ref(db, `chats/${sessionId}/alarm`), false);
  });

  // Send Message
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    initAudio();
    const text = chatInput.value.trim();
    if (!text) return;

    push(ref(db, `chats/${sessionId}/messages`), {
      sender: 'user',
      text: text,
      timestamp: Date.now()
    }).then(() => {
      chatInput.value = '';
      scrollChat();
    });
  });

  function scrollChat() {
    setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
  }
}
