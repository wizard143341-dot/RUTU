/* ==========================================================================
   RUTU — A DIGITAL LOVE LETTER & CINEMATIC BIRTHDAY EXPERIENCE
   Vanilla JavaScript + GSAP ScrollTrigger + Web Audio API + Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const screenOpening = document.getElementById('screenOpening');
  const btnEnter = document.getElementById('btnEnter');
  const mainExperience = document.getElementById('mainExperience');
  const soundToggle = document.getElementById('soundToggle');
  const soundLabel = document.getElementById('soundLabel');
  const soundtrackAudio = document.getElementById('soundtrackAudio');
  const videoModalBtn = document.getElementById('videoModalBtn');
  const reelModal = document.getElementById('reelModal');
  const reelBackdrop = document.getElementById('reelBackdrop');
  const reelCloseBtn = document.getElementById('reelCloseBtn');
  const reelVideo = document.getElementById('reelVideo');
  
  // Custom Cursor
  const cursor = document.getElementById('customCursor');
  const cursorText = document.getElementById('cursorText');
  
  // Interactive Breath Orb
  const breathOrb = document.getElementById('breathOrb');
  const breathStateText = document.getElementById('breathStateText');
  const breathSubPrompt = document.getElementById('breathSubPrompt');
  const breathFeedbackBox = document.getElementById('breathFeedbackBox');
  
  // Filmstrip
  const filmstripViewport = document.getElementById('filmstripViewport');
  
  // Docking stage
  const dockingStage = document.getElementById('dockingStage');
  
  // Interactive Candle & Wish
  const candleBtn = document.getElementById('candleBtn');
  const wishIntro = document.getElementById('wishIntro');
  const wishRevealBox = document.getElementById('wishRevealBox');
  const starlightMemories = document.getElementById('starlightMemories');
  const btnReplay = document.getElementById('btnReplay');

  // Stars Canvas
  const starsCanvas = document.getElementById('starsCanvas');

  // State
  let isSoundActive = false;
  let audioContext = null;
  let synthGain = null;
  let synthOscillators = [];
  let breathHoldTimer = null;
  let isBreathingHeld = false;
  let breathCompleted = false;
  let isCandleBlown = false;

  // Remove loading class
  document.body.classList.remove('loading');

  /* ==========================================================================
     1. CUSTOM CURSOR
     ========================================================================== */
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      const dot = cursor.querySelector('.cursor-dot');
      if (dot) {
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    });

    const updateCursorRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      const ring = cursor.querySelector('.cursor-ring');
      if (ring) {
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      requestAnimationFrame(updateCursorRing);
    };
    requestAnimationFrame(updateCursorRing);

    // Interactive Hover Elements
    const interactiveElements = document.querySelectorAll('[data-cursor]');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const text = el.getAttribute('data-cursor');
        cursor.classList.add('active');
        if (cursorText) cursorText.textContent = text || '';
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        if (cursorText) cursorText.textContent = '';
      });
    });
  }

  /* ==========================================================================
     2. AMBIENT AUDIO SYSTEM (Generative Web Audio + Audio Track)
     ========================================================================== */
  const initWebAudioSynth = () => {
    if (audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      
      // Warm atmospheric drone chords (F# major pentatonic ambient pad)
      const freqs = [92.5, 138.59, 185.00, 277.18, 369.99]; // F#2, C#3, F#3, C#4, F#4
      synthGain = audioContext.createGain();
      synthGain.gain.setValueAtTime(0.001, audioContext.currentTime);

      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioContext.currentTime);

      freqs.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        // Gentle detuning for lush warmth
        const detuneOsc = (idx - 2) * 4;
        osc.detune.setValueAtTime(detuneOsc, audioContext.currentTime);

        const oscGain = audioContext.createGain();
        oscGain.gain.setValueAtTime(0.08 / freqs.length, audioContext.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        synthOscillators.push(osc);
      });

      filter.connect(synthGain);
      synthGain.connect(audioContext.destination);
    } catch (e) {
      console.warn('Web Audio synthesis not supported or initialized', e);
    }
  };

  const playGenerativeSynth = () => {
    initWebAudioSynth();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (synthGain && audioContext) {
      synthGain.gain.cancelScheduledValues(audioContext.currentTime);
      synthGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 3);
    }
  };

  const stopGenerativeSynth = () => {
    if (synthGain && audioContext) {
      synthGain.gain.cancelScheduledValues(audioContext.currentTime);
      synthGain.gain.linearRampToValueAtTime(0.001, audioContext.currentTime + 1.5);
    }
  };

  const startSound = async () => {
    isSoundActive = true;
    soundToggle.classList.add('playing');
    if (soundLabel) soundLabel.textContent = 'Sound On';

    // Try playing the soundtrack audio file (from video/audio)
    if (soundtrackAudio) {
      soundtrackAudio.volume = 0;
      soundtrackAudio.play().then(() => {
        // Smoothly fade in volume
        gsap.to(soundtrackAudio, { volume: 0.7, duration: 2.5 });
      }).catch(() => {
        // Fallback to generative ambient synth if audio file playback is blocked
        playGenerativeSynth();
      });
    } else {
      playGenerativeSynth();
    }
  };

  const stopSound = () => {
    isSoundActive = false;
    soundToggle.classList.remove('playing');
    if (soundLabel) soundLabel.textContent = 'Sound Off';

    if (soundtrackAudio) {
      gsap.to(soundtrackAudio, {
        volume: 0,
        duration: 1.2,
        onComplete: () => soundtrackAudio.pause()
      });
    }
    stopGenerativeSynth();
  };

  soundToggle.addEventListener('click', () => {
    if (isSoundActive) {
      stopSound();
    } else {
      startSound();
    }
  });

  // Pause sound when user changes tab/minimizes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isSoundActive) {
      if (soundtrackAudio) soundtrackAudio.pause();
      stopGenerativeSynth();
    } else if (!document.hidden && isSoundActive) {
      if (soundtrackAudio) soundtrackAudio.play().catch(() => {});
      playGenerativeSynth();
    }
  });

  /* ==========================================================================
     3. VIDEO REEL MODAL
     ========================================================================== */
  const openReelModal = () => {
    if (reelModal) {
      reelModal.classList.add('active');
      reelModal.setAttribute('aria-hidden', 'false');
      if (reelVideo) {
        reelVideo.currentTime = 0;
        reelVideo.play().catch(() => {});
      }
      // If ambient audio was playing, pause it while video is on
      if (isSoundActive && soundtrackAudio) {
        soundtrackAudio.pause();
      }
    }
  };

  const closeReelModal = () => {
    if (reelModal) {
      reelModal.classList.remove('active');
      reelModal.setAttribute('aria-hidden', 'true');
      if (reelVideo) {
        reelVideo.pause();
      }
      // Resume soundtrack if sound was active
      if (isSoundActive && soundtrackAudio) {
        soundtrackAudio.play().catch(() => {});
      }
    }
  };

  if (videoModalBtn) videoModalBtn.addEventListener('click', openReelModal);
  if (reelCloseBtn) reelCloseBtn.addEventListener('click', closeReelModal);
  if (reelBackdrop) reelBackdrop.addEventListener('click', closeReelModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && reelModal && reelModal.classList.contains('active')) {
      closeReelModal();
    }
  });

  /* ==========================================================================
     4. OPENING SCREEN TRANSITION
     ========================================================================== */
  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      // Start audio with user interaction gesture
      startSound();

      // Fade out opening screen
      screenOpening.classList.add('fade-out');

      setTimeout(() => {
        screenOpening.style.display = 'none';
        mainExperience.classList.remove('experience-hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Trigger Hero animation timeline
        initHeroAnimations();
      }, 900);
    });
  }

  /* ==========================================================================
     5. GSAP SCROLLTRIGGER & TIMELINES
     ========================================================================== */
  const initHeroAnimations = () => {
    if (typeof gsap === 'undefined') return;

    const heroTl = gsap.timeline();
    heroTl.fromTo('.hero-headline span', 
      { opacity: 0, y: 30 }, 
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.25, ease: 'power3.out' }
    )
    .fromTo('.hero-subline p', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power2.out' }, 
      '-=0.6'
    )
    .fromTo('.scroll-cue', 
      { opacity: 0 }, 
      { opacity: 1, duration: 1, ease: 'power2.out' }, 
      '-=0.4'
    );
  };

  const initScrollTriggers = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero Image subtle parallax
    gsap.to('.hero-img', {
      scrollTrigger: {
        trigger: '#actHero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      y: '18%',
      ease: 'none'
    });

    // Act 2: I See You Cards Stagger
    gsap.utils.toArray('.see-you-text-col .reveal-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        x: -30,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });

    gsap.from('.admire-quote-box', {
      scrollTrigger: {
        trigger: '.admire-quote-box',
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 25,
      duration: 1,
      ease: 'power3.out'
    });

    // Act 3: Unlearning rows
    gsap.utils.toArray('.unlearning-row').forEach((row, i) => {
      gsap.from(row, {
        scrollTrigger: {
          trigger: row,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: i * 0.15,
        ease: 'power2.out'
      });
    });

    // Act 7: Kinetic Typography "Beside You" Docking
    if (dockingStage) {
      ScrollTrigger.create({
        trigger: dockingStage,
        start: 'top 75%',
        end: 'bottom 40%',
        onEnter: () => dockingStage.classList.add('docked'),
        onLeaveBack: () => dockingStage.classList.remove('docked')
      });
    }

    // Act 8: You Won golden light expand
    gsap.fromTo('#wonBgLight', 
      { scale: 0.6, opacity: 0.3 }, 
      {
        scrollTrigger: {
          trigger: '#actYouWon',
          start: 'top 70%',
          end: 'bottom 30%',
          scrub: 1
        },
        scale: 1.4,
        opacity: 0.9,
        ease: 'power2.out'
      }
    );

    // Generic reveal text and cards
    gsap.utils.toArray('.reveal-text').forEach((item) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray('.reveal-card, .reveal-fade').forEach((card) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 0.9,
        ease: 'power3.out'
      });
    });
  };

  initScrollTriggers();

  /* ==========================================================================
     6. ACT 4: INTERACTIVE "TAKE A BREATH" MOMENT
     ========================================================================== */
  if (breathOrb) {
    const handleBreathStart = (e) => {
      e.preventDefault();
      if (isBreathingHeld) return;
      isBreathingHeld = true;

      breathOrb.classList.remove('exhaling');
      breathOrb.classList.add('inhaling');
      if (breathStateText) breathStateText.textContent = 'Inhale…';
      if (breathSubPrompt) breathSubPrompt.textContent = 'filling your lungs gently';

      // Minimum 3.2s of holding to complete breathing cycle
      breathHoldTimer = setTimeout(() => {
        handleBreathComplete();
      }, 3200);
    };

    const handleBreathEnd = (e) => {
      if (!isBreathingHeld) return;
      isBreathingHeld = false;

      if (!breathCompleted) {
        clearTimeout(breathHoldTimer);
        breathOrb.classList.remove('inhaling');
        breathOrb.classList.add('exhaling');
        if (breathStateText) breathStateText.textContent = 'Exhale…';
        if (breathSubPrompt) breathSubPrompt.textContent = 'let it all out';

        setTimeout(() => {
          breathOrb.classList.remove('exhaling');
          if (breathStateText) breathStateText.textContent = 'Press & Hold';
          if (breathSubPrompt) breathSubPrompt.textContent = 'to inhale';
        }, 2200);
      }
    };

    const handleBreathComplete = () => {
      breathCompleted = true;
      breathOrb.classList.remove('inhaling');
      breathOrb.classList.add('exhaling');
      if (breathStateText) breathStateText.textContent = 'Exhale…';
      if (breathSubPrompt) breathSubPrompt.textContent = 'peaceful & soft';

      if (breathFeedbackBox) {
        breathFeedbackBox.classList.add('active');
      }

      setTimeout(() => {
        breathOrb.classList.remove('exhaling');
        if (breathStateText) breathStateText.textContent = 'Calm.';
        if (breathSubPrompt) breathSubPrompt.textContent = 'good job, Rutu';
      }, 2500);
    };

    breathOrb.addEventListener('mousedown', handleBreathStart);
    window.addEventListener('mouseup', handleBreathEnd);

    breathOrb.addEventListener('touchstart', handleBreathStart, { passive: false });
    window.addEventListener('touchend', handleBreathEnd);
  }

  /* ==========================================================================
     7. ACT 5: HORIZONTAL FILMSTRIP DRAG & WHEEL
     ========================================================================== */
  if (filmstripViewport) {
    let isDown = false;
    let startX;
    let scrollLeft;

    filmstripViewport.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - filmstripViewport.offsetLeft;
      scrollLeft = filmstripViewport.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
    });

    filmstripViewport.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - filmstripViewport.offsetLeft;
      const walk = (x - startX) * 1.8;
      filmstripViewport.scrollLeft = scrollLeft - walk;
    });

    // Horizontal wheel conversion when hovering over filmstrip
    filmstripViewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // Already horizontal
      // If within limits, scroll horizontally
      const maxScroll = filmstripViewport.scrollWidth - filmstripViewport.clientWidth;
      if (
        (e.deltaY > 0 && filmstripViewport.scrollLeft < maxScroll - 5) ||
        (e.deltaY < 0 && filmstripViewport.scrollLeft > 5)
      ) {
        e.preventDefault();
        filmstripViewport.scrollLeft += e.deltaY * 1.4;
      }
    }, { passive: false });
  }

  /* ==========================================================================
     8. ACT 9: TWINKLING STARS CANVAS
     ========================================================================== */
  if (starsCanvas) {
    const ctx = starsCanvas.getContext('2d');
    let stars = [];
    let animationFrameId;

    const resizeStars = () => {
      starsCanvas.width = starsCanvas.offsetWidth;
      starsCanvas.height = starsCanvas.offsetHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const count = Math.floor((starsCanvas.width * starsCanvas.height) / 8000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * starsCanvas.width,
          y: Math.random() * starsCanvas.height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random(),
          speed: Math.random() * 0.015 + 0.005,
          increasing: Math.random() > 0.5
        });
      }
    };

    const drawStars = () => {
      ctx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
      stars.forEach((star) => {
        if (star.increasing) {
          star.alpha += star.speed;
          if (star.alpha >= 1) star.increasing = false;
        } else {
          star.alpha -= star.speed;
          if (star.alpha <= 0.1) star.increasing = true;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(229, 196, 152, ${star.alpha * 0.8})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(drawStars);
    };

    window.addEventListener('resize', resizeStars);
    resizeStars();
    drawStars();
  }

  /* ==========================================================================
     9. ACT 13: INTERACTIVE BIRTHDAY CANDLE & MEMORY DRIFT
     ========================================================================== */
  if (candleBtn) {
    const memoryImages = [
      'images/rutu-rooftop-night.jpg',
      'images/rutu-eyes-closed-peace.jpg',
      'images/rutu-playful-cap.jpg',
      'images/rutu-traditional-wink.png',
      'images/hassan-rutu-cafe.jpg',
      'images/hassan-rutu-portrait.jpg'
    ];

    const blowCandle = () => {
      if (isCandleBlown) return;
      isCandleBlown = true;

      // Add blown class to extinguish flame and trigger smoke
      candleBtn.classList.add('blown');

      // Hide intro text
      if (wishIntro) {
        gsap.to(wishIntro, { opacity: 0, y: -20, duration: 0.8 });
      }

      // Generate floating soft memory stars in the background
      if (starlightMemories) {
        starlightMemories.innerHTML = '';
        memoryImages.forEach((src, idx) => {
          const item = document.createElement('div');
          item.className = 'memory-star-drift';
          item.style.top = `${15 + (idx % 3) * 26 + (Math.random() * 8)}%`;
          item.style.left = `${10 + idx * 14 + (Math.random() * 6)}%`;
          item.style.animationDelay = `${idx * 1.5}s`;
          
          const img = document.createElement('img');
          img.src = src;
          img.alt = 'Memory with Rutu';
          item.appendChild(img);
          starlightMemories.appendChild(item);
        });
      }

      // Reveal final message
      setTimeout(() => {
        if (wishRevealBox) {
          wishRevealBox.classList.add('active');
          wishRevealBox.setAttribute('aria-hidden', 'false');
        }
      }, 1000);
    };

    candleBtn.addEventListener('click', blowCandle);
    candleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        blowCandle();
      }
    });
  }

  // Replay button: smooth scroll back to the hero section
  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
