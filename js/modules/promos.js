import { db, ref, onValue } from '../firebase.js';

export function initPromos() {
  const promoSection = document.getElementById('promoSection');
  const promoContainer = document.getElementById('promoContainer');

  onValue(ref(db, 'promos'), (snapshot) => {
    const data = snapshot.val();
    promoContainer.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
      promoSection.classList.add('hidden');
      return;
    }

    promoSection.classList.remove('hidden');

    Object.keys(data).forEach((key) => {
      const item = data[key];
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 rounded-2xl border border-purple-500/20 hover:border-purple-400/60 transition-all flex flex-col justify-between';

      card.innerHTML = `
        <div class="space-y-1.5">
          <div class="text-xs font-bold text-purple-300 font-tech uppercase tracking-wide">${escapeHtml(item.title || '')}</div>
          <p class="text-xs text-slate-400 line-clamp-3">${escapeHtml(item.desc || '')}</p>
        </div>
        ${item.link ? `
          <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-1.5 text-[11px] font-tech text-purple-400 hover:text-purple-200 font-semibold">
            <span>Lihat Detail</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </a>
        ` : ''}
      `;

      promoContainer.appendChild(card);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
