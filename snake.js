(() => {
  "use strict";

  const STORAGE_KEY = "afterglow-neon-snake-v1";
  const COLUMNS = 26;
  const ROWS = 17;
  const CELL = 30;
  const MODES = {
    cruise: { label:"Sunset Cruise", short:"CRUISE", baseStep:145, minStep:76, levelDrop:6, multiplier:1, obstacles:0, obstacleGain:1, wrap:true, note:"Wraparound walls and a relaxed starting speed." },
    arcade: { label:"Neon Arcade", short:"ARCADE", baseStep:116, minStep:56, levelDrop:7, multiplier:1.3, obstacles:3, obstacleGain:2, wrap:false, note:"Solid walls, faster levels and more roadblocks." },
    blackout: { label:"Blackout Run", short:"BLACKOUT", baseStep:92, minStep:43, levelDrop:8, multiplier:1.7, obstacles:6, obstacleGain:3, wrap:false, note:"Immediate speed, dense barriers and maximum score." }
  };
  const PICKUPS = {
    cherry: { label:"Neon cherry", points:10, growth:1, color:"#ef747d", accent:"#ffc4aa", life:0 },
    firefly: { label:"Firefly", points:28, growth:2, color:"#f1c36f", accent:"#fff2b0", life:7600 },
    raindrop: { label:"Rain drop", points:18, growth:1, color:"#70b6c6", accent:"#c4eff1", life:9000 }
  };

  window.createAfterglowSnake = function createAfterglowSnake() {
    const root = document.createElement("section");
    root.className = "snake-app";
    root.tabIndex = 0;
    root.setAttribute("aria-label", "Neon Snake game");
    root.innerHTML = `
      <div class="snake-menubar">
        <button type="button" data-snake-new><u>G</u>ame</button>
        <button type="button" data-snake-pause><u>P</u>ause</button>
        <button type="button" data-snake-help><u>H</u>ow to play</button>
        <span class="snake-menu-title">AFTERGLOW ARCADE NETWORK / CABINET 03</span>
      </div>
      <div class="snake-workspace">
        <main class="snake-main">
          <div class="snake-scorebar">
            <div><span>SCORE</span><strong data-snake-score>000000</strong></div>
            <div><span>LEVEL</span><strong data-snake-level>01</strong></div>
            <div><span>LENGTH</span><strong data-snake-length>04</strong></div>
            <div class="snake-combo"><span>COMBO</span><strong data-snake-combo>x1</strong><i><b data-snake-combo-bar></b></i></div>
          </div>
          <div class="snake-frame">
            <canvas class="snake-canvas" width="780" height="510" aria-label="Neon Snake play field"></canvas>
            <div class="snake-overlay" data-snake-overlay>
              <span data-snake-overlay-kicker>NIGHT SHIFT READY</span>
              <strong data-snake-overlay-title>NEON SNAKE</strong>
              <p data-snake-overlay-copy>Collect motel lights, build combos, and stay off the barriers.</p>
              <button type="button" data-snake-start>Start run</button>
              <small>ARROWS / WASD TO STEER</small>
            </div>
            <div class="snake-help-panel hidden" data-snake-help-panel>
              <button type="button" data-snake-help-close aria-label="Close instructions">&times;</button>
              <span>AFTERGLOW ARCADE FIELD MANUAL</span>
              <h2>Follow the neon</h2>
              <div class="snake-help-grid">
                <p><b>STEER</b><br>Arrow keys, WASD, or the on-screen direction pad.</p>
                <p><b>CHAIN</b><br>Collect quickly to raise the combo up to x5.</p>
                <p><b>FIREFLY</b><br>Gold pickups grow twice and award bonus points.</p>
                <p><b>RAIN DROP</b><br>Blue pickups briefly slow the entire run.</p>
              </div>
              <p>Every five pickups raises the level, speeds up traffic, and adds new barriers. Space pauses. N starts over.</p>
            </div>
          </div>
          <div class="snake-statusbar"><i></i><span data-snake-status>Choose a route, then start the night run.</span><b data-snake-effect>GRID ONLINE</b></div>
        </main>
        <aside class="snake-sidebar">
          <div class="snake-brand"><span>AFTERGLOW MOTOR LODGE</span><strong>NEON<br>SNAKE</strong><small>RAIN-SLICK ARCADE EDITION</small></div>
          <div class="snake-record"><span>PERSONAL BEST</span><strong data-snake-best>000000</strong><small data-snake-best-label>Sunset Cruise record</small></div>
          <div class="snake-routes"><header><span>SELECT ROUTE</span><b data-snake-route>CRUISE</b></header>${Object.entries(MODES).map(([id,mode]) => `<button type="button" data-snake-mode="${id}" class="${id === "cruise" ? "active" : ""}"><i></i><span><b>${mode.label}</b><small>${mode.note}</small></span></button>`).join("")}</div>
          <div class="snake-next"><span>NEXT LEVEL</span><strong data-snake-next>5 pickups</strong><i><b data-snake-level-bar></b></i></div>
          <div class="snake-legend"><span>PICKUP SIGNALS</span><p><i class="cherry"></i> Neon cherry <b>+10</b></p><p><i class="firefly"></i> Firefly <b>+28</b></p><p><i class="raindrop"></i> Rain drop <b>SLOW</b></p></div>
          <button type="button" class="snake-sound" data-snake-sound aria-pressed="true">Sound: on</button>
          <div class="snake-dpad" aria-label="Snake direction controls">
            <button type="button" data-snake-direction="up" aria-label="Move up">&#9650;</button>
            <button type="button" data-snake-direction="left" aria-label="Move left">&#9664;</button>
            <button type="button" data-snake-direction="down" aria-label="Move down">&#9660;</button>
            <button type="button" data-snake-direction="right" aria-label="Move right">&#9654;</button>
          </div>
          <div class="snake-tip"><b>ARROWS / WASD</b> steer<br><b>SPACE</b> pause &nbsp; <b>N</b> new run</div>
        </aside>
      </div>`;

    const canvas = root.querySelector(".snake-canvas");
    const context = canvas.getContext("2d");
    const overlay = root.querySelector("[data-snake-overlay]");
    const overlayKicker = root.querySelector("[data-snake-overlay-kicker]");
    const overlayTitle = root.querySelector("[data-snake-overlay-title]");
    const overlayCopy = root.querySelector("[data-snake-overlay-copy]");
    const startButton = root.querySelector("[data-snake-start]");
    const helpPanel = root.querySelector("[data-snake-help-panel]");
    const scoreElement = root.querySelector("[data-snake-score]");
    const levelElement = root.querySelector("[data-snake-level]");
    const lengthElement = root.querySelector("[data-snake-length]");
    const comboElement = root.querySelector("[data-snake-combo]");
    const comboBar = root.querySelector("[data-snake-combo-bar]");
    const levelBar = root.querySelector("[data-snake-level-bar]");
    const nextElement = root.querySelector("[data-snake-next]");
    const statusElement = root.querySelector("[data-snake-status]");
    const effectElement = root.querySelector("[data-snake-effect]");
    const bestElement = root.querySelector("[data-snake-best]");
    const bestLabel = root.querySelector("[data-snake-best-label]");
    const routeElement = root.querySelector("[data-snake-route]");
    const pauseButton = root.querySelector("[data-snake-pause]");
    const soundButton = root.querySelector("[data-snake-sound]");

    let records = loadRecords();
    let modeId = localStorage.getItem("afterglow-snake-mode");
    if (!MODES[modeId]) modeId = "cruise";
    let mode = MODES[modeId];
    let snake = [];
    let direction = { x:1, y:0 };
    let directionQueue = [];
    let food = null;
    let obstacles = [];
    let particles = [];
    let phase = "ready";
    let resumeAfterHelp = false;
    let score = 0;
    let level = 1;
    let eaten = 0;
    let growth = 0;
    let combo = 1;
    let comboUntil = 0;
    let slowUntil = 0;
    let accumulator = 0;
    let lastTime = performance.now();
    let animationFrame = 0;
    let destroyed = false;
    let soundOn = true;
    let audioContext = null;
    let shakeTimer = null;
    const rain = Array.from({ length:75 }, () => ({ x:Math.random() * canvas.width, y:Math.random() * canvas.height, length:5 + Math.random() * 9, speed:90 + Math.random() * 150, alpha:.08 + Math.random() * .16 }));

    function loadRecords() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return saved && typeof saved === "object" ? saved : {};
      } catch (_) { return {}; }
    }

    function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

    function tone(frequency, duration = .05, volume = .018, type = "square", delay = 0) {
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
      } catch (_) { /* audio is optional */ }
    }

    function setStatus(message, effect = "GRID ONLINE") {
      statusElement.textContent = message;
      effectElement.textContent = effect;
    }

    function cellKey(cell) { return `${cell.x}:${cell.y}`; }
    function occupiedSet(includeFood = false) {
      const cells = new Set([...snake, ...obstacles].map(cellKey));
      if (includeFood && food) cells.add(cellKey(food));
      return cells;
    }

    function randomFreeCell(awayFromHead = false) {
      const occupied = occupiedSet(true);
      const head = snake[0] || { x:0, y:0 };
      const candidates = [];
      for (let y = 1; y < ROWS - 1; y += 1) for (let x = 1; x < COLUMNS - 1; x += 1) {
        const cell = { x, y };
        if (!occupied.has(cellKey(cell)) && (!awayFromHead || Math.abs(x - head.x) + Math.abs(y - head.y) > 5)) candidates.push(cell);
      }
      return candidates[Math.floor(Math.random() * candidates.length)] || { x:COLUMNS - 4, y:Math.floor(ROWS / 2) };
    }

    function choosePickup() {
      const roll = Math.random();
      return roll < .67 ? "cherry" : roll < .86 ? "firefly" : "raindrop";
    }

    function spawnFood(forceType = "") {
      const type = forceType || choosePickup();
      food = { ...randomFreeCell(true), type, born:performance.now() };
    }

    function addObstacles(count) {
      for (let index = 0; index < count; index += 1) {
        const cell = randomFreeCell(true);
        if (!obstacles.some(obstacle => cellKey(obstacle) === cellKey(cell))) obstacles.push(cell);
      }
    }

    function updateBest() {
      const best = Number(records[modeId]) || 0;
      bestElement.textContent = String(best).padStart(6, "0");
      bestLabel.textContent = `${mode.label} record`;
      routeElement.textContent = mode.short;
    }

    function refreshHud(now = performance.now()) {
      root.dataset.phase = phase;
      root.dataset.mode = modeId;
      root.dataset.level = String(level);
      root.dataset.obstacles = String(obstacles.length);
      scoreElement.textContent = String(score).padStart(6, "0");
      levelElement.textContent = String(level).padStart(2, "0");
      lengthElement.textContent = String(snake.length).padStart(2, "0");
      comboElement.textContent = `x${combo}`;
      const remaining = combo > 1 ? Math.max(0, (comboUntil - now) / 4500) : 0;
      comboBar.style.width = `${remaining * 100}%`;
      const levelProgress = eaten % 5;
      levelBar.style.width = `${levelProgress / 5 * 100}%`;
      nextElement.textContent = `${5 - levelProgress} pickup${5 - levelProgress === 1 ? "" : "s"}`;
      effectElement.classList.toggle("active", now < slowUntil);
      if (now < slowUntil) effectElement.textContent = "RAIN SLOW ACTIVE";
    }

    function resetRun(autostart = false) {
      snake = [{x:8,y:8},{x:7,y:8},{x:6,y:8},{x:5,y:8}];
      direction = { x:1, y:0 };
      directionQueue = [];
      obstacles = [];
      particles = [];
      score = 0;
      level = 1;
      eaten = 0;
      growth = 0;
      combo = 1;
      comboUntil = 0;
      slowUntil = 0;
      accumulator = 0;
      addObstacles(mode.obstacles);
      spawnFood("cherry");
      phase = autostart ? "running" : "ready";
      overlay.classList.toggle("hidden", autostart);
      overlayKicker.textContent = "NIGHT SHIFT READY";
      overlayTitle.textContent = "NEON SNAKE";
      overlayCopy.textContent = "Collect motel lights, build combos, and stay off the barriers.";
      startButton.textContent = "Start run";
      pauseButton.textContent = "Pause";
      setStatus(autostart ? "Run active. Follow the glow." : "Choose a route, then start the night run.");
      refreshHud();
      root.focus();
    }

    function startRun() {
      if (phase === "over") resetRun(true);
      else if (phase === "ready") {
        phase = "running";
        overlay.classList.add("hidden");
        setStatus("Run active. Follow the glow.", `${mode.short} ROUTE`);
      } else if (phase === "paused") togglePause();
      tone(330,.05,.018,"square");
      tone(495,.07,.018,"square",.06);
      root.focus();
    }

    function togglePause() {
      if (phase === "ready") { startRun(); return; }
      if (phase === "over") return;
      if (phase === "running") {
        phase = "paused";
        overlay.classList.remove("hidden");
        overlayKicker.textContent = "RAIN BREAK";
        overlayTitle.textContent = "PAUSED";
        overlayCopy.textContent = "The neon will wait. Take a breath.";
        startButton.textContent = "Resume run";
        pauseButton.textContent = "Resume";
        setStatus("Run paused.", "SIGNAL HELD");
      } else {
        phase = "running";
        overlay.classList.add("hidden");
        pauseButton.textContent = "Pause";
        setStatus("Run resumed. Follow the glow.", `${mode.short} ROUTE`);
        lastTime = performance.now();
      }
    }

    function queueDirection(next) {
      if (phase === "ready" || phase === "over") startRun();
      if (phase !== "running" || directionQueue.length >= 2) return;
      const reference = directionQueue[directionQueue.length - 1] || direction;
      if (next.x === -reference.x && next.y === -reference.y) return;
      if (next.x === reference.x && next.y === reference.y) return;
      directionQueue.push(next);
      tone(215,.018,.004,"sine");
    }

    function burst(cell, color, amount = 12) {
      const centerX = cell.x * CELL + CELL / 2, centerY = cell.y * CELL + CELL / 2;
      for (let index = 0; index < amount; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 35 + Math.random() * 95;
        particles.push({ x:centerX, y:centerY, vx:Math.cos(angle) * speed, vy:Math.sin(angle) * speed, life:.35 + Math.random() * .5, maxLife:.85, color });
      }
    }

    function shake() {
      root.classList.remove("snake-shake");
      void root.offsetWidth;
      root.classList.add("snake-shake");
      clearTimeout(shakeTimer);
      shakeTimer = setTimeout(() => root.classList.remove("snake-shake"), 180);
    }

    function eatFood(now) {
      const pickup = PICKUPS[food.type];
      combo = now < comboUntil ? Math.min(5, combo + 1) : 1;
      comboUntil = now + 4500;
      growth += pickup.growth;
      eaten += 1;
      score += Math.round(pickup.points * combo * mode.multiplier * (1 + (level - 1) * .08));
      burst(food, pickup.color, food.type === "firefly" ? 20 : 13);
      shake();
      if (food.type === "raindrop") {
        slowUntil = now + 5200;
        setStatus("Rain drop collected. Traffic slowed for five seconds.", "RAIN SLOW ACTIVE");
        tone(620,.08,.018,"sine");tone(420,.12,.014,"sine",.08);
      } else if (food.type === "firefly") {
        setStatus(`Firefly secured. Combo x${combo}.`, "+BONUS LIGHT");
        tone(523,.06,.021,"sine");tone(784,.11,.018,"sine",.07);
      } else {
        setStatus(`Neon cherry collected. Combo x${combo}.`, "+MOTEL LIGHT");
        tone(360 + combo * 45,.055,.018,"square");
      }
      const nextLevel = Math.floor(eaten / 5) + 1;
      if (nextLevel > level) {
        level = nextLevel;
        addObstacles(mode.obstacleGain);
        setStatus(`Level ${level}. The road is getting crowded.`, "SPEED UP");
        tone(440,.06,.02,"square");tone(660,.09,.02,"square",.07);
      }
      spawnFood();
      refreshHud(now);
    }

    function gameOver(reason) {
      phase = "over";
      burst(snake[0], "#ef747d", 34);
      shake();
      const isRecord = score > (Number(records[modeId]) || 0);
      if (isRecord) { records[modeId] = score; saveRecords(); }
      updateBest();
      overlay.classList.remove("hidden");
      overlayKicker.textContent = isRecord ? "NEW PERSONAL BEST" : "SIGNAL LOST";
      overlayTitle.textContent = "RUN OVER";
      overlayCopy.textContent = `${reason} Final score: ${String(score).padStart(6,"0")}.`;
      startButton.textContent = "Run again";
      setStatus(reason, isRecord ? "RECORD SAVED" : "CABINET READY");
      tone(150,.18,.028,"sawtooth");tone(92,.25,.02,"sawtooth",.12);
    }

    function advance(now) {
      if (directionQueue.length) direction = directionQueue.shift();
      const head = { x:snake[0].x + direction.x, y:snake[0].y + direction.y };
      if (mode.wrap) {
        head.x = (head.x + COLUMNS) % COLUMNS;
        head.y = (head.y + ROWS) % ROWS;
      } else if (head.x < 0 || head.x >= COLUMNS || head.y < 0 || head.y >= ROWS) {
        gameOver("You crossed the edge of the night grid.");
        return;
      }
      const body = growth > 0 ? snake : snake.slice(0, -1);
      if (body.some(cell => cell.x === head.x && cell.y === head.y)) { gameOver("The signal crossed its own trail."); return; }
      if (obstacles.some(cell => cell.x === head.x && cell.y === head.y)) { gameOver("You hit a rain-slick roadblock."); return; }
      snake.unshift(head);
      if (food && head.x === food.x && head.y === food.y) eatFood(now);
      if (growth > 0) growth -= 1;
      else snake.pop();
    }

    function roundedRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();ctx.moveTo(x + r,y);ctx.arcTo(x + width,y,x + width,y + height,r);ctx.arcTo(x + width,y + height,x,y + height,r);ctx.arcTo(x,y + height,x,y,r);ctx.arcTo(x,y,x + width,y,r);ctx.closePath();
    }

    function drawBackground(time) {
      const gradient = context.createLinearGradient(0,0,0,canvas.height);
      gradient.addColorStop(0,"#071c25");gradient.addColorStop(.58,"#092b31");gradient.addColorStop(1,"#07191e");
      context.fillStyle = gradient;context.fillRect(0,0,canvas.width,canvas.height);
      context.strokeStyle = "rgba(91,151,145,.12)";context.lineWidth = 1;
      for (let x=0;x<=canvas.width;x+=CELL){context.beginPath();context.moveTo(x,0);context.lineTo(x,canvas.height);context.stroke();}
      for (let y=0;y<=canvas.height;y+=CELL){context.beginPath();context.moveTo(0,y);context.lineTo(canvas.width,y);context.stroke();}
      context.save();context.globalAlpha=.14;context.fillStyle="#ed777e";context.font="700 34px Trebuchet MS";context.textAlign="right";context.fillText("AFTERGLOW",canvas.width-18,45);context.font="10px Courier New";context.fillStyle="#e8c27d";context.fillText("NIGHT GRID / ROUTE 03",canvas.width-20,62);context.restore();
      rain.forEach(drop => {
        drop.y += drop.speed / 60;drop.x -= drop.speed / 330;
        if(drop.y>canvas.height+20){drop.y=-20;drop.x=Math.random()*canvas.width;}
        context.strokeStyle=`rgba(164,205,201,${drop.alpha})`;context.beginPath();context.moveTo(drop.x,drop.y);context.lineTo(drop.x-2,drop.y+drop.length);context.stroke();
      });
      const glow = context.createRadialGradient(canvas.width*.63,canvas.height*.5,10,canvas.width*.63,canvas.height*.5,canvas.width*.45);glow.addColorStop(0,`rgba(225,103,116,${.035 + Math.sin(time*.002)*.012})`);glow.addColorStop(1,"rgba(0,0,0,0)");context.fillStyle=glow;context.fillRect(0,0,canvas.width,canvas.height);
    }

    function drawObstacles() {
      obstacles.forEach((cell,index) => {
        const x=cell.x*CELL+5,y=cell.y*CELL+5,size=CELL-10;
        context.save();context.shadowColor="#d96973";context.shadowBlur=9;context.fillStyle="#713f4a";roundedRect(context,x,y,size,size,3);context.fill();context.strokeStyle="#e47b82";context.lineWidth=2;context.stroke();context.strokeStyle="rgba(244,199,151,.7)";context.beginPath();context.moveTo(x+4,y+size-4);context.lineTo(x+size-4,y+4);context.stroke();if(index%2===0){context.fillStyle="#f0bf72";context.fillRect(x+size*.38,y-3,size*.24,4);}context.restore();
      });
    }

    function drawFood(time) {
      if(!food)return;
      const pickup=PICKUPS[food.type],cx=food.x*CELL+CELL/2,cy=food.y*CELL+CELL/2,pulse=1+Math.sin(time*.008)*.12;
      context.save();context.translate(cx,cy);context.scale(pulse,pulse);context.shadowColor=pickup.color;context.shadowBlur=16;context.fillStyle=pickup.color;context.strokeStyle=pickup.accent;context.lineWidth=2;
      if(food.type==="firefly"){context.rotate(time*.0015);context.beginPath();for(let i=0;i<8;i+=1){const radius=i%2?5:11,angle=i*Math.PI/4;context.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius);}context.closePath();context.fill();context.stroke();}
      else if(food.type==="raindrop"){context.beginPath();context.moveTo(0,-12);context.bezierCurveTo(10,0,10,10,0,12);context.bezierCurveTo(-10,10,-10,0,0,-12);context.fill();context.stroke();}
      else {context.beginPath();context.arc(-5,2,7,0,Math.PI*2);context.arc(6,2,7,0,Math.PI*2);context.fill();context.stroke();context.strokeStyle="#86b58c";context.beginPath();context.moveTo(0,-3);context.quadraticCurveTo(2,-12,10,-13);context.stroke();}
      context.restore();context.strokeStyle=`rgba(255,232,190,${.25+Math.sin(time*.006)*.15})`;context.beginPath();context.arc(cx,cy,18+Math.sin(time*.006)*3,0,Math.PI*2);context.stroke();
    }

    function drawSnake() {
      for(let index=snake.length-1;index>=0;index-=1){const cell=snake[index],x=cell.x*CELL+3,y=cell.y*CELL+3,size=CELL-6,t=index/Math.max(1,snake.length-1);context.save();context.shadowColor=index===0?"#f0c173":"#68c1ad";context.shadowBlur=index===0?15:8;context.fillStyle=index===0?"#efbf70":`hsl(${165-t*18} 38% ${54-t*19}%)`;roundedRect(context,x,y,size,size,index===0?8:6);context.fill();context.strokeStyle=index===0?"#fff0ba":"rgba(174,229,211,.58)";context.lineWidth=1.5;context.stroke();if(index>0&&index%3===0){context.fillStyle="rgba(239,117,126,.58)";context.fillRect(x+6,y+size*.44,size-12,2);}context.restore();}
      const head=snake[0];if(!head)return;const cx=head.x*CELL+CELL/2,cy=head.y*CELL+CELL/2;const side={x:-direction.y,y:direction.x};context.fillStyle="#173033";for(const offset of[-1,1]){context.beginPath();context.arc(cx+direction.x*6+side.x*offset*6,cy+direction.y*6+side.y*offset*6,2.6,0,Math.PI*2);context.fill();context.fillStyle="#f7eee0";context.beginPath();context.arc(cx+direction.x*6+side.x*offset*6-.7,cy+direction.y*6+side.y*offset*6-.7,.8,0,Math.PI*2);context.fill();context.fillStyle="#173033";}
    }

    function drawParticles(delta) {
      particles.forEach(particle=>{particle.x+=particle.vx*delta;particle.y+=particle.vy*delta;particle.vy+=35*delta;particle.life-=delta;context.globalAlpha=Math.max(0,particle.life/particle.maxLife);context.fillStyle=particle.color;context.fillRect(particle.x-2,particle.y-2,4,4);});context.globalAlpha=1;particles=particles.filter(particle=>particle.life>0);
    }

    function draw(time,delta) { drawBackground(time);drawObstacles();drawFood(time);drawSnake();drawParticles(delta); }

    function frame(time) {
      if(destroyed)return;
      const delta=Math.min(.05,(time-lastTime)/1000);lastTime=time;
      if(phase==="running"&&!helpPanel.classList.contains("hidden")) phase="paused";
      if(phase==="running"){
        if(food&&PICKUPS[food.type].life&&time-food.born>PICKUPS[food.type].life){spawnFood("cherry");setStatus("The bonus signal faded into the rain.","SIGNAL EXPIRED");}
        accumulator+=delta*1000;
        const base=Math.max(mode.minStep,mode.baseStep-(level-1)*mode.levelDrop);
        const step=time<slowUntil?base*1.38:base;
        let safety=0;while(accumulator>=step&&phase==="running"&&safety<3){accumulator-=step;advance(time);safety+=1;}
        if(combo>1&&time>comboUntil){combo=1;setStatus("Combo signal cooled off.",`${mode.short} ROUTE`);}
      }
      refreshHud(time);draw(time,delta);animationFrame=requestAnimationFrame(frame);
    }

    function selectMode(nextMode) {
      if(!MODES[nextMode])return;
      modeId=nextMode;mode=MODES[modeId];localStorage.setItem("afterglow-snake-mode",modeId);
      root.querySelectorAll("[data-snake-mode]").forEach(button=>button.classList.toggle("active",button.dataset.snakeMode===modeId));
      updateBest();resetRun(false);setStatus(`${mode.label} selected. ${mode.note}`,`${mode.short} READY`);tone(280,.05,.014,"square");
    }

    function openHelp() {
      resumeAfterHelp=phase==="running";
      if(resumeAfterHelp)phase="paused";
      helpPanel.classList.remove("hidden");root.querySelector("[data-snake-help-close]").focus();
    }
    function closeHelp() {helpPanel.classList.add("hidden");if(resumeAfterHelp){phase="running";lastTime=performance.now();}resumeAfterHelp=false;root.focus();}

    const DIRECTIONS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    function onKeyDown(event){const key=event.key.toLowerCase();const next=key==="arrowup"||key==="w"?DIRECTIONS.up:key==="arrowdown"||key==="s"?DIRECTIONS.down:key==="arrowleft"||key==="a"?DIRECTIONS.left:key==="arrowright"||key==="d"?DIRECTIONS.right:null;if(next){event.preventDefault();queueDirection(next);}else if(key===" "||key==="p"){event.preventDefault();togglePause();}else if(key==="n"){event.preventDefault();resetRun(true);}else if(key==="escape"&&!helpPanel.classList.contains("hidden")){event.preventDefault();closeHelp();}else if(key==="enter"&&(phase==="ready"||phase==="over")){event.preventDefault();startRun();}}

    root.addEventListener("keydown",onKeyDown);
    root.querySelector("[data-snake-new]").onclick=()=>resetRun(true);
    pauseButton.onclick=togglePause;
    root.querySelector("[data-snake-help]").onclick=openHelp;
    root.querySelector("[data-snake-help-close]").onclick=closeHelp;
    startButton.onclick=startRun;
    root.querySelectorAll("[data-snake-mode]").forEach(button=>button.onclick=()=>selectMode(button.dataset.snakeMode));
    root.querySelectorAll("[data-snake-direction]").forEach(button=>button.addEventListener("pointerdown",event=>{event.preventDefault();queueDirection(DIRECTIONS[button.dataset.snakeDirection]);root.focus();}));
    soundButton.onclick=()=>{soundOn=!soundOn;soundButton.textContent=`Sound: ${soundOn?"on":"off"}`;soundButton.setAttribute("aria-pressed",String(soundOn));if(soundOn)tone(380,.06,.016,"sine");};

    root.querySelectorAll("[data-snake-mode]").forEach(button=>button.classList.toggle("active",button.dataset.snakeMode===modeId));
    updateBest();resetRun(false);animationFrame=requestAnimationFrame(frame);

    return {
      element:root,
      focus(){root.focus();},
      snapshot(){return {phase,mode:modeId,score,level,length:snake.length,food:food?.type,obstacles:obstacles.length};},
      destroy(){destroyed=true;cancelAnimationFrame(animationFrame);clearTimeout(shakeTimer);root.removeEventListener("keydown",onKeyDown);if(audioContext&&audioContext.state!=="closed")audioContext.close();}
    };
  };
})();
