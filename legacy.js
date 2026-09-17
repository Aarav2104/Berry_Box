/* Functionality layer for the original BerryBox screens. It intentionally leaves their design untouched. */
(() => {
  const by = (selector) => document.querySelector(selector);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Continue in memory if browser storage is unavailable. */ } };
  const readUser = () => read('berrybox-user', {});
  const saveUser = (user) => write('berrybox-user', user);
  const landing = by('#landing-page');
  if (landing) {
    const open = () => location.href = 'Signup.html';
    landing.addEventListener('click', open);
    landing.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') open(); });
    return;
  }

  const signup = by('.desktop-2');
  if (signup) {
    by('.signup-form-panel-inner')?.addEventListener('click', (event) => {
      event.preventDefault();
      const name = by('.enter-full-name')?.value.trim();
      const email = by('.enter-email')?.value.trim();
      const password = by('.password2')?.value;
      if (!name || !email || !password || !by('.famiconscheckbox')?.checked) return alert('Please complete all fields and accept the agreement.');
      saveUser({ name, email, memberSince: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }) });
      location.href = 'dashboard.html';
    });
    by('.already-have-an-container')?.addEventListener('click', () => location.href = 'Signin.html');
    return;
  }

  const signin = by('.desktop-3');
  if (signin) {
    by('.right-panel-form-inner')?.addEventListener('click', (event) => {
      event.preventDefault();
      const email = by('.enter-email')?.value.trim();
      const password = by('.password2')?.value;
      if (!email || !password) return alert('Enter your email and password to continue.');
      const user = readUser(); saveUser({ ...user, name: user.name || email.split('@')[0], email });
      location.href = 'dashboard.html';
    });
    by('.dont-have-an-container')?.addEventListener('click', () => location.href = 'Signup.html');
    return;
  }

  const dashboard = by('.desktop-4');
  if (!dashboard) return;
  dashboard.addEventListener('submit', (event) => event.preventDefault());
  const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.hidden = true; document.body.append(input);
  const photoGrid = by('.photo-grid'), user = readUser();
  const categories = ['All', 'People', 'Sports', 'Travel', 'Pets'];
  let activeCategory = 'All', newestFirst = true, onlyFavorites = false, page = 1;
  const base = [...document.querySelectorAll('.photo-card-1,.photo-card-3')].map((card, index) => ({
    id: `built-in-${index}`, name: card.textContent.trim(), src: card.querySelector('img').src,
    category: categories[(index % (categories.length - 1)) + 1], favorite: index < 3, added: index
  }));
  let gallery = read('berrybox-gallery', null) || base;
  const toast = (message) => { let item = document.createElement('div'); item.textContent = message; item.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99;background:#24212c;color:#fff;padding:12px 18px;border-radius:9px;font:14px Poppins,Arial;box-shadow:0 8px 22px #0004'; document.body.append(item); setTimeout(() => item.remove(), 2200); };
  const save = () => write('berrybox-gallery', gallery);
  const total = by('.info-row-photos .control-items');
  const member = [...document.querySelectorAll('.info-row-member .control-items')].at(-1);
  if (member && user.memberSince) member.textContent = user.memberSince;
  const card = (photo) => { const el = document.createElement('div'); el.className = 'photo-card-1'; el.dataset.id = photo.id; el.style.cursor = 'pointer'; el.innerHTML = `<img class="photo-items-icon" src="${photo.src}" alt="${photo.name}"><div class="photo-1">${photo.name}</div>`; el.addEventListener('click', () => { photo.favorite = !photo.favorite; save(); render(); toast(photo.favorite ? 'Added to favorites.' : 'Removed from favorites.'); }); return el; };
  const updateStats = () => {
    if (total) total.textContent = gallery.length;
    const size = gallery.length * 0.019;
    const usage = by('.gb-10'); if (usage) usage.textContent = `${size.toFixed(2)} GB  /  10 GB used`;
  };
  const render = () => {
    const search = by('.search-photos')?.value.toLowerCase() || '';
    let items = gallery.filter(photo => (!onlyFavorites || photo.favorite) && (activeCategory === 'All' || photo.category === activeCategory) && photo.name.toLowerCase().includes(search));
    items.sort((a, b) => newestFirst ? b.added - a.added : a.added - b.added);
    const perPage = 6, pages = Math.max(1, Math.ceil(items.length / perPage)); page = Math.min(page, pages);
    photoGrid.innerHTML = ''; items.slice((page - 1) * perPage, page * perPage).forEach(photo => photoGrid.append(card(photo)));
    document.querySelectorAll('.page-controls,.page-controls2,.page-controls3').forEach((button, index) => { button.style.backgroundColor = index + 1 === page ? '#d3c3f2' : ''; button.style.display = index + 1 <= pages ? '' : 'none'; });
    updateStats();
  };
  const choose = () => input.click();
  by('.choose-file-button')?.addEventListener('click', choose);
  document.querySelector('.navigation-items')?.addEventListener('click', choose);
  input.addEventListener('change', () => {
    const file = input.files[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) return toast('Choose a JPG, PNG, or WebP image under 10 MB.');
    const reader = new FileReader(); reader.onload = () => { gallery.unshift({ id: `upload-${Date.now()}`, name: file.name.replace(/\.[^/.]+$/, ''), src: reader.result, category: 'All', favorite: false, added: Date.now() }); save(); page = 1; onlyFavorites = false; render(); toast('Photo added to your gallery.'); }; reader.readAsDataURL(file);
  });
  by('.gallery-link')?.addEventListener('click', () => { onlyFavorites = false; page = 1; render(); toast('Showing all photos.'); });
  by('.favorites-link')?.addEventListener('click', () => { onlyFavorites = true; page = 1; render(); toast('Showing favorites.'); });
  by('.search-photos')?.addEventListener('input', () => { page = 1; render(); });
  by('.filter-selectors')?.addEventListener('click', () => { activeCategory = categories[(categories.indexOf(activeCategory) + 1) % categories.length]; by('.filter-selectors .logout').textContent = activeCategory; page = 1; render(); });
  by('.filter-selectors2')?.addEventListener('click', () => { newestFirst = !newestFirst; by('.date2').textContent = newestFirst ? 'Newest' : 'Oldest'; render(); });
  document.querySelectorAll('.page-controls,.page-controls2,.page-controls3').forEach((button, index) => button.addEventListener('click', () => { page = index + 1; render(); }));
  document.querySelectorAll('.page-controls-icon').forEach((arrow, index) => arrow.addEventListener('click', () => { page = Math.max(1, page + (index === 0 ? -1 : 1)); render(); }));
  by('.streamline-flex-colorbell-not-icon')?.addEventListener('click', () => toast('You are all caught up.'));
  by('.logout-button')?.addEventListener('click', () => { localStorage.removeItem('berrybox-user'); location.href = 'index.html'; });
  by('.navigation-items2')?.addEventListener('click', () => toast(`Signed in as ${user.name || user.email || 'BerryBox member'}.`));
  render();
})();
