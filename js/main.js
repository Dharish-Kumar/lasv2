/* ==========================================================================
   Little Ace Sports — home page scripts (vanilla JS + Bootstrap 5 bundle)
   ========================================================================== */
(function () {
    'use strict';

    /* ---------- Settings: edit these ---------- */
    // URL that receives the trial form as JSON (your server, Google Apps Script
    // web app, Formspree, etc). Leave empty to send the enquiry through WhatsApp.
    var FORM_ENDPOINT = '';
    // WhatsApp number with country code, digits only (used when FORM_ENDPOINT is empty).
    var WHATSAPP_NUMBER = '910000000000';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* ---------- Header shadow + back-to-top button ---------- */
    var header = $('.site-header');
    var toTop = $('#toTop');
    function onScroll() {
        var y = window.scrollY;
        if (header) header.classList.toggle('is-scrolled', y > 10);
        if (toTop) toTop.classList.toggle('is-visible', y > 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Close the mobile menu after choosing a link ---------- */
    var navMenu = $('#navMenu');
    $$('#navMenu a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function () {
            if (navMenu.classList.contains('show') && window.bootstrap) {
                window.bootstrap.Collapse.getOrCreateInstance(navMenu).hide();
            }
        });
    });

    /* ---------- Scroll reveal ---------- */
    var reveals = $$('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        // Stagger items that sit side by side in the same row or grid
        $$('.row, .bento, .stats').forEach(function (group) {
            $$('.reveal', group).forEach(function (el, i) { el.style.setProperty('--delay', (i % 6) * 70 + 'ms'); });
        });
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
        reveals.forEach(function (el) { revealObserver.observe(el); });
    }

    /* ---------- Count-up numbers ---------- */
    function countUp(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        if (!target || reduceMotion) return;
        var start = null, duration = 1400;
        function tick(now) {
            if (start === null) start = now;
            var p = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { countUp(entry.target); countObserver.unobserve(entry.target); }
            });
        }, { threshold: 0.6 });
        $$('[data-count]').forEach(function (el) { countObserver.observe(el); });
    }

    /* ---------- Program filter by age ---------- */
    var filters = $$('.filter');
    var cards = $$('#programGrid [data-ages]');
    var emptyMsg = $('#programEmpty');
    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var key = btn.getAttribute('data-filter');
            var shown = 0;
            filters.forEach(function (b) {
                var on = b === btn;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            cards.forEach(function (card) {
                var match = key === 'all' || card.getAttribute('data-ages').split(' ').indexOf(key) !== -1;
                card.hidden = !match;
                if (match) shown++;
            });
            if (emptyMsg) emptyMsg.hidden = shown > 0;
        });
    });

    /* ---------- "Try a class" pre-selects the sport in the form ---------- */
    var sportSelect = $('#tSport');
    $$('[data-sport]').forEach(function (link) {
        link.addEventListener('click', function () {
            if (sportSelect) sportSelect.value = link.getAttribute('data-sport');
        });
    });

    /* ---------- Trial form ---------- */
    var form = $('#trialForm');
    var msg = $('#trialMsg');
    function showMsg(text, isError) {
        msg.textContent = text;
        msg.classList.toggle('is-error', !!isError);
        msg.hidden = false;
    }
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                var firstBad = $(':invalid', form);
                if (firstBad) firstBad.focus();
                return;
            }
            var data = {
                parent: form.parent.value.trim(),
                phone: form.phone.value.trim(),
                age: form.age.value,
                sport: form.sport.value,
                page: location.href
            };

            // No endpoint configured: hand the enquiry to WhatsApp
            if (!FORM_ENDPOINT) {
                var text = 'Hi Little Ace Sports, I would like a free trial class.\n' +
                    'Parent: ' + data.parent + '\nPhone: ' + data.phone +
                    '\nChild\'s age: ' + data.age + '\nSport: ' + data.sport;
                window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
                showMsg('WhatsApp is opening with your details. Press send there to complete your request.');
                return;
            }

            var btn = $('button[type="submit"]', form);
            btn.disabled = true;
            fetch(FORM_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }).then(function (res) {
                if (!res.ok) throw new Error('Request failed: ' + res.status);
                form.reset();
                form.classList.remove('was-validated');
                showMsg('Thank you! We have your request and will call you within one working day.');
            }).catch(function () {
                showMsg('Sorry, we could not send your request. Please call or WhatsApp us instead.', true);
            }).then(function () {
                btn.disabled = false;
            });
        });
    }

    /* ---------- Footer year ---------- */
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
})();
