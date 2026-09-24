const $ = (selector) => document.querySelector(selector);
const motion = window.gsap;
const modal = $('#messageModal');
const audio = $('#backgroundMusic');
const musicToggle = $('#musicToggle');

let audioUnlocked = false;
function tryUnlockAudio() {
  if (audioUnlocked || !audio) return;
  audio.play().then(() => {
    audioUnlocked = true;
    setMusicState(true);
  }).catch(() => {});
}
window.addEventListener('touchstart', tryUnlockAudio, { once: true, passive: true });
window.addEventListener('pointerdown', tryUnlockAudio, { once: true, passive: true });
window.addEventListener('click', tryUnlockAudio, { once: true });

function showScene(id) {
  const target = $(id);
  if (!target) return;

  // Cleanly deactivate all scenes first to avoid any overlap or bleed
  document.querySelectorAll('.scene').forEach(scene => {
    if (scene !== target) {
      hideScene(scene);
    }
  });

  target.classList.add('active');
  target.setAttribute('aria-hidden', 'false');
  target.style.display = 'flex';
  target.style.visibility = 'visible';
  target.style.pointerEvents = 'auto';

  if (id === '#memoryScene') {
    buildCards();
  } else if (id === '#roseScene') {
    resume3DRoseScene();
  }

  if (motion) {
    motion.fromTo(target, { opacity: 0, scale: 1.02 }, { opacity: 1, scale: 1, duration: .65, ease: 'power2.out' });
  } else {
    target.style.opacity = '1';
  }
}

function hideScene(element) {
  if (!element) return;
  element.classList.remove('active');
  element.setAttribute('aria-hidden', 'true');
  element.style.display = 'none';
  element.style.visibility = 'hidden';
  element.style.pointerEvents = 'none';
  if (element.id === 'roseScene') {
    pause3DRoseScene();
  }
  if (motion) {
    motion.killTweensOf(element);
    motion.set(element, { opacity: 0 });
  }
}
let rejectCount = 0;
let acceptScale = 1.0;

const rejectPhrases = [
  'no thanks 🙈',
  'are you sure? 🥺',
  'really?? 💔',
  "don't break my heart 😭",
  "you can't say no! 😜",
  'nice try hehe ✨',
  'only YES allowed! 💕',
  'just click thank you! 🥰'
];

function resetModalButtons() {
  rejectCount = 0;
  acceptScale = 1.0;
  const acceptBtn = $('#closeModal');
  const rejectBtn = $('#noThanksModal');
  
  if (acceptBtn) {
    if (motion) {
      motion.set(acceptBtn, { scale: 1, clearProps: 'all' });
    } else {
      acceptBtn.style.transform = 'none';
    }
  }
  if (rejectBtn) {
    const textSpan = rejectBtn.querySelector('span');
    if (textSpan) textSpan.textContent = rejectPhrases[0];
    if (motion) {
      motion.set(rejectBtn, { x: 0, y: 0, scale: 1, clearProps: 'all' });
    } else {
      rejectBtn.style.transform = 'none';
    }
  }
}

function dodgeRejectButton(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const rejectBtn = $('#noThanksModal');
  const acceptBtn = $('#closeModal');
  if (!rejectBtn || !acceptBtn) return;

  rejectCount++;
  acceptScale = Math.min(2.1, 1.0 + rejectCount * 0.16);

  // Update reject phrase
  const phraseIndex = Math.min(rejectPhrases.length - 1, rejectCount);
  const textSpan = rejectBtn.querySelector('span');
  if (textSpan) textSpan.textContent = rejectPhrases[phraseIndex];

  // Grow the accept button
  if (motion) {
    motion.to(acceptBtn, {
      scale: acceptScale,
      duration: 0.35,
      ease: 'back.out(1.8)'
    });
  } else {
    acceptBtn.style.transform = `scale(${acceptScale})`;
  }

  // Calculate random runaway offset: dodge away dynamically
  const maxDist = Math.min(95, 35 + rejectCount * 10);
  const randomAngle = Math.random() * Math.PI * 2;
  const distance = 40 + Math.random() * maxDist;
  const targetX = Math.cos(randomAngle) * distance;
  const targetY = (Math.random() - 0.5) * 60;

  if (motion) {
    motion.to(rejectBtn, {
      x: targetX,
      y: targetY,
      rotation: (Math.random() - 0.5) * 24,
      duration: 0.28,
      ease: 'power2.out'
    });
  } else {
    rejectBtn.style.transform = `translate(${targetX}px, ${targetY}px)`;
  }
}

let modalCloseCallback = null;

function showMessage(message, onClose = null) {
  modalCloseCallback = onClose;
  $('#modalText').textContent = message;
  resetModalButtons();
  modal.classList.add('show');
  
  if (motion) {
    motion.fromTo('.modal-backdrop', { opacity: 0 }, { opacity: 1, duration: 0.25 });
    motion.fromTo('.modal-card', 
      { scale: 0.65, opacity: 0, y: 30 }, 
      { scale: 1, opacity: 1, y: 0, duration: 0.42, ease: 'back.out(1.6)' }
    );
  }
}
function setMusicState(isPlaying) {
  musicToggle.classList.toggle('playing', isPlaying);
  musicToggle.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
  musicToggle.querySelector('i').textContent = isPlaying ? 'pause' : 'music';
}
function playMusic() {
  audio.play().then(() => setMusicState(true)).catch(() => setMusicState(false));
}

$('#closeModal').addEventListener('click', () => {
  const cb = modalCloseCallback;
  modalCloseCallback = null;

  if (motion) {
    motion.to('.modal-backdrop', { opacity: 0, duration: 0.2 });
    motion.to('.modal-card', {
      scale: 0.8,
      opacity: 0,
      y: 20,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        modal.classList.remove('show');
        resetModalButtons();
        if (cb) cb();
      }
    });
  } else {
    modal.classList.remove('show');
    resetModalButtons();
    if (cb) cb();
  }
});

const noThanksBtn = $('#noThanksModal');
if (noThanksBtn) {
  noThanksBtn.addEventListener('mouseenter', dodgeRejectButton);
  noThanksBtn.addEventListener('touchstart', dodgeRejectButton, { passive: false });
  noThanksBtn.addEventListener('click', dodgeRejectButton);
}
musicToggle.addEventListener('click', () => audio.paused ? playMusic() : audio.pause());
audio.addEventListener('pause', () => setMusicState(false));
audio.addEventListener('play', () => setMusicState(true));

const targetHeart = $('#targetHeart');
const bowRigAnchor = $('#bowRigAnchor');
const bowArrowRig = $('#bowArrowRig');
const bowString = $('#bowString');
const startArrow = $('#startButton');
const heartSparks = $('#heartSparks');

let arrowReleased = false;
let arrowDragging = false;
let startPointerX = 0;
let startPointerY = 0;
let currentPull = 0;
let aimAngle = -38;
let aimRad = (-38 * Math.PI) / 180;
let distanceToHeart = 380;

function updateAimVector() {
  if (arrowReleased || !targetHeart || !bowArrowRig) return;
  const heartBox = targetHeart.getBoundingClientRect();
  
  // Use unrotated anchor for invariant, rock-solid coordinate measuring
  const anchorBox = bowRigAnchor ? bowRigAnchor.getBoundingClientRect() : bowArrowRig.getBoundingClientRect();
  
  const heartCenterX = heartBox.left + heartBox.width / 2;
  const heartCenterY = heartBox.top + heartBox.height / 2;
  
  // Pivot origin of bow rig is fixed at (28px, 70px) relative to anchor
  const bowAnchorX = anchorBox.left + 28;
  const bowAnchorY = anchorBox.top + 70;
  
  const dx = heartCenterX - bowAnchorX;
  const dy = heartCenterY - bowAnchorY;
  
  aimRad = Math.atan2(dy, dx);
  aimAngle = (aimRad * 180) / Math.PI;
  
  // Measure exact Euclidean distance to heart center minus arrow length offset
  const arrowLength = startArrow ? (startArrow.getBoundingClientRect().width * 0.78) : 150;
  distanceToHeart = Math.max(80, Math.hypot(dx, dy) - arrowLength);
  
  bowArrowRig.style.transform = `rotate(${aimAngle}deg)`;
}

window.addEventListener('resize', updateAimVector);
window.addEventListener('orientationchange', () => setTimeout(updateAimVector, 150));
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(updateAimVector, 60);
});
setTimeout(updateAimVector, 120);

function createHeartHitBurst() {
  if (!heartSparks) return;
  heartSparks.innerHTML = '';
  const colors = ['#ff2e63', '#ff6b8b', '#ffd166', '#ffffff', '#ff9bb9', '#ff4081'];
  const symbols = ['♥', '✦', '♡', '•', '✧'];
  
  for (let i = 0; i < 32; i++) {
    const spark = document.createElement('span');
    spark.className = 'spark-particle';
    const isSymbol = Math.random() > 0.45;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (isSymbol) {
      spark.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      spark.style.color = color;
      spark.style.fontSize = `${12 + Math.random() * 16}px`;
      spark.style.lineHeight = '1';
    } else {
      const size = 5 + Math.random() * 7;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.backgroundColor = color;
      spark.style.boxShadow = `0 0 8px ${color}`;
    }
    
    heartSparks.appendChild(spark);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 120;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;
    
    if (motion) {
      motion.fromTo(spark, 
        { x: 0, y: 0, scale: 0.2, opacity: 1, rotation: 0 },
        { 
          x: destX, 
          y: destY, 
          scale: 1 + Math.random() * 0.5, 
          opacity: 0, 
          rotation: (Math.random() - 0.5) * 360,
          duration: 0.65 + Math.random() * 0.45, 
          ease: 'power2.out',
          onComplete: () => spark.remove()
        }
      );
    } else {
      setTimeout(() => spark.remove(), 800);
    }
  }
}

function launchOpening() {
  if (arrowReleased) return;
  arrowReleased = true;
  bowArrowRig.classList.remove('pulling');
  bowArrowRig.classList.add('released');
  
  // Snap bowstring back with spring vibration
  if (motion) {
    motion.to(bowString, {
      attr: { d: 'M 112 18 Q 112 256 112 494' },
      duration: 0.12,
      ease: 'elastic.out(2, 0.3)'
    });
  } else {
    bowString.setAttribute('d', 'M 112 18 Q 112 256 112 494');
  }

  playMusic();

  // Launch arrow towards target heart
  if (motion) {
    motion.to(startArrow, {
      x: distanceToHeart,
      duration: 0.38,
      ease: 'power3.in',
      onComplete: () => {
        targetHeart.classList.add('hit');
        createHeartHitBurst();
        motion.to(startArrow, { opacity: 0, duration: 0.2, delay: 0.1 });
        
        setTimeout(() => {
          $('#opening').classList.add('is-gone');
          showScene('#giftScene');
        }, 950);
      }
    });
  } else {
    startArrow.style.transform = `translateX(${distanceToHeart}px)`;
    setTimeout(() => {
      targetHeart.classList.add('hit');
      createHeartHitBurst();
      setTimeout(() => {
        $('#opening').classList.add('is-gone');
        showScene('#giftScene');
      }, 950);
    }, 380);
  }
}

startArrow.addEventListener('pointerdown', (event) => {
  if (arrowReleased) return;
  tryUnlockAudio();
  updateAimVector();
  arrowDragging = true;
  startPointerX = event.clientX;
  startPointerY = event.clientY;
  currentPull = 0;
  try {
    startArrow.setPointerCapture(event.pointerId);
  } catch(e) {}
  bowArrowRig.classList.add('pulling');
});

startArrow.addEventListener('pointermove', (event) => {
  if (!arrowDragging || arrowReleased) return;
  const dx = event.clientX - startPointerX;
  const dy = event.clientY - startPointerY;
  
  // Vector projection: pull backwards along the aim axis
  const pullProjection = -(dx * Math.cos(aimRad) + dy * Math.sin(aimRad));
  const maxPull = 85;
  currentPull = Math.max(0, Math.min(maxPull, pullProjection));
  
  // Update arrow pullback position along its shaft
  startArrow.style.transform = `translateX(${-currentPull}px)`;
  
  // Dynamically deform the SVG bowstring
  const stringPullSvg = currentPull * 2.6;
  bowString.setAttribute('d', `M 112 18 Q ${112 - stringPullSvg} 256 112 494`);
});

function releasePull() {
  if (!arrowDragging || arrowReleased) return;
  arrowDragging = false;
  bowArrowRig.classList.remove('pulling');
  
  if (currentPull > 10) {
    launchOpening();
  } else {
    // Return to rest if not pulled enough
    if (motion) {
      motion.to(startArrow, { x: 0, duration: 0.35, ease: 'elastic.out(1, 0.4)' });
      motion.to(bowString, {
        attr: { d: 'M 112 18 Q 112 256 112 494' },
        duration: 0.35,
        ease: 'elastic.out(1, 0.4)'
      });
    } else {
      startArrow.style.transform = 'translateX(0)';
      bowString.setAttribute('d', 'M 112 18 Q 112 256 112 494');
    }
  }
}

startArrow.addEventListener('pointerup', releasePull);
startArrow.addEventListener('pointercancel', releasePull);
startArrow.addEventListener('touchend', (e) => {
  if (arrowDragging) {
    releasePull();
  } else if (!arrowReleased) {
    launchOpening();
  }
});
startArrow.addEventListener('click', () => {
  if (!arrowReleased && !arrowDragging) {
    launchOpening();
  }
});

function triggerGiftConfetti() {
  const container = $('#giftBurstFx');
  if (!container) return;
  container.innerHTML = '';

  const colors = ['#ffd166', '#ff2e63', '#ff6b8b', '#ffffff', '#ff9bb9', '#ffd700', '#f72585'];
  const symbols = ['✦', '✨', '♥', '♡', '💖', '⭐', '•'];
  const count = 48;

  for (let i = 0; i < count; i++) {
    const shard = document.createElement('span');
    shard.className = 'gift-sparkle-shard';
    const isSymbol = Math.random() > 0.45;
    const color = colors[Math.floor(Math.random() * colors.length)];

    if (isSymbol) {
      shard.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      shard.style.color = color;
      shard.style.fontSize = `${14 + Math.random() * 16}px`;
    } else {
      const w = 6 + Math.random() * 8;
      const h = 6 + Math.random() * 10;
      shard.style.width = `${w}px`;
      shard.style.height = `${h}px`;
      shard.style.backgroundColor = color;
      shard.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      shard.style.boxShadow = `0 2px 8px ${color}88`;
    }

    container.appendChild(shard);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const distance = 80 + Math.random() * 140;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance - 50; // shoot upward

    if (motion) {
      motion.fromTo(shard,
        { x: 0, y: 0, scale: 0.2, opacity: 1, rotation: 0 },
        {
          x: destX,
          y: destY,
          scale: 1,
          opacity: 0,
          rotation: (Math.random() - 0.5) * 720,
          duration: 0.85 + Math.random() * 0.45,
          ease: 'power3.out',
          onComplete: () => shard.remove()
        }
      );
    } else {
      setTimeout(() => shard.remove(), 1200);
    }
  }
}

// Video Player Controls Logic
const giftVideo = $('#giftVideo');
const videoPlayerWrapper = $('#videoPlayerWrapper');
const videoPlayBtn = $('#videoPlayBtn');
const videoMuteBtn = $('#videoMuteBtn');
const videoProgressFill = $('#videoProgressFill');
const videoProgressWrap = $('#videoProgressWrap');

function toggleVideoPlay() {
  if (!giftVideo) return;
  if (giftVideo.paused) {
    giftVideo.play().then(() => {
      videoPlayerWrapper?.classList.add('is-playing');
    }).catch(err => console.log(err));
  } else {
    giftVideo.pause();
    videoPlayerWrapper?.classList.remove('is-playing');
  }
}

let wasBgMusicPlaying = false;

if (giftVideo) {
  giftVideo.addEventListener('play', () => {
    videoPlayerWrapper?.classList.add('is-playing');
    if (audio && !audio.paused) {
      wasBgMusicPlaying = true;
      audio.pause();
    }
  });
  
  giftVideo.addEventListener('pause', () => {
    videoPlayerWrapper?.classList.remove('is-playing');
    if (wasBgMusicPlaying) {
      playMusic();
      wasBgMusicPlaying = false;
    }
  });
  
  giftVideo.addEventListener('timeupdate', () => {
    if (giftVideo.duration && videoProgressFill) {
      const pct = (giftVideo.currentTime / giftVideo.duration) * 100;
      videoProgressFill.style.width = `${pct}%`;
    }
  });
  
  giftVideo.addEventListener('ended', () => {
    videoPlayerWrapper?.classList.remove('is-playing');
    if (wasBgMusicPlaying) {
      playMusic();
      wasBgMusicPlaying = false;
    }
  });
}

if (videoPlayBtn) {
  videoPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVideoPlay();
  });
}

if (videoPlayerWrapper) {
  videoPlayerWrapper.addEventListener('click', () => {
    toggleVideoPlay();
  });
}

if (videoProgressWrap && giftVideo) {
  videoProgressWrap.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = videoProgressWrap.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (giftVideo.duration) {
      giftVideo.currentTime = pos * giftVideo.duration;
    }
  });
}

if (videoMuteBtn && giftVideo) {
  videoMuteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    giftVideo.muted = !giftVideo.muted;
    const icon = videoMuteBtn.querySelector('.sound-icon');
    const label = videoMuteBtn.querySelector('.sound-label');
    if (icon) icon.textContent = giftVideo.muted ? '🔇' : '🔊';
    if (label) label.textContent = giftVideo.muted ? 'Unmute' : 'Mute';
  });
}

// Gift Unwrap & Video Emergence Sequence
let isGiftUnwrapping = false;

function unwrapGift() {
  const gift = $('#giftButton');
  const giftWrapper = $('#giftWrapper');
  const videoCard = $('#giftVideoCard');
  const giftHint = $('#giftHint');
  
  if (isGiftUnwrapping || gift.classList.contains('unwrapped')) return;
  isGiftUnwrapping = true;

  // Pre-buffer video immediately on user tap gesture
  if (giftVideo) {
    try {
      giftVideo.load();
    } catch(e) {}
  }
  
  // 1. Tactile wobble before untying
  if (motion) {
    motion.to(gift, {
      scale: 1.12,
      rotation: -3,
      duration: 0.15,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        gift.classList.add('unwrapped');
        triggerGiftConfetti();

        if (giftHint) giftHint.textContent = 'A special memory revealed for you! ✨';

        // Animate bow loops untying and flying apart
        motion.to('.bow-loop.left', { x: -45, y: -25, rotation: -70, scale: 0.1, opacity: 0, duration: 0.45, ease: 'power2.out' });
        motion.to('.bow-loop.right', { x: 45, y: -25, rotation: 70, scale: 0.1, opacity: 0, duration: 0.45, ease: 'power2.out' });
        motion.to('.bow-knot, .bow-tail', { scale: 0, opacity: 0, duration: 0.35, ease: 'power2.in' });

        // Lid lifts off in a dramatic arc
        motion.to('#giftLidGroup', {
          y: -140,
          x: -80,
          rotation: -42,
          opacity: 0,
          duration: 0.75,
          ease: 'back.in(1.6)'
        });

        // Ribbons dissolve
        motion.to('#giftRibbonVertical', { scaleY: 0, opacity: 0, duration: 0.4, ease: 'power2.in' });

        // Inner golden illumination
        motion.to('#giftInnerGlow', { opacity: 1, scaleY: 1, duration: 0.5 });

        // Scale box down into the background as pedestal
        motion.to('#giftBoxBody', {
          scale: 0.82,
          y: 45,
          opacity: 0.25,
          duration: 0.7,
          ease: 'power2.out'
        });

        // 2. Video Card Emerges from inside the Gift Box
        setTimeout(() => {
          $('#giftScene')?.classList.add('video-active');
          if (videoCard) {
            videoCard.classList.add('show');
            videoCard.style.display = 'flex';
            
            motion.fromTo(videoCard,
              { scale: 0.18, y: 70, opacity: 0 },
              {
                scale: 1,
                y: 0,
                opacity: 1,
                duration: 0.85,
                ease: 'back.out(1.5)',
                onComplete: () => {
                  // Hide background gift box completely to give full focus to video
                  if (giftWrapper) giftWrapper.style.display = 'none';
                  
                  // Start playing the video
                  if (giftVideo) {
                    giftVideo.currentTime = 0;
                    giftVideo.play().then(() => {
                      videoPlayerWrapper?.classList.add('is-playing');
                    }).catch(() => {
                      // Autoplay with audio might be blocked by browser policies: fallback to muted autoplay
                      giftVideo.muted = true;
                      const icon = videoMuteBtn?.querySelector('.sound-icon');
                      const label = videoMuteBtn?.querySelector('.sound-label');
                      if (icon) icon.textContent = '🔇';
                      if (label) label.textContent = 'Unmute';
                      giftVideo.play().then(() => {
                        videoPlayerWrapper?.classList.add('is-playing');
                      }).catch(e => console.log('Autoplay blocked:', e));
                    });
                  }
                }
              }
            );
          }
        }, 320);
      }
    });
  } else {
    gift.classList.add('unwrapped');
    triggerGiftConfetti();
    if (giftWrapper) giftWrapper.style.display = 'none';
    if (videoCard) {
      videoCard.classList.add('show');
      videoCard.style.display = 'flex';
    }
  }
}

const giftBtn = $('#giftButton');
if (giftBtn) {
  const handleGiftUnwrap = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    unwrapGift();
  };
  giftBtn.addEventListener('click', handleGiftUnwrap);
  giftBtn.addEventListener('touchstart', handleGiftUnwrap, { passive: false });
}

// Proceed from Video Card to Balloon Scene
const toBalloonsBtn = $('#toBalloons');
if (toBalloonsBtn) {
  let isNavigatingToBalloons = false;
  const handleToBalloons = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isNavigatingToBalloons) return;
    isNavigatingToBalloons = true;
    if (giftVideo && !giftVideo.paused) {
      try { giftVideo.pause(); } catch(err) {}
    }
    hideScene($('#giftScene'));
    showScene('#balloonScene');
    createBalloons();
    setTimeout(() => { isNavigatingToBalloons = false; }, 800);
  };
  toBalloonsBtn.addEventListener('click', handleToBalloons);
  toBalloonsBtn.addEventListener('pointerdown', handleToBalloons);
}

const balloonNotes = [
  'You are my favorite notification. ♡',
  'Today, you are officially allowed to eat extra cake!',
  'Your smile is my favorite kind of sunshine.',
  'A reminder: you are ridiculously, wonderfully loved.',
  'I still get butterflies because of you.',
  'You make everything prettier just by being there.',
  'One birthday wish from me: more us, always.',
  'You are my happiest place, cutie.',
  'The world is luckier with you in it. ♥'
];
let popped = 0;

function burstBalloon(balloon, color, callback) {
  const scene = $('#balloonScene');
  const balloonBox = balloon.getBoundingClientRect();
  const sceneBox = scene.getBoundingClientRect();
  
  const centerX = balloonBox.left - sceneBox.left + balloonBox.width / 2;
  const centerY = balloonBox.top - sceneBox.top + balloonBox.height / 2;
  
  const burstWrap = document.createElement('div');
  burstWrap.className = 'burst-container';
  burstWrap.style.position = 'absolute';
  burstWrap.style.left = `${centerX}px`;
  burstWrap.style.top = `${centerY}px`;
  burstWrap.style.pointerEvents = 'none';
  burstWrap.style.zIndex = '30';
  scene.appendChild(burstWrap);

  // Shockwave ring
  const ring = document.createElement('div');
  ring.className = 'shock-ring';
  ring.style.borderColor = color;
  burstWrap.appendChild(ring);
  
  if (motion) {
    motion.fromTo(ring, 
      { width: 10, height: 10, x: -5, y: -5, opacity: 1, borderWidth: 4 },
      { width: 120, height: 120, x: -60, y: -60, opacity: 0, borderWidth: 1, duration: 0.38, ease: 'power2.out' }
    );
  }

  // Rubber shards & sparkle confetti
  const symbols = ['✦', '♥', '♡', '•'];
  const shardCount = 24;
  
  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement('span');
    shard.className = 'burst-particle';
    const isSymbol = Math.random() > 0.6;
    
    if (isSymbol) {
      shard.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      shard.style.color = Math.random() > 0.5 ? color : '#ffd166';
      shard.style.fontSize = `${13 + Math.random() * 12}px`;
    } else {
      const w = 6 + Math.random() * 8;
      const h = 4 + Math.random() * 7;
      shard.style.width = `${w}px`;
      shard.style.height = `${h}px`;
      shard.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
      shard.style.backgroundColor = color;
      shard.style.boxShadow = `0 2px 6px ${color}88`;
    }
    
    burstWrap.appendChild(shard);
    
    const angle = (Math.PI * 2 * i) / shardCount + (Math.random() - 0.5) * 0.4;
    const distance = 50 + Math.random() * 80;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance + 15; // gravity effect
    
    if (motion) {
      motion.fromTo(shard,
        { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
        {
          x: destX,
          y: destY,
          scale: 0.2,
          opacity: 0,
          rotation: (Math.random() - 0.5) * 720,
          duration: 0.45 + Math.random() * 0.3,
          ease: 'power3.out'
        }
      );
    }
  }

  // Hide the popped balloon instantly
  balloon.classList.add('popped');
  balloon.style.opacity = '0';
  balloon.style.pointerEvents = 'none';

  setTimeout(() => {
    burstWrap.remove();
    if (callback) callback();
  }, 380);
}

function createBalloons() {
  const field = $('#balloonField');
  if (!field) return;
  field.innerHTML = '';
  popped = 0;
  
  const ambientLayer = $('#ambientBalloons');
  if (ambientLayer) ambientLayer.innerHTML = '';

  const completeCard = $('#balloonCompleteCard');
  if (completeCard) {
    completeCard.classList.remove('show');
    completeCard.style.display = 'none';
  }
  field.style.display = 'grid';
  field.style.opacity = '1';
  field.style.transform = 'none';
  $('#balloonHint').textContent = 'Each one has a secret little note inside.';

  const colors = [
    '#ff6b8b', '#ffa048', '#8ec789',
    '#7ec3e6', '#b78fe6', '#ff85a1',
    '#ffcf56', '#87c79e', '#f882a8'
  ];
  
  balloonNotes.forEach((note, index) => {
    const balloon = document.createElement('button');
    balloon.className = 'balloon';
    balloon.style.background = `radial-gradient(circle at 35% 30%, ${colors[index]}ee 0%, ${colors[index]} 65%, #00000022 100%)`;
    balloon.style.backgroundColor = colors[index];
    balloon.style.setProperty('--speed', `${2.5 + (index % 4) * 0.35}s`);
    balloon.setAttribute('aria-label', `Balloon ${index + 1}`);

    const shine = document.createElement('span');
    shine.className = 'balloon-shine';
    balloon.appendChild(shine);

    let isPoppingThis = false;
    const popThisBalloon = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (isPoppingThis || balloon.classList.contains('popped') || balloon.classList.contains('popping')) return;
      isPoppingThis = true;
      balloon.classList.add('popping');
      
      burstBalloon(balloon, colors[index], () => {
        popped++;
        showMessage(note);
        if (popped === balloonNotes.length) {
          $('#balloonHint').textContent = 'You found every sweet note! 🎉';
          
          setTimeout(() => {
            if (motion) {
              motion.to(field, {
                opacity: 0,
                scale: 0.85,
                duration: 0.35,
                onComplete: () => {
                  field.style.display = 'none';
                  if (completeCard) {
                    completeCard.style.display = 'flex';
                    completeCard.classList.add('show');
                    motion.fromTo(completeCard,
                      { scale: 0.7, opacity: 0, y: 25 },
                      { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.6)' }
                    );
                  }
                }
              });
            } else {
              field.style.display = 'none';
              if (completeCard) {
                completeCard.style.display = 'flex';
                completeCard.classList.add('show');
              }
            }
          }, 300);
        }
      });
    };

    balloon.addEventListener('click', popThisBalloon);
    balloon.addEventListener('pointerdown', popThisBalloon);
    field.appendChild(balloon);
  });
  
  if (motion) {
    motion.fromTo(field,
      { opacity: 0, scale: 0.92 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.5)' }
    );
  }
}

let sparkInterval = null;

function startCandleSparkles() {
  stopCandleSparkles();
  const sparkContainer = $('#candleSparkles');
  if (!sparkContainer) return;
  
  sparkInterval = setInterval(() => {
    if ($('#flameButton')?.classList.contains('blown')) {
      stopCandleSparkles();
      return;
    }
    const spark = document.createElement('span');
    spark.className = 'candle-spark';
    spark.textContent = Math.random() > 0.4 ? '✦' : '•';
    spark.style.color = Math.random() > 0.4 ? '#ffd166' : '#ff8fa3';
    spark.style.fontSize = `${10 + Math.random() * 8}px`;
    sparkContainer.appendChild(spark);
    
    const destX = (Math.random() - 0.5) * 40;
    const destY = -(28 + Math.random() * 45);
    
    if (motion) {
      motion.fromTo(spark,
        { x: 0, y: 0, scale: 0.2, opacity: 1 },
        {
          x: destX,
          y: destY,
          scale: 1,
          opacity: 0,
          rotation: (Math.random() - 0.5) * 180,
          duration: 0.85 + Math.random() * 0.4,
          ease: 'power1.out',
          onComplete: () => spark.remove()
        }
      );
    } else {
      setTimeout(() => spark.remove(), 900);
    }
  }, 200);
}

function stopCandleSparkles() {
  if (sparkInterval) {
    clearInterval(sparkInterval);
    sparkInterval = null;
  }
}

function animateCakeEntrance() {
  const plate = $('#cakeScene .plate');
  const layerOne = $('#cakeScene .cake-layer.one');
  const layerTwo = $('#cakeScene .cake-layer.two');
  const frosting = $('#cakeScene .frosting');
  const candle = $('#cakeScene .candle');
  const wick = $('#cakeScene .wick');
  const flameWrap = $('#flameWrap');
  const cake = $('#flameButton');
  
  cake.classList.remove('blown');
  stopCandleSparkles();

  if (!motion) {
    flameWrap.style.transform = 'scale(1)';
    flameWrap.style.opacity = '1';
    startCandleSparkles();
    return;
  }

  // Set initial offscreen positions above the screen
  motion.set([plate, layerOne, layerTwo, frosting, candle, wick], { y: -450, opacity: 0 });
  motion.set(flameWrap, { scale: 0, opacity: 0 });

  const tl = motion.timeline({ delay: 0.15 });

  // 1. Plate drops from sky with bouncy spring
  tl.to(plate, { y: 0, opacity: 1, duration: 0.65, ease: 'bounce.out' })
    // 2. Bottom cake layer lands on plate with a squish bounce
    .to(layerOne, { y: 0, opacity: 1, duration: 0.55, ease: 'bounce.out' }, '-=0.25')
    // 3. Top layer drops onto bottom layer
    .to(layerTwo, { y: 0, opacity: 1, duration: 0.52, ease: 'bounce.out' }, '-=0.25')
    // 4. Frosting lands on top layer
    .to(frosting, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.35')
    // 5. Candle & wick drop in and plant into the cake
    .to([candle, wick], { y: 0, opacity: 1, duration: 0.48, ease: 'back.out(2)' }, '-=0.15')
    // 6. Flame ignites with a lively flash!
    .to(flameWrap, {
      scale: 1,
      opacity: 1,
      duration: 0.42,
      ease: 'back.out(2.5)',
      onComplete: () => {
        startCandleSparkles();
      }
    });
}

const toCakeBtn = $('#toCake');
if (toCakeBtn) {
  const handleToCake = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    hideScene($('#balloonScene')); 
    showScene('#cakeScene'); 
    setTimeout(animateCakeEntrance, 80);
  };
  toCakeBtn.addEventListener('click', handleToCake);
  toCakeBtn.addEventListener('touchend', handleToCake);
}

function triggerCakeSideConfetti() {
  const container = $('#cakeConfetti');
  if (!container) return;
  container.innerHTML = '';

  const colors = [
    '#ff2a6d', '#ff70a6', '#ffd166', '#06d6a0', 
    '#118ab2', '#8338ec', '#ff99c8', '#ffffff', '#ffbe0b'
  ];
  const symbols = ['♥', '♡', '💖', '✨', '✦', '🌸', '•'];
  const particleCountPerSide = 32;

  // Function to shoot from one corner
  const shootCannon = (isLeft) => {
    const originX = isLeft ? -10 : window.innerWidth + 10;
    const originY = window.innerHeight * 0.85;

    for (let i = 0; i < particleCountPerSide; i++) {
      const p = document.createElement('span');
      p.className = 'cannon-confetti';
      const isSymbol = Math.random() > 0.55;
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (isSymbol) {
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.color = color;
        p.style.fontSize = `${14 + Math.random() * 16}px`;
      } else {
        const w = 8 + Math.random() * 10;
        const h = 5 + Math.random() * 12;
        p.style.width = `${w}px`;
        p.style.height = `${h}px`;
        p.style.backgroundColor = color;
        p.style.borderRadius = Math.random() > 0.6 ? '50%' : '2px';
        p.style.boxShadow = `0 2px 6px ${color}66`;
      }

      p.style.left = `${originX}px`;
      p.style.top = `${originY}px`;
      container.appendChild(p);

      // Trajectory calculation
      const angleDeg = isLeft 
        ? (35 + Math.random() * 40) // 35 to 75 deg (pointing up-right)
        : (105 + Math.random() * 40); // 105 to 145 deg (pointing up-left)
      const angleRad = (angleDeg * Math.PI) / 180;
      const power = 380 + Math.random() * 420;
      
      const peakX = Math.cos(angleRad) * power;
      const peakY = -Math.sin(angleRad) * power;
      const finalY = peakY + (300 + Math.random() * 400); // falling gravity

      if (motion) {
        const tl = motion.timeline({
          onComplete: () => p.remove()
        });

        // Launch upwards and across
        tl.to(p, {
          x: peakX,
          y: peakY,
          rotation: (Math.random() - 0.5) * 720,
          rotationX: Math.random() * 360,
          rotationY: Math.random() * 360,
          duration: 0.65 + Math.random() * 0.35,
          ease: 'power2.out'
        })
        // Fall down with gravity and flutter
        .to(p, {
          x: peakX + (isLeft ? 60 : -60) + (Math.random() - 0.5) * 100,
          y: finalY,
          opacity: 0,
          scale: 0.5,
          rotation: `+=${(Math.random() - 0.5) * 360}`,
          duration: 1.2 + Math.random() * 0.6,
          ease: 'power1.in'
        }, '-=0.15');
      } else {
        setTimeout(() => p.remove(), 2000);
      }
    }
  };

  shootCannon(true);  // Left Cannon
  shootCannon(false); // Right Cannon
}

const flameBtn = $('#flameButton');
if (flameBtn) {
  const handleBlowFlame = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    if (flameBtn.classList.contains('blown')) return;
    flameBtn.classList.add('blown');
    stopCandleSparkles();
    triggerCakeSideConfetti();
    
    setTimeout(() => {
      showMessage(
        'Make a wish, close your eyes... and remember that mine has always been you. ♡',
        () => {
          hideScene($('#cakeScene'));
          showBirthdayReveal();
        }
      );
    }, 750);
  };
  flameBtn.addEventListener('click', handleBlowFlame);
  flameBtn.addEventListener('touchstart', handleBlowFlame, { passive: false });
}

function showBirthdayReveal() {
  const scene = $('#birthdayScene');
  showScene('#birthdayScene');
  
  if (!motion) return;
  
  const timeline = motion.timeline();
  timeline.fromTo(scene, 
    { clipPath: 'circle(0% at 50% 50%)' }, 
    { clipPath: 'circle(160% at 50% 50%)', duration: 1.1, ease: 'power4.inOut' }
  )
  .fromTo('#birthdayScene .wish-prompt', 
    { y: 35, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 
    '-=0.35'
  )
  .fromTo('#birthdayScene h2', 
    { y: 110, opacity: 0, scale: 0.68 }, 
    { y: 0, opacity: 1, scale: 1, duration: 0.95, ease: 'back.out(1.5)' }, 
    '-=0.3'
  )
  .fromTo('#toRoses', 
    { y: 30, opacity: 0, scale: 0.85 }, 
    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 
    '-=0.25'
  );
}
$('#toRoses').addEventListener('click', () => { 
  hideScene($('#birthdayScene')); 
  showScene('#roseScene'); 
});

// ==========================================
// --- 3D INTERACTIVE ROSE BOUQUET (THREE.JS) ---
// ==========================================
let rose3DInitialized = false;
let isRose3DActive = false;
let roseClock = null;
let rose3DScene, rose3DCamera, rose3DRenderer;
let rose3DBouquetGroup, rose3DRotGroup;
let roseBackgroundPetals = [];
let rosePluckedPetals = [];
let roseRaycaster, rosePointer;
let isRoseDragging = false;
let roseDragStartX = 0, roseDragStartY = 0;
let roseTargetRotY = 0, roseTargetRotX = -0.22;
let roseCurrentRotY = 0, roseCurrentRotX = -0.22;
let roseScrollProgress = 0;
let roseTransitionComplete = false;
let roseAnimFrameId = null;
let roseTextureCache = {};

function pause3DRoseScene() {
  isRose3DActive = false;
  if (roseAnimFrameId) {
    cancelAnimationFrame(roseAnimFrameId);
    roseAnimFrameId = null;
  }
}

function resume3DRoseScene() {
  if (!rose3DInitialized) {
    init3DRoseScene();
  } else {
    onRoseResize();
    roseTransitionComplete = false;
    roseScrollProgress = 0;
    if (rose3DBouquetGroup) {
      rose3DBouquetGroup.position.set(0, 0.05, 0);
      rose3DBouquetGroup.scale.set(0.58, 0.58, 0.58);
    }
    if (!isRose3DActive) {
      isRose3DActive = true;
      if (roseClock) roseClock.getDelta();
      animateRoses();
    }
  }
}

function init3DRoseScene() {
  const container = document.getElementById('rose3dContainer');
  if (!container || !window.THREE) return;

  if (rose3DInitialized) {
    resume3DRoseScene();
    return;
  }

  rose3DInitialized = true;
  isRose3DActive = true;
  roseTransitionComplete = false;
  roseScrollProgress = 0;

  const width = window.innerWidth;
  const height = window.innerHeight;

  // 1. Scene & Camera
  rose3DScene = new THREE.Scene();
  rose3DCamera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  rose3DCamera.position.set(0, 0.05, 4.85);

  // 2. High-Performance Renderer (capped DPR for silky smooth 60fps on mobile)
  rose3DRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  rose3DRenderer.setSize(width, height);
  rose3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  rose3DRenderer.outputEncoding = THREE.sRGBEncoding || 3001;
  container.appendChild(rose3DRenderer.domElement);

  // 3. Balanced Warm Studio Lighting (Accentuates Rich Reds and Deep Emerald Greens Without Washing Out)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  rose3DScene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
  mainLight.position.set(3, 5, 4);
  rose3DScene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xfff1f2, 0.35);
  fillLight.position.set(-4, 2, 3);
  rose3DScene.add(fillLight);

  const backRimLight = new THREE.PointLight(0xff0000, 1.5, 10);
  backRimLight.position.set(0, 1.5, -2.5);
  rose3DScene.add(backRimLight);

  const topGlowLight = new THREE.PointLight(0xff3131, 0.6, 8);
  topGlowLight.position.set(0, 2.5, 2.0);
  rose3DScene.add(topGlowLight);

  // 4. Transform Hierarchy Groups
  rose3DRotGroup = new THREE.Group();
  rose3DBouquetGroup = new THREE.Group();
  rose3DBouquetGroup.position.set(0, 0.05, 0);
  rose3DBouquetGroup.scale.set(0.58, 0.58, 0.58);
  rose3DRotGroup.add(rose3DBouquetGroup);
  rose3DScene.add(rose3DRotGroup);

  // 5. Build Ultra-Realistic 3D Bouquet
  buildRealisticBouquet(rose3DBouquetGroup);

  // 6. Build Full-Screen Falling Background Petals
  buildFullScreenFallingPetals(rose3DScene);

  // 7. Raycasting & Interaction Setup
  roseRaycaster = new THREE.Raycaster();
  rosePointer = new THREE.Vector2();

  setupRoseInteractions(container);

  // 8. Fluid Animation Loop
  roseClock = new THREE.Clock();

  function animateRoses() {
    if (!isRose3DActive) return;
    roseAnimFrameId = requestAnimationFrame(animateRoses);
    const delta = roseClock.getDelta();
    const elapsedTime = roseClock.getElapsedTime();

    // Subtle Natural Breathing & Sway
    const idleSwayX = Math.sin(elapsedTime * 1.3) * 0.025;
    const idleSwayY = Math.cos(elapsedTime * 1.0) * 0.03;
    const idleBob = Math.sin(elapsedTime * 1.8) * 0.025;

    // Fluid Rotation Damping
    roseCurrentRotY += (roseTargetRotY - roseCurrentRotY) * 0.08;
    roseCurrentRotX += (roseTargetRotX - roseCurrentRotX) * 0.08;

    rose3DRotGroup.rotation.y = roseCurrentRotY + idleSwayY;
    rose3DRotGroup.rotation.x = roseCurrentRotX + idleSwayX;
    rose3DBouquetGroup.position.y = 0.05 + idleBob + roseScrollProgress * 0.22;

    // Scroll Zoom Perspective ("Coming out of screen" effect: Starts compact 0.58 and scales to 1.55)
    rose3DBouquetGroup.position.z = roseScrollProgress * 2.8;
    const scaleFactor = 0.58 + roseScrollProgress * 0.97;
    rose3DBouquetGroup.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Update Full-Screen Falling Petals
    updateFullScreenPetals(delta, elapsedTime);

    // Update Plucked Interactive Petals
    updatePluckedPetals(delta);

    rose3DRenderer.render(rose3DScene, rose3DCamera);
  }
  animateRoses();

  window.addEventListener('resize', onRoseResize);
}

function onRoseResize() {
  const container = document.getElementById('rose3dContainer');
  if (!container || !rose3DRenderer || !rose3DCamera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  rose3DCamera.aspect = width / height;
  rose3DCamera.updateProjectionMatrix();
  rose3DRenderer.setSize(width, height);
  rose3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
}

// --- Procedural Textures for Velvet Petals & Leaves ---
function getRosePetalTexture(colorHex) {
  if (roseTextureCache[colorHex]) return roseTextureCache[colorHex];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const baseColor = new THREE.Color(colorHex);
  // Deep velvety dark red base shadow
  const deepShadow = baseColor.clone().multiplyScalar(0.38);
  const midColor = baseColor.clone();
  // Vibrant bright red highlight (keeps it purely rich red, no white)
  const rimColor = new THREE.Color(0xff3131);

  // Pure rich red gradient from base to edge
  const grad = ctx.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0, deepShadow.getStyle());
  grad.addColorStop(0.25, deepShadow.getStyle());
  grad.addColorStop(0.65, midColor.getStyle());
  grad.addColorStop(0.9, midColor.getStyle());
  grad.addColorStop(1, rimColor.getStyle());

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle organic red veining
  ctx.strokeStyle = deepShadow.getStyle();
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 36; i++) {
    const spread = ((i - 18) / 18) * 0.75;
    ctx.beginPath();
    ctx.moveTo(256, 480);
    const cpX = 256 + Math.sin(spread) * 160;
    const cpY = 270;
    const endX = 256 + Math.sin(spread) * 240;
    const endY = 30 + Math.random() * 50;
    ctx.quadraticCurveTo(cpX, cpY, endX, endY);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  roseTextureCache[colorHex] = texture;
  return texture;
}

function getLeafTexture() {
  if (roseTextureCache['leaf']) return roseTextureCache['leaf'];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep rich botanical leaf green
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 512);

  // Central vibrant vein
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(256, 512);
  ctx.lineTo(256, 15);
  ctx.stroke();

  // Branching veins
  ctx.lineWidth = 3.0;
  ctx.globalAlpha = 0.65;
  for (let y = 60; y < 480; y += 42) {
    ctx.beginPath();
    ctx.moveTo(256, y);
    ctx.lineTo(50, y - 45);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, y);
    ctx.lineTo(462, y - 45);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  roseTextureCache['leaf'] = texture;
  return texture;
}

// --- Organic Curved Petal Mesh Generator ---
function createOrganicPetalGeometry(width, height, curlAmount = 0.28) {
  const geom = new THREE.PlaneGeometry(width, height, 12, 12);
  const pos = geom.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const normalizedY = (y + height / 2) / height; // 0 to 1
    const normalizedX = x / (width / 2); // -1 to 1

    // Smooth organic cupping (concave center)
    const cupZ = -Math.sin(normalizedY * Math.PI) * (width * 0.42) * (1 - normalizedX * normalizedX * 0.45);
    // Outward ruffled lip at the tip
    const lipCurl = Math.pow(Math.max(0, normalizedY - 0.42) * 1.72, 2) * curlAmount;
    // Slight side flare
    const sideFlare = Math.sin(normalizedX * Math.PI) * 0.04;

    pos.setZ(i, cupZ + lipCurl + sideFlare);
  }

  geom.computeVertexNormals();
  return geom;
}

// --- High-Fidelity English Garden Rose / Peony Model ---
function createRealisticRose(colorHex, scale = 1.0) {
  const flowerGroup = new THREE.Group();
  flowerGroup.userData = { isRose: true, colorHex: colorHex };

  const petalMap = getRosePetalTexture(colorHex);
  const petalMat = new THREE.MeshStandardMaterial({
    map: petalMap,
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.05,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: 0.12,
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide
  });

  // 1. Rosette Center Eye (6 tight ruffled swirl petals)
  for (let i = 0; i < 6; i++) {
    const angle = i * 1.05;
    const r = 0.04 * scale * (1 + i * 0.1);
    const h = (0.24 - i * 0.015) * scale;
    const w = (0.14 + i * 0.02) * scale;
    const geom = createOrganicPetalGeometry(w, h, 0.06);
    const petal = new THREE.Mesh(geom, petalMat);
    petal.position.set(Math.cos(angle) * r, (0.14 - i * 0.012) * scale, Math.sin(angle) * r);
    petal.rotation.y = -angle - 1.2;
    petal.rotation.x = 0.18 + i * 0.05;
    petal.userData = { isFlowerPart: true, parentRose: flowerGroup };
    flowerGroup.add(petal);
  }

  // 2. Inner Layer (6 cupped overlapping petals)
  const layer1Geom = createOrganicPetalGeometry(0.26 * scale, 0.35 * scale, 0.14);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.2;
    const petal = new THREE.Mesh(layer1Geom, petalMat);
    petal.position.set(Math.cos(angle) * 0.08 * scale, 0.11 * scale, Math.sin(angle) * 0.08 * scale);
    petal.rotation.y = -angle - Math.PI / 2;
    petal.rotation.x = 0.42;
    petal.userData = { isFlowerPart: true, parentRose: flowerGroup };
    flowerGroup.add(petal);
  }

  // 3. Middle Layer (8 wide ruffled petals)
  const layer2Geom = createOrganicPetalGeometry(0.36 * scale, 0.45 * scale, 0.24);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.5;
    const petal = new THREE.Mesh(layer2Geom, petalMat);
    petal.position.set(Math.cos(angle) * 0.15 * scale, 0.07 * scale, Math.sin(angle) * 0.15 * scale);
    petal.rotation.y = -angle - Math.PI / 2;
    petal.rotation.x = 0.68;
    petal.userData = { isFlowerPart: true, parentRose: flowerGroup };
    flowerGroup.add(petal);
  }

  // 4. Outer Layer (10 broad open reflexed petals)
  const layer3Geom = createOrganicPetalGeometry(0.46 * scale, 0.54 * scale, 0.35);
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + 0.15;
    const petal = new THREE.Mesh(layer3Geom, petalMat);
    petal.position.set(Math.cos(angle) * 0.24 * scale, 0.02 * scale, Math.sin(angle) * 0.24 * scale);
    petal.rotation.y = -angle - Math.PI / 2;
    petal.rotation.x = 0.98;
    petal.userData = { isFlowerPart: true, parentRose: flowerGroup };
    flowerGroup.add(petal);
  }

  // 5. Green Sepals Underneath (5 pointed calyx leaves)
  const sepalMat = new THREE.MeshStandardMaterial({
    map: getLeafTexture(),
    color: 0xffffff,
    roughness: 0.45,
    emissive: new THREE.Color(0x0a3812),
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide
  });
  const sepalGeom = createOrganicPetalGeometry(0.11 * scale, 0.38 * scale, -0.18);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const sepal = new THREE.Mesh(sepalGeom, sepalMat);
    sepal.position.set(Math.cos(angle) * 0.13 * scale, -0.04 * scale, Math.sin(angle) * 0.13 * scale);
    sepal.rotation.y = -angle - Math.PI / 2;
    sepal.rotation.x = 1.68;
    flowerGroup.add(sepal);
  }

  // Calyx base
  const recMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.11 * scale, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5, emissive: 0x0a3812, emissiveIntensity: 0.15 })
  );
  recMesh.position.y = -0.07 * scale;
  flowerGroup.add(recMesh);

  return flowerGroup;
}

// --- Delicate Baby's Breath (Gypsophila) & Foliage ---
function createBabysBreathSprig() {
  const group = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, emissive: 0x0a3812, emissiveIntensity: 0.15 });
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.05,
    emissive: 0xffffff,
    emissiveIntensity: 0.35
  });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 1.1, 5), stemMat);
  group.add(stem);

  // 14 airy tiny flower beads
  const flowerGeom = new THREE.SphereGeometry(0.035, 6, 6);
  for (let i = 0; i < 14; i++) {
    const fl = new THREE.Mesh(flowerGeom, flowerMat);
    const theta = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
    const r = 0.07 + Math.random() * 0.18;
    const h = 0.15 + (i / 14) * 0.55;
    fl.position.set(Math.cos(theta) * r, h, Math.sin(theta) * r);
    group.add(fl);
  }
  return group;
}

function createEucalyptusSprig() {
  const group = new THREE.Group();
  const leafMat = new THREE.MeshStandardMaterial({
    map: getLeafTexture(),
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.03,
    emissive: new THREE.Color(0x0a3812),
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide
  });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.5, emissive: 0x0a3812, emissiveIntensity: 0.15 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 1.0, 5), stemMat);
  group.add(stem);

  const leafGeom = new THREE.CircleGeometry(0.22, 12);
  for (let i = 0; i < 5; i++) {
    const y = 0.12 + i * 0.16;
    const leafL = new THREE.Mesh(leafGeom, leafMat);
    leafL.position.set(-0.18, y, 0);
    leafL.rotation.set(0.25, 0.2, 0.45);
    leafL.scale.set(0.92, 0.78, 1);
    group.add(leafL);

    const leafR = new THREE.Mesh(leafGeom, leafMat);
    leafR.position.set(0.18, y, 0);
    leafR.rotation.set(-0.25, -0.2, -0.45);
    leafR.scale.set(0.92, 0.78, 1);
    group.add(leafR);
  }
  return group;
}

// --- Master Hand-Tied Florist Bouquet (Matching Pure & Deep Red Palette) ---
function buildRealisticBouquet(bouquetGroup) {
  // Pure, Deep & Neon Red Palette specified by user
  const colors = {
    pureRed:   0xff0000, // HEX #FF0000 (Pure Red)
    crimson:   0xdc143c, // HEX #DC143C (Crimson)
    darkRed:   0x8b0000, // HEX #8B0000 (Dark Red)
    cherryRed: 0xd2042d, // HEX #D2042D (Cherry Red)
    neonRed:   0xff3131  // HEX #FF3131 (Neon Red)
  };

  // 24 Florist Arranged English Red Roses in Dense Rounded Dome
  const roseConfigs = [
    // 1. Center Top Crown (3 dense roses)
    { pos: [0, 0.85, 0.05], rot: [0.15, 0, 0], col: colors.pureRed, scale: 1.15 },
    { pos: [-0.32, 0.78, -0.15], rot: [-0.2, -0.4, 0], col: colors.cherryRed, scale: 1.08 },
    { pos: [0.32, 0.78, -0.15], rot: [-0.2, 0.4, 0], col: colors.neonRed, scale: 1.08 },

    // 2. Upper Tier (6 surrounding roses)
    { pos: [0, 0.72, 0.42], rot: [0.55, 0, 0], col: colors.crimson, scale: 1.08 },
    { pos: [-0.48, 0.68, 0.24], rot: [0.38, -0.55, -0.15], col: colors.darkRed, scale: 1.05 },
    { pos: [0.48, 0.68, 0.24], rot: [0.38, 0.55, 0.15], col: colors.pureRed, scale: 1.05 },
    { pos: [-0.62, 0.62, -0.25], rot: [-0.35, -0.85, -0.2], col: colors.cherryRed, scale: 1.02 },
    { pos: [0.62, 0.62, -0.25], rot: [-0.35, 0.85, 0.2], col: colors.neonRed, scale: 1.02 },
    { pos: [0, 0.66, -0.52], rot: [-0.65, 0, 0], col: colors.crimson, scale: 1.02 },

    // 3. Mid Tier (7 full-bloom roses)
    { pos: [-0.78, 0.45, 0.15], rot: [0.25, -1.05, -0.3], col: colors.pureRed, scale: 1.0 },
    { pos: [0.78, 0.45, 0.15], rot: [0.25, 1.05, 0.3], col: colors.cherryRed, scale: 1.0 },
    { pos: [-0.38, 0.48, 0.62], rot: [0.78, -0.35, -0.2], col: colors.neonRed, scale: 1.0 },
    { pos: [0.38, 0.48, 0.62], rot: [0.78, 0.35, 0.2], col: colors.crimson, scale: 1.0 },
    { pos: [-0.58, 0.42, -0.55], rot: [-0.65, -0.75, -0.25], col: colors.darkRed, scale: 0.98 },
    { pos: [0.58, 0.42, -0.55], rot: [-0.65, 0.75, 0.25], col: colors.pureRed, scale: 0.98 },
    { pos: [0, 0.36, 0.78], rot: [1.05, 0, 0], col: colors.cherryRed, scale: 0.98 },

    // 4. Lower Skirt Tier (8 downward/outward facing roses framing the base)
    { pos: [-0.92, 0.22, -0.1], rot: [0.1, -1.35, -0.45], col: colors.crimson, scale: 0.94 },
    { pos: [0.92, 0.22, -0.1], rot: [0.1, 1.35, 0.45], col: colors.pureRed, scale: 0.94 },
    { pos: [-0.72, 0.24, 0.48], rot: [0.72, -0.95, -0.35], col: colors.neonRed, scale: 0.94 },
    { pos: [0.72, 0.24, 0.48], rot: [0.72, 0.95, 0.35], col: colors.cherryRed, scale: 0.94 },
    { pos: [-0.42, 0.18, 0.78], rot: [1.18, -0.35, -0.2], col: colors.darkRed, scale: 0.92 },
    { pos: [0.42, 0.18, 0.78], rot: [1.18, 0.35, 0.2], col: colors.pureRed, scale: 0.92 },
    { pos: [-0.45, 0.22, -0.72], rot: [-0.95, -0.55, -0.2], col: colors.crimson, scale: 0.92 },
    { pos: [0.45, 0.22, -0.72], rot: [-0.95, 0.55, 0.2], col: colors.neonRed, scale: 0.92 }
  ];

  const flowerCluster = new THREE.Group();
  roseConfigs.forEach(cfg => {
    const rose = createRealisticRose(cfg.col, cfg.scale);
    rose.position.set(...cfg.pos);
    rose.rotation.set(...cfg.rot);
    flowerCluster.add(rose);
  });
  bouquetGroup.add(flowerCluster);

  // Add Abundant Baby's Breath (Gypsophila) Sprigs on sides & crevices
  const bbPositions = [
    [-0.26, 0.88, 0.22], [0.26, 0.88, 0.22],
    [-0.62, 0.65, 0.38], [0.62, 0.65, 0.38],
    [-0.72, 0.55, -0.25], [0.72, 0.55, -0.25],
    [0, 0.94, -0.15], [0, 0.55, 0.78],
    [-0.95, 0.35, 0.15], [0.95, 0.35, 0.15],
    [-0.85, 0.25, -0.45], [0.85, 0.25, -0.45]
  ];
  bbPositions.forEach(p => {
    const bb = createBabysBreathSprig();
    bb.position.set(...p);
    bb.rotation.set((Math.random() - 0.5) * 0.6, Math.random() * Math.PI, (Math.random() - 0.5) * 0.6);
    bouquetGroup.add(bb);
  });

  // Add Broad Eucalyptus & Rose Foliage Framing the Base (Matching Image 2)
  const eucConfigs = [
    { pos: [-1.02, 0.28, 0.28], rot: [0.35, -0.85, -0.75] },
    { pos: [1.02, 0.28, 0.28], rot: [0.35, 0.85, 0.75] },
    { pos: [-0.88, 0.25, -0.55], rot: [-0.55, -0.95, -0.55] },
    { pos: [0.88, 0.25, -0.55], rot: [-0.55, 0.95, 0.55] },
    { pos: [0, 0.15, 0.96], rot: [1.25, 0, 0] },
    { pos: [0, 0.18, -0.92], rot: [-1.25, 0, 0] },
    { pos: [-0.75, 0.18, 0.72], rot: [0.95, -0.65, -0.45] },
    { pos: [0.75, 0.18, 0.72], rot: [0.95, 0.65, 0.45] }
  ];
  eucConfigs.forEach(cfg => {
    const euc = createEucalyptusSprig();
    euc.position.set(...cfg.pos);
    euc.rotation.set(...cfg.rot);
    bouquetGroup.add(euc);
  });

  // Fresh, Deep Botanical Green Stems
  const stemColors = [0x15803d, 0x166534, 0x1b5e20, 0x1e7e34, 0x2e7d32];
  const stemCount = 18;
  const stemGeom = new THREE.CylinderGeometry(0.024, 0.022, 1.45, 7);

  for (let i = 0; i < stemCount; i++) {
    const col = stemColors[i % stemColors.length];
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.4,
      metalness: 0.05,
      emissive: new THREE.Color(0x0a3812),
      emissiveIntensity: 0.15
    });
    const stem = new THREE.Mesh(stemGeom, mat);

    const angle = (i / stemCount) * Math.PI * 2;
    const topRadius = 0.35;
    const waistRadius = 0.09;
    const botRadius = 0.28 + Math.random() * 0.12;

    // Waist position at y = -0.7
    const topX = Math.cos(angle) * topRadius;
    const topZ = Math.sin(angle) * topRadius;
    const botX = Math.cos(angle + 0.3) * botRadius;
    const botZ = Math.sin(angle + 0.3) * botRadius;

    stem.position.set((topX + botX) / 2, -0.75, (topZ + botZ) / 2);
    
    // Tilt stem naturally
    const dir = new THREE.Vector3(botX - topX, -1.4, botZ - topZ).normalize();
    const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    const angleRad = Math.acos(new THREE.Vector3(0, -1, 0).dot(dir));
    stem.quaternion.setFromAxisAngle(axis, angleRad);

    bouquetGroup.add(stem);
  }

  // Delicate Tied White Silk Ribbon & Bow Around Stems (Matching Image 2)
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.08,
    emissive: 0xffffff,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide
  });

  // Tied band around stem waist
  const bandGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16, 1, true);
  const band = new THREE.Mesh(bandGeom, ribbonMat);
  band.position.set(0, -0.68, 0);
  bouquetGroup.add(band);

  // White Ribbon Knot
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), ribbonMat);
  knot.position.set(0, -0.68, 0.15);
  knot.scale.set(1.2, 0.9, 0.8);
  bouquetGroup.add(knot);

  // Ribbon Loops
  const loopGeom = new THREE.TorusGeometry(0.16, 0.038, 10, 20);
  const leftLoop = new THREE.Mesh(loopGeom, ribbonMat);
  leftLoop.position.set(-0.14, -0.66, 0.14);
  leftLoop.rotation.set(0.2, 0.35, 0.4);
  bouquetGroup.add(leftLoop);

  const rightLoop = new THREE.Mesh(loopGeom, ribbonMat);
  rightLoop.position.set(0.14, -0.66, 0.14);
  rightLoop.rotation.set(0.2, -0.35, -0.4);
  bouquetGroup.add(rightLoop);

  // Thin dangling white ribbon streamers (Matching Image 2)
  for (let i = 0; i < 6; i++) {
    const streamerGeom = createOrganicPetalGeometry(0.045, 0.75 + Math.random() * 0.35, 0.2);
    const streamer = new THREE.Mesh(streamerGeom, ribbonMat);
    const angleOffset = (i - 2.5) * 0.12;
    streamer.position.set(angleOffset * 0.8, -1.05, 0.14);
    streamer.rotation.set(0.2 + Math.random() * 0.1, 0, angleOffset);
    bouquetGroup.add(streamer);
  }
}

// --- Full-Screen Falling Flower Petals System (Optimized & Lush) ---
function buildFullScreenFallingPetals(scene) {
  roseBackgroundPetals = [];
  const petalColors = [0xff004f, 0xff1493, 0xff4500, 0xff2a85, 0xff6b8b, 0xffffff, 0xffccd5];
  const isMobile = window.innerWidth < 640;
  const count = isMobile ? 28 : 60;

  for (let i = 0; i < count; i++) {
    const col = petalColors[Math.floor(Math.random() * petalColors.length)];
    const width = 0.22 + Math.random() * 0.18;
    const height = 0.28 + Math.random() * 0.22;
    const geom = createOrganicPetalGeometry(width, height, 0.25 + Math.random() * 0.25);

    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.35,
      metalness: 0.04,
      emissive: new THREE.Color(col),
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88 + Math.random() * 0.12
    });

    const mesh = new THREE.Mesh(geom, mat);
    // Spread across entire screen viewport volume
    mesh.position.set(
      (Math.random() - 0.5) * 14.0,
      (Math.random() - 0.5) * 12.0,
      (Math.random() - 0.5) * 7.0
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    const petalData = {
      mesh: mesh,
      speedY: 0.010 + Math.random() * 0.016,
      speedX: (Math.random() - 0.5) * 0.007,
      swayFreq: 1.1 + Math.random() * 1.6,
      swayRadius: 0.008 + Math.random() * 0.014,
      rotSpeedX: 0.01 + Math.random() * 0.02,
      rotSpeedY: 0.014 + Math.random() * 0.024,
      rotSpeedZ: 0.008 + Math.random() * 0.016
    };

    scene.add(mesh);
    roseBackgroundPetals.push(petalData);
  }
}

function updateFullScreenPetals(delta, elapsedTime) {
  for (let i = 0; i < roseBackgroundPetals.length; i++) {
    const p = roseBackgroundPetals[i];
    p.mesh.position.y -= p.speedY * 60 * delta;
    p.mesh.position.x += Math.sin(elapsedTime * p.swayFreq + i) * p.swayRadius + p.speedX;

    p.mesh.rotation.x += p.rotSpeedX;
    p.mesh.rotation.y += p.rotSpeedY;
    p.mesh.rotation.z += p.rotSpeedZ;

    // Reset when fallen below bottom of viewport
    if (p.mesh.position.y < -5.5) {
      p.mesh.position.y = 5.8;
      p.mesh.position.x = (Math.random() - 0.5) * 14.0;
      p.mesh.position.z = (Math.random() - 0.5) * 7.0;
    }
  }
}

// --- Interactive Tap Petal Plucking ---
function spawnPluckedPetals(originPos, colorHex) {
  if (!rose3DScene) return;

  const count = 8 + Math.floor(Math.random() * 5);
  const petalColors = [colorHex, 0xff0000, 0xdc143c, 0x8b0000, 0xd2042d, 0xff3131];

  for (let i = 0; i < count; i++) {
    const col = petalColors[Math.floor(Math.random() * petalColors.length)];
    const geom = createOrganicPetalGeometry(0.24, 0.32, 0.35);
    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.3,
      metalness: 0.04,
      emissive: new THREE.Color(col),
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(originPos);
    mesh.position.x += (Math.random() - 0.5) * 0.25;
    mesh.position.y += (Math.random() - 0.5) * 0.25;
    mesh.position.z += (Math.random() - 0.5) * 0.25;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.05 + Math.random() * 0.09;

    const pluckedData = {
      mesh: mesh,
      vx: Math.cos(angle) * speed,
      vy: 0.06 + Math.random() * 0.08, // Initial upward burst
      vz: 0.04 + Math.random() * 0.07, // Forward towards camera
      rotVx: (Math.random() - 0.5) * 0.16,
      rotVy: (Math.random() - 0.5) * 0.16,
      rotVz: (Math.random() - 0.5) * 0.16,
      gravity: 0.0032,
      life: 1.0,
      decay: 0.012 + Math.random() * 0.010
    };

    rose3DScene.add(mesh);
    rosePluckedPetals.push(pluckedData);
  }

  // Tactile Spring Bounce on Bouquet
  if (motion && rose3DBouquetGroup) {
    motion.fromTo(rose3DBouquetGroup.scale, 
      { x: 1.08, y: 0.94, z: 1.08 }, 
      { x: 1.0, y: 1.0, z: 1.0, duration: 0.65, ease: 'elastic.out(1.2, 0.4)' }
    );
  }
}

function updatePluckedPetals(delta) {
  for (let i = rosePluckedPetals.length - 1; i >= 0; i--) {
    const p = rosePluckedPetals[i];
    p.vy -= p.gravity;
    p.mesh.position.x += p.vx;
    p.mesh.position.y += p.vy;
    p.mesh.position.z += p.vz;

    p.mesh.rotation.x += p.rotVx;
    p.mesh.rotation.y += p.rotVy;
    p.mesh.rotation.z += p.rotVz;

    p.life -= p.decay;
    p.mesh.material.opacity = Math.max(0, p.life);

    if (p.life <= 0 || p.mesh.position.y < -6) {
      rose3DScene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      rosePluckedPetals.splice(i, 1);
    }
  }
}

// --- Setup User Interactions (Drag, Tap Raycast, Scroll Zoom) ---
function setupRoseInteractions(container) {
  let touchStartY = 0;
  let hasMoved = false;

  // Pointer Down
  const handlePointerDown = (clientX, clientY) => {
    isRoseDragging = true;
    hasMoved = false;
    roseDragStartX = clientX;
    roseDragStartY = clientY;
    touchStartY = clientY;
  };

  // Pointer Move
  const handlePointerMove = (clientX, clientY) => {
    if (!isRoseDragging) return;
    const dx = clientX - roseDragStartX;
    const dy = clientY - roseDragStartY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved = true;
    }

    roseTargetRotY += dx * 0.007;
    roseTargetRotX += dy * 0.005;
    // Clamp vertical tilt to keep bouquet looking great
    roseTargetRotX = Math.max(-0.55, Math.min(0.55, roseTargetRotX));

    roseDragStartX = clientX;
    roseDragStartY = clientY;
  };

  // Pointer Up (Tap detection)
  const handlePointerUp = (clientX, clientY) => {
    if (!isRoseDragging) return;
    isRoseDragging = false;

    if (!hasMoved && rose3DCamera && rose3DBouquetGroup) {
      // Raycast to find clicked flower
      rosePointer.x = (clientX / window.innerWidth) * 2 - 1;
      rosePointer.y = -(clientY / window.innerHeight) * 2 + 1;

      roseRaycaster.setFromCamera(rosePointer, rose3DCamera);
      const intersects = roseRaycaster.intersectObjects(rose3DBouquetGroup.children, true);

      if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        let color = 0xa80c25;
        if (hitObject.userData && hitObject.userData.parentRose) {
          color = hitObject.userData.parentRose.userData.colorHex || color;
        } else if (hitObject.material && hitObject.material.color) {
          color = hitObject.material.color.getHex();
        }
        spawnPluckedPetals(intersects[0].point, color);
      } else {
        const worldCenter = new THREE.Vector3(0, 0.4, 0);
        spawnPluckedPetals(worldCenter, 0xe07a98);
      }
    }
  };

  // Mouse listeners
  window.addEventListener('mousedown', (e) => {
    if ($('#roseScene').classList.contains('active')) {
      handlePointerDown(e.clientX, e.clientY);
    }
  });
  window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', (e) => handlePointerUp(e.clientX, e.clientY));

  // Touch listeners
  window.addEventListener('touchstart', (e) => {
    if ($('#roseScene').classList.contains('active') && e.touches.length === 1) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0) {
      handlePointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  });

  // Wheel / Scroll event for "Coming out of screen" effect
  const roseSceneElem = $('#roseScene');
  if (roseSceneElem) {
    roseSceneElem.addEventListener('wheel', (e) => {
      if (roseTransitionComplete) return;
      if (e.deltaY > 0) {
        roseScrollProgress = Math.min(1, roseScrollProgress + e.deltaY * 0.0018);
      } else {
        roseScrollProgress = Math.max(0, roseScrollProgress + e.deltaY * 0.0018);
      }

      if (roseScrollProgress > 0.82 && !roseTransitionComplete) {
        triggerRoseToMemoriesTransition();
      }
    }, { passive: true });

    // Touch swipe up for mobile scroll progress
    let touchLastY = 0;
    roseSceneElem.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) touchLastY = e.touches[0].clientY;
    }, { passive: true });

    roseSceneElem.addEventListener('touchmove', (e) => {
      if (roseTransitionComplete || e.touches.length !== 1) return;
      const currentY = e.touches[0].clientY;
      const diffY = touchLastY - currentY;
      touchLastY = currentY;

      if (diffY > 0) {
        roseScrollProgress = Math.min(1, roseScrollProgress + diffY * 0.0035);
        if (roseScrollProgress > 0.82 && !roseTransitionComplete) {
          triggerRoseToMemoriesTransition();
        }
      }
    }, { passive: true });
  }

  // Button Trigger: Take Bouquet
  const takeBouquetBtn = $('#takeBouquetBtn');
  if (takeBouquetBtn) {
    takeBouquetBtn.addEventListener('click', () => {
      triggerRoseToMemoriesTransition();
    });
  }
}

function triggerRoseToMemoriesTransition() {
  if (roseTransitionComplete) return;
  roseTransitionComplete = true;

  // Grand celebration explosion of petals
  if (rose3DBouquetGroup) {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        spawnPluckedPetals(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.4 + Math.random() * 0.4, 0.2), 0xff0000);
      }, i * 65);
    }
  }

  if (motion && rose3DBouquetGroup) {
    motion.to(rose3DBouquetGroup.position, {
      z: 3.8,
      y: 0.15,
      duration: 1.15,
      ease: 'power3.in'
    });
    motion.to(rose3DBouquetGroup.scale, {
      x: 2.2,
      y: 2.2,
      z: 2.2,
      duration: 1.15,
      ease: 'power3.in'
    });
    motion.to('#roseScene', {
      opacity: 0,
      duration: 0.8,
      delay: 0.45,
      ease: 'power2.inOut',
      onComplete: () => {
        hideScene($('#roseScene'));
        showScene('#memoryScene');
      }
    });
  } else {
    setTimeout(() => {
      hideScene($('#roseScene'));
      showScene('#memoryScene');
    }, 500);
  }
}



// --- Fairy Lights & Canopy Decorations ---
function initFairyLights() {
  const bulbsContainer = $('#fairyBulbs');
  const decorationsContainer = $('#hangingDecorations');
  if (!bulbsContainer || bulbsContainer.childElementCount > 0) return;

  // Wire 1 bulbs
  const wire1Points = [
    { x: 4, y: 24, type: 'gold' },
    { x: 12, y: 44, type: 'pink' },
    { x: 22, y: 64, type: 'amber' },
    { x: 32, y: 58, type: 'gold' },
    { x: 44, y: 36, type: 'pink' },
    { x: 54, y: 30, type: 'gold' },
    { x: 64, y: 36, type: 'amber' },
    { x: 74, y: 52, type: 'pink' },
    { x: 86, y: 40, type: 'gold' },
    { x: 95, y: 26, type: 'amber' }
  ];

  // Wire 2 bulbs (offset lower)
  const wire2Points = [
    { x: 8, y: 56, type: 'pink' },
    { x: 18, y: 78, type: 'amber' },
    { x: 28, y: 92, type: 'gold' },
    { x: 38, y: 86, type: 'pink' },
    { x: 48, y: 62, type: 'gold' },
    { x: 58, y: 54, type: 'amber' },
    { x: 70, y: 66, type: 'gold' },
    { x: 80, y: 78, type: 'pink' },
    { x: 91, y: 60, type: 'amber' }
  ];

  [...wire1Points, ...wire2Points].forEach((pt, i) => {
    const bulb = document.createElement('span');
    bulb.className = `fairy-bulb ${pt.type}`;
    bulb.style.left = `${pt.x}%`;
    bulb.style.top = `${pt.y}px`;
    bulb.style.animationDelay = `${(i * 0.27) % 2.5}s`;
    bulb.style.transform = `rotate(${(Math.sin(i) * 12).toFixed(1)}deg)`;
    bulbsContainer.appendChild(bulb);
  });

  // Hanging Flowers, Hearts & Greenery
  const hangingItems = [
    { x: 6, y: 38, symbol: '🌸', size: 18, delay: 0 },
    { x: 15, y: 62, symbol: '🌿', size: 16, delay: 0.4 },
    { x: 24, y: 84, symbol: '💖', size: 17, delay: 0.9 },
    { x: 34, y: 76, symbol: '🌺', size: 19, delay: 1.3 },
    { x: 45, y: 48, symbol: '♡', size: 16, delay: 0.6 },
    { x: 53, y: 42, symbol: '🌷', size: 18, delay: 1.1 },
    { x: 63, y: 52, symbol: '✨', size: 15, delay: 0.2 },
    { x: 72, y: 70, symbol: '🌸', size: 19, delay: 1.5 },
    { x: 82, y: 82, symbol: '🌿', size: 17, delay: 0.8 },
    { x: 92, y: 50, symbol: '💖', size: 16, delay: 1.4 }
  ];

  hangingItems.forEach((item) => {
    const el = document.createElement('span');
    el.className = 'hanging-item';
    el.textContent = item.symbol;
    el.style.left = `${item.x}%`;
    el.style.top = `${item.y + 14}px`;
    el.style.fontSize = `${item.size}px`;
    el.style.animationDelay = `-${item.delay}s`;
    decorationsContainer.appendChild(el);
  });
}

// --- Ambient Floating Rose Petals ---
function initAmbientPetals() {
  const container = $('#ambientPetals');
  if (!container || container.childElementCount > 0) return;

  const count = 15;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'ambient-petal';
    const sizeW = 9 + Math.random() * 11;
    const sizeH = 12 + Math.random() * 12;
    petal.style.width = `${sizeW}px`;
    petal.style.height = `${sizeH}px`;
    petal.style.left = `${Math.random() * 96}%`;
    petal.style.top = `${Math.random() * 92}%`;
    petal.style.opacity = `${0.25 + Math.random() * 0.45}`;
    petal.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(petal);

    if (motion) {
      motion.to(petal, {
        y: `+=${25 + Math.random() * 40}`,
        x: `+=${(Math.random() - 0.5) * 35}`,
        rotation: `+=${(Math.random() - 0.5) * 120}`,
        duration: 4 + Math.random() * 4,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 3
      });
    }
  }
}

// --- Polaroid Cards & Memory Carousel ---
const memories = [
  {
    title: 'our little adventures',
    tag: 'Chapter 01',
    caption: 'You make ordinary days feel like pure magic. ♡',
    colors: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    icon: '✨',
    badge: '1 of 5',
    date: 'Forever & Always',
    image: 'assets/mem1.jpeg'
  },
  {
    title: 'my favorite face',
    tag: 'Chapter 02',
    caption: 'Every single version of you is my favorite version.',
    colors: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    icon: '🌸',
    badge: '2 of 5',
    date: 'Sweetest Smile',
    image: 'assets/mem2.jpeg'
  },
  {
    title: 'us, always',
    tag: 'Chapter 03',
    caption: 'The best memories are the ones where I am next to you.',
    colors: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    icon: '💖',
    badge: '3 of 5',
    date: 'My Safe Place',
    image: 'assets/mem3.jpeg'
  },
  {
    title: 'forever my cutie',
    tag: 'Chapter 04',
    caption: 'No matter where life takes us, home is always you. ♥',
    colors: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    icon: '🎀',
    badge: '4 of 5',
    date: 'My Whole Heart',
    image: 'assets/mem4.jpeg'
  },
  {
    title: 'my gorgeous hotty',
    tag: 'Chapter 05',
    caption: 'Looking this breathtaking should be illegal! Forever obsessed with you. 🔥💋',
    colors: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',
    icon: '🔥',
    badge: '5 of 5',
    date: 'Happy Birthday, Babe! 🎂',
    image: 'assets/mem5.jpeg'
  }
];

const stack = $('#cardStack');
const restingRotations = [-3.2, 2.4, -1.8, 2.6, 0];
const restingYOffsets = [8, 6, 4, 2, 0];

function updateCardIndicator(activeIndex) {
  const indicator = $('#cardIndicator');
  if (!indicator) return;
  indicator.innerHTML = '';
  memories.forEach((_, idx) => {
    const dot = document.createElement('i');
    if (idx === activeIndex) dot.className = 'active';
    indicator.appendChild(dot);
  });
}

function buildCards() {
  if (!stack) return;
  stack.innerHTML = '';
  initFairyLights();
  initAmbientPetals();

  [...memories].reverse().forEach((memory, reverseIndex) => {
    const index = memories.length - 1 - reverseIndex;
    const card = document.createElement('article');
    card.className = 'memory-card';
    card.dataset.index = index;

    const rot = restingRotations[index % restingRotations.length];
    const yOff = restingYOffsets[index % restingYOffsets.length];
    const restTrans = `rotate(${rot}deg) translateY(${yOff}px)`;
    
    card.style.transform = restTrans;
    card.dataset.restRotation = String(rot);
    card.dataset.restY = String(yOff);

    const photoContent = memory.image
      ? `<img src="${memory.image}" alt="${memory.title}" />`
      : `<div class="photo-placeholder">
           <span class="icon">${memory.icon}</span>
           <span>your photo<br>goes here ♡</span>
           <small>${memory.date}</small>
         </div>`;

    card.innerHTML = `
      <div class="washi-tape"></div>
      <div class="card-badge">${memory.badge}</div>
      <div class="photo" style="background:${memory.colors}">${photoContent}</div>
      <div class="card-footer">
        <small>${memory.title}</small>
        <span class="card-tag">${memory.tag}</span>
      </div>
    `;
    stack.appendChild(card);
  });

  updateCardIndicator(0);
  activateTopCard();
}

function revealLetter() {
  const letter = $('#letter');
  letter.classList.add('active');
  letter.setAttribute('aria-hidden', 'false');
  letter.style.display = 'flex';
  letter.style.visibility = 'visible';
  letter.style.pointerEvents = 'auto';

  const envelopeWrapper = $('#envelopeWrapper');
  const envelopeLid = $('#envelopeLid');
  const waxSeal = $('#waxSeal');
  const letterPaper = $('#letterPaper');
  const envelopePocket = $('.envelope-pocket');
  const envelopeBack = $('.envelope-back');

  if (!motion) {
    if (letterPaper) {
      letterPaper.style.opacity = '1';
      letterPaper.style.transform = 'translate(-50%, -50%)';
    }
    return;
  }

  // Set initial states
  motion.set(envelopeWrapper, { scale: 0.82, y: 50, opacity: 0 });
  motion.set(envelopeLid, { rotateX: 0, transformOrigin: 'top center', zIndex: 4 });
  motion.set(waxSeal, { scale: 1, opacity: 1 });
  motion.set(letterPaper, { 
    xPercent: -50, 
    yPercent: -50, 
    x: 0, 
    y: 35, 
    scaleY: 0.2, 
    scaleX: 0.75, 
    opacity: 0, 
    rotateX: -40, 
    transformOrigin: 'center top', 
    zIndex: 2 
  });
  motion.set([envelopePocket, envelopeBack], { opacity: 1, y: 0 });
  motion.set('.letter-paper .eyebrow, .letter-paper h2, .letter-copy p, .signature', { opacity: 0, y: 12 });

  const tl = motion.timeline({ delay: 0.2 });

  // 1. Envelope floats in into center view
  tl.to(envelopeWrapper, {
    scale: 1,
    y: 0,
    opacity: 1,
    duration: 0.75,
    ease: 'back.out(1.5)'
  })
  // 2. Wax seal shimmers & pops open
  .to(waxSeal, {
    scale: 1.35,
    duration: 0.22,
    ease: 'power2.out'
  })
  .to(waxSeal, {
    scale: 0,
    opacity: 0,
    duration: 0.28,
    ease: 'power2.in'
  })
  // 3. Top flap flips open in 3D
  .to(envelopeLid, {
    rotateX: -180,
    zIndex: 1,
    duration: 0.7,
    ease: 'power2.inOut'
  }, '-=0.1')
  // 4. Folded letter slides UP out of envelope
  .to(letterPaper, {
    y: -115,
    opacity: 1,
    scaleX: 0.85,
    duration: 0.65,
    ease: 'power2.out'
  }, '-=0.25')
  // 5. Letter unfolds itself into full screen centered view
  .to(letterPaper, {
    y: 0,
    scaleY: 1,
    scaleX: 1,
    rotateX: 0,
    zIndex: 30,
    duration: 0.9,
    ease: 'power3.out'
  })
  // Envelope sinks and fades behind the open letter
  .to([envelopePocket, envelopeBack, envelopeLid], {
    y: 40,
    opacity: 0,
    duration: 0.45,
    ease: 'power2.out'
  }, '-=0.55')
  // 6. Letter text smoothly staggers into view
  .to('.letter-paper .eyebrow, .letter-paper h2, .letter-copy p, .signature', {
    opacity: 1,
    y: 0,
    stagger: 0.1,
    duration: 0.5,
    ease: 'power2.out'
  }, '-=0.2');
}

function swipeTopCard(direction = 1) {
  if (!stack) return;
  const top = stack.querySelector('.memory-card:last-child');
  if (!top || top._isLeaving) return;
  top._isLeaving = true;
  top.style.pointerEvents = 'none';

  if (motion) {
    motion.to(top, {
      x: direction * (window.innerWidth * 0.75 + 250),
      y: -20,
      rotation: direction * 35,
      opacity: 0,
      duration: 0.38,
      ease: 'power2.in',
      onComplete: () => {
        top.remove();
        activateTopCard();
      }
    });
  } else {
    top.classList.add(direction > 0 ? 'leaving-right' : 'leaving-left');
    setTimeout(() => {
      top.remove();
      activateTopCard();
    }, 400);
  }
}

function activateTopCard() {
  if (!stack) return;
  const top = stack.querySelector('.memory-card:last-child');
  if (!top) {
    $('#memoryCaption').textContent = 'And that is only the beginning of our story...';
    $('#cardIndicator').innerHTML = '';
    setTimeout(() => {
      hideScene($('#memoryScene'));
      revealLetter();
    }, 650);
    return;
  }

  const currentIndex = Number(top.dataset.index);
  updateCardIndicator(currentIndex);
  $('#memoryCaption').textContent = memories[currentIndex].caption;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let dragging = false;
  let startTime = 0;

  const onPointerMove = (event) => {
    if (!dragging) return;
    currentX = event.clientX - startX;
    currentY = event.clientY - startY;

    const restRot = parseFloat(top.dataset.restRotation || 0);
    const restY = parseFloat(top.dataset.restY || 0);
    const rotZ = restRot + currentX * 0.05;
    const transY = restY + currentY * 0.35;

    top.style.transform = `translate3d(${currentX}px, ${transY}px, 0) rotate(${rotZ}deg) scale(1.04)`;
    top.style.boxShadow = `0 ${24 + Math.abs(currentX) * 0.15}px ${50 + Math.abs(currentX) * 0.2}px rgba(70,20,35,0.3)`;
  };

  const onPointerUp = (event) => {
    if (!dragging) return;
    dragging = false;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);

    try {
      if (event && event.pointerId !== undefined && top.hasPointerCapture && top.hasPointerCapture(event.pointerId)) {
        top.releasePointerCapture(event.pointerId);
      }
    } catch(e) {}

    const elapsed = Date.now() - startTime;
    const velocity = Math.abs(currentX) / Math.max(1, elapsed);
    const direction = currentX >= 0 ? 1 : -1;

    // Threshold check for swipe vs snap back
    if (Math.abs(currentX) > 55 || velocity > 0.28) {
      top._isLeaving = true;
      top.style.pointerEvents = 'none';
      if (motion) {
        motion.to(top, {
          x: direction * (window.innerWidth * 0.75 + 250),
          y: currentY * 0.4,
          rotation: direction * 35,
          opacity: 0,
          duration: 0.36,
          ease: 'power2.in',
          onComplete: () => {
            top.remove();
            activateTopCard();
          }
        });
      } else {
        top.classList.add(direction > 0 ? 'leaving-right' : 'leaving-left');
        setTimeout(() => {
          top.remove();
          activateTopCard();
        }, 400);
      }
    } else {
      // Elastic spring back to rest position
      const restRot = parseFloat(top.dataset.restRotation || 0);
      const restY = parseFloat(top.dataset.restY || 0);
      if (motion) {
        motion.to(top, {
          x: 0,
          y: restY,
          rotation: restRot,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.5)',
          clearProps: 'boxShadow'
        });
      } else {
        top.style.transform = `rotate(${restRot}deg) translateY(${restY}px)`;
        top.style.boxShadow = '';
      }
    }
  };

  const onPointerDown = (event) => {
    if (top._isLeaving) return;
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    currentX = 0;
    currentY = 0;
    startTime = Date.now();

    if (motion) {
      motion.killTweensOf(top);
    }

    try {
      top.setPointerCapture(event.pointerId);
    } catch(e) {}

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  top.onpointerdown = onPointerDown;
}

// Hook swipe hint button to trigger next card
const swipeNextBtn = $('#swipeNextBtn');
if (swipeNextBtn) {
  swipeNextBtn.addEventListener('click', () => swipeTopCard(1));
}

buildCards();
