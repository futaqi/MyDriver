import { db, ref, onValue, push } from '../firebase.js';

export function initChat() {
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const chatCloseBtn = document.getElementById('chatCloseBtn');
  const chatBox = document.getElementById('chatBox');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  // Ambil atau buat ID Sesi unik di browser pengunjung
  let sessionId = localStorage.getItem('futaqi_driver_chat_session');
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('futaqi_driver_chat_session', sessionId);
  }

  // Buka/Tutup Jendela Chat
  chatToggleBtn.addEventListener('click', () => {
    chatBox.classList.toggle('hidden');
    if (!chatBox.classList.contains('hidden')) {
      chatInput.focus();
      scrollChatToBottom();
    }
  });

  chatCloseBtn.addEventListener('click', () => {
    chatBox.classList.add('hidden');
  });

  // Listener Pesan Sesi Ini
  const userChatRef = ref(db, `chats/${sessionId}`);
  onValue(userChatRef, (snapshot) => {
    const data = snapshot.val();
    chatMessages.innerHTML = '';

    if (!data) {
      chatMessages.innerHTML = '<div class="text-center text-slate-500 text-[11px] mt-8">Halo! Ada yang bisa saya bantu untuk perjalanan Anda?</div>';
      return;
    }

    Object.keys(data).forEach((key) => {
      const msg = data[key];
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

    scrollChatToBottom();
  });

  // Kirim Pesan
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    push(userChatRef, {
      sender: 'user',
      text: text,
      timestamp: Date.now()
    }).then(() => {
      chatInput.value = '';
      scrollChatToBottom();
    }).catch((err) => {
      alert('Gagal mengirim pesan: ' + err.message);
    });
  });

  function scrollChatToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }
}
