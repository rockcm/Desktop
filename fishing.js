(() => {
  "use strict";

  const STORAGE_KEY = "afterglow-fishing-v1";
  const FISH = [
    { id:"perch", name:"Rain Perch", rarity:"Common", challenge:.08, color:"#d8b36e", accent:"#7e9e96", belly:"#ead9aa", min:.35, max:1.25, chance:34, fight:.72, points:90, shape:"round", description:"A small golden lake fish that feeds close to the rain-broken surface.", habitat:"Shallow reeds", tip:"Rain Moth" },
    { id:"bluegill", name:"Bluegill", rarity:"Common", challenge:.2, color:"#7fa9ad", accent:"#e0bb71", belly:"#c7d7cf", min:.45, max:1.6, chance:28, fight:.82, points:115, shape:"round", description:"A lively blue-green fish with a bright amber breast and a stubborn pull.", habitat:"Motel shoreline", tip:"Rain Moth" },
    { id:"trout", name:"Silver Trout", rarity:"Uncommon", challenge:.42, color:"#c5d3cc", accent:"#df7d82", belly:"#eef0e8", min:1.1, max:3.8, chance:19, fight:1.02, points:180, shape:"sleek", description:"Fast, reflective and easiest to spot when neon crosses the water.", habitat:"Open water", tip:"Silver Minnow" },
    { id:"char", name:"Lake Char", rarity:"Rare", challenge:.64, color:"#547c77", accent:"#e19a66", belly:"#a9c0b6", min:2.2, max:6.4, chance:11, fight:1.2, points:280, shape:"sleek", description:"A deep-water hunter marked by ember-orange fins and powerful runs.", habitat:"Cold lake shelf", tip:"Silver Minnow" },
    { id:"pike", name:"Neon Pike", rarity:"Rare", challenge:.82, color:"#83a98d", accent:"#ee7a82", belly:"#c8d8bf", min:3.5, max:9.2, chance:6, fight:1.38, points:420, shape:"long", description:"Long, quick and striped like the motel sign reflected after midnight.", habitat:"Pine-shadow bank", tip:"Neon Spinner" },
    { id:"koi", name:"Midnight Koi", rarity:"Legendary", challenge:1, color:"#e47a80", accent:"#f0c47e", belly:"#f2d3b0", min:5.5, max:12.5, chance:2, fight:1.58, points:850, shape:"koi", description:"A rumored old koi whose scales glow coral beneath the rain.", habitat:"Unknown depths", tip:"Neon Spinner" }
  ];
  const LURES = [
    { id:"moth", name:"Rain Moth", label:"MOTH", bite:.76, rare:0, fight:.96, note:"Quick bites, gentle fights" },
    { id:"minnow", name:"Silver Minnow", label:"MINNOW", bite:1, rare:.13, fight:1, note:"Balanced lake lure" },
    { id:"spinner", name:"Neon Spinner", label:"SPINNER", bite:1.2, rare:.32, fight:1.1, note:"Rare fish, harder fights" }
  ];

  window.createAfterglowFishing = function createAfterglowFishing() {
    const root = document.createElement("section");
    root.className = "fishing-app";
    root.tabIndex = 0;
    root.setAttribute("aria-label", "Rainy Lake Fishing game");
    root.innerHTML = `
      <div class="fish-menubar">
        <button type="button" data-fish-new><u>G</u>ame</button>
        <button type="button" data-fish-help><u>H</u>ow to play</button>
        <button type="button" data-fish-collection><u>C</u>ollection</button>
        <span class="fish-menu-divider"></span>
        <span class="fish-menu-title">AFTERGLOW RECREATION DEPT. / LAKE 01</span>
      </div>
      <div class="fish-workspace">
        <main class="fish-game-pane">
          <div class="fish-scene-frame">
            <canvas class="fish-canvas" width="960" height="540" aria-label="Rainy motel lake fishing scene"></canvas>
            <div class="fish-weather"><i></i><span>STEADY RAIN</span><b>52&deg;F</b></div>
            <div class="fish-catch-card hidden" data-fish-catch-card>
              <span class="fish-catch-kicker">CAUGHT AT AFTERGLOW LAKE</span>
              <canvas class="fish-catch-canvas" width="260" height="104" data-fish-catch-canvas></canvas>
              <strong data-fish-catch-name>Rain Perch</strong>
              <div><b data-fish-catch-weight>0.00 lb</b><span data-fish-catch-rarity>Common</span></div>
              <small data-fish-catch-points>+000 points</small>
              <div class="fish-catch-actions"><button type="button" data-fish-view-catch>View specimen</button><button type="button" data-fish-cast-again>Cast again</button></div>
            </div>
            <div class="fish-help-card hidden" data-fish-help-card>
              <button type="button" aria-label="Close instructions" data-fish-help-close>&times;</button>
              <span>FIELD GUIDE / LAKE 01</span>
              <h2>Fishing after dark</h2>
              <ol>
                <li><b>Hold</b> Space or the action button to charge your cast.</li>
                <li><b>Release</b> to send the bobber across the lake.</li>
                <li>When it dips, <b>press quickly</b> to set the hook.</li>
                <li><b>Hold and release</b> while reeling. Keep tension inside the green band.</li>
                <li>Better fish have a <b>narrower safe band</b>, longer fights and violent surges. Red snaps the line; zero tension loses the fish.</li>
              </ol>
              <p>Long casts and specialized lures improve rare catches. Open Collection to inspect every recorded fish.</p>
            </div>
            <div class="fish-gallery hidden" data-fish-gallery>
              <header><div><span>AFTERGLOW LAKE ARCHIVE</span><strong data-gallery-title>Lake Journal</strong></div><button type="button" data-gallery-close aria-label="Close collection">&times;</button></header>
              <div class="fish-gallery-stage"><canvas width="520" height="260" data-gallery-canvas></canvas><span data-gallery-locked>Catch this fish to reveal its specimen.</span></div>
              <div class="fish-gallery-copy">
                <div><span>SPECIES</span><strong data-gallery-name>Unknown specimen</strong><small data-gallery-rarity>UNDISCOVERED</small></div>
                <div class="fish-gallery-records"><p><span>BEST</span><b data-gallery-best>&mdash;</b></p><p><span>CAUGHT</span><b data-gallery-count>0</b></p><p><span>HABITAT</span><b data-gallery-habitat>&mdash;</b></p></div>
                <p data-gallery-description>The lake journal has no entry for this fish yet.</p>
                <small data-gallery-tip></small>
              </div>
              <footer><button type="button" data-gallery-prev>&larr; Previous</button><b data-gallery-position>1 / ${FISH.length}</b><button type="button" data-gallery-next>Next &rarr;</button></footer>
            </div>
          </div>
          <div class="fish-control-deck">
            <div class="fish-status-copy">
              <span data-fish-phase>ON THE SHORE</span>
              <strong data-fish-status>Hold to charge your cast.</strong>
            </div>
            <div class="fish-meter-block">
              <div><span data-fish-meter-label>CAST POWER</span><b data-fish-meter-value>0%</b></div>
              <div class="fish-meter"><span class="fish-safe-zone"></span><i data-fish-meter></i><em></em></div>
              <small class="fish-reel-progress"><i data-fish-progress></i></small>
            </div>
            <button type="button" class="fish-action" data-fish-action><span>HOLD TO CAST</span><small>SPACE</small></button>
          </div>
        </main>
        <aside class="fish-sidebar">
          <div class="fish-brand"><span>AFTERGLOW MOTOR LODGE</span><strong>LAKE<br>FISHING</strong><small>RAIN OR SHINE &middot; OPEN ALL NIGHT</small></div>
          <div class="fish-stat-grid">
            <div><span>SCORE</span><strong data-fish-score>000000</strong></div>
            <div><span>CAUGHT</span><strong data-fish-count>00</strong></div>
            <div><span>STREAK</span><strong data-fish-streak>x1</strong></div>
          </div>
          <div class="fish-best">
            <span>PERSONAL BEST</span>
            <strong data-fish-best>&mdash;</strong>
            <small data-fish-best-species>No catches yet</small>
          </div>
          <div class="fish-lures"><header><span>TACKLE BOX</span><b data-fish-lure-name>Rain Moth</b></header><div>${LURES.map((lure,index)=>`<button type="button" class="${index===0?"active":""}" data-fish-lure="${lure.id}" title="${lure.note}"><i></i><span>${lure.label}</span></button>`).join("")}</div></div>
          <div class="fish-journal">
            <header><span>LAKE JOURNAL</span><b data-fish-journal-count>0 / ${FISH.length}</b></header>
            <div data-fish-journal></div>
          </div>
          <button type="button" class="fish-sound" data-fish-sound aria-pressed="true">Sound: on</button>
          <div class="fish-tip"><b>SPACE / HOLD</b> cast or reel<br><b>SPACE / TAP</b> set the hook<br><b>C</b> collection &nbsp; <b>N</b> new session</div>
        </aside>
      </div>`;

    const canvas = root.querySelector(".fish-canvas");
    const context = canvas.getContext("2d");
    const actionButton = root.querySelector("[data-fish-action]");
    const phaseElement = root.querySelector("[data-fish-phase]");
    const statusElement = root.querySelector("[data-fish-status]");
    const meterLabel = root.querySelector("[data-fish-meter-label]");
    const meterValue = root.querySelector("[data-fish-meter-value]");
    const meterElement = root.querySelector(".fish-meter");
    const meterFill = root.querySelector("[data-fish-meter]");
    const progressFill = root.querySelector("[data-fish-progress]");
    const scoreElement = root.querySelector("[data-fish-score]");
    const countElement = root.querySelector("[data-fish-count]");
    const streakElement = root.querySelector("[data-fish-streak]");
    const bestElement = root.querySelector("[data-fish-best]");
    const bestSpeciesElement = root.querySelector("[data-fish-best-species]");
    const journalElement = root.querySelector("[data-fish-journal]");
    const journalCountElement = root.querySelector("[data-fish-journal-count]");
    const catchCard = root.querySelector("[data-fish-catch-card]");
    const helpCard = root.querySelector("[data-fish-help-card]");
    const soundButton = root.querySelector("[data-fish-sound]");
    const gallery = root.querySelector("[data-fish-gallery]");
    const galleryCanvas = root.querySelector("[data-gallery-canvas]");
    const catchCanvas = root.querySelector("[data-fish-catch-canvas]");

    let saveData = loadSave();
    let score = 0;
    let catchCount = 0;
    let streak = 0;
    let selectedLure = "moth";
    let galleryIndex = 0;
    let lastCaughtFish = null;
    let phase = "ready";
    let castPower = 0;
    let chargeDirection = 1;
    let inputHeld = false;
    let castAnimation = 0;
    let bobberX = 520;
    let bobberY = 350;
    let waitRemaining = 0;
    let biteRemaining = 0;
    let hookedFish = null;
    let tension = 42;
    let reelProgress = 0;
    let slackTime = 0;
    let fishClock = 0;
    let wasSurging = false;
    let lastTime = performance.now();
    let animationFrame = 0;
    let destroyed = false;
    let soundOn = true;
    let audioContext = null;
    let catchCardTimer = null;
    const rain = Array.from({ length: 150 }, () => ({
      x: Math.random() * 980,
      y: Math.random() * 560,
      speed: 330 + Math.random() * 270,
      length: 7 + Math.random() * 12,
      opacity: .12 + Math.random() * .28
    }));
    const lakeLife = Array.from({ length: 11 }, (_,index) => ({
      x: Math.random() * 900,
      y: 325 + Math.random() * 175,
      speed: 7 + Math.random() * 16,
      size: 7 + Math.random() * 13,
      direction: index % 2 ? 1 : -1,
      depth: .08 + Math.random() * .13
    }));

    function loadSave() {
      try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (value && typeof value === "object") return {
          bestWeight: Number(value.bestWeight) || 0,
          bestSpecies: value.bestSpecies || "",
          highScore: Number(value.highScore) || 0,
          lifetimeCatches: Number(value.lifetimeCatches) || 0,
          discovered: Array.isArray(value.discovered) ? value.discovered : [],
          records: value.records && typeof value.records === "object" ? value.records : {}
        };
      } catch (_) { /* use a clean save */ }
      return { bestWeight: 0, bestSpecies: "", highScore: 0, lifetimeCatches: 0, discovered: [], records:{} };
    }

    function persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    }

    function tone(frequency, duration = .06, volume = .022, type = "sine", delay = 0) {
      if (!soundOn) return;
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") audioContext.resume();
        const start = audioContext.currentTime + delay;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
      } catch (_) { /* sound is optional */ }
    }

    function soundCatch() {
      tone(392, .09, .025, "sine");
      tone(523, .1, .025, "sine", .08);
      tone(659, .15, .025, "sine", .16);
    }

    function setMessage(nextPhase, message) {
      phaseElement.textContent = nextPhase;
      statusElement.textContent = message;
    }

    function fishRecord(fish) {
      return saveData.records[fish.id] || { count:0, best:0 };
    }

    function drawFishSpecimen(canvasElement, fish, weight = 0, locked = false) {
      const ctx = canvasElement.getContext("2d");
      const width = canvasElement.width, height = canvasElement.height;
      ctx.clearRect(0, 0, width, height);
      const backdrop = ctx.createRadialGradient(width * .5, height * .45, 5, width * .5, height * .5, width * .55);
      backdrop.addColorStop(0, locked ? "rgba(72,99,96,.18)" : "rgba(111,164,157,.22)");
      backdrop.addColorStop(1, "rgba(7,31,35,0)");
      ctx.fillStyle = backdrop; ctx.fillRect(0, 0, width, height);
      for (let index = 0; index < 12; index += 1) {
        const x = (index * 83 + 29) % width, y = (index * 47 + 17) % height;
        ctx.strokeStyle = "rgba(171,207,200,.18)";ctx.lineWidth = Math.max(1, width / 520);
        ctx.beginPath();ctx.arc(x, y, 2 + index % 5, 0, Math.PI * 2);ctx.stroke();
      }
      const shapeScale = fish.shape === "long" ? 1.08 : fish.shape === "round" ? .83 : 1;
      const bodyLength = width * .56 * shapeScale;
      const bodyHeight = height * (fish.shape === "round" ? .34 : fish.shape === "koi" ? .3 : .24);
      const centerX = width * .52, centerY = height * .51;
      ctx.save();ctx.translate(centerX, centerY);
      if (locked) ctx.globalAlpha = .46;
      const bodyGradient = ctx.createLinearGradient(0, -bodyHeight / 2, 0, bodyHeight / 2);
      bodyGradient.addColorStop(0, locked ? "#31504d" : fish.accent);
      bodyGradient.addColorStop(.43, locked ? "#294542" : fish.color);
      bodyGradient.addColorStop(1, locked ? "#203b39" : fish.belly);
      ctx.fillStyle = bodyGradient;ctx.strokeStyle = locked ? "#59736d" : "#263f3d";ctx.lineWidth = Math.max(2, width / 230);
      ctx.beginPath();ctx.ellipse(0, 0, bodyLength / 2, bodyHeight / 2, 0, 0, Math.PI * 2);ctx.fill();ctx.stroke();
      ctx.fillStyle = locked ? "#294542" : fish.color;
      ctx.beginPath();ctx.moveTo(-bodyLength * .45, 0);ctx.lineTo(-bodyLength * .68, -bodyHeight * .48);ctx.lineTo(-bodyLength * .63, 0);ctx.lineTo(-bodyLength * .68, bodyHeight * .48);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle = locked ? "#294542" : fish.accent;
      ctx.beginPath();ctx.moveTo(-bodyLength * .08, -bodyHeight * .42);ctx.quadraticCurveTo(bodyLength * .06,-bodyHeight * .88,bodyLength * .22,-bodyHeight * .37);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(-bodyLength * .02, bodyHeight * .22);ctx.quadraticCurveTo(bodyLength * .1,bodyHeight * .72,bodyLength * .25,bodyHeight * .26);ctx.closePath();ctx.fill();
      if (!locked) {
        ctx.globalAlpha = .3;ctx.strokeStyle = fish.accent;ctx.lineWidth = Math.max(1, width / 400);
        const scaleSize = Math.max(8, bodyLength / 15);
        for (let x = -bodyLength * .3; x < bodyLength * .28; x += scaleSize) for (let y = -bodyHeight * .22; y < bodyHeight * .26; y += scaleSize * .7) { ctx.beginPath();ctx.arc(x + ((Math.round(y) & 1) ? scaleSize * .35 : 0),y,scaleSize * .38,0,Math.PI);ctx.stroke(); }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#f3ebd8";ctx.beginPath();ctx.arc(bodyLength * .34,-bodyHeight * .12,Math.max(4,width/85),0,Math.PI*2);ctx.fill();
        ctx.fillStyle = "#172c2c";ctx.beginPath();ctx.arc(bodyLength * .35,-bodyHeight * .12,Math.max(2,width/180),0,Math.PI*2);ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.32)";ctx.lineWidth = Math.max(1,width/420);ctx.beginPath();ctx.moveTo(-bodyLength*.18,-bodyHeight*.32);ctx.quadraticCurveTo(bodyLength*.08,-bodyHeight*.48,bodyLength*.27,-bodyHeight*.25);ctx.stroke();
      }
      ctx.restore();
      if (!locked && weight) {
        ctx.fillStyle = "rgba(231,223,202,.8)";ctx.font = `${Math.max(9,width/42)}px Courier New`;ctx.textAlign = "right";ctx.fillText(`${weight.toFixed(2)} LB`,width-12,height-10);
      }
    }

    function renderGallery() {
      const fish = FISH[galleryIndex];
      const found = saveData.discovered.includes(fish.name);
      const record = fishRecord(fish);
      root.querySelector("[data-gallery-title]").textContent = found ? fish.rarity.toUpperCase() + " SPECIMEN" : "SEALED ENTRY";
      root.querySelector("[data-gallery-name]").textContent = found ? fish.name : "Unknown specimen";
      root.querySelector("[data-gallery-rarity]").textContent = found ? fish.rarity.toUpperCase() : "UNDISCOVERED";
      root.querySelector("[data-gallery-best]").textContent = found && record.best ? `${record.best.toFixed(2)} lb` : "—";
      root.querySelector("[data-gallery-count]").textContent = found ? String(record.count || 0) : "0";
      root.querySelector("[data-gallery-habitat]").textContent = found ? fish.habitat : "—";
      root.querySelector("[data-gallery-description]").textContent = found ? fish.description : "Catch this fish to unlock its field notes and full specimen rendering.";
      root.querySelector("[data-gallery-tip]").textContent = found ? `FIELD TIP / Try the ${fish.tip}.` : "The motel lake still has secrets.";
      root.querySelector("[data-gallery-position]").textContent = `${galleryIndex + 1} / ${FISH.length}`;
      root.querySelector("[data-gallery-locked]").classList.toggle("hidden", found);
      drawFishSpecimen(galleryCanvas, fish, record.best || 0, !found);
    }

    function openGallery(index = 0) {
      galleryIndex = Math.max(0, Math.min(FISH.length - 1, index));
      helpCard.classList.add("hidden");
      gallery.classList.remove("hidden");
      renderGallery();
      root.querySelector("[data-gallery-close]").focus();
    }

    function closeGallery() {
      gallery.classList.add("hidden");
      root.focus();
    }

    function refreshStats() {
      scoreElement.textContent = String(score).padStart(6, "0");
      countElement.textContent = String(catchCount).padStart(2, "0");
      streakElement.textContent = `x${Math.max(1, streak)}`;
      bestElement.textContent = saveData.bestWeight ? `${saveData.bestWeight.toFixed(2)} lb` : "—";
      bestSpeciesElement.textContent = saveData.bestSpecies || "No catches yet";
      journalCountElement.textContent = `${saveData.discovered.length} / ${FISH.length}`;
      journalElement.innerHTML = FISH.map((fish,index) => {
        const found = saveData.discovered.includes(fish.name);
        const record = fishRecord(fish);
        return `<button type="button" data-journal-fish="${index}" class="${found ? "found" : ""}"><i style="--fish-color:${fish.color};--fish-accent:${fish.accent}"></i><span>${found ? fish.name : "Unknown catch"}<small>${found && record.best ? `${record.best.toFixed(2)} lb best` : "not recorded"}</small></span><b>${found ? fish.rarity : "?"}</b></button>`;
      }).join("");
      journalElement.querySelectorAll("[data-journal-fish]").forEach(button => button.onclick = () => openGallery(Number(button.dataset.journalFish)));
    }

    function updateControls() {
      let label = "HOLD TO CAST";
      let meter = castPower;
      let meterTitle = "CAST POWER";
      let description = `${Math.round(castPower)}%`;
      actionButton.disabled = false;
      const safeMin = hookedFish?.safeMin ?? 24;
      const safeMax = hookedFish?.safeMax ?? 78;
      if (hookedFish) {
        root.dataset.hookedFish = hookedFish.id;
        root.dataset.fightChallenge = hookedFish.challenge.toFixed(2);
        root.dataset.safeMin = hookedFish.safeMin.toFixed(1);
        root.dataset.safeMax = hookedFish.safeMax.toFixed(1);
        root.dataset.reelTarget = hookedFish.target.toFixed(1);
      }
      root.classList.toggle("line-danger", phase === "hooked" && tension > safeMax);
      root.classList.toggle("line-slack", phase === "hooked" && tension < safeMin);
      root.classList.toggle("fish-biting", phase === "bite");
      root.classList.toggle("fish-hooked", phase === "hooked");
      root.classList.toggle("fish-charging", phase === "charging");
      if (phase === "charging") label = "RELEASE TO CAST";
      if (phase === "casting") { label = "CASTING..."; actionButton.disabled = true; }
      if (phase === "waiting") { label = "WAIT FOR A BITE"; actionButton.disabled = true; meter = 0; description = "—"; }
      if (phase === "bite") { label = "HOOK IT!"; meterTitle = "BITE WINDOW"; meter = Math.max(0, biteRemaining / 1.15 * 100); description = `${Math.ceil(biteRemaining * 10) / 10}s`; }
      if (phase === "hooked") { label = inputHeld ? "REELING..." : "HOLD TO REEL"; meterTitle = tension > safeMax ? "LINE TENSION / DANGER" : tension < safeMin ? "LINE TENSION / SLACK" : `LINE TENSION / ${hookedFish.rarity.toUpperCase()}`; meter = tension; description = `${Math.round(tension)}%`; }
      if (phase === "caught" || phase === "escaped") { label = "CAST AGAIN"; meter = 0; description = "READY"; }
      actionButton.querySelector("span").textContent = label;
      meterLabel.textContent = meterTitle;
      meterValue.textContent = description;
      meterFill.style.width = `${Math.max(0, Math.min(100, meter))}%`;
      meterFill.classList.toggle("danger", phase === "hooked" && tension > safeMax);
      meterFill.classList.toggle("slack", phase === "hooked" && tension < safeMin);
      meterElement.classList.toggle("show-safe-zone", phase === "hooked");
      meterElement.style.setProperty("--safe-start", `${safeMin}%`);
      meterElement.style.setProperty("--safe-width", `${Math.max(0, safeMax - safeMin)}%`);
      meterElement.style.setProperty("--safe-end", `${safeMax}%`);
      progressFill.style.width = `${phase === "hooked" && hookedFish ? Math.min(100, reelProgress / hookedFish.target * 100) : 0}%`;
    }

    function chooseFish() {
      const distanceBonus = castPower / 100;
      const lure = LURES.find(item => item.id === selectedLure) || LURES[0];
      const weighted = FISH.map((fish, index) => ({
        fish,
        weight: fish.chance * (1 + distanceBonus * index * .22) * (1 + lure.rare * index)
      }));
      let roll = Math.random() * weighted.reduce((sum, item) => sum + item.weight, 0);
      const selected = weighted.find(item => (roll -= item.weight) <= 0)?.fish || FISH[0];
      const weight = selected.min + Math.pow(Math.random(), .72) * (selected.max - selected.min);
      const challenge = Math.max(.04, Math.min(1, selected.challenge + (lure.fight - 1) * .35));
      const sizeChallenge = (weight - selected.min) / Math.max(.01, selected.max - selected.min);
      return {
        ...selected,
        weight,
        fight:selected.fight * lure.fight,
        challenge,
        safeMin:22 + challenge * 13,
        safeMax:80 - challenge * 14,
        tensionRise:27 + challenge * 12,
        slackFall:21 + challenge * 17,
        reelRate:27 - challenge * 7,
        target:78 + challenge * 112 + sizeChallenge * (8 + challenge * 14)
      };
    }

    function startCharging() {
      clearTimeout(catchCardTimer);
      catchCard.classList.add("hidden");
      castPower = 4;
      chargeDirection = 1;
      phase = "charging";
      setMessage("CASTING", "Release when the cast meter feels right.");
      tone(196, .04, .012, "square");
    }

    function releaseCast() {
      if (phase !== "charging") return;
      phase = "casting";
      castAnimation = 0;
      bobberX = 735 - castPower * 4.5;
      bobberY = 344 + (1 - castPower / 100) * 44;
      setMessage("CAST AWAY", "The bobber sails into the rain...");
      tone(245, .08, .018, "triangle");
    }

    function setHook() {
      if (phase !== "bite") return;
      hookedFish = chooseFish();
      phase = "hooked";
      tension = (hookedFish.safeMin + hookedFish.safeMax) / 2;
      reelProgress = 7;
      slackTime = 0;
      fishClock = 0;
      wasSurging = false;
      setMessage(`${hookedFish.rarity.toUpperCase()} FISH ON`, `${hookedFish.name} hooked. Keep the line inside the green band!`);
      tone(330, .05, .025, "square");
      tone(440, .07, .02, "square", .05);
    }

    function loseFish(message) {
      phase = "escaped";
      inputHeld = false;
      root.classList.remove("fish-surge");
      wasSurging = false;
      streak = 0;
      refreshStats();
      setMessage("THE LINE WENT QUIET", message);
      tone(145, .18, .025, "sawtooth");
      updateControls();
    }

    function landFish() {
      const fish = hookedFish;
      phase = "caught";
      inputHeld = false;
      root.classList.remove("fish-surge");
      wasSurging = false;
      catchCount += 1;
      streak += 1;
      const streakMultiplier = 1 + Math.min(4, streak - 1) * .25;
      const earned = Math.round(fish.points * (.65 + fish.weight / fish.max) * streakMultiplier);
      score += earned;
      saveData.highScore = Math.max(saveData.highScore, score);
      saveData.lifetimeCatches += 1;
      if (!saveData.discovered.includes(fish.name)) saveData.discovered.push(fish.name);
      const record = fishRecord(fish);
      saveData.records[fish.id] = { count:(record.count || 0) + 1, best:Math.max(record.best || 0, Number(fish.weight.toFixed(2))) };
      if (fish.weight > saveData.bestWeight) {
        saveData.bestWeight = Number(fish.weight.toFixed(2));
        saveData.bestSpecies = fish.name;
      }
      persist();
      refreshStats();
      root.querySelector("[data-fish-catch-name]").textContent = fish.name;
      root.querySelector("[data-fish-catch-weight]").textContent = `${fish.weight.toFixed(2)} lb`;
      root.querySelector("[data-fish-catch-rarity]").textContent = fish.rarity;
      root.querySelector("[data-fish-catch-points]").textContent = `+${earned} points`;
      lastCaughtFish = fish;
      drawFishSpecimen(catchCanvas, fish, fish.weight);
      catchCard.classList.remove("hidden");
      setMessage("LANDED", `${fish.name}, ${fish.weight.toFixed(2)} lb. Streak x${streak}.`);
      soundCatch();
      catchCardTimer = setTimeout(() => catchCard.classList.add("settled"), 900);
    }

    function newSession() {
      clearTimeout(catchCardTimer);
      catchCard.classList.add("hidden");
      catchCard.classList.remove("settled");
      helpCard.classList.add("hidden");
      score = 0;
      catchCount = 0;
      streak = 0;
      castPower = 0;
      inputHeld = false;
      phase = "ready";
      hookedFish = null;
      root.classList.remove("fish-surge");
      wasSurging = false;
      setMessage("ON THE SHORE", "Hold to charge your cast.");
      refreshStats();
      updateControls();
      root.focus();
    }

    function actionDown(event) {
      if (event) event.preventDefault();
      if (!gallery.classList.contains("hidden") || !helpCard.classList.contains("hidden")) return;
      if (inputHeld) return;
      inputHeld = true;
      root.focus({ preventScroll: true });
      if (phase === "ready") startCharging();
      else if (phase === "bite") setHook();
      else if (phase === "caught" || phase === "escaped") startCharging();
      else if (phase === "waiting") {
        inputHeld = false;
        waitRemaining += .65;
        setMessage("TOO SOON", "Easy now—the ripples were only rain.");
        tone(180, .05, .012, "square");
      }
      updateControls();
    }

    function actionUp(event) {
      if (event) event.preventDefault();
      if (!inputHeld) return;
      inputHeld = false;
      if (phase === "charging") releaseCast();
      updateControls();
    }

    function updateGame(delta) {
      rain.forEach(drop => {
        drop.y += drop.speed * delta;
        drop.x -= drop.speed * .14 * delta;
        if (drop.y > 565 || drop.x < -25) { drop.x = Math.random() * 1020; drop.y = -25 - Math.random() * 150; }
      });
      lakeLife.forEach(fish => {
        fish.x += fish.speed * fish.direction * delta;
        if (fish.x < -40) fish.x = 1000;
        if (fish.x > 1000) fish.x = -40;
      });
      if (!gallery.classList.contains("hidden") || !helpCard.classList.contains("hidden")) { updateControls(); return; }
      if (phase === "charging") {
        castPower += chargeDirection * delta * 66;
        if (castPower >= 100) { castPower = 100; chargeDirection = -1; tone(270, .03, .008, "square"); }
        if (castPower <= 10) { castPower = 10; chargeDirection = 1; }
      } else if (phase === "casting") {
        castAnimation += delta / .72;
        if (castAnimation >= 1) {
          castAnimation = 1;
          phase = "waiting";
          const lure = LURES.find(item => item.id === selectedLure) || LURES[0];
          waitRemaining = (1.45 + Math.random() * 3.25 - castPower * .006) * lure.bite;
          setMessage("LISTEN TO THE RAIN", "Wait for the bobber to dip, then set the hook.");
          tone(205, .08, .013, "sine");
        }
      } else if (phase === "waiting") {
        waitRemaining -= delta;
        if (waitRemaining <= 0) {
          phase = "bite";
          biteRemaining = 1.15;
          setMessage("BITE!", "Press now to set the hook!");
          tone(510, .05, .025, "square");
          tone(640, .05, .02, "square", .08);
        }
      } else if (phase === "bite") {
        biteRemaining -= delta;
        if (biteRemaining <= 0) loseFish("The fish took the bait and slipped away.");
      } else if (phase === "hooked") {
        fishClock += delta;
        const primary = (Math.sin(fishClock * (2.15 + hookedFish.fight * .9)) + 1) / 2;
        const chop = (Math.sin(fishClock * (5.4 + hookedFish.challenge * 3.2) + 1.3) + 1) / 2;
        const surge = Math.pow(primary * .7 + chop * .3, 2.15 - hookedFish.challenge * .75);
        const surging = surge > .72 - hookedFish.challenge * .2;
        root.classList.toggle("fish-surge", surging);
        if (surging && !wasSurging) {
          setMessage(`${hookedFish.rarity.toUpperCase()} SURGE`, `${hookedFish.name} is running—ease off the reel!`);
          tone(118 + hookedFish.challenge * 45, .07, .018, "sawtooth");
        } else if (!surging && wasSurging) {
          setMessage("FISH ON", "Recover tension and reel inside the green band.");
        }
        wasSurging = surging;
        if (inputHeld) {
          tension += delta * (hookedFish.tensionRise + surge * (14 + hookedFish.challenge * 55));
          const sweetSpot = tension >= hookedFish.safeMin && tension <= hookedFish.safeMax;
          reelProgress += delta * hookedFish.reelRate * (sweetSpot ? 1 : .12);
          if (tension > hookedFish.safeMax) reelProgress -= delta * (2 + hookedFish.challenge * 6);
          slackTime = Math.max(0, slackTime - delta * 2);
        } else {
          tension -= delta * (hookedFish.slackFall + (surging ? hookedFish.challenge * 5 : 0));
          reelProgress -= delta * (2.2 + hookedFish.challenge * 5.2);
          if (tension < hookedFish.safeMin) slackTime += delta;
          else slackTime = Math.max(0, slackTime - delta);
        }
        tension = Math.max(0, tension);
        reelProgress = Math.max(0, reelProgress);
        if (tension >= 100) loseFish("The line snapped under too much tension.");
        else if (tension <= 0) loseFish("The line reached zero tension and the fish shook free.");
        else if (reelProgress >= hookedFish.target) landFish();
      } else {
        root.classList.remove("fish-surge");
      }
      updateControls();
    }

    function roundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
    }

    function drawMountains() {
      context.fillStyle = "#18343b";
      context.beginPath();
      context.moveTo(0, 265); context.lineTo(0, 165); context.lineTo(105, 76); context.lineTo(196, 178); context.lineTo(335, 98); context.lineTo(468, 203); context.lineTo(575, 139); context.lineTo(715, 235); context.lineTo(960, 162); context.lineTo(960, 290); context.closePath(); context.fill();
      context.fillStyle = "#102b31";
      context.beginPath();
      context.moveTo(0, 286); context.lineTo(0, 220); context.lineTo(130, 154); context.lineTo(254, 237); context.lineTo(390, 171); context.lineTo(526, 249); context.lineTo(665, 181); context.lineTo(795, 243); context.lineTo(960, 205); context.lineTo(960, 300); context.closePath(); context.fill();
      context.fillStyle = "rgba(143,174,172,.12)";
      context.fillRect(0, 236, 960, 20);
    }

    function drawClouds(time) {
      context.save();
      context.filter = "blur(13px)";
      for (let index = 0; index < 5; index += 1) {
        const x = ((time * (.003 + index * .0007) + index * 235) % 1250) - 170;
        const y = 55 + index * 31;
        context.fillStyle = `rgba(109,145,148,${.055 + index * .009})`;
        context.beginPath();context.ellipse(x,y,145 + index * 15,26 + index * 3,0,0,Math.PI*2);context.fill();
      }
      context.restore();
    }

    function drawPines() {
      context.fillStyle = "#0b2529";
      for (let x = 0; x < 960; x += 24) {
        const height = 42 + ((x * 17) % 68);
        const base = 291;
        context.fillRect(x + 10, base - height * .6, 3, height * .65);
        context.beginPath();
        context.moveTo(x + 11, base - height); context.lineTo(x - 5, base - height * .36); context.lineTo(x + 27, base - height * .36); context.closePath(); context.fill();
        context.beginPath();
        context.moveTo(x + 11, base - height * .77); context.lineTo(x - 9, base - height * .12); context.lineTo(x + 31, base - height * .12); context.closePath(); context.fill();
      }
    }

    function drawMotel(time) {
      context.save();
      context.fillStyle = "#172526";
      context.fillRect(610, 232, 242, 61);
      context.fillStyle = "#263637";
      context.fillRect(602, 225, 258, 10);
      context.fillStyle = "#0f2022";context.fillRect(610, 285, 242, 8);
      for (let x = 624; x < 848; x += 38) {
        context.fillStyle = "#e7aa69";
        context.globalAlpha = .68 + Math.sin(time * .001 + x) * .05;
        context.fillRect(x, 248, 18, 21);
        context.fillStyle = "#44352b";
        context.fillRect(x + 2, 250, 6, 17);
        context.strokeStyle = "rgba(245,211,159,.28)";context.lineWidth = 1;context.strokeRect(x,248,18,21);
        context.fillStyle = "#111e20";context.fillRect(x + 25,246,8,37);
      }
      context.globalAlpha = 1;
      context.fillStyle = "#111f21";
      context.fillRect(718, 159, 5, 73);
      context.fillRect(820, 159, 5, 73);
      roundedRect(context, 697, 149, 150, 58, 7);
      context.fillStyle = "#3d292a"; context.fill();
      context.strokeStyle = "#df7379"; context.lineWidth = 3; context.stroke();
      context.shadowColor = "rgba(239,111,120,.7)"; context.shadowBlur = 13;
      context.fillStyle = "#ef7c82";
      context.font = "700 19px Trebuchet MS"; context.textAlign = "center";
      context.fillText("AFTERGLOW", 772, 174);
      context.fillStyle = "#f0c57f"; context.font = "700 15px Trebuchet MS";
      context.fillText("MOTEL", 772, 194);
      for (let index = 0; index < 9; index += 1) {
        const angle = Math.PI * 2 * index / 9;
        context.fillStyle = index % 2 ? "#ef7c82" : "#f0c57f";
        context.beginPath();context.arc(772 + Math.cos(angle) * 66,178 + Math.sin(angle) * 23,1.5,0,Math.PI*2);context.fill();
      }
      context.shadowBlur = 0;
      context.restore();
    }

    function drawLake(time) {
      const water = context.createLinearGradient(0, 278, 0, 540);
      water.addColorStop(0, "#173c43"); water.addColorStop(.48, "#0b3038"); water.addColorStop(1, "#08242b");
      context.fillStyle = water; context.fillRect(0, 278, 960, 262);
      lakeLife.forEach((fish,index) => {
        const sway = Math.sin(time * .0015 + index) * 3;
        context.save();context.translate(fish.x,fish.y+sway);context.scale(fish.direction,1);context.globalAlpha = fish.depth;context.fillStyle = index % 3 === 0 ? "#df7d82" : "#9ac0b8";
        context.beginPath();context.ellipse(0,0,fish.size*1.8,fish.size*.55,0,0,Math.PI*2);context.fill();context.beginPath();context.moveTo(-fish.size*1.5,0);context.lineTo(-fish.size*2.35,-fish.size*.75);context.lineTo(-fish.size*2.35,fish.size*.75);context.closePath();context.fill();context.restore();
      });
      context.strokeStyle = "rgba(132,181,183,.15)"; context.lineWidth = 1;
      for (let index = 0; index < 34; index += 1) {
        const y = 294 + index * 7.6;
        const offset = Math.sin(time * .0012 + index) * 17;
        context.beginPath(); context.moveTo((index * 47 + offset) % 170, y); context.lineTo(790 - (index * 19) % 120, y); context.stroke();
      }
      const reflection = context.createLinearGradient(697, 278, 847, 510);
      reflection.addColorStop(0, "rgba(232,110,116,.31)"); reflection.addColorStop(1, "rgba(232,110,116,0)");
      context.fillStyle = reflection; context.beginPath(); context.moveTo(705, 278); context.lineTo(840, 278); context.lineTo(803, 520); context.lineTo(742, 520); context.closePath(); context.fill();
      context.strokeStyle = "rgba(193,222,218,.21)";
      rain.forEach((drop, index) => {
        if (drop.y < 278 || index % 4) return;
        context.beginPath(); context.ellipse(drop.x, drop.y, 5 + index % 8, 1.8 + index % 3, 0, 0, Math.PI * 2); context.stroke();
      });
    }

    function drawForeground(time) {
      const ground = context.createLinearGradient(0,475,0,540);ground.addColorStop(0,"rgba(7,29,31,0)");ground.addColorStop(1,"rgba(4,19,22,.82)");context.fillStyle=ground;context.fillRect(0,455,960,85);
      context.strokeStyle = "#173f3d";context.lineWidth = 3;
      for (let index = 0; index < 20; index += 1) {
        const x = (index * 53) % 960;const height = 13 + index % 5 * 7;
        context.beginPath();context.moveTo(x,540);context.quadraticCurveTo(x + Math.sin(time*.001+index)*4,540-height*.55,x-3,540-height);context.stroke();
      }
      context.fillStyle="rgba(91,115,106,.28)";
      for(let index=0;index<9;index+=1){context.beginPath();context.ellipse(36+index*117,526+(index%3)*6,13+index%4*4,5+index%2*2,-.15,0,Math.PI*2);context.fill();}
    }

    function bobberPosition() {
      if (phase === "casting") {
        const t = Math.min(1, castAnimation);
        const startX = 810, startY = 404;
        const height = 175 + castPower * .75;
        return { x: startX + (bobberX - startX) * t, y: startY + (bobberY - startY) * t - Math.sin(t * Math.PI) * height };
      }
      const dip = phase === "bite" ? 10 + Math.sin(biteRemaining * 30) * 4 : 0;
      const struggle = phase === "hooked" ? Math.sin(fishClock * 8) * (7 + hookedFish.fight * 4) : 0;
      return { x: bobberX + struggle, y: bobberY + dip + Math.abs(struggle) * .2 };
    }

    function drawFishing(time) {
      if (phase === "charging") {
        const targetX = 735 - castPower * 4.5,targetY = 344 + (1 - castPower / 100) * 44;
        context.save();context.setLineDash([5,5]);context.strokeStyle="rgba(239,193,122,.6)";context.lineWidth=1;context.beginPath();context.ellipse(targetX,targetY+7,20,6,0,0,Math.PI*2);context.stroke();context.setLineDash([]);context.fillStyle="rgba(239,193,122,.8)";context.font="8px Courier New";context.textAlign="center";context.fillText("CAST",targetX,targetY-9);context.restore();return;
      }
      if (["ready", "caught", "escaped"].includes(phase)) return;
      const bobber = bobberPosition();
      context.strokeStyle = phase === "hooked" && tension > 78 ? "rgba(247,133,137,.92)" : "rgba(224,224,204,.72)";
      context.lineWidth = 1.35;
      context.beginPath(); context.moveTo(827, 369); context.quadraticCurveTo(700, 240, bobber.x, bobber.y - 4); context.stroke();
      context.fillStyle = "#f0e1bd"; context.fillRect(bobber.x - 2, bobber.y - 9, 4, 10);
      context.fillStyle = "#df7379"; context.beginPath(); context.arc(bobber.x, bobber.y + 1, 6, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(220,235,228,.34)";
      context.beginPath(); context.ellipse(bobber.x, bobber.y + 7, 13 + Math.sin(time * .004) * 4, 4, 0, 0, Math.PI * 2); context.stroke();
      if (phase === "bite" || phase === "hooked") {
        const force = phase === "bite" ? 1 : Math.min(1.8,hookedFish.fight);
        context.strokeStyle = `rgba(220,235,228,${phase === "bite" ? .7 : .42})`;
        for(let ring=1;ring<=3;ring+=1){context.beginPath();context.ellipse(bobber.x,bobber.y+8,ring*13*force+(time*.04)%11,ring*3.2*force,0,0,Math.PI*2);context.stroke();}
        for(let drop=0;drop<6;drop+=1){const angle=time*.006+drop*1.047;context.fillStyle="rgba(211,231,224,.52)";context.beginPath();context.arc(bobber.x+Math.cos(angle)*18*force,bobber.y-Math.abs(Math.sin(angle))*18*force,1.5,0,Math.PI*2);context.fill();}
      }
      if (phase === "hooked") {
        context.save(); context.translate(bobber.x + Math.sin(fishClock * 3) * 34, bobber.y + 52); context.rotate(Math.sin(fishClock * 2.4) * .22);
        context.globalAlpha = .34; context.fillStyle = hookedFish.color;
        context.beginPath(); context.ellipse(0, 0, 27 + hookedFish.fight * 8, 8 + hookedFish.fight * 2, 0, 0, Math.PI * 2); context.fill();
        context.beginPath(); context.moveTo(-24, 0); context.lineTo(-41, -12); context.lineTo(-41, 12); context.closePath(); context.fill(); context.restore();
      }
      context.strokeStyle = "#9b7250"; context.lineWidth = 6; context.lineCap = "round"; context.beginPath(); context.moveTo(852, 508); context.lineTo(828, 368); context.stroke();
      context.strokeStyle = "#dbc38f"; context.lineWidth = 2; context.beginPath(); context.moveTo(828, 368); context.lineTo(812, 332); context.stroke();
    }

    function drawRain() {
      context.lineWidth = 1;
      rain.forEach(drop => {
        context.strokeStyle = `rgba(174,205,206,${drop.opacity})`;
        context.beginPath(); context.moveTo(drop.x, drop.y); context.lineTo(drop.x - drop.length * .18, drop.y + drop.length); context.stroke();
      });
    }

    function draw(time) {
      context.clearRect(0, 0, 960, 540);
      const sky = context.createLinearGradient(0, 0, 0, 310);
      sky.addColorStop(0, "#0b252d"); sky.addColorStop(.55, "#23434a"); sky.addColorStop(1, "#284e52");
      context.fillStyle = sky; context.fillRect(0, 0, 960, 310);
      drawClouds(time);
      context.fillStyle = "rgba(118,155,158,.1)"; context.beginPath(); context.ellipse(420, 226, 390, 58, 0, 0, Math.PI * 2); context.fill();
      drawMountains(); drawPines(); drawLake(time); drawMotel(time); drawFishing(time); drawForeground(time); drawRain();
      const vignette = context.createRadialGradient(480, 270, 190, 480, 270, 620);
      vignette.addColorStop(.55, "rgba(4,18,21,0)"); vignette.addColorStop(1, "rgba(3,14,17,.48)");
      context.fillStyle = vignette; context.fillRect(0, 0, 960, 540);
    }

    function frame(time) {
      if (destroyed) return;
      const delta = Math.min(.04, (time - lastTime) / 1000 || 0);
      lastTime = time;
      updateGame(delta);
      draw(time);
      animationFrame = requestAnimationFrame(frame);
    }

    function onKeyDown(event) {
      if (event.code === "Space") {
        if (event.repeat) return;
        actionDown(event);
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault(); newSession();
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault(); openGallery(0);
      } else if (event.key === "Escape" && (!helpCard.classList.contains("hidden") || !gallery.classList.contains("hidden"))) {
        event.preventDefault(); helpCard.classList.add("hidden");closeGallery();
      }
    }

    function onKeyUp(event) {
      if (event.code === "Space") actionUp(event);
    }

    actionButton.addEventListener("pointerdown", actionDown);
    canvas.addEventListener("pointerdown", actionDown);
    document.addEventListener("pointerup", actionUp);
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("keyup", onKeyUp);
    root.querySelector("[data-fish-new]").onclick = newSession;
    root.querySelector("[data-fish-help]").onclick = () => { helpCard.classList.remove("hidden"); root.querySelector("[data-fish-help-close]").focus(); };
    root.querySelector("[data-fish-help-close]").onclick = () => { helpCard.classList.add("hidden"); root.focus(); };
    root.querySelector("[data-fish-collection]").onclick = () => openGallery(0);
    root.querySelector("[data-gallery-close]").onclick = closeGallery;
    root.querySelector("[data-gallery-prev]").onclick = () => { galleryIndex = (galleryIndex - 1 + FISH.length) % FISH.length;renderGallery(); };
    root.querySelector("[data-gallery-next]").onclick = () => { galleryIndex = (galleryIndex + 1) % FISH.length;renderGallery(); };
    root.querySelector("[data-fish-view-catch]").onclick = () => { if (lastCaughtFish) openGallery(FISH.findIndex(fish => fish.id === lastCaughtFish.id)); };
    root.querySelector("[data-fish-cast-again]").onclick = () => { catchCard.classList.add("hidden");catchCard.classList.remove("settled");phase="ready";castPower=0;setMessage("ON THE SHORE","Choose a lure or hold to cast again.");updateControls();root.focus(); };
    root.querySelectorAll("[data-fish-lure]").forEach(button => button.onclick = () => {
      if (["casting","waiting","bite","hooked"].includes(phase)) { setMessage("LINE IN WATER", "Change lures after this cast.");tone(170,.04,.01,"square");return; }
      selectedLure = button.dataset.fishLure;
      const lure = LURES.find(item => item.id === selectedLure) || LURES[0];
      root.querySelectorAll("[data-fish-lure]").forEach(item => item.classList.toggle("active", item === button));
      root.querySelector("[data-fish-lure-name]").textContent = lure.name;
      setMessage("TACKLE READY", `${lure.name}: ${lure.note}.`);
      tone(280,.045,.014,"triangle");
      root.focus();
    });
    soundButton.onclick = () => {
      soundOn = !soundOn;
      soundButton.textContent = `Sound: ${soundOn ? "on" : "off"}`;
      soundButton.setAttribute("aria-pressed", String(soundOn));
      if (soundOn) tone(330, .06, .018, "sine");
    };

    refreshStats();
    updateControls();
    animationFrame = requestAnimationFrame(frame);

    return {
      element: root,
      focus() { root.focus(); },
      destroy() {
        destroyed = true;
        cancelAnimationFrame(animationFrame);
        clearTimeout(catchCardTimer);
        document.removeEventListener("pointerup", actionUp);
        root.removeEventListener("keydown", onKeyDown);
        root.removeEventListener("keyup", onKeyUp);
        if (audioContext && audioContext.state !== "closed") audioContext.close();
      }
    };
  };
})();
