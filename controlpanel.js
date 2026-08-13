(() => {
  "use strict";

  const HARD_DEFAULTS = Object.freeze({
    rainOpacity: 20,
    rainIntensity: 45,
    accent: "afterglow",
    interfaceSound: "soft",
    iconSpacing: "normal",
    autoArrange: false,
    clockFormat: "12"
  });
  const SPACING_CHOICES = Object.freeze([
    { id:"compact", label:"Compact", detail:"Fit more icons on the desktop", sample:"64 px" },
    { id:"normal", label:"Normal", detail:"Classic Afterglow spacing", sample:"72 px" },
    { id:"roomy", label:"Roomy", detail:"More breathing room for labels", sample:"84 px" }
  ]);
  const SOUND_CHOICES = Object.freeze([
    { id:"soft", label:"Soft", detail:"Quiet glassy taps", glyph:"♪" },
    { id:"classic", label:"Classic", detail:"Bright desktop beeps", glyph:"▣" },
    { id:"off", label:"Off", detail:"No interface sounds", glyph:"×" }
  ]);
  const PAGE_INFO = Object.freeze({
    appearance:{ label:"Appearance", subtitle:"Wallpaper and accent colors", glyph:"▧" },
    rain:{ label:"Rain & motion", subtitle:"Atmosphere and animation", glyph:"⋰" },
    sounds:{ label:"Sounds", subtitle:"Interface sound scheme", glyph:"♫" },
    icons:{ label:"Desktop icons", subtitle:"Spacing and arrangement", glyph:"▦" },
    time:{ label:"Date & time", subtitle:"Taskbar clock format", glyph:"◷" }
  });

  const clone = value => {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, Number(value) || 0));
  const stableStringify = value => JSON.stringify(value, (_key, nested) => {
    if (!nested || Array.isArray(nested) || typeof nested !== "object") return nested;
    return Object.keys(nested).sort().reduce((result, key) => { result[key] = nested[key];return result; }, {});
  });
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
  const accentColor = accent => {
    if (typeof accent === "string") return accent;
    if (!accent || typeof accent !== "object") return "#df7379";
    return accent.preview || accent.color || accent.primary || accent.accent || accent.rust || accent["--rust"] || "#df7379";
  };
  const accentSecondary = accent => {
    if (!accent || typeof accent !== "object") return "#315b61";
    return accent.secondary || accent.dark || accent.sageDark || accent["--sage-dark"] || accentColor(accent);
  };
  const accentLabel = (key, accent) => {
    if (accent && typeof accent === "object" && accent.label) return accent.label;
    return String(key).replace(/[-_]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
  };

  function createAfterglowControlPanel(options = {}) {
    const photos = Array.isArray(options.photos) ? options.photos.filter(photo => photo && photo.src) : [];
    const accents = options.accents && typeof options.accents === "object" ? options.accents : {};
    const accentKeys = Object.keys(accents);
    const suppliedDefaults = options.defaults && typeof options.defaults === "object" ? options.defaults : {};
    const rawDefaultSettings = suppliedDefaults.settings && typeof suppliedDefaults.settings === "object" ? suppliedDefaults.settings : suppliedDefaults;
    const defaultSettingsSource = { ...rawDefaultSettings };
    if (!suppliedDefaults.settings) delete defaultSettingsSource.wallpaper;
    const defaultWallpaper = suppliedDefaults.wallpaper || options.defaultWallpaper || photos[0]?.src || options.wallpaper || "";

    function normalizeSettings(source = {}, fallback = HARD_DEFAULTS) {
      const selectedAccent = source.accent ?? fallback.accent;
      const accent = accentKeys.length && !accentKeys.includes(selectedAccent)
        ? (accentKeys.includes(fallback.accent) ? fallback.accent : accentKeys[0])
        : selectedAccent;
      return {
        ...source,
        rainOpacity:Math.round(clamp(source.rainOpacity ?? fallback.rainOpacity, 0, 60)),
        rainIntensity:Math.round(clamp(source.rainIntensity ?? fallback.rainIntensity, 0, 100)),
        accent,
        interfaceSound:["soft","classic","off"].includes(source.interfaceSound) ? source.interfaceSound : fallback.interfaceSound,
        iconSpacing:["compact","normal","roomy"].includes(source.iconSpacing) ? source.iconSpacing : fallback.iconSpacing,
        autoArrange:Boolean(source.autoArrange ?? fallback.autoArrange),
        clockFormat:String(source.clockFormat ?? fallback.clockFormat) === "24" ? "24" : "12"
      };
    }

    const normalizedDefaults = normalizeSettings(defaultSettingsSource, HARD_DEFAULTS);
    let draft = normalizeSettings(options.settings || {}, normalizedDefaults);
    let wallpaper = photos.some(photo => photo.src === options.wallpaper) ? options.wallpaper : (options.wallpaper || defaultWallpaper);
    let baseline = { settings:clone(draft), wallpaper };
    let page = "appearance";
    let clockTimer = 0;
    let destroyed = false;

    const root = document.createElement("section");
    root.className = "control-panel-app";
    root.tabIndex = -1;
    root.setAttribute("aria-label", "Afterglow Control Panel");
    root.innerHTML = `
      <header class="cp-header">
        <div class="cp-header-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <div><span>AFTERGLOW SYSTEMS</span><strong>Control Panel</strong><small>Make this desktop feel like yours.</small></div>
        <p data-cp-status>All changes are saved</p>
      </header>
      <div class="cp-workspace">
        <nav class="cp-categories" aria-label="Control Panel categories" role="tablist">
          ${Object.entries(PAGE_INFO).map(([id, info], index) => `<button id="cp-tab-${id}" type="button" role="tab" data-cp-page="${id}" aria-controls="cp-panel-${id}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}"><i aria-hidden="true">${info.glyph}</i><span><b>${info.label}</b><small>${info.subtitle}</small></span><em aria-hidden="true">›</em></button>`).join("")}
          <div class="cp-session-card"><i aria-hidden="true"></i><span><b>LOCAL SETTINGS</b><small>Saved in this browser</small></span></div>
        </nav>
        <main class="cp-pages">
          <section id="cp-panel-appearance" class="cp-page" data-cp-panel="appearance" role="tabpanel" aria-labelledby="cp-tab-appearance">
            <div class="cp-page-heading"><span>01</span><div><h2>Appearance</h2><p>Choose a rainy motel view and an interface accent.</p></div></div>
            <div class="cp-wallpaper-current"><div class="cp-monitor"><div><img data-cp-current-wallpaper alt="Selected desktop wallpaper preview"><span class="cp-preview-rain" aria-hidden="true"></span><b>AFTERGLOW</b></div><i></i></div><div><span>DESKTOP PREVIEW</span><strong data-cp-wallpaper-name>Wallpaper</strong><p data-cp-wallpaper-caption></p><small data-cp-wallpaper-location></small></div></div>
            <fieldset class="cp-fieldset cp-wallpaper-fieldset"><legend>Rainy motel wallpapers</legend><div class="cp-wallpaper-grid" data-cp-wallpapers></div></fieldset>
            <fieldset class="cp-fieldset"><legend>Window accent</legend><div class="cp-accent-grid" data-cp-accents></div></fieldset>
          </section>
          <section id="cp-panel-rain" class="cp-page hidden" data-cp-panel="rain" role="tabpanel" aria-labelledby="cp-tab-rain">
            <div class="cp-page-heading"><span>02</span><div><h2>Rain &amp; motion</h2><p>Dial in the rain without hiding the view.</p></div></div>
            <div class="cp-atmosphere-card">
              <div class="cp-rain-preview" aria-hidden="true"><img data-cp-rain-wallpaper alt=""><i></i><span>LIVE ATMOSPHERE PREVIEW</span></div>
              <div class="cp-rain-readout"><span>RAIN PROFILE</span><strong data-cp-rain-profile>Misty drizzle</strong><p data-cp-rain-description>A light layer of rain with gentle motion.</p></div>
            </div>
            <div class="cp-slider-card">
              <label for="cp-rain-opacity"><span><b>Rain opacity</b><small>How visible the rain layer is</small></span><output data-cp-opacity-output>20%</output></label>
              <input id="cp-rain-opacity" data-cp-setting="rainOpacity" type="range" min="0" max="60" step="1" aria-describedby="cp-opacity-scale">
              <div id="cp-opacity-scale" class="cp-range-scale"><span>Clear</span><span>Visible</span><span>Soaked glass</span></div>
            </div>
            <div class="cp-slider-card">
              <label for="cp-rain-intensity"><span><b>Animation intensity</b><small>Added drift and visual energy around the rain loop</small></span><output data-cp-intensity-output>45%</output></label>
              <input id="cp-rain-intensity" data-cp-setting="rainIntensity" type="range" min="0" max="100" step="1" aria-describedby="cp-intensity-scale">
              <div id="cp-intensity-scale" class="cp-range-scale"><span>Gentle</span><span>Drifting</span><span>Downpour</span></div>
            </div>
            <p class="cp-info-note"><i aria-hidden="true">i</i><span>Lower motion settings reduce the added screen drift. At zero, the base rain loop stays visible without extra layer movement.</span></p>
          </section>
          <section id="cp-panel-sounds" class="cp-page hidden" data-cp-panel="sounds" role="tabpanel" aria-labelledby="cp-tab-sounds">
            <div class="cp-page-heading"><span>03</span><div><h2>Sounds</h2><p>Select the small sounds used by windows and buttons.</p></div></div>
            <fieldset class="cp-fieldset"><legend>Interface sound scheme</legend><div class="cp-choice-grid cp-sound-grid" data-cp-sounds></div></fieldset>
            <div class="cp-sound-console">
              <div class="cp-speaker" aria-hidden="true"><i></i><span></span><span></span><span></span></div>
              <div><span>PREVIEW CHANNEL</span><strong data-cp-sound-title>Soft interface</strong><p data-cp-sound-detail>Quiet glassy taps for menus, dialogs, and windows.</p></div>
              <button type="button" data-cp-test-sound>Test sound</button>
            </div>
            <p class="cp-info-note"><i aria-hidden="true">i</i><span>This setting controls interface effects only. Cassette volume and individual game sounds stay independent.</span></p>
          </section>
          <section id="cp-panel-icons" class="cp-page hidden" data-cp-panel="icons" role="tabpanel" aria-labelledby="cp-tab-icons">
            <div class="cp-page-heading"><span>04</span><div><h2>Desktop icons</h2><p>Choose a comfortable grid and how icons settle into it.</p></div></div>
            <fieldset class="cp-fieldset"><legend>Icon spacing</legend><div class="cp-choice-grid cp-spacing-grid" data-cp-spacing></div></fieldset>
            <div class="cp-icon-preview" data-cp-icon-preview aria-label="Icon spacing preview"><div>${miniIcon("folder", "Journal")}${miniIcon("document", "notes.txt")}${miniIcon("game", "Night Mines")}</div><span>SPACING PREVIEW</span></div>
            <label class="cp-toggle-card"><span class="cp-toggle"><input type="checkbox" data-cp-setting="autoArrange"><i aria-hidden="true"></i></span><span><b>Automatically arrange desktop icons</b><small>Keep icons packed into tidy columns. Folder and Recycle Bin drops still work normally.</small></span><em data-cp-auto-state>Off</em></label>
          </section>
          <section id="cp-panel-time" class="cp-page hidden" data-cp-panel="time" role="tabpanel" aria-labelledby="cp-tab-time">
            <div class="cp-page-heading"><span>05</span><div><h2>Date &amp; time</h2><p>Set how time appears in the taskbar and calendar.</p></div></div>
            <div class="cp-clock-stage"><div class="cp-clock-face"><span data-cp-clock-live>11:42 PM</span><small data-cp-date-live>Rainy evening</small><i></i></div><div><span>LIVE LOCAL TIME</span><strong data-cp-time-zone>Local time zone</strong><p>The clock uses the time and date supplied by this device.</p></div></div>
            <fieldset class="cp-fieldset"><legend>Clock format</legend><div class="cp-choice-grid cp-clock-options">
              <button type="button" data-cp-clock="12" aria-pressed="false"><i>11:42 <small>PM</small></i><span><b>12-hour clock</b><small>Show AM and PM</small></span><em aria-hidden="true"></em></button>
              <button type="button" data-cp-clock="24" aria-pressed="false"><i>23:42</i><span><b>24-hour clock</b><small>Use a leading zero</small></span><em aria-hidden="true"></em></button>
            </div></fieldset>
            <div class="cp-taskbar-sample"><button type="button" tabindex="-1">afterglow</button><span></span><time data-cp-taskbar-time></time></div>
          </section>
        </main>
      </div>
      <footer class="cp-actions">
        <span data-cp-dirty-dot aria-hidden="true"></span><p data-cp-footer-status>Settings are up to date.</p>
        <button type="button" data-cp-restore>Restore defaults</button><i></i>
        <button type="button" data-cp-cancel>Cancel</button>
        <button type="button" data-cp-apply>Apply</button>
        <button type="button" class="primary" data-cp-ok>OK</button>
      </footer>`;

    function miniIcon(type, label) {
      const glyph = type === "folder" ? "▰" : type === "game" ? "✦" : "▤";
      return `<span class="cp-mini-icon"><i aria-hidden="true" data-type="${type}">${glyph}</i><b>${escapeHtml(label)}</b></span>`;
    }

    const currentWallpaperImage = root.querySelector("[data-cp-current-wallpaper]");
    const rainWallpaperImage = root.querySelector("[data-cp-rain-wallpaper]");
    const previewRain = root.querySelector(".cp-preview-rain");
    const rainPreview = root.querySelector(".cp-rain-preview");
    const applyButton = root.querySelector("[data-cp-apply]");
    const status = root.querySelector("[data-cp-status]");
    const footerStatus = root.querySelector("[data-cp-footer-status]");
    const dirtyDot = root.querySelector("[data-cp-dirty-dot]");

    function selectedPhoto() {
      return photos.find(photo => photo.src === wallpaper) || photos[0] || { src:wallpaper, name:"Desktop wallpaper", caption:"Your selected desktop background.", location:"AFTERGLOW ARCHIVE" };
    }

    function isDirty() {
      return stableStringify({ settings:draft, wallpaper }) !== stableStringify(baseline);
    }

    function localAccent() {
      const selected = accents[draft.accent];
      root.style.setProperty("--cp-accent", accentColor(selected));
      root.style.setProperty("--cp-accent-dark", accentSecondary(selected));
    }

    function renderWallpaperChoices() {
      const container = root.querySelector("[data-cp-wallpapers]");
      container.innerHTML = "";
      photos.forEach((photo, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cp-wallpaper-option";
        button.dataset.wallpaper = photo.src;
        button.setAttribute("aria-pressed", String(photo.src === wallpaper));
        button.setAttribute("aria-label", `Use ${photo.name || `wallpaper ${index + 1}`}`);
        const image = document.createElement("img");
        image.src = photo.src;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => button.classList.add("image-error"));
        const check = document.createElement("i");check.setAttribute("aria-hidden", "true");check.textContent = "✓";
        const label = document.createElement("span");label.textContent = photo.name || `Wallpaper ${index + 1}`;
        button.append(image, check, label);
        button.addEventListener("click", () => { wallpaper = photo.src;previewChange(); });
        container.append(button);
      });
      if (!photos.length) container.innerHTML = `<p class="cp-empty">No wallpaper photos are available.</p>`;
    }

    function renderAccentChoices() {
      const container = root.querySelector("[data-cp-accents]");
      container.innerHTML = "";
      accentKeys.forEach(key => {
        const value = accents[key];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cp-accent-option";
        button.dataset.accent = key;
        button.style.setProperty("--swatch", accentColor(value));
        button.style.setProperty("--swatch-dark", accentSecondary(value));
        button.setAttribute("aria-pressed", String(key === draft.accent));
        button.innerHTML = `<i aria-hidden="true"><span></span></i><b>${escapeHtml(accentLabel(key, value))}</b><em aria-hidden="true">✓</em>`;
        button.addEventListener("click", () => { draft.accent = key;previewChange(); });
        container.append(button);
      });
      if (!accentKeys.length) container.innerHTML = `<p class="cp-empty">The current Afterglow accent is active.</p>`;
    }

    function renderSoundChoices() {
      const container = root.querySelector("[data-cp-sounds]");
      container.innerHTML = "";
      SOUND_CHOICES.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.sound = choice.id;
        button.setAttribute("aria-pressed", String(choice.id === draft.interfaceSound));
        button.innerHTML = `<i aria-hidden="true">${choice.glyph}</i><span><b>${choice.label}</b><small>${choice.detail}</small></span><em aria-hidden="true"></em>`;
        button.addEventListener("click", () => {
          draft.interfaceSound = choice.id;
          previewChange();
          if (choice.id !== "off") options.onSoundPreview?.(choice.id);
        });
        container.append(button);
      });
    }

    function renderSpacingChoices() {
      const container = root.querySelector("[data-cp-spacing]");
      container.innerHTML = "";
      SPACING_CHOICES.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.spacing = choice.id;
        button.setAttribute("aria-pressed", String(choice.id === draft.iconSpacing));
        button.innerHTML = `<i aria-hidden="true"><b></b><b></b><b></b></i><span><b>${choice.label}</b><small>${choice.detail}</small></span><em>${choice.sample}</em>`;
        button.addEventListener("click", () => { draft.iconSpacing = choice.id;previewChange(); });
        container.append(button);
      });
    }

    function rainProfile() {
      if (!draft.rainOpacity) return ["Clear night", "The rain layer is hidden while the motel stays in view."];
      if (!draft.rainIntensity) return ["Quiet rain", "The base rain loop remains visible without extra screen drift."];
      const force = draft.rainOpacity * .85 + draft.rainIntensity * .45;
      if (force < 30) return ["Misty drizzle", "A light layer of rain with gentle motion."];
      if (force < 57) return ["Lake shower", "Steady rain moving softly across the motel lights."];
      if (force < 82) return ["Midnight rain", "A vivid rainy-night atmosphere with active motion."];
      return ["Neon downpour", "Heavy animated rain glowing against the motel sign."];
    }

    function formatTime(now, seconds = false) {
      const options = { hour:"2-digit", minute:"2-digit", ...(seconds ? { second:"2-digit" } : {}) };
      if (draft.clockFormat === "24") options.hourCycle = "h23";
      else options.hour12 = true;
      return now.toLocaleTimeString([], options);
    }

    function updateClock() {
      const now = new Date();
      root.querySelector("[data-cp-clock-live]").textContent = formatTime(now, true);
      root.querySelector("[data-cp-date-live]").textContent = now.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" });
      root.querySelector("[data-cp-taskbar-time]").textContent = `${formatTime(now)}\n${now.toLocaleDateString([], { month:"short", day:"numeric" })}`;
      let zone = "Local time zone";
      try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, " "); } catch (_) { /* keep fallback */ }
      root.querySelector("[data-cp-time-zone]").textContent = zone;
    }

    function syncInterface() {
      if (destroyed) return;
      localAccent();
      const photo = selectedPhoto();
      currentWallpaperImage.src = photo.src || "";
      rainWallpaperImage.src = photo.src || "";
      root.querySelector("[data-cp-wallpaper-name]").textContent = photo.name || "Desktop wallpaper";
      root.querySelector("[data-cp-wallpaper-caption]").textContent = photo.caption || "Your selected desktop background.";
      root.querySelector("[data-cp-wallpaper-location]").textContent = photo.location || "AFTERGLOW ARCHIVE";
      root.querySelectorAll("[data-wallpaper]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.wallpaper === wallpaper)));
      root.querySelectorAll("[data-accent]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.accent === draft.accent)));
      root.querySelectorAll("[data-sound]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.sound === draft.interfaceSound)));
      root.querySelectorAll("[data-spacing]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.spacing === draft.iconSpacing)));
      root.querySelectorAll("[data-cp-clock]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.cpClock === draft.clockFormat)));

      const opacityInput = root.querySelector('[data-cp-setting="rainOpacity"]');
      const intensityInput = root.querySelector('[data-cp-setting="rainIntensity"]');
      const arrangeInput = root.querySelector('[data-cp-setting="autoArrange"]');
      opacityInput.value = String(draft.rainOpacity);
      intensityInput.value = String(draft.rainIntensity);
      arrangeInput.checked = draft.autoArrange;
      root.querySelector("[data-cp-opacity-output]").value = `${draft.rainOpacity}%`;
      root.querySelector("[data-cp-intensity-output]").value = `${draft.rainIntensity}%`;
      root.querySelector("[data-cp-auto-state]").textContent = draft.autoArrange ? "On" : "Off";
      root.querySelector("[data-cp-icon-preview]").dataset.spacing = draft.iconSpacing;
      root.querySelector("[data-cp-test-sound]").disabled = draft.interfaceSound === "off";
      const sound = SOUND_CHOICES.find(choice => choice.id === draft.interfaceSound) || SOUND_CHOICES[0];
      root.querySelector("[data-cp-sound-title]").textContent = `${sound.label} interface`;
      root.querySelector("[data-cp-sound-detail]").textContent = sound.id === "off" ? "Window, menu, and button effects are muted." : `${sound.detail} for menus, dialogs, and windows.`;
      const profile = rainProfile();
      root.querySelector("[data-cp-rain-profile]").textContent = profile[0];
      root.querySelector("[data-cp-rain-description]").textContent = profile[1];
      previewRain.style.opacity = String(draft.rainOpacity / 100);
      previewRain.style.setProperty("--cp-rain-speed", `${Math.max(2.8, 18 - draft.rainIntensity * .145)}s`);
      previewRain.classList.toggle("still", draft.rainIntensity === 0);
      rainPreview.style.setProperty("--cp-rain-opacity", String(draft.rainOpacity / 100));
      rainPreview.style.setProperty("--cp-rain-speed", `${Math.max(2.8, 18 - draft.rainIntensity * .145)}s`);
      rainPreview.classList.toggle("still", draft.rainIntensity === 0);
      updateClock();

      const dirty = isDirty();
      root.classList.toggle("has-unsaved-changes", dirty);
      applyButton.disabled = !dirty;
      status.textContent = dirty ? "Unsaved changes" : "All changes are saved";
      footerStatus.textContent = dirty ? "You have changes waiting to be applied." : "Settings are up to date.";
      dirtyDot.setAttribute("aria-label", dirty ? "Unsaved changes" : "No unsaved changes");
    }

    function previewChange() {
      syncInterface();
      options.onPreview?.({ settings:clone(draft), wallpaper });
    }

    function activatePage(nextPage, focusTab = false) {
      if (!PAGE_INFO[nextPage]) return;
      page = nextPage;
      root.querySelectorAll("[data-cp-page]").forEach(button => {
        const selected = button.dataset.cpPage === page;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      root.querySelectorAll("[data-cp-panel]").forEach(panel => panel.classList.toggle("hidden", panel.dataset.cpPanel !== page));
      if (focusTab) root.querySelector(`[data-cp-page="${page}"]`)?.focus();
    }

    function applyChanges() {
      if (!isDirty()) return false;
      options.onApply?.({ settings:clone(draft), wallpaper });
      baseline = { settings:clone(draft), wallpaper };
      syncInterface();
      return true;
    }

    function cancelChanges() {
      if (!isDirty()) return false;
      draft = clone(baseline.settings);
      wallpaper = baseline.wallpaper;
      options.onCancel?.();
      syncInterface();
      return true;
    }

    renderWallpaperChoices();
    renderAccentChoices();
    renderSoundChoices();
    renderSpacingChoices();
    activatePage(page);
    syncInterface();
    clockTimer = window.setInterval(updateClock, 1000);

    root.querySelectorAll("[data-cp-page]").forEach(button => button.addEventListener("click", () => activatePage(button.dataset.cpPage)));
    root.querySelector(".cp-categories").addEventListener("keydown", event => {
      if (!["ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const pages = Object.keys(PAGE_INFO);
      let index = pages.indexOf(page);
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = pages.length - 1;
      else index = (index + (event.key === "ArrowDown" ? 1 : -1) + pages.length) % pages.length;
      activatePage(pages[index], true);
    });
    root.querySelector('[data-cp-setting="rainOpacity"]').addEventListener("input", event => { draft.rainOpacity = Math.round(clamp(event.target.value, 0, 60));previewChange(); });
    root.querySelector('[data-cp-setting="rainIntensity"]').addEventListener("input", event => { draft.rainIntensity = Math.round(clamp(event.target.value, 0, 100));previewChange(); });
    root.querySelector('[data-cp-setting="autoArrange"]').addEventListener("change", event => { draft.autoArrange = event.target.checked;previewChange(); });
    root.querySelectorAll("[data-cp-clock]").forEach(button => button.addEventListener("click", () => { draft.clockFormat = button.dataset.cpClock;previewChange(); }));
    root.querySelector("[data-cp-test-sound]").addEventListener("click", () => { if (draft.interfaceSound !== "off") options.onSoundPreview?.(draft.interfaceSound); });
    root.querySelector("[data-cp-restore]").addEventListener("click", () => {
      draft = normalizeSettings(normalizedDefaults, HARD_DEFAULTS);
      wallpaper = defaultWallpaper;
      previewChange();
      root.querySelector("[data-cp-restore]").focus();
    });
    applyButton.addEventListener("click", applyChanges);
    root.querySelector("[data-cp-ok]").addEventListener("click", () => { applyChanges();options.onRequestClose?.("ok"); });
    root.querySelector("[data-cp-cancel]").addEventListener("click", () => { cancelChanges();options.onRequestClose?.("cancel"); });
    root.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault();cancelChanges();options.onRequestClose?.("cancel"); }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault();applyChanges(); }
    });

    return {
      element:root,
      focus() { if (!destroyed) (root.querySelector(`[data-cp-page="${page}"]`) || root).focus(); },
      destroy() { destroyed = true;window.clearInterval(clockTimer); }
    };
  }

  window.createAfterglowControlPanel = createAfterglowControlPanel;
})();
