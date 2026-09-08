import { initStatusAndProfile } from './modules/status-profile.js';
import { initPromos } from './modules/promos.js';
import { initReviews } from './modules/reviews.js';
import { initChat } from './modules/chat.js';

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi seluruh modul antarmuka
  initStatusAndProfile();
  initPromos();
  initReviews();
  initChat();
});
