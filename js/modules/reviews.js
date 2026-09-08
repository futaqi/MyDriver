import { db, ref, onValue, push } from '../firebase.js';

export function initReviews() {
  const toggleBtn = document.getElementById('toggleReviewForm');
  const reviewForm = document.getElementById('reviewForm');
  const starSelector = document.getElementById('starRatingSelector');
  const ratingValueInput = document.getElementById('ratingValue');
  const reviewsStream = document.getElementById('reviewsStream');
  const starVisual = document.getElementById('starVisual');
  const ratingAvgEl = document.getElementById('ratingAverage');
  const ratingCountEl = document.getElementById('ratingCount');

  toggleBtn.addEventListener('click', () => {
    reviewForm.classList.toggle('hidden');
    toggleBtn.textContent = reviewForm.classList.contains('hidden') ? '+ TULIS ULASAN' : 'TUTUP FORM';
  });

  const starSpans = starSelector.querySelectorAll('span');
  starSpans.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-star'), 10);
      ratingValueInput.value = val;
      starSpans.forEach((s) => {
        const idx = parseInt(s.getAttribute('data-star'), 10);
        s.className = idx <= val ? 'text-amber-400' : 'text-slate-600';
      });
    });
  });

  onValue(ref(db, 'reviews'), (snapshot) => {
    const data = snapshot.val();
    reviewsStream.innerHTML = '';

    if (!data) {
      reviewsStream.innerHTML = '<div class="text-center text-slate-500 text-xs py-8">Belum ada ulasan masuk. Jadilah yang pertama!</div>';
      ratingAvgEl.textContent = '5.0';
      ratingCountEl.textContent = '(0 ulasan)';
      starVisual.textContent = '★★★★★';
      return;
    }

    const keys = Object.keys(data).reverse();
    let totalScore = 0;

    keys.forEach((key) => {
      const r = data[key];
      const rating = Number(r.rating) || 5;
      totalScore += rating;

      const card = document.createElement('div');
      card.className = 'bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2';
      
      const starsDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const dateString = r.timestamp ? new Date(r.timestamp).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      }) : '';

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-bold text-xs text-slate-200">${escapeHtml(r.name || 'Pelanggan')}</span>
          <span class="text-amber-400 text-xs font-mono">${starsDisplay}</span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(r.comment || '')}</p>
        <div class="text-[10px] text-slate-500 text-right">${dateString}</div>
      `;

      reviewsStream.appendChild(card);
    });

    const avg = (totalScore / keys.length).toFixed(1);
    ratingAvgEl.textContent = avg;
    ratingCountEl.textContent = `(${keys.length} ulasan)`;
    starVisual.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  });

  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reviewerName').value.trim();
    const rating = parseInt(ratingValueInput.value, 10);
    const comment = document.getElementById('reviewComment').value.trim();

    if (!name || !comment) return;

    push(ref(db, 'reviews'), {
      name: name,
      rating: rating,
      comment: comment,
      timestamp: Date.now()
    }).then(() => {
      reviewForm.reset();
      ratingValueInput.value = 5;
      starSpans.forEach(s => s.className = 'text-amber-400');
      reviewForm.classList.add('hidden');
      toggleBtn.textContent = '+ TULIS ULASAN';
      alert('Ulasan Anda berhasil diterbitkan. Terima kasih!');
    }).catch((err) => {
      alert('Gagal mengirim ulasan: ' + err.message);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
