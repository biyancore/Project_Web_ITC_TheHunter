const divisionCards = Array.from(document.querySelectorAll('.division-card'));
const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
const searchInput = document.getElementById('division-search');
const resetFavoritesButton = document.getElementById('reset-favorites');
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

const STORAGE_KEYS = {
  favorites: 'itcFavoriteDivisions',
  filter: 'itcDivisionFilter',
  search: 'itcDivisionSearch'
};

let activeFilter = 'all';
let activeSearch = '';
let favorites = new Set();

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function getCardWrapper(card) {
  return card.closest('.col-md-6, .col-xl-4, .col-lg-4, .col-lg-6, .col');
}

function loadFavorites() {
  try {
    const storedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]');
    favorites = new Set(storedFavorites.map(normalizeValue));
  } catch (error) {
    favorites = new Set();
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...favorites]));
}

function saveViewState() {
  localStorage.setItem(STORAGE_KEYS.filter, activeFilter);
  localStorage.setItem(STORAGE_KEYS.search, activeSearch);

  const url = new URL(window.location.href);

  if (activeFilter !== 'all') {
    url.searchParams.set('filter', activeFilter);
  } else {
    url.searchParams.delete('filter');
  }

  if (activeSearch.trim()) {
    url.searchParams.set('search', activeSearch.trim());
  } else {
    url.searchParams.delete('search');
  }

  history.replaceState({}, '', url);
}

function loadViewState() {
  const url = new URL(window.location.href);
  const urlFilter = normalizeValue(url.searchParams.get('filter'));
  const urlSearch = url.searchParams.get('search') || '';

  const storedFilter = normalizeValue(localStorage.getItem(STORAGE_KEYS.filter));
  const storedSearch = localStorage.getItem(STORAGE_KEYS.search) || '';

  activeFilter = urlFilter || storedFilter || 'all';
  activeSearch = urlSearch || storedSearch || '';

  if (searchInput) {
    searchInput.value = activeSearch;
  }
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const buttonFilter = normalizeValue(button.dataset.filter);
    const isActive = buttonFilter === activeFilter;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function updateFavoriteUI() {
  divisionCards.forEach((card) => {
    const divisionName = normalizeValue(card.dataset.name);
    const favoriteButton = card.querySelector('.favorite-button');
    const title = card.querySelector('h3')?.textContent?.trim() || 'division';
    const isFavorite = favorites.has(divisionName);

    if (!favoriteButton) return;

    favoriteButton.classList.toggle('is-favorite', isFavorite);
    favoriteButton.textContent = isFavorite ? '★' : '☆';
    favoriteButton.setAttribute(
      'aria-label',
      isFavorite
        ? `Hapus ${title} dari favorit`
        : `Tambahkan ${title} ke favorit`
    );
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
  });
}

function applyDivisionFilters() {
  const normalizedSearch = normalizeValue(activeSearch);

  divisionCards.forEach((card) => {
    const category = normalizeValue(card.dataset.category);
    const name = normalizeValue(card.dataset.name);
    const title = normalizeValue(card.querySelector('h3')?.textContent);
    const text = normalizeValue(card.textContent);

    const matchesFilter = activeFilter === 'all' || category === activeFilter;
    const matchesSearch =
      normalizedSearch === '' ||
      name.includes(normalizedSearch) ||
      title.includes(normalizedSearch) ||
      text.includes(normalizedSearch);

    const shouldShow = matchesFilter && matchesSearch;
    const wrapper = getCardWrapper(card);

    if (wrapper) {
      wrapper.classList.toggle('d-none', !shouldShow);
    } else {
      card.classList.toggle('d-none', !shouldShow);
    }
  });

  updateFilterButtons();
  saveViewState();
}

function handleFilterClick(event) {
  const clickedButton = event.currentTarget;
  const filterValue = normalizeValue(clickedButton.dataset.filter);

  if (!filterValue) return;

  activeFilter = filterValue;
  applyDivisionFilters();
}

function handleSearchInput(event) {
  activeSearch = event.target.value || '';
  applyDivisionFilters();
}

function handleFavoriteClick(event) {
  const favoriteButton = event.currentTarget;
  const card = favoriteButton.closest('.division-card');

  if (!card) return;

  const divisionName = normalizeValue(card.dataset.name);

  if (!divisionName) return;

  if (favorites.has(divisionName)) {
    favorites.delete(divisionName);
  } else {
    favorites.add(divisionName);
  }

  saveFavorites();
  updateFavoriteUI();
}

function resetFavorites() {
  if (!favorites.size) {
    alert('Belum ada bidang favorit yang disimpan.');
    return;
  }

  const confirmed = confirm('Yakin ingin menghapus semua division favorit?');
  if (!confirmed) return;

  favorites.clear();
  saveFavorites();
  updateFavoriteUI();
  alert('Semua division favorit berhasil direset.');
}

function setFieldError(input, message) {
  if (!input) return;

  const errorElement = input.parentElement.querySelector('.error-message');
  input.classList.toggle('is-invalid', Boolean(message));

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
  if (!contactForm) return true;

  let isValid = true;

  const nameInput = contactForm.querySelector('#name');
  const emailInput = contactForm.querySelector('#email');
  const messageInput = contactForm.querySelector('#message');

  const nameValue = nameInput?.value.trim() || '';
  const emailValue = emailInput?.value.trim() || '';
  const messageValue = messageInput?.value.trim() || '';

  if (!nameValue) {
    setFieldError(nameInput, 'Nama wajib diisi.');
    isValid = false;
  } else if (nameValue.length < 3) {
    setFieldError(nameInput, 'Nama minimal 3 karakter.');
    isValid = false;
  } else {
    setFieldError(nameInput, '');
  }

  if (!emailValue) {
    setFieldError(emailInput, 'Email wajib diisi.');
    isValid = false;
  } else if (!validateEmail(emailValue)) {
    setFieldError(emailInput, 'Format email belum valid.');
    isValid = false;
  } else {
    setFieldError(emailInput, '');
  }

  if (!messageValue) {
    setFieldError(messageInput, 'Pesan wajib diisi.');
    isValid = false;
  } else if (messageValue.length < 10) {
    setFieldError(messageInput, 'Pesan minimal 10 karakter.');
    isValid = false;
  } else {
    setFieldError(messageInput, '');
  }

  return isValid;
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    if (formStatus) {
      formStatus.textContent = 'Form belum valid. Periksa kembali input kamu.';
      formStatus.classList.remove('text-success');
      formStatus.classList.add('text-danger');
    }
    return;
  }

  const submittedName = contactForm.querySelector('#name')?.value.trim() || 'Kamu';

  if (formStatus) {
    formStatus.textContent = `Terima kasih, ${submittedName}. Pesan kamu berhasil dikirim.`;
    formStatus.classList.remove('text-danger');
    formStatus.classList.add('text-success');
  }

  contactForm.reset();

  contactForm.querySelectorAll('.is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
  });

  contactForm.querySelectorAll('.error-message').forEach((error) => {
    error.textContent = '';
  });
}

function handleFieldValidation() {
  if (!contactForm) return;

  ['name', 'email', 'message'].forEach((fieldId) => {
    const input = contactForm.querySelector(`#${fieldId}`);
    if (!input) return;

    input.addEventListener('input', () => {
      validateForm();
    });
  });
}

function initSmoothCloseNavbar() {
  const navLinks = document.querySelectorAll('.navbar-collapse .nav-link');
  const navbarCollapse = document.getElementById('siteNavigation');

  if (!navbarCollapse || typeof bootstrap === 'undefined') return;

  const collapseInstance = new bootstrap.Collapse(navbarCollapse, { toggle: false });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        collapseInstance.hide();
      }
    });
  });
}

function initFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener('click', handleFilterClick);
  });

  if (searchInput) {
    searchInput.addEventListener('input', handleSearchInput);
  }
}

function initFavorites() {
  divisionCards.forEach((card) => {
    const favoriteButton = card.querySelector('.favorite-button');
    if (!favoriteButton) return;

    favoriteButton.addEventListener('click', handleFavoriteClick);
  });

  if (resetFavoritesButton) {
    resetFavoritesButton.addEventListener('click', resetFavorites);
  }
}

function initForm() {
  if (!contactForm) return;

  handleFieldValidation();
  contactForm.addEventListener('submit', handleFormSubmit);
}

function init() {
  loadFavorites();
  loadViewState();
  updateFavoriteUI();
  applyDivisionFilters();

  initFilters();
  initFavorites();
  initForm();
  initSmoothCloseNavbar();
}

document.addEventListener('DOMContentLoaded', init);