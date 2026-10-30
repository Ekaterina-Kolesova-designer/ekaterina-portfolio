/* Buildless and offline-ready: all content and media are local. */
(() => {
  'use strict';

  const cards = [...document.querySelectorAll('.project-card')];
  // Browsers ignore the download attribute on file:// PDF links. Keep the
  // normal PDF URL for HTTP; load its exact bundled bytes only on an offline
  // download click, so neither a server nor a network request is needed.
  if (location.protocol === 'file:') {
    let cvBlobReady = null;
    const getCvBlob = () => {
      if (!cvBlobReady) {
        cvBlobReady = new Promise((resolve, reject) => {
          const source = document.createElement('script');
          source.src = 'assets/cv-download.js';
          source.onload = () => {
            try {
              const binary = atob(window.portfolioCvBase64);
              const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
              delete window.portfolioCvBase64;
              resolve(new Blob([bytes], { type: 'application/pdf' }));
            } catch (error) { reject(error); }
          };
          source.onerror = () => reject(new Error('Local PDF download data unavailable'));
          document.head.append(source);
        });
      }
      return cvBlobReady;
    };

    for (const link of document.querySelectorAll('a[href="assets/cv.pdf"][download]')) {
      link.addEventListener('click', async (event) => {
        event.preventDefault();
        if (link.getAttribute('aria-busy') === 'true') return;
        link.setAttribute('aria-busy', 'true');
        try {
          const url = URL.createObjectURL(await getCvBlob());
          const download = document.createElement('a');
          download.href = url;
          download.download = link.download;
          document.body.append(download);
          download.click();
          download.remove();
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch {
          // If someone moved only part of the folder, the original PDF still
          // remains accessible through the browser's built-in PDF viewer.
          location.href = link.href;
        } finally { link.removeAttribute('aria-busy'); }
      });
    }
  }

  const gallery = document.querySelector('.work-gallery');
  if (gallery) {
    const slides = [...gallery.querySelectorAll('.gallery-slide')];
    const counter = gallery.querySelector('.gallery-counter');
    const viewport = gallery.querySelector('.gallery-viewport');
    let activeSlide = 0;
    let pointerStart = null;

    const showSlide = (index) => {
      activeSlide = (index + slides.length) % slides.length;
      slides.forEach((slide, position) => { slide.hidden = position !== activeSlide; });
      counter.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };

    gallery.querySelector('.gallery-prev').addEventListener('click', () => showSlide(activeSlide - 1));
    gallery.querySelector('.gallery-next').addEventListener('click', () => showSlide(activeSlide + 1));
    gallery.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      showSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
    });

    // Allow vertical page scrolling; only a deliberate horizontal gesture
    // changes the photo. Pointer capture also covers dragging past the edge.
    viewport.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener('pointerup', (event) => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        showSlide(activeSlide + (dx < 0 ? 1 : -1));
      }
    });
    viewport.addEventListener('pointercancel', () => { pointerStart = null; });
    viewport.addEventListener('lostpointercapture', () => { pointerStart = null; });

    // Prepare the other local photos when About approaches the viewport.
    // Nothing advances automatically, and the initial page stays light.
    const preparePhotos = () => {
      for (const image of gallery.querySelectorAll('img[loading]')) image.loading = 'eager';
    };
    if ('IntersectionObserver' in window) {
      const photoObserver = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        preparePhotos();
        photoObserver.disconnect();
      }, { rootMargin: '320px' });
      photoObserver.observe(gallery);
    } else {
      preparePhotos();
    }
  }

  const count = document.querySelector('#portfolio-count');
  if (count) {
    const amount = cards.length;
    const lastTwo = amount % 100;
    const last = amount % 10;
    const noun = lastTwo >= 11 && lastTwo <= 14 ? 'проектов' :
      last === 1 ? 'проект' : last >= 2 && last <= 4 ? 'проекта' : 'проектов';
    count.textContent = `${amount} ${noun}`;
  }
})();
