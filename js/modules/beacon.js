import { db, ref, onValue } from '../firebase.js';

export function initArrivalBeacon() {
  const alarmModal = document.getElementById('alarmModal');
  const btnAcknowledgeAlarm = document.getElementById('btnAcknowledgeAlarm');

  let audioCtx = null;
  let alarmInterval = null;

  // Web Audio Context untuk Synthetic Cyber-HUD Chime
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Buka izin audio pada setiap sentuhan pertama pengguna di layar
  window.addEventListener('click', initAudio, { once: true });
  window.addEventListener('touchstart', initAudio, { once: true });

  function playChime() {
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
    playChime();
    alarmInterval = setInterval(playChime, 900);
  }

  function stopAlarmSound() {
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  // Listener Sinyal Cloud
  const arrivalRef = ref(db, 'arrival');
  onValue(arrivalRef, (snapshot) => {
    const data = snapshot.val() || {};

    // 1. Jika Trip Selesai
    if (data.completed === true) {
      stopAlarmSound();
      alarmModal.classList.add('hidden');
      
      const reviewForm = document.getElementById('reviewForm');
      const toggleReviewBtn = document.getElementById('toggleReviewForm');
      reviewForm.classList.remove('hidden');
      toggleReviewBtn.textContent = 'TUTUP FORM';
      document.getElementById('reviewHubSection').scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // 2. Jika Driver Mengaktifkan Alarm Tiba
    if (data.active === true) {
      initAudio();
      startAlarmSound();
      alarmModal.classList.remove('hidden');
    } else {
      stopAlarmSound();
      alarmModal.classList.add('hidden');
    }
  });

  // Tombol Matikan Alarm oleh Pelanggan
  btnAcknowledgeAlarm.addEventListener('click', () => {
    stopAlarmSound();
    alarmModal.classList.add('hidden');
  });
}
