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

  // 2. DETEKSI INFO PERANGKAT
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

  // 3. PRESENCE TRACKING KE FIREBASE
  const deviceRef = ref(db, `devices/${deviceId}`);
  const connectedRef = ref(db, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(deviceRef).update({
        isOnline: false,
        lastActive: serverTimestamp()
      });

      update(deviceRef, {
        deviceId: deviceId,
        deviceInfo: getDeviceInfo(),
        isOnline: true,
        lastActive: Date.now()
      });
    }
  });

  // 4. AUDIO ENGINE TERPROTEKSI (ANTI-BURST & ANTI-DELAY)
  let audioCtx = null;
  let compressor = null;
  let alarmLoopTimer = null;
  let isAlarmActiveLocally = false;
  let activeNodes = [];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-18, audioCtx.currentTime);
        compressor.knee.setValueAtTime(25, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.15, audioCtx.currentTime);
        compressor.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Buka kunci AudioContext saat interaksi layar apa pun sejak awal
  ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(evt => {
    window.addEventListener(evt, () => getAudioContext(), { once: true, passive: true });
  });

  function playHighGainCyberPulse() {
    // Cegah eksekusi jika status alarm sudah dimatikan
    if (!isAlarmActiveLocally) return;

    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return; // JANGAN jadwalkan audio jika status masih suspended

    try {
      const now = ctx.currentTime;

      // Layer 1: Sawtooth Frequency Sweep
      const oscSaw = ctx.createOscillator();
      const gainSaw = ctx.createGain();
      oscSaw.type = 'sawtooth';
      oscSaw.frequency.setValueAtTime(550, now);
      oscSaw.frequency.exponentialRampToValueAtTime(1950, now + 0.22);
      gainSaw.gain.setValueAtTime(0.7, now);
      gainSaw.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      oscSaw.connect(gainSaw);
      gainSaw.connect(compressor);

      // Layer 2: Square Wave Harmonic Beep
      const oscSq = ctx.createOscillator();
      const gainSq = ctx.createGain();
      oscSq.type = 'square';
      oscSq.frequency.setValueAtTime(3200, now + 0.08);
      gainSq.gain.setValueAtTime(0.45, now + 0.08);
      gainSq.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      oscSq.connect(gainSq);
      gainSq.connect(compressor);

      oscSaw.start(now);
      oscSaw.stop(now + 0.3);
      oscSq.start(now + 0.08);
      oscSq.stop(now + 0.32);

      activeNodes.push(oscSaw, oscSq);

      // Bersihkan array node setelah selesai
      setTimeout(() => {
        activeNodes = activeNodes.filter(n => n !== oscSaw && n !== oscSq);
      }, 400);

      // Haptik Getar
      if ('vibrate' in navigator) {
        navigator.vibrate([250, 80, 250]);
      }
    } catch (e) {
      console.warn('Audio synthesize error:', e);
    }
  }

  function startAlarmSequence() {
    if (isAlarmActiveLocally) return;
    isAlarmActiveLocally = true;

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      playHighGainCyberPulse();
    }

    clearInterval(alarmLoopTimer);
    alarmLoopTimer = setInterval(() => {
      if (isAlarmActiveLocally) {
        playHighGainCyberPulse();
      }
    }, 750);
  }

  function stopAlarmSequence() {
    isAlarmActiveLocally = false;
    clearInterval(alarmLoopTimer);
    alarmLoopTimer = null;

    // Hentikan dan putus seluruh node suara yang sedang berjalan detik ini
    activeNodes.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (_) {}
    });
    activeNodes = [];

    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }

  // 5. LISTENER FIREBASE
  onValue(ref(db, `devices/${deviceId}/alarm`), (snapshot) => {
    const isAlarmTriggered = snapshot.val() === true;

    if (isAlarmTriggered) {
      startAlarmSequence();
      alarmModal.classList.remove('hidden');
    } else {
      stopAlarmSequence();
      alarmModal.classList.add('hidden');
    }
  });

  // 6. TOMBOL MATIKAN ALARM OLEH PELANGGAN
  btnAcknowledgeAlarm.addEventListener('click', (e) => {
    e.stopPropagation(); // Cegah propagasi event ke window
    stopAlarmSequence();
    alarmModal.classList.add('hidden');
    set(ref(db, `devices/${deviceId}/alarm`), false);
  });
        }
