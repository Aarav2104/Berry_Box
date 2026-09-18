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
      const user = readUser(); saveUser({ ...user, name: user.name || email.split('@')[0], email, memberSince: user.memberSince || new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }) });
      location.href = 'dashboard.html';
    });
    by('.dont-have-an-container')?.addEventListener('click', () => location.href = 'Signup.html');
    return;
  }

  const toast = (message) => { let item = document.createElement('div'); item.textContent = message; item.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99;background:#24212c;color:#fff;padding:12px 18px;border-radius:9px;font:14px Poppins,Arial;box-shadow:0 8px 22px #0004'; document.body.append(item); setTimeout(() => item.remove(), 2200); };
  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // New: standalone Profile.html page. Reads the same localStorage the dashboard uses.
  const profilePage = by('.profile-page');
  if (profilePage) {
    const user = readUser();
    const gallery = read('berrybox-gallery', null) || [];
    const set = (selector, text) => { const el = by(selector); if (el) el.textContent = text; el && el.setAttribute && el.setAttribute('title', text); };
    set('.profile-name', user.name || (user.email ? user.email.split('@')[0] : 'BerryBox member'));
    set('.profile-email', user.email || 'member@example.com');
    set('.profile-member-since', user.memberSince || 'September 2026');
    set('.profile-photo-count', gallery.length);
    set('.profile-storage-used', `${(gallery.length * 0.019).toFixed(2)} GB / 10 GB`);
    by('.gallery-link')?.addEventListener('click', () => location.href = 'dashboard.html');
    by('.navigation-items')?.addEventListener('click', () => location.href = 'dashboard.html');
    by('.favorites-link')?.addEventListener('click', () => location.href = 'dashboard.html');
    by('.logout-button')?.addEventListener('click', () => { localStorage.removeItem('berrybox-user'); location.href = 'index.html'; });
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
  const save = () => write('berrybox-gallery', gallery);
  const total = by('.info-row-photos .control-items');
  const member = [...document.querySelectorAll('.info-row-member .control-items')].at(-1);
  if (member && user.memberSince) member.textContent = user.memberSince;

  // New: download the original file for a gallery photo.
  const guessExtension = (url, mime) => {
    const fromUrl = (url.split('?')[0].match(/\.[a-zA-Z0-9]+$/) || [])[0];
    if (fromUrl) return fromUrl;
    const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
    return map[mime] || '';
  };
  const downloadPhoto = async (photo) => {
    try {
      const res = await fetch(photo.src);
      const blob = await res.blob();
      const ext = guessExtension(photo.src, blob.type);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${photo.name || 'photo'}${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      toast('Could not download this photo.');
    }
  };

  // New: confirmation dialog before a photo is deleted.
  const askDelete = (photo) => {
    const overlay = document.createElement('div');
    overlay.className = 'bb-modal-overlay';
    overlay.innerHTML = `<div class="bb-modal-card"><h2>Delete this photo?</h2><p>“${esc(photo.name)}” will be permanently removed from your gallery. This can't be undone.</p><div class="bb-modal-actions"><button data-action="cancel">Cancel</button><button data-action="confirm" class="bb-danger">Delete photo</button></div></div>`;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.dataset.action === 'cancel') { overlay.remove(); return; }
      if (event.target.dataset.action === 'confirm') {
        const wasFavorite = photo.favorite;
        gallery = gallery.filter((p) => p.id !== photo.id);
        save(); overlay.remove(); page = 1; render();
        toast(wasFavorite ? 'Photo deleted and removed from favorites.' : 'Photo deleted.');
      }
    });
    document.body.appendChild(overlay);
  };

  const card = (photo) => {
    const el = document.createElement('div'); el.className = 'photo-card-1'; el.dataset.id = photo.id;
    el.innerHTML = `<div class="photo-thumb"><img class="photo-items-icon" src="${photo.src}" alt="${esc(photo.name)}"><button type="button" class="photo-action photo-star ${photo.favorite ? 'on' : ''}" aria-label="Toggle favorite">★</button><button type="button" class="photo-action photo-download" aria-label="Download photo"><img src="public/tabler_download.svg" alt=""></button><button type="button" class="photo-action photo-delete" aria-label="Delete photo"><img src="public/tabler_trash.svg" alt=""></button></div><div class="photo-1" title="${esc(photo.name)}">${esc(photo.name)}</div>`;
    el.querySelector('.photo-star').addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      photo.favorite = !photo.favorite; save(); render();
      toast(photo.favorite ? 'Added to favorites.' : 'Removed from favorites.');
    });
    el.querySelector('.photo-download').addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      downloadPhoto(photo);
    });
    el.querySelector('.photo-delete').addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      askDelete(photo);
    });
    return el;
  };
  const updateStats = () => {
    if (total) total.textContent = gallery.length;
    const quotaGb = 10;
    const usedGb = gallery.length * 0.019;
    const percent = Math.min(100, (usedGb / quotaGb) * 100);
    const usage = by('.gb-10'); if (usage) usage.textContent = `${usedGb.toFixed(2)} GB  /  ${quotaGb} GB used`;
    const percentLabel = by('.storage-usage-row .control-items'); if (percentLabel) percentLabel.textContent = `${Math.round(percent)}%`;
    const fill = by('#storage-bar-fill'); if (fill) fill.style.width = `${percent}%`;
  };
  const pageNumbers = by('#page-numbers');
  const renderPageNumbers = (pages) => {
    if (!pageNumbers) return;
    const slots = Math.max(pages, 3); // always show at least 1, 2, 3 by default
    pageNumbers.classList.toggle('fit', slots <= 3); // let them fill the bar (bigger) until scrolling is actually needed
    pageNumbers.innerHTML = '';
    for (let i = 1; i <= slots; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `page-num${i === page ? ' active' : ''}`;
      btn.innerHTML = `<div class="control-items">${i}</div>`;
      btn.addEventListener('click', () => { page = i; render(); });
      pageNumbers.appendChild(btn);
    }
    pageNumbers.querySelector('.page-num.active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };
  const render = () => {
    const search = by('.search-photos')?.value.toLowerCase() || '';
    let items = gallery.filter(photo => (!onlyFavorites || photo.favorite) && (activeCategory === 'All' || photo.category === activeCategory) && photo.name.toLowerCase().includes(search));
    items.sort((a, b) => newestFirst ? b.added - a.added : a.added - b.added);
    const perPage = 6, pages = Math.max(1, Math.ceil(items.length / perPage)); page = Math.min(page, pages);
    photoGrid.innerHTML = ''; items.slice((page - 1) * perPage, page * perPage).forEach(photo => photoGrid.append(card(photo)));
    renderPageNumbers(pages);
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
  document.querySelectorAll('.page-controls-icon').forEach((arrow, index) => arrow.addEventListener('click', () => { page = Math.max(1, page + (index === 0 ? -1 : 1)); render(); }));
  by('.streamline-flex-colorbell-not-icon')?.addEventListener('click', () => toast('You are all caught up.'));
  by('.logout-button')?.addEventListener('click', () => { localStorage.removeItem('berrybox-user'); location.href = 'index.html'; });
  by('.navigation-items2')?.addEventListener('click', () => location.href = 'Profile.html');
  render();
})();
