import { db, ref, onValue, set, update, onDisconnect, serverTimestamp } from '../firebase.js';

export function initArrivalBeacon() {
  const alarmModal = document.getElementById('alarmModal');
  const btnAcknowledgeAlarm = document.getElementById('btnAcknowledgeAlarm');

  // 1. MANAJEMEN ID PERANGKAT UNIK
  let deviceId = localStorage.getItem('futaqi_device_uid');
  if (!deviceId) {
    deviceId = 'DEV-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('futaqi_device_uid', deviceId);
  }

  // 2. DETEKSI INFO PERANGKAT (ZERO PII / TANPA DATA PRIBADI)
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let os = 'Desktop / Lainnya';
    let browser = 'Browser';

    if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'MacOS';

    if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Edge/i.test(ua)) browser = 'Edge';

    return `${os} / ${browser}`;
  }

  // 3. REGISTRASI & PRESENCE TRACKING KE FIREBASE
  const deviceRef = ref(db, `devices/${deviceId}`);
  const connectedRef = ref(db, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // Pasang instruksi otomatis saat koneksi terputus / tab ditutup
      onDisconnect(deviceRef).update({
        isOnline: false,
        lastActive: serverTimestamp()
      });

      // Daftarkan atau perbarui status online perangkat
      update(deviceRef, {
        deviceId: deviceId,
        deviceInfo: getDeviceInfo(),
        isOnline: true,
        lastActive: Date.now()
      });
    }
  });

  // 4. HIGH-GAIN CYBERNETIC SOUND ENGINE & HAPTIK
  let audioCtx = null;
  let compressor = null;
  let alarmLoopTimer = null;

  function initAudioEngine() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();

        // Dynamics Compressor untuk mendongkrak volume maksimal tanpa distorsi
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
        compressor.knee.setValueAtTime(25, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(10, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.15, audioCtx.currentTime);

        compressor.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Buka izin pemutaran audio pada sentuhan/klik pertama di layar
  window.addEventListener('click', initAudioEngine, { once: true });
  window.addEventListener('touchstart', initAudioEngine, { once: true });

  function playHighGainCyberPulse() {
    if (!audioCtx || !compressor) return;
    try {
      const now = audioCtx.currentTime;

      // Layer 1: Sawtooth Frequency Sweep (Pendaran tajam karakter radar)
      const oscSaw = audioCtx.createOscillator();
      const gainSaw = audioCtx.createGain();
      oscSaw.type = 'sawtooth';
      oscSaw.frequency.setValueAtTime(550, now);
      oscSaw.frequency.exponentialRampToValueAtTime(1950, now + 0.22);
      gainSaw.gain.setValueAtTime(0.65, now);
      gainSaw.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      oscSaw.connect(gainSaw);
      gainSaw.connect(compressor);

      // Layer 2: Square Wave Harmonic Beep (Penetrasi frekuensi tinggi)
      const oscSq = audioCtx.createOscillator();
      const gainSq = audioCtx.createGain();
      oscSq.type = 'square';
      oscSq.frequency.setValueAtTime(3200, now + 0.08);
      gainSq.gain.setValueAtTime(0.4, now + 0.08);
      gainSq.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscSq.connect(gainSq);
      gainSq.connect(compressor);

      oscSaw.start(now);
      oscSaw.stop(now + 0.3);
      oscSq.start(now + 0.08);
      oscSq.stop(now + 0.32);

      // Haptik Getar Taktis
      if ('vibrate' in navigator) {
        navigator.vibrate([250, 80, 250]);
      }
    } catch (e) {
      console.warn('Audio synthesis trigger error:', e);
    }
  }

  function startAlarmSequence() {
    if (alarmLoopTimer) return;
    initAudioEngine();
    playHighGainCyberPulse();
    alarmLoopTimer = setInterval(playHighGainCyberPulse, 750);
  }

  function stopAlarmSequence() {
    if (alarmLoopTimer) {
      clearInterval(alarmLoopTimer);
      alarmLoopTimer = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  // 5. LISTENER SINYAL ALARM TERTARGET DARI FIREBASE
  onValue(ref(db, `devices/${deviceId}/alarm`), (snapshot) => {
    const isAlarmActive = snapshot.val() === true;

    if (isAlarmActive) {
      startAlarmSequence();
      alarmModal.classList.remove('hidden');
    } else {
      stopAlarmSequence();
      alarmModal.classList.add('hidden');
    }
  });

  // 6. RESPON TOMBOL MATIKAN ALARM OLEH PELANGGAN
  btnAcknowledgeAlarm.addEventListener('click', () => {
    stopAlarmSequence();
    alarmModal.classList.add('hidden');
    // Matikan alarm di Firebase agar status kembali normal
    set(ref(db, `devices/${deviceId}/alarm`), false);
  });
                                               }
