"use strict";

// ---------- basics ----------
const LANGUAGES = [
  { name: "Hindi", native: "हिन्दी", code: "hi-IN" },
  { name: "Bengali", native: "বাংলা", code: "bn-IN" },
  { name: "Marathi", native: "मराठी", code: "mr-IN" },
  { name: "Telugu", native: "తెలుగు", code: "te-IN" },
  { name: "Tamil", native: "தமிழ்", code: "ta-IN" },
  { name: "Gujarati", native: "ગુજરાતી", code: "gu-IN" },
  { name: "Urdu", native: "اردو", code: "ur-IN" },
  { name: "Kannada", native: "ಕನ್ನಡ", code: "kn-IN" },
  { name: "English (India)", native: "English", code: "en-IN" },
];
const SCREENS = ["login", "welcome", "languages", "who", "input", "result"];
const BACK = {
  languages: "welcome",
  who: "languages",
  input: "who",
  result: "input",
}; // where Back goes
const STEP = { who: 1, input: 2, result: 3 }; // progress bar
const LABEL = { patient: "Patient", doctor: "Doctor" };
const ERROR_HELP = {
  "not-allowed":
    "Microphone access is blocked. Click the lock icon next to the address bar, allow the microphone, then try again.",
  "service-not-allowed":
    "Microphone access is blocked. Allow the microphone in your browser settings and try again.",
  "no-speech": "No speech was heard. Check your microphone and try again.",
  "audio-capture":
    "No microphone was found. Plug one in or check your device settings.",
  network:
    "Speech recognition needs an internet connection. Check your connection and try again.",
  "language-not-supported":
    "This browser does not support speech recognition for the chosen language. Try another language or browser.",
};

const $ = (id) => document.getElementById(id);
const el = {};
[
  "topbar",
  "backBtn",
  "signOutBtn",
  "progress",
  "loginForm",
  "nameInput",
  "loginError",
  "greeting",
  "startBtn",
  "patientLang",
  "doctorLang",
  "sameLang",
  "langNextBtn",
  "steps",
  "logCard",
  "log",
  "logNotice",
  "inputTitle",
  "tabSpeak",
  "tabWrite",
  "speakPanel",
  "micBtn",
  "micLabel",
  "micStatus",
  "engineNote",
  "notice",
  "originalBlock",
  "originalBox",
  "editBox",
  "editedBadge",
  "restoreBtn",
  "playBtn",
  "translateBtn",
  "origCard",
  "origCap",
  "origText",
  "origNote",
  "playOrigBtn",
  "trCard",
  "trCap",
  "trText",
  "playTrBtn",
  "resultNotice",
  "saveBtn",
  "editAgainBtn",
].forEach((id) => (el[id] = $(id)));

// What the app remembers while it runs.
const S = {
  name: "",
  patient: "hi-IN",
  doctor: "en-IN",
  who: "patient",
  mode: "speak",
  listening: false,
  transcribing: false,
  translating: false,
  engine: null,
  heard: "", // original words exactly as heard (never edited)
  draft: null, // who is speaking and in which languages
  current: null, // the turn shown on the result page
  log: [], // saved turns
};

const langOf = (code) => LANGUAGES.find((l) => l.code === code);
const codeOf = (who) => (who === "patient" ? S.patient : S.doctor);
const otherOf = (who) => (who === "patient" ? "doctor" : "patient");
const note = (node, text) => {
  node.textContent = text;
  node.hidden = !text;
};

// ---------- moving between pages ----------
function go(name) {
  SCREENS.forEach((n) =>
    $("screen-" + n).classList.toggle("active", n === name),
  );
  document.body.dataset.screen = name;
  el.topbar.hidden = name === "login";
  el.backBtn.hidden = !BACK[name];
  el.progress.hidden = !STEP[name];
  el.progress.querySelectorAll("li").forEach((li, i) => {
    li.classList.toggle("on", i + 1 === STEP[name]);
    li.classList.toggle("done", i + 1 < STEP[name]);
  });
  window.scrollTo(0, 0);
  const h = $("screen-" + name).querySelector("h1, h2");
  if (h) {
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }
}

el.backBtn.addEventListener("click", () => {
  const here = document.body.dataset.screen;
  if (here === "input") {
    if (S.listening) Recorder.stop();
    if (
      el.editBox.value.trim() &&
      !confirm("Go back and discard this message?")
    )
      return;
  }
  go(BACK[here]);
});

// ---------- page 1: login ----------
el.loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = el.nameInput.value.trim();
  if (!name) {
    note(el.loginError, "Please type your name to continue.");
    return;
  }
  note(el.loginError, "");
  S.name = name;
  try {
    sessionStorage.setItem("medivaani-name", name);
  } catch (_) {
    /* storage may be blocked; that is fine */
  }
  showWelcome();
});

el.signOutBtn.addEventListener("click", () => {
  if (
    S.log.length &&
    !confirm("Sign out? The conversation on this page will be cleared.")
  )
    return;
  if (S.listening) Recorder.stop();
  try {
    sessionStorage.removeItem("medivaani-name");
  } catch (_) {}
  S.name = "";
  S.log = [];
  S.heard = "";
  S.draft = null;
  S.current = null;
  el.nameInput.value = "";
  renderLog();
  go("login");
});

// ---------- page 2: greeting ----------
function showWelcome() {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  el.greeting.textContent = `Good ${part}, ${S.name}!`;
  go("welcome");
}
el.startBtn.addEventListener("click", () => go("languages"));

// ---------- page 3: languages ----------
function fillSelect(select, selectedCode) {
  LANGUAGES.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent =
      l.native === "English" ? l.name : `${l.name} (${l.native})`;
    opt.selected = l.code === selectedCode;
    select.appendChild(opt);
  });
}
fillSelect(el.patientLang, S.patient);
fillSelect(el.doctorLang, S.doctor);
function onLangChange() {
  S.patient = el.patientLang.value;
  S.doctor = el.doctorLang.value;
  el.sameLang.hidden = S.patient !== S.doctor;
}
el.patientLang.addEventListener("change", onLangChange);
el.doctorLang.addEventListener("change", onLangChange);
el.langNextBtn.addEventListener("click", () => {
  el.steps.classList.toggle("compact", S.log.length > 0);
  go("who");
});

// ---------- page 4: who are you ----------
document.querySelectorAll("[data-who]").forEach((btn) =>
  btn.addEventListener("click", () => {
    S.who = btn.dataset.who;
    document.body.dataset.speaker = S.who;
    newDraft();
    go("input");
  }),
);

// ---------- page 5: speak or write ----------
function newDraft() {
  const code = codeOf(S.who);
  const targetCode = codeOf(otherOf(S.who));
  S.draft = {
    speaker: S.who,
    code,
    langName: langOf(code).name,
    targetCode,
    targetName: langOf(targetCode).name,
  };
  S.heard = "";
  el.editBox.value = "";
  showOriginal("", "");
  note(el.notice, "");
  el.inputTitle.textContent = `${LABEL[S.who]} · ${S.draft.langName}`;
  S.engine = Recorder.engineFor(code);
  if (!S.engine) {
    el.tabSpeak.disabled = true;
    note(
      el.notice,
      "Speech recognition is not available in this browser, but you can still write. For speaking, use Google Chrome or Microsoft Edge.",
    );
    setMode("write");
  } else {
    setMode("speak");
  }
}

function setMode(mode) {
  S.mode = mode;
  el.tabSpeak.setAttribute("aria-selected", String(mode === "speak"));
  el.tabWrite.setAttribute("aria-selected", String(mode === "write"));
  el.speakPanel.hidden = mode !== "speak";
  el.micStatus.textContent = `Press the mic and speak in ${S.draft.langName}.`;
  el.engineNote.textContent =
    S.engine === "indic"
      ? "Speech engine: AI4Bharat IndicConformer"
      : S.engine === "browser"
        ? "Speech engine: this browser (Chrome or Edge)"
        : "";
  el.editBox.placeholder =
    mode === "speak"
      ? "Your words will appear here. You can fix mistakes before translating."
      : `Write your message in ${S.draft.langName}…`;
  syncInput();
}
el.tabSpeak.addEventListener("click", () => setMode("speak"));
el.tabWrite.addEventListener("click", () => {
  setMode("write");
  el.editBox.focus();
});

function showOriginal(finalPart, interimPart) {
  el.originalBox.textContent = "";
  el.originalBox.append(document.createTextNode(finalPart));
  if (interimPart) {
    const s = document.createElement("span");
    s.className = "interim";
    s.textContent = (finalPart ? " " : "") + interimPart;
    el.originalBox.appendChild(s);
  }
}

function startListening() {
  // Never silently throw away words that are already there.
  if (
    (S.heard || el.editBox.value.trim()) &&
    !confirm("Replace the current message with a new recording?")
  )
    return;
  S.heard = "";
  el.editBox.value = "";
  showOriginal("", "");
  note(el.notice, "");
  const started = Recorder.start(S.draft.code, {
    onText: (finalText, interim) => {
      S.heard = finalText;
      showOriginal(finalText, interim);
      syncInput();
    },
    onError: (err) => note(el.notice, ERROR_HELP[err] || err),
    onState: (state) => {
      if (state !== "transcribing") return;
      S.transcribing = true;
      el.micStatus.textContent =
        "Transcribing with IndicConformer… please wait.";
      syncInput();
    },
    onEnd: finishListening,
  });
  if (!started) {
    note(el.notice, "Could not start the microphone. Please try again.");
    return;
  }
  S.listening = true;
  el.micStatus.textContent =
    S.engine === "indic"
      ? `Recording in ${S.draft.langName}… press stop when you finish.`
      : `Listening in ${S.draft.langName}… speak now, then press stop.`;
  syncInput();
}

function finishListening() {
  S.listening = false;
  S.transcribing = false;
  showOriginal(S.heard, "");
  if (S.heard) {
    el.editBox.value = S.heard; // editable COPY; the original above is never changed
    el.micStatus.textContent =
      "Done. Check your message, fix mistakes if needed, then press Translate.";
  } else {
    el.micStatus.textContent = "Nothing was captured. Try again.";
  }
  syncInput();
}
el.micBtn.addEventListener("click", () =>
  S.listening ? Recorder.stop() : startListening(),
);

function syncInput() {
  const hasHeard = !!S.heard;
  const typed = el.editBox.value.trim();
  const edited = hasHeard && el.editBox.value !== S.heard;
  el.micBtn.setAttribute("aria-pressed", String(S.listening));
  el.micLabel.textContent = S.transcribing
    ? "Transcribing…"
    : S.listening
      ? "Stop recording"
      : "Start recording";
  el.micBtn.disabled = S.transcribing;
  el.originalBlock.hidden = !hasHeard && !S.listening;
  el.editBox.disabled = S.listening || (S.mode === "speak" && !hasHeard);
  el.editedBadge.hidden = !edited;
  el.restoreBtn.hidden = !hasHeard;
  el.restoreBtn.disabled = !edited || S.listening;
  el.playBtn.disabled = !typed || S.listening;
  el.translateBtn.disabled = !typed || S.listening || S.translating;
  el.translateBtn.textContent = S.translating ? "Translating…" : "Translate";
  el.translateBtn.classList.toggle("busy", S.translating);
  el.tabSpeak.disabled = S.listening || !S.engine;
  el.tabWrite.disabled = S.listening;
}
el.editBox.addEventListener("input", syncInput);
el.restoreBtn.addEventListener("click", () => {
  el.editBox.value = S.heard;
  syncInput();
});

function speak(text, code, noticeNode) {
  const r = AudioPlayer.speak(text, code);
  note(noticeNode, r.ok ? "" : r.reason);
}
el.playBtn.addEventListener("click", () =>
  speak(el.editBox.value.trim(), S.draft.code, el.notice),
);

el.translateBtn.addEventListener("click", async () => {
  const text = el.editBox.value.trim();
  if (!text) return;
  let tr = text;
  if (S.draft.code !== S.draft.targetCode) {
    S.translating = true;
    note(el.notice, "");
    syncInput();
    try {
      tr = await Translation.translate(text, S.draft.code, S.draft.targetCode);
    } catch (err) {
      S.translating = false;
      note(
        el.notice,
        err.message + " Your message is safe, so you can try again.",
      );
      syncInput();
      return;
    }
    S.translating = false;
    syncInput();
  }
  S.current = {
    ...S.draft,
    text,
    heard: S.heard,
    wasEdited: !!S.heard && text !== S.heard,
    tr,
  };
  showResult();
});

// ---------- page 6: translation in both languages ----------
function showResult() {
  const c = S.current;
  const other = otherOf(c.speaker);
  note(el.resultNotice, "");
  el.origCard.dataset.who = c.speaker;
  el.origCap.textContent = `${LABEL[c.speaker]} said · ${c.langName}`;
  el.origText.textContent = c.text;
  const sameLang = c.code === c.targetCode;
  el.origNote.hidden = !(c.wasEdited || sameLang);
  el.origNote.textContent = c.wasEdited
    ? `Edited. Original as heard: ${c.heard}`
    : "Both languages are the same, so the text was not changed.";
  el.trCard.dataset.who = other;
  el.trCap.textContent = `${LABEL[other]} reads · ${c.targetName}`;
  el.trText.textContent = c.tr;
  // replay the little entrance animation each time
  [el.origCard, el.trCard].forEach((n) => {
    n.style.animation = "none";
    void n.offsetWidth;
    n.style.animation = "";
  });
  go("result");
}
el.playOrigBtn.addEventListener("click", () =>
  speak(S.current.text, S.current.code, el.resultNotice),
);
el.playTrBtn.addEventListener("click", () =>
  speak(S.current.tr, S.current.targetCode, el.resultNotice),
);
el.editAgainBtn.addEventListener("click", () => go("input"));
el.saveBtn.addEventListener("click", () => {
  S.log.push(S.current);
  S.current = null;
  renderLog();
  el.steps.classList.add("compact");
  go("who");
});

// ---------- conversation list ----------
function renderLog() {
  el.log.textContent = "";
  S.log.forEach((m) => {
    const li = document.createElement("li");
    li.className = `msg ${m.speaker}`;
    const add = (cls, text) => {
      const d = document.createElement("div");
      d.className = cls;
      d.textContent = text;
      li.appendChild(d);
    };
    add(
      "who",
      `${LABEL[m.speaker]} · ${m.langName}${m.wasEdited ? " · edited" : ""}`,
    );
    add("text", m.text);
    if (m.wasEdited) add("orig", `Original as heard: ${m.heard}`);
    if (m.code !== m.targetCode) {
      add("tr", `Translation (${m.targetName}): ${m.tr}`);
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn ghost play";
      b.textContent = "Play translation";
      b.addEventListener("click", () =>
        speak(m.tr, m.targetCode, el.logNotice),
      );
      li.appendChild(b);
    }
    el.log.appendChild(li);
  });
  el.logCard.hidden = !S.log.length;
}

// ---------- start-up ----------
(function init() {
  Translation.config().then((cfg) => Recorder.configure(cfg && cfg.asr)); // which speech engine is ready
  let saved = "";
  try {
    saved = sessionStorage.getItem("medivaani-name") || "";
  } catch (_) {}
  if (saved) {
    S.name = saved;
    showWelcome();
  } else {
    go("login");
  }
})();
