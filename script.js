const config = {
  // Edit these values to adjust the timing and the five hidden-star messages.
  photoSceneDuration: 7600,
  lightSceneDuration: 10400,
  starMessages: [
    "Ada seseorang yang tersenyum karena kehadiranmu.",
    "Ada seseorang yang merasa nyaman saat bersamamu.",
    "Ada seseorang yang bangga kepadamu.",
    "Ada seseorang yang merasa lebih kuat karena kamu.",
    "Ada seseorang yang bersyukur karena mengenalmu.",
  ],
  starPositions: [
    { left: "12%", top: "18%" },
    { left: "76%", top: "22%" },
    { left: "22%", top: "64%" },
    { left: "62%", top: "56%" },
    { left: "84%", top: "76%" },
  ],
};

const root = document.documentElement;
const loader = document.querySelector("#loader");
const scenes = [...document.querySelectorAll("[data-scene]")];
const startJourney = document.querySelector("#startJourney");
const showLight = document.querySelector("#showLight");
const openLetterScene = document.querySelector("#openLetterScene");
const restart = document.querySelector("#restart");
const starField = document.querySelector("#starField");
const progressText = document.querySelector("#progressText");
const messageToast = document.querySelector("#messageToast");
const envelope = document.querySelector("#envelope");
const letterNext = document.querySelector("#letterNext");
const letterScene = document.querySelector("#letterScene");
const musicToggle = document.querySelector("#musicToggle");
const musicIcon = document.querySelector("#musicIcon");
const foundAudio = document.querySelector("#foundAudio");
const lightAudio = document.querySelector("#lightAudio");
const canvas = document.querySelector("#skyCanvas");
const ctx = canvas.getContext("2d");

let activeScene = "opening";
let foundCount = 0;
let activeAudio = null;
let userPausedMusic = false;
let toastTimer;
let particles = [];
let routeTimer;

function setupAudioFallback(audio) {
  audio.addEventListener("error", () => {
    const fallback = audio.dataset.fallback;
    if (fallback && audio.dataset.fallbackUsed !== "true") {
      audio.dataset.fallbackUsed = "true";
      audio.src = fallback;
      audio.load();
      if (activeAudio === audio && !userPausedMusic) {
        window.setTimeout(() => playAudio(audio), 250);
      }
    }
  });
}

function showScene(id) {
  // Each section behaves like a soft page in a single-screen story.
  activeScene = id;
  scenes.forEach((scene) => {
    scene.classList.toggle("is-active", scene.id === id);
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function playAudio(audio) {
  if (!audio || userPausedMusic) {
    return;
  }

  [foundAudio, lightAudio].forEach((item) => {
    if (item !== audio) {
      item.pause();
      item.currentTime = 0;
    }
  });

  activeAudio = audio;

  try {
    await audio.play();
    updateMusicButton(true);
  } catch {
    updateMusicButton(false);
  }
}

function stopAllAudio() {
  [foundAudio, lightAudio].forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudio = null;
  updateMusicButton(false);
}

function updateMusicButton(isPlaying) {
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicIcon.textContent = isPlaying ? "||" : ">";
}

function buildStars() {
  // The mini game is rebuilt on restart so every star can be found again.
  starField.textContent = "";
  config.starMessages.forEach((message, index) => {
    const star = document.createElement("button");
    star.type = "button";
    star.className = "star-button";
    star.style.left = config.starPositions[index].left;
    star.style.top = config.starPositions[index].top;
    star.style.animationDelay = `${index * 260}ms`;
    star.setAttribute("aria-label", `Temukan bintang ${index + 1}`);
    star.addEventListener("click", () => collectStar(star, message));
    starField.append(star);
  });
}

function collectStar(star, message) {
  if (star.classList.contains("is-found")) {
    return;
  }

  star.classList.add("is-found");
  foundCount += 1;
  progressText.textContent = `${foundCount}/5 bintang ditemukan`;
  root.style.setProperty("--brighten", foundCount / config.starMessages.length);
  showToast(message);

  if (foundCount === config.starMessages.length) {
    window.setTimeout(() => showScene("discovery"), 1300);
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  messageToast.textContent = message;
  messageToast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    messageToast.classList.remove("is-visible");
  }, 2600);
}

function resetJourney() {
  window.clearTimeout(routeTimer);
  foundCount = 0;
  userPausedMusic = false;
  letterScene.classList.remove("is-open");
  progressText.textContent = "0/5 bintang ditemukan";
  root.style.setProperty("--brighten", 0);
  buildStars();
  stopAllAudio();
  showScene("opening");
}

function enterPhotoReveal() {
  showScene("photoReveal");
  routeTimer = window.setTimeout(() => {
    playAudio(lightAudio);
    showScene("theLight");
    routeTimer = window.setTimeout(() => {
      playAudio(foundAudio);
      showScene("foundSong");
    }, config.lightSceneDuration);
  }, config.photoSceneDuration);
}

function resizeCanvas() {
  // Canvas particles are decorative only and resize with the viewport.
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.min(92, Math.max(42, Math.floor(window.innerWidth / 13)));
  particles = Array.from({ length: count }, () => createParticle(true));
}

function createParticle(anywhere = false) {
  return {
    x: Math.random() * window.innerWidth,
    y: anywhere ? Math.random() * window.innerHeight : window.innerHeight + 20,
    size: 0.7 + Math.random() * 2.1,
    speed: 0.12 + Math.random() * 0.42,
    drift: -0.16 + Math.random() * 0.32,
    alpha: 0.18 + Math.random() * 0.48,
  };
}

function drawParticles() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  particles.forEach((particle, index) => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 247, 232, ${particle.alpha})`;
    ctx.shadowColor = "rgba(231, 200, 121, 0.86)";
    ctx.shadowBlur = 12;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    particle.y -= particle.speed;
    particle.x += particle.drift;

    if (particle.y < -20 || particle.x < -20 || particle.x > window.innerWidth + 20) {
      particles[index] = createParticle(false);
    }
  });

  requestAnimationFrame(drawParticles);
}

startJourney.addEventListener("click", () => {
  userPausedMusic = false;
  showScene("search");
  playAudio(lightAudio);
});

showLight.addEventListener("click", enterPhotoReveal);

openLetterScene.addEventListener("click", () => {
  showScene("letterScene");
});

restart.addEventListener("click", resetJourney);

envelope.addEventListener("click", () => {
  letterScene.classList.add("is-open");
});

letterNext.addEventListener("click", () => {
  showScene("finale");
});

musicToggle.addEventListener("click", () => {
  if (activeAudio && !activeAudio.paused) {
    activeAudio.pause();
    userPausedMusic = true;
    updateMusicButton(false);
    return;
  }

  userPausedMusic = false;
  const preferredAudio = activeScene === "foundSong" ? foundAudio : lightAudio;
  playAudio(preferredAudio);
});

window.addEventListener("resize", resizeCanvas);

window.addEventListener("load", () => {
  window.setTimeout(() => loader.classList.add("is-hidden"), 900);
});

buildStars();
setupAudioFallback(foundAudio);
setupAudioFallback(lightAudio);
resizeCanvas();
drawParticles();
