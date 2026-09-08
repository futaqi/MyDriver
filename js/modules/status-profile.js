import { db, ref, onValue } from '../firebase.js';

export function initStatusAndProfile() {
  const driverNameEl = document.getElementById('driverName');
  const driverTaglineEl = document.getElementById('driverTagline');
  const driverPhotoEl = document.getElementById('driverPhoto');
  const driverInitialsEl = document.getElementById('driverInitials');
  const btnMapsEl = document.getElementById('btnMaps');
  const btnContactEl = document.getElementById('btnContact');
  const driverStatusTextEl = document.getElementById('driverStatusText');
  const statusPingEl = document.getElementById('statusPing');

  // Sync Profil & Link
  onValue(ref(db, 'config'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    if (data.name) driverNameEl.textContent = data.name;
    if (data.tagline) driverTaglineEl.textContent = data.tagline;

    // Foto Profil atau Inisial
    if (data.photoUrl && data.photoUrl.trim() !== '') {
      driverPhotoEl.src = data.photoUrl;
      driverPhotoEl.classList.remove('hidden');
      driverInitialsEl.classList.add('hidden');
    } else {
      driverPhotoEl.classList.add('hidden');
      driverInitialsEl.classList.remove('hidden');
    }

    if (data.mapsUrl) {
      btnMapsEl.href = data.mapsUrl;
      btnMapsEl.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      btnMapsEl.classList.add('opacity-50', 'pointer-events-none');
    }

    if (data.contactUrl) {
      btnContactEl.href = data.contactUrl;
      btnContactEl.classList.remove('opacity-50', 'pointer-events-none');
    } else {
      btnContactEl.classList.add('opacity-50', 'pointer-events-none');
    }
  });

  // Sync Status
  onValue(ref(db, 'status'), (snapshot) => {
    const status = snapshot.val() || 'ONLINE';

    if (status === 'ONLINE') {
      driverStatusTextEl.textContent = 'ONLINE — SIAP JALAN';
      driverStatusTextEl.className = 'text-xs font-semibold tracking-wider text-emerald-400 font-tech';
      statusPingEl.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      `;
    } else if (status === 'ON_TRIP') {
      driverStatusTextEl.textContent = 'SEDANG DI PERJALANAN';
      driverStatusTextEl.className = 'text-xs font-semibold tracking-wider text-amber-400 font-tech';
      statusPingEl.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
      `;
    } else {
      driverStatusTextEl.textContent = 'SEDANG TIDAK AKTIF';
      driverStatusTextEl.className = 'text-xs font-semibold tracking-wider text-rose-400 font-tech';
      statusPingEl.innerHTML = `
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
      `;
    }
  });
}
