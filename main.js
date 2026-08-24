/* =========================================================================
   Aaryan Parab — portfolio interactions
   Nav (sticky + scroll-spy + drawer), scroll progress, reveal-on-scroll,
   rotating role text, pointer glow, screenshot lightbox.
   ========================================================================= */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $  = (sel, ctx) => (ctx || document).querySelector(sel);
    const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));

    /* -------------------------- footer year -------------------------- */
    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* --------------------- nav: stuck + progress --------------------- */
    const nav      = $('#nav');
    const progress = $('#progress');

    function onScroll() {
        const y = window.scrollY || document.documentElement.scrollTop;
        if (nav) nav.classList.toggle('is-stuck', y > 24);

        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        }
    }

    let scrollQueued = false;
    window.addEventListener('scroll', function () {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(function () {
            onScroll();
            scrollQueued = false;
        });
    }, { passive: true });
    onScroll();

    /* --------------------------- mobile drawer ----------------------- */
    const burger = $('#burger');
    const drawer = $('#drawer');

    function closeMenu() {
        document.body.classList.remove('menu-open');
        if (burger) burger.setAttribute('aria-expanded', 'false');
    }

    if (burger && drawer) {
        burger.addEventListener('click', function () {
            const open = document.body.classList.toggle('menu-open');
            burger.setAttribute('aria-expanded', String(open));
        });
        $$('a', drawer).forEach(a => a.addEventListener('click', closeMenu));
    }

    window.addEventListener('resize', function () {
        if (window.innerWidth > 880) closeMenu();
    });

    /* ------------------------- nav scroll-spy ------------------------ */
    const navLinks = $$('#navLinks a');
    const sections = navLinks
        .map(a => document.getElementById(a.getAttribute('href').slice(1)))
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        const spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (link) {
                    link.classList.toggle(
                        'is-active',
                        link.getAttribute('href') === '#' + entry.target.id
                    );
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

        sections.forEach(s => spy.observe(s));
    }

    /* ------------------------ reveal on scroll ----------------------- */
    const revealables = $$('[data-reveal]');

    if (!revealables.length) {
        /* nothing to do */
    } else if (reduceMotion || !('IntersectionObserver' in window)) {
        revealables.forEach(el => el.classList.add('is-in'));
    } else {
        const revealer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                revealer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

        revealables.forEach(el => revealer.observe(el));
    }

    /* --------------------- rotating role typewriter ------------------ */
    const roleText = $('#roleText');
    const ROLES = [
        'Unity gameplay programmer',
        'Photon multiplayer & netcode',
        'C# systems & editor tooling',
        'Arabic RTL localization',
        'Unreal Engine 5 in progress'
    ];

    if (roleText) {
        if (reduceMotion) {
            roleText.textContent = ROLES[0];
        } else {
            let roleIndex = 0;
            let charIndex = 0;
            let deleting  = false;

            (function type() {
                const word = ROLES[roleIndex];
                charIndex += deleting ? -1 : 1;
                roleText.textContent = word.slice(0, charIndex);

                let wait = deleting ? 34 : 62;

                if (!deleting && charIndex === word.length) {
                    deleting = true;
                    wait = 1900;
                } else if (deleting && charIndex === 0) {
                    deleting = false;
                    roleIndex = (roleIndex + 1) % ROLES.length;
                    wait = 320;
                }

                setTimeout(type, wait);
            })();
        }
    }

    /* --------------------------- pointer glow ------------------------ */
    const glow = $('#cursorGlow');

    if (glow && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        let gx = 0, gy = 0, tx = 0, ty = 0, running = false;

        window.addEventListener('pointermove', function (e) {
            document.body.classList.add('has-pointer');
            tx = e.clientX;
            ty = e.clientY;
            if (!running) {
                running = true;
                requestAnimationFrame(follow);
            }
        }, { passive: true });

        function follow() {
            gx += (tx - gx) * 0.12;
            gy += (ty - gy) * 0.12;
            glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';

            if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) {
                requestAnimationFrame(follow);
            } else {
                running = false;
            }
        }
    }

    /* ----------------------------- lightbox -------------------------- */
    const lightbox = $('#lightbox');

    if (lightbox) {
        const lbImg   = $('#lightboxImg');
        const lbLabel = $('#lightboxLabel');
        const lbCount = $('#lightboxCount');
        const lbClose = $('#lightboxClose');
        const lbPrev  = $('#lightboxPrev');
        const lbNext  = $('#lightboxNext');

        let group = [];
        let index = 0;
        let lastFocus = null;

        function render() {
            const img = group[index];
            if (!img) return;
            lbImg.src = img.currentSrc || img.src;
            lbImg.alt = img.alt || '';
            lbLabel.textContent = img.alt || 'Screenshot';
            lbCount.textContent = (index + 1) + ' / ' + group.length;
        }

        function open(img) {
            const shots = img.closest('.shots');
            group = shots ? $$('img', shots) : [img];
            index = Math.max(0, group.indexOf(img));
            lastFocus = document.activeElement;
            lightbox.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            render();
            lbClose.focus();
        }

        function close() {
            lightbox.classList.remove('is-open');
            document.body.style.overflow = '';
            lbImg.removeAttribute('src'); /* '' would re-request the page itself */
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        function step(delta) {
            if (group.length < 2) return;
            index = (index + delta + group.length) % group.length;
            render();
        }

        $$('.shots img').forEach(function (img) {
            img.addEventListener('click', function () { open(img); });
        });

        lbClose.addEventListener('click', close);
        lbPrev.addEventListener('click', function () { step(-1); });
        lbNext.addEventListener('click', function () { step(1); });

        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) close();
        });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('is-open')) return;
            if (e.key === 'Escape')     close();
            if (e.key === 'ArrowLeft')  step(-1);
            if (e.key === 'ArrowRight') step(1);
        });
    }

    /* ------------------- drag-to-scroll screenshot rails ------------- */
    $$('.shots').forEach(function (rail) {
        let down = false, startX = 0, startScroll = 0, moved = 0;

        rail.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'touch') return; /* native touch scroll */
            down = true;
            moved = 0;
            startX = e.clientX;
            startScroll = rail.scrollLeft;
        });

        rail.addEventListener('pointermove', function (e) {
            if (!down) return;
            const dx = e.clientX - startX;
            moved = Math.max(moved, Math.abs(dx));
            if (moved > 4) {
                rail.scrollLeft = startScroll - dx;
                rail.style.cursor = 'grabbing';
            }
        });

        function release() {
            down = false;
            rail.style.cursor = '';
        }

        rail.addEventListener('pointerup', release);
        rail.addEventListener('pointerleave', release);

        /* swallow the click that ends a drag so the lightbox stays shut */
        rail.addEventListener('click', function (e) {
            if (moved > 4) {
                e.stopPropagation();
                e.preventDefault();
                moved = 0;
            }
        }, true);
    });
})();
