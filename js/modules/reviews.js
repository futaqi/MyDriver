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

  // Toggle Buka/Tutup Form
  toggleBtn.addEventListener('click', () => {
    reviewForm.classList.toggle('hidden');
    toggleBtn.textContent = reviewForm.classList.contains('hidden') ? '+ TULIS ULASAN' : 'TUTUP FORM';
  });

  // Selector Bintang Interaktif
  const starSpans = starSelector.querySelectorAll('span');
  starSpans.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-star'), 10);
      ratingValueInput.value = val;
      updateStarUI(val);
    });
  });

  function updateStarUI(val) {
    starSpans.forEach((s) => {
      const starIndex = parseInt(s.getAttribute('data-star'), 10);
      if (starIndex <= val) {
        s.className = 'text-amber-400';
      } else {
        s.className = 'text-slate-600';
      }
    });
  }

  // Listener Real-time Feed Ulasan
  const reviewsRef = ref(db, 'reviews');
  onValue(reviewsRef, (snapshot) => {
    const data = snapshot.val();
    reviewsStream.innerHTML = '';

    if (!data) {
      reviewsStream.innerHTML = '<div class="text-center text-slate-500 text-xs py-8">Belum ada ulasan masuk. Jadilah yang pertama memberikan ulasan!</div>';
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
        day: 'numeric',
        month: 'short',
        year: 'numeric'
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

    // Update Rating Rata-rata
    const avg = (totalScore / keys.length).toFixed(1);
    ratingAvgEl.textContent = avg;
    ratingCountEl.textContent = `(${keys.length} ulasan)`;
    starVisual.textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  });

  // Submit Ulasan Baru
  reviewForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reviewerName').value.trim();
    const rating = parseInt(ratingValueInput.value, 10);
    const comment = document.getElementById('reviewComment').value.trim();

    if (!name || !comment) return;

    push(reviewsRef, {
      name: name,
      rating: rating,
      comment: comment,
      timestamp: Date.now()
    }).then(() => {
      reviewForm.reset();
      ratingValueInput.value = 5;
      updateStarUI(5);
      reviewForm.classList.add('hidden');
      toggleBtn.textContent = '+ TULIS ULASAN';
      alert('Terima kasih! Ulasan Anda telah berhasil diterbitkan.');
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
