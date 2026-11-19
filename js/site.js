if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lenis = new Lenis({
  duration: 1.1,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: !reduce,
  syncTouch: false
});
if (window.ScrollTrigger) {
  lenis.on("scroll", ScrollTrigger.update);
  ScrollTrigger.config({ ignoreMobileResize: true });
}
gsap.ticker.add(time => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const desktopHome = matchMedia("(min-width: 901px)");
const holdHome = () => {
  if (document.body.dataset.page === "home" && desktopHome.matches) lenis.stop();
  else lenis.start();
};
holdHome();
desktopHome.addEventListener("change", holdHome);

const menu = $(".hd__menu");
const sheet = $(".sheet");
function setMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  if (open) {
    gsap.set(sheet, { visibility: "visible" });
    gsap.to(sheet, { clipPath: "inset(0 0 -20px 0)", duration: .55, ease: "expo.out", overwrite: "auto" });
  } else {
    gsap.to(sheet, {
      clipPath: "inset(0 0 100% 0)", duration: .35, overwrite: "auto",
      onComplete: () => gsap.set(sheet, { visibility: "hidden" })
    });
  }
}
menu.addEventListener("click", (event) => {
  event.stopPropagation();
  setMenu(menu.getAttribute("aria-expanded") !== "true");
});
document.addEventListener("click", (event) => {
  if (menu.getAttribute("aria-expanded") === "true" && !sheet.contains(event.target)) setMenu(false);
});

const page = location.pathname.replace(/index\.html$/, "").replace(/\/$/, "") || "/";
$$(".sheet__nav a").forEach(link => {
  const href = link.getAttribute("href").replace(/\/$/, "") || "/";
  link.classList.toggle("is-active", href === page);
});

try {
  const saved = localStorage.getItem("oe-theme") || "main";
  document.documentElement.dataset.theme = saved;
  $$("[data-mood]").forEach(button => button.classList.toggle("is-on", button.dataset.mood === saved));
} catch (e) {}
$$("[data-mood]").forEach(button => {
  button.addEventListener("click", () => {
    document.documentElement.dataset.theme = button.dataset.mood;
    try { localStorage.setItem("oe-theme", button.dataset.mood); } catch (e) {}
    $$("[data-mood]").forEach(other => other.classList.toggle("is-on", other === button));
  });
});

if (window.ScrollTrigger && !reduce) {
  $$("[data-reveal]").forEach(el => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: .9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true }
    });
  });
}

const stage = $("[data-pin]");
if (stage && window.ScrollTrigger) {
  const slides = $$(".stage__slide", stage);
  const count = $("[data-stage-n]", stage);
  const phone = $("[data-phone]", stage);
  const photo = phone && phone.querySelector("img");
  const clip = phone && phone.querySelector("video");
  const show = progress => {
    const index = Math.min(slides.length - 1, Math.floor(progress * slides.length));
    slides.forEach((slide, n) => slide.classList.toggle("is-on", n === index));
    if (count) count.textContent = String(index + 1).padStart(2, "0");
    const slide = slides[index];
    const videoSrc = slide && slide.dataset.video;
    const shot = slide && slide.dataset.shot;
    if (clip && videoSrc) {
      if (photo) photo.hidden = true;
      clip.hidden = false;
      if (clip.getAttribute("src") !== videoSrc) {
        clip.src = videoSrc;
        clip.play().catch(() => {});
      } else if (clip.paused) {
        clip.play().catch(() => {});
      }
    } else if (photo && shot) {
      if (clip) {
        clip.pause();
        clip.hidden = true;
      }
      photo.hidden = false;
      photo.src = shot;
    }
  };
  const total = $("[data-stage-total]", stage);
  if (total) total.textContent = String(slides.length).padStart(2, "0");
  ScrollTrigger.create({
    trigger: stage,
    start: "top top",
    end: () => `+=${Math.max(1, slides.length - 1) * 80}%`,
    pin: ".stage__sticky",
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: self => show(self.progress)
  });
}

const feed = $(".kfeed[data-split]");
if (feed) {
  const notes = [...feed.querySelectorAll(".kitem")];
  gsap.matchMedia().add("(min-width: 761px)", () => {
    const left = document.createElement("div");
    const right = document.createElement("div");
    left.className = "kfeed__col";
    right.className = "kfeed__col kfeed__col--r";
    notes.forEach((note, i) => (i % 2 ? right : left).appendChild(note));
    feed.replaceChildren(left, right);
    feed.style.display = "grid";
    feed.style.gridTemplateColumns = "repeat(2, min(360px, 42vw))";
    feed.style.justifyContent = "center";
    feed.style.gap = "clamp(30px, 10vw, 180px)";
    return () => {
      notes.forEach(note => feed.appendChild(note));
      left.remove();
      right.remove();
      feed.style.display = "";
      feed.style.gridTemplateColumns = "";
      feed.style.justifyContent = "";
      feed.style.gap = "";
    };
  });
}
document.addEventListener("click", event => {
  const heart = event.target.closest(".kheart");
  if (heart) {
    const on = heart.classList.toggle("is-on");
    const count = heart.querySelector("span");
    const value = parseInt(count.textContent || "0", 10) || 0;
    count.textContent = String(on ? value + 1 : Math.max(0, value - 1));
    heart.setAttribute("aria-pressed", String(on));
  }
  const share = event.target.closest(".kpost__share");
  if (share) {
    const text = share.closest(".kitem")?.querySelector(".kquote p")?.textContent || "";
    navigator.clipboard?.writeText(text).catch(() => {});
    const label = share.textContent;
    share.textContent = "Copied";
    setTimeout(() => { share.textContent = label; }, 1200);
  }
});
if (window.ScrollTrigger) {
  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

const line = $(".tl__line i");
if (line && window.ScrollTrigger) {
  gsap.to(line, {
    scaleY: 1,
    ease: "none",
    scrollTrigger: { trigger: ".jobs", start: "top 75%", end: "bottom 70%", scrub: true }
  });
}

const loader = $(".loader");
if (loader) {
  const lines = [
    { big: "Write the caption", hand: "so it sounds like the brand." },
    { big: "Cut the video", hand: "short enough to finish." },
    { big: "Plan the week", hand: "then post it." }
  ];
  const count = $(".loader__count span");
  const big = $(".loader__big");
  const hand = $(".loader__hand");
  const reels = $$(".reel");
  let stopped = false;

  function showLine(i) {
    const lineItem = lines[i % lines.length];
    big.textContent = lineItem.big;
    hand.textContent = lineItem.hand;
    reels.forEach((reel, n) => reel.classList.toggle("is-on", n === i % reels.length));
  }
  function savedHello() {
    try { return localStorage.getItem("oe-hello"); } catch (e) { return null; }
  }
  function revealHome() {
    gsap.from(".scrap", { y: -50, opacity: 0, rotate: () => gsap.utils.random(-12, 12), duration: .8, stagger: .05, ease: "back.out(1.6)" });
    gsap.from(".hA__intro, .hA__cut, .hA__side, .door", { y: 24, opacity: 0, duration: .8, stagger: .06, ease: "expo.out", delay: .15 });
  }
  function finishLoader() {
    if (stopped) return;
    stopped = true;
    gsap.to(loader, { opacity: 0, duration: .45, onComplete: () => {
      loader.remove();
      const saved = savedHello();
      if (saved) {
        const greet = $("span[data-name]");
        if (greet) greet.textContent = saved;
        dialog.remove();
        revealHome();
      } else {
        openDialog();
      }
    } });
  }
  function runLoader() {
    showLine(0);
    const obj = { n: 0 };
    gsap.to(obj, {
      n: 100, duration: 3.4, ease: "power1.inOut",
      onUpdate: () => {
        const value = Math.round(obj.n);
        count.textContent = value;
        showLine(Math.min(lines.length - 1, Math.floor(value / 34)));
      },
      onComplete: finishLoader
    });
    if (window.MotionPathPlugin) {
      const trail = $(".loader__trail path");
      gsap.to(".loader__plane", {
        duration: 3.6, ease: "power1.inOut",
        motionPath: { path: trail, align: trail, alignOrigin: [.5, .5], autoRotate: true }
      });
    }
  }
  $(".loader__skip").addEventListener("click", finishLoader);

  const nameBlock = $(".hA__name");
  if (nameBlock) {
    const tornClip = () => {
      const pts = [];
      const n = 7;
      for (let i = 0; i <= n; i++) pts.push(`${(i / n * 100).toFixed(1)}% ${(Math.random() * 7).toFixed(1)}%`);
      for (let i = 0; i <= n; i++) pts.push(`${(100 - Math.random() * 6).toFixed(1)}% ${(i / n * 100).toFixed(1)}%`);
      for (let i = n; i >= 0; i--) pts.push(`${(i / n * 100).toFixed(1)}% ${(100 - Math.random() * 7).toFixed(1)}%`);
      for (let i = n; i >= 0; i--) pts.push(`${(Math.random() * 6).toFixed(1)}% ${(i / n * 100).toFixed(1)}%`);
      return `polygon(${pts.join(",")})`;
    };
    nameBlock.innerHTML = [...nameBlock.dataset.name].map(ch => `<span class="scrap" style="clip-path:${tornClip()}">${ch}</span>`).join("");
  }

  const dialog = $(".dialog");
  function openDialog() {
    gsap.set(dialog, { visibility: "visible" });
    gsap.to($(".dialog__bg"), { opacity: 1, duration: .35, overwrite: "auto" });
    gsap.fromTo($(".dialog__card"), { y: 36, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .6, ease: "expo.out" });
    $("#dlg-name").focus();
  }
  function closeDialog(name) {
    if (name) {
      $("span[data-name]").textContent = name;
      try { localStorage.setItem("oe-hello", name); } catch (e) {}
    }
    gsap.to($(".dialog__card"), { y: 16, opacity: 0, duration: .3, overwrite: "auto" });
    gsap.to($(".dialog__bg"), {
      opacity: 0, duration: .35, delay: .05, overwrite: "auto",
      onComplete: () => {
        dialog.remove();
        revealHome();
      }
    });
  }
  $(".dialog__card").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#dlg-name").value.trim();
    const err = $(".dialog__err");
    if (!name) { err.textContent = "A first name, or skip."; return; }
    closeDialog(name);
  });
  $("[data-skip]").addEventListener("click", () => closeDialog(""));
  runLoader();
}
