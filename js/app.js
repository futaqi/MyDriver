import { initStatusAndProfile } from './modules/status-profile.js';
import { initPromos } from './modules/promos.js';
import { initReviews } from './modules/reviews.js';
import { initArrivalBeacon } from './modules/beacon.js';

document.addEventListener('DOMContentLoaded', () => {
  initStatusAndProfile();
  initPromos();
  initReviews();
  initArrivalBeacon();
});
