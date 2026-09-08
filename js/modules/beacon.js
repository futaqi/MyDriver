import { db, ref, onValue, set, update, onDisconnect, serverTimestamp } from '../firebase.js';

export function initArrivalBeacon() {
  const alarmModal = document.getElementById('alarmModal');
  const btnAcknowledgeAlarm = document.getElementById('btnAcknowledgeAlarm');
  const radarHookBanner = document.getElementById('radarHookBanner');
  const btnActivateRadar = document.getElementById('btnActivateRadar');
  const radarActiveBadge = document.getElementById('radarActiveBadge');

  // 1. MANAJEMEN ID PERANGKAT
  let deviceId = localStorage.getItem('futaqi_device_uid');
  if (!deviceId) {
    deviceId = 'DEV-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem('futaqi_device_uid', deviceId);
  }

  // 2. DETEKSI INFO PERANGKAT
  function getDeviceInfo() {
    const ua = navigator.userAgent;
    let os = 'Desktop';
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

  // 3. REGISTRASI STATUS KE FIREBASE
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

  // 4. AUDIO ENGINE (DUAL-OSCILLATOR + DYNAMICS COMPRESSOR)
  let audioCtx = null;
  let compressor = null;
  let alarmLoopTimer = null;
  let isAlarmActiveLocally = false;
  let activeNodes = [];

  function initAudioContext() {
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
  }

  // Nada konfirmasi aktivasi radar (Cyber-Ping Halus)
  function playRadarActivationChime() {
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(compressor);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (_) {}
  }

  // Nada Alarm Kedatangan Utama (Loud Sawtooth + Square Wave)
  function playHighGainCyberPulse() {
    if (!isAlarmActiveLocally || !audioCtx || audioCtx.state !== 'running') return;

    try {
      const now = audioCtx.currentTime;

      // Layer 1: Sawtooth Sweep (550Hz -> 1950Hz)
      const oscSaw = audioCtx.createOscillator();
      const gainSaw = audioCtx.createGain();
      oscSaw.type = 'sawtooth';
      oscSaw.frequency.setValueAtTime(550, now);
      oscSaw.frequency.exponentialRampToValueAtTime(1950, now + 0.22);
      gainSaw.gain.setValueAtTime(0.75, now);
      gainSaw.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      oscSaw.connect(gainSaw);
      gainSaw.connect(compressor);

      // Layer 2: High Harmonic Beep (3200Hz)
      const oscSq = audioCtx.createOscillator();
      const gainSq = audioCtx.createGain();
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

      setTimeout(() => {
        activeNodes = activeNodes.filter(n => n !== oscSaw && n !== oscSq);
      }, 400);

      if ('vibrate' in navigator) {
        navigator.vibrate([250, 80, 250]);
      }
    } catch (e) {
      console.warn('Playback error:', e);
    }
  }

  function startAlarmSequence() {
    if (isAlarmActiveLocally) return;
    isAlarmActiveLocally = true;

    initAudioContext();
    playHighGainCyberPulse();

    clearInterval(alarmLoopTimer);
    alarmLoopTimer = setInterval(playHighGainCyberPulse, 750);
  }

  function stopAlarmSequence() {
    isAlarmActiveLocally = false;
    clearInterval(alarmLoopTimer);
    alarmLoopTimer = null;

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

  // 5. EVENT PANCINGAN: KLIK AKTIFKAN RADAR
  btnActivateRadar.addEventListener('click', () => {
    initAudioContext();
    playRadarActivationChime();

    // Minta izin notifikasi browser jika didukung
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    radarHookBanner.classList.add('hidden');
    radarActiveBadge.classList.remove('hidden');
  });

  // 6. LISTENER FIREBASE ALARM
  onValue(ref(db, `devices/${deviceId}/alarm`), (snapshot) => {
    const isAlarmTriggered = snapshot.val() === true;

    if (isAlarmTriggered) {
      startAlarmSequence();
      alarmModal.classList.remove('hidden');

      // Tampilkan notifikasi sistem jika tab di latar belakang
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 DRIVER TELAH TIBA!', {
          body: 'Futaqi Ali telah sampai di lokasi penjemputan Anda.',
          icon: 'assets/icons/verified.svg'
        });
      }
    } else {
      stopAlarmSequence();
      alarmModal.classList.add('hidden');
    }
  });

  // 7. TOMBOL MATIKAN ALARM
  btnAcknowledgeAlarm.addEventListener('click', (e) => {
    e.stopPropagation();
    stopAlarmSequence();
    alarmModal.classList.add('hidden');
    set(ref(db, `devices/${deviceId}/alarm`), false);
  });
                                 }
