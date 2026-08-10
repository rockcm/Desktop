(() => {
  "use strict";

  const LEVELS = {
    beginner: { label: "Beginner", rows: 9, columns: 9, mines: 10 },
    intermediate: { label: "Intermediate", rows: 16, columns: 16, mines: 40 },
    expert: { label: "Expert", rows: 16, columns: 30, mines: 99 }
  };

  window.createAfterglowMinesweeper = function createAfterglowMinesweeper() {
    const root = document.createElement("div");
    root.className = "minesweeper-app";
    root.tabIndex = 0;
    root.innerHTML = `
      <div class="mine-menubar" role="toolbar" aria-label="Minesweeper game options">
        <button type="button" data-mine-new><u>G</u>ame</button>
        <span class="mine-menu-divider"></span>
        ${Object.entries(LEVELS).map(([id, level]) => `<button type="button" data-mine-level="${id}">${level.label}</button>`).join("")}
        <span class="mine-menu-title">NIGHT MINES / AFTERGLOW 97</span>
      </div>
      <div class="mine-workspace">
        <section class="mine-game-pane" aria-label="Minesweeper game">
          <div class="mine-scorebar">
            <div class="mine-counter" aria-label="Mines remaining"><span>MINES</span><strong data-mine-counter>010</strong></div>
            <button type="button" class="mine-face" data-mine-face aria-label="Start a new game">:-)</button>
            <div class="mine-counter" aria-label="Elapsed time"><span>TIME</span><strong data-mine-time>000</strong></div>
          </div>
          <div class="mine-board-rack">
            <div class="mine-board" data-mine-board role="grid" aria-label="Minesweeper board"></div>
          </div>
          <div class="mine-statusbar">
            <span class="mine-status-light"></span>
            <span data-mine-status>Pick a square. Your first move is always safe.</span>
          </div>
        </section>
        <aside class="mine-sidebar">
          <div class="mine-brand">
            <span>AFTERGLOW SOFTWARE</span>
            <strong>NIGHT<br>MINES</strong>
            <small>RAINY DESKTOP EDITION</small>
          </div>
          <div class="mine-info-card">
            <span>FIELD</span>
            <strong data-mine-field>9 × 9</strong>
            <small data-mine-total>10 hidden mines</small>
          </div>
          <div class="mine-info-card best">
            <span>PERSONAL BEST</span>
            <strong data-mine-best>—</strong>
            <small data-mine-best-label>Beginner record</small>
          </div>
          <button type="button" class="mine-mode-button" data-mine-flag-mode aria-pressed="false"><i></i><span><b>Reveal mode</b><small>Tap squares to uncover</small></span></button>
          <button type="button" class="mine-sound-button" data-mine-sound aria-pressed="true">Sound: on</button>
          <div class="mine-help">
            <b>CLICK</b> reveal a square<br>
            <b>RIGHT CLICK / F</b> place a flag<br>
            <b>DOUBLE CLICK</b> clear around a number<br>
            <b>ARROWS</b> move keyboard focus<br>
            <b>N</b> start a new field
          </div>
        </aside>
      </div>`;

    const boardElement = root.querySelector("[data-mine-board]");
    const counterElement = root.querySelector("[data-mine-counter]");
    const timeElement = root.querySelector("[data-mine-time]");
    const statusElement = root.querySelector("[data-mine-status]");
    const faceButton = root.querySelector("[data-mine-face]");
    const fieldElement = root.querySelector("[data-mine-field]");
    const totalElement = root.querySelector("[data-mine-total]");
    const bestElement = root.querySelector("[data-mine-best]");
    const bestLabelElement = root.querySelector("[data-mine-best-label]");
    const flagModeButton = root.querySelector("[data-mine-flag-mode]");
    const soundButton = root.querySelector("[data-mine-sound]");

    let difficulty = "beginner";
    let settings = LEVELS[difficulty];
    let board = [];
    let started = false;
    let gameOver = false;
    let won = false;
    let flags = 0;
    let revealed = 0;
    let elapsed = 0;
    let explodedIndex = -1;
    let timer = null;
    let startTime = 0;
    let flagMode = false;
    let soundOn = true;
    let audioContext = null;
    let suppressTap = false;
    let pressTimer = null;
    let bestTimes = loadBestTimes();

    function loadBestTimes() {
      try {
        const saved = JSON.parse(localStorage.getItem("afterglow-minesweeper-best"));
        return saved && typeof saved === "object" ? saved : {};
      } catch (_) {
        return {};
      }
    }

    function saveBestTime() {
      const previous = bestTimes[difficulty] === undefined ? Infinity : Number(bestTimes[difficulty]);
      if (elapsed < previous) {
        bestTimes[difficulty] = elapsed;
        localStorage.setItem("afterglow-minesweeper-best", JSON.stringify(bestTimes));
        statusElement.textContent = `New ${settings.label.toLowerCase()} record: ${elapsed} seconds.`;
      }
    }

    function tone(frequency, duration = 0.045, volume = 0.018, type = "square") {
      if (!soundOn) return;
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      } catch (_) { /* audio is optional */ }
    }

    function formatDisplay(value) {
      const bounded = Math.max(-99, Math.min(999, value));
      return bounded < 0 ? `-${String(Math.abs(bounded)).padStart(2, "0")}` : String(bounded).padStart(3, "0");
    }

    function neighborsOf(index) {
      const row = Math.floor(index / settings.columns);
      const column = index % settings.columns;
      const neighbors = [];
      for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
        for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
          if (!rowOffset && !columnOffset) continue;
          const nextRow = row + rowOffset;
          const nextColumn = column + columnOffset;
          if (nextRow >= 0 && nextRow < settings.rows && nextColumn >= 0 && nextColumn < settings.columns) {
            neighbors.push(nextRow * settings.columns + nextColumn);
          }
        }
      }
      return neighbors;
    }

    function placeMines(firstIndex) {
      const protectedCells = new Set([firstIndex, ...neighborsOf(firstIndex)]);
      const candidates = board.map((_, index) => index).filter(index => !protectedCells.has(index));
      for (let index = candidates.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [candidates[index], candidates[swapIndex]] = [candidates[swapIndex], candidates[index]];
      }
      candidates.slice(0, settings.mines).forEach(index => { board[index].mine = true; });
      board.forEach((cell, index) => {
        cell.adjacent = neighborsOf(index).filter(neighbor => board[neighbor].mine).length;
      });
    }

    function startClock(firstIndex) {
      placeMines(firstIndex);
      started = true;
      startTime = performance.now();
      timer = setInterval(() => {
        elapsed = Math.min(999, Math.floor((performance.now() - startTime) / 1000));
        timeElement.textContent = formatDisplay(elapsed);
      }, 200);
      statusElement.textContent = "Field active. Listen to the rain and take your time.";
    }

    function stopClock() {
      if (timer) clearInterval(timer);
      timer = null;
      if (started) elapsed = Math.min(999, Math.floor((performance.now() - startTime) / 1000));
      timeElement.textContent = formatDisplay(elapsed);
    }

    function cellLabel(cell, index) {
      const row = Math.floor(index / settings.columns) + 1;
      const column = index % settings.columns + 1;
      if (cell.flagged) return `Flagged square, row ${row}, column ${column}`;
      if (!cell.revealed) return `Covered square, row ${row}, column ${column}`;
      if (cell.mine) return `Mine, row ${row}, column ${column}`;
      return `${cell.adjacent || "Empty"}, row ${row}, column ${column}`;
    }

    function refreshBoard() {
      board.forEach((cell, index) => {
        const button = boardElement.children[index];
        const wrongFlag = gameOver && cell.flagged && !cell.mine;
        button.className = "mine-cell";
        button.textContent = "";
        if (cell.revealed) button.classList.add("revealed");
        if (cell.revealed && cell.adjacent && !cell.mine) {
          button.classList.add(`number-${cell.adjacent}`);
          button.textContent = String(cell.adjacent);
        }
        if (cell.flagged && !wrongFlag) {
          button.classList.add("flagged");
          button.textContent = "⚑";
        }
        if (cell.revealed && cell.mine && !cell.flagged) {
          button.classList.add("mine");
          button.textContent = "✹";
        }
        if (index === explodedIndex) button.classList.add("exploded");
        if (wrongFlag) {
          button.classList.add("wrong-flag");
          button.textContent = "×";
        }
        button.setAttribute("aria-label", cellLabel(cell, index));
        button.setAttribute("aria-pressed", String(cell.flagged));
      });
      counterElement.textContent = formatDisplay(settings.mines - flags);
      root.classList.toggle("game-won", won);
      root.classList.toggle("game-lost", gameOver && !won);
    }

    function checkWin() {
      if (revealed !== board.length - settings.mines) return false;
      won = true;
      gameOver = true;
      board.forEach(cell => {
        if (cell.mine && !cell.flagged) {
          cell.flagged = true;
          flags += 1;
        }
      });
      stopClock();
      faceButton.textContent = "B-)";
      statusElement.textContent = `Field cleared in ${elapsed} seconds. The night is yours.`;
      saveBestTime();
      updateBestPanel();
      tone(523, 0.08, 0.026, "sine");
      setTimeout(() => tone(659, 0.08, 0.026, "sine"), 90);
      setTimeout(() => tone(784, 0.13, 0.026, "sine"), 180);
      return true;
    }

    function lose(index) {
      gameOver = true;
      explodedIndex = index;
      board.forEach(cell => { if (cell.mine) cell.revealed = true; });
      stopClock();
      faceButton.textContent = "X-(";
      statusElement.textContent = "Mine found. The field has been marked for your next shift.";
      tone(110, 0.22, 0.035, "sawtooth");
      refreshBoard();
    }

    function reveal(index) {
      if (gameOver || board[index].flagged || board[index].revealed) return;
      if (!started) startClock(index);
      if (board[index].mine) {
        lose(index);
        return;
      }
      const queue = [index];
      const queued = new Set(queue);
      while (queue.length) {
        const currentIndex = queue.shift();
        const cell = board[currentIndex];
        if (cell.revealed || cell.flagged || cell.mine) continue;
        cell.revealed = true;
        revealed += 1;
        if (cell.adjacent === 0) {
          neighborsOf(currentIndex).forEach(neighborIndex => {
            if (!queued.has(neighborIndex) && !board[neighborIndex].mine && !board[neighborIndex].flagged) {
              queued.add(neighborIndex);
              queue.push(neighborIndex);
            }
          });
        }
      }
      tone(board[index].adjacent ? 270 : 220, 0.022, 0.008, "sine");
      checkWin();
      refreshBoard();
    }

    function toggleFlag(index) {
      const cell = board[index];
      if (gameOver || cell.revealed) return;
      cell.flagged = !cell.flagged;
      flags += cell.flagged ? 1 : -1;
      tone(cell.flagged ? 430 : 340, 0.035, 0.012, "square");
      refreshBoard();
    }

    function chord(index) {
      const cell = board[index];
      if (gameOver || !cell.revealed || !cell.adjacent) return;
      const neighbors = neighborsOf(index);
      if (neighbors.filter(neighbor => board[neighbor].flagged).length !== cell.adjacent) {
        statusElement.textContent = `This ${cell.adjacent} still needs the matching number of flags.`;
        tone(150, 0.04, 0.012, "square");
        return;
      }
      for (const neighbor of neighbors) {
        if (!board[neighbor].flagged && board[neighbor].mine) {
          lose(neighbor);
          return;
        }
      }
      neighbors.forEach(neighbor => reveal(neighbor));
    }

    function focusNeighbor(index, key) {
      const row = Math.floor(index / settings.columns);
      const column = index % settings.columns;
      const nextRow = Math.max(0, Math.min(settings.rows - 1, row + (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0)));
      const nextColumn = Math.max(0, Math.min(settings.columns - 1, column + (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0)));
      boardElement.children[nextRow * settings.columns + nextColumn].focus();
    }

    function buildBoard() {
      boardElement.innerHTML = "";
      boardElement.style.setProperty("--mine-columns", settings.columns);
      const fragment = document.createDocumentFragment();
      board.forEach((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mine-cell";
        button.setAttribute("role", "gridcell");
        button.addEventListener("click", () => {
          if (suppressTap) { suppressTap = false; return; }
          flagMode ? toggleFlag(index) : reveal(index);
        });
        button.addEventListener("dblclick", event => {
          event.preventDefault();
          chord(index);
        });
        button.addEventListener("contextmenu", event => {
          event.preventDefault();
          toggleFlag(index);
        });
        button.addEventListener("pointerdown", event => {
          if (event.pointerType === "touch" || event.pointerType === "pen") {
            pressTimer = setTimeout(() => {
              suppressTap = true;
              toggleFlag(index);
              if (navigator.vibrate) navigator.vibrate(24);
            }, 430);
          } else if (!gameOver) {
            faceButton.textContent = ":-o";
          }
        });
        button.addEventListener("pointerup", () => {
          if (pressTimer) clearTimeout(pressTimer);
          pressTimer = null;
          if (!gameOver) faceButton.textContent = ":-)";
        });
        button.addEventListener("pointercancel", () => {
          if (pressTimer) clearTimeout(pressTimer);
          pressTimer = null;
          if (!gameOver) faceButton.textContent = ":-)";
        });
        button.addEventListener("keydown", event => {
          if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
            event.preventDefault();
            focusNeighbor(index, event.key);
          } else if (event.key.toLowerCase() === "f") {
            event.preventDefault();
            toggleFlag(index);
          } else if (event.key === "Enter") {
            event.preventDefault();
            reveal(index);
          }
        });
        fragment.append(button);
      });
      boardElement.append(fragment);
    }

    function updateBestPanel() {
      const hasBest = bestTimes[difficulty] !== undefined;
      const best = Number(bestTimes[difficulty]);
      bestElement.textContent = hasBest ? `${best} SEC` : "—";
      bestLabelElement.textContent = `${settings.label} record`;
    }

    function newGame(nextDifficulty = difficulty) {
      if (timer) clearInterval(timer);
      difficulty = LEVELS[nextDifficulty] ? nextDifficulty : difficulty;
      settings = LEVELS[difficulty];
      board = Array.from({ length: settings.rows * settings.columns }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }));
      started = false;
      gameOver = false;
      won = false;
      flags = 0;
      revealed = 0;
      elapsed = 0;
      explodedIndex = -1;
      timer = null;
      root.dataset.difficulty = difficulty;
      root.querySelectorAll("[data-mine-level]").forEach(button => button.classList.toggle("active", button.dataset.mineLevel === difficulty));
      timeElement.textContent = "000";
      faceButton.textContent = ":-)";
      fieldElement.textContent = `${settings.columns} × ${settings.rows}`;
      totalElement.textContent = `${settings.mines} hidden mines`;
      statusElement.textContent = "Pick a square. Your first move is always safe.";
      updateBestPanel();
      buildBoard();
      refreshBoard();
      setTimeout(() => boardElement.firstElementChild?.focus(), 0);
    }

    root.querySelector("[data-mine-new]").addEventListener("click", () => newGame());
    faceButton.addEventListener("click", () => newGame());
    root.querySelectorAll("[data-mine-level]").forEach(button => {
      button.addEventListener("click", () => newGame(button.dataset.mineLevel));
    });
    flagModeButton.addEventListener("click", () => {
      flagMode = !flagMode;
      flagModeButton.classList.toggle("active", flagMode);
      flagModeButton.setAttribute("aria-pressed", String(flagMode));
      flagModeButton.querySelector("b").textContent = flagMode ? "Flag mode" : "Reveal mode";
      flagModeButton.querySelector("small").textContent = flagMode ? "Tap squares to mark" : "Tap squares to uncover";
      statusElement.textContent = flagMode ? "Flag mode active. Tap suspected mines." : "Reveal mode active. Tap to uncover squares.";
      tone(flagMode ? 470 : 360, 0.04, 0.012, "square");
    });
    soundButton.addEventListener("click", () => {
      soundOn = !soundOn;
      soundButton.textContent = `Sound: ${soundOn ? "on" : "off"}`;
      soundButton.setAttribute("aria-pressed", String(soundOn));
      if (soundOn) tone(440, 0.04, 0.014, "square");
    });
    root.addEventListener("keydown", event => {
      if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        newGame();
      }
    });

    newGame();

    return {
      element: root,
      focus() { boardElement.firstElementChild?.focus(); },
      destroy() {
        if (timer) clearInterval(timer);
        if (pressTimer) clearTimeout(pressTimer);
        if (audioContext) audioContext.close();
      }
    };
  };
})();
