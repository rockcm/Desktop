(() => {
  "use strict";

  const STORAGE_KEY = "afterglow-solitaire-v1";
  const SUITS = {
    hearts: { symbol: "&hearts;", label: "Hearts", color: "red" },
    diamonds: { symbol: "&diams;", label: "Diamonds", color: "red" },
    clubs: { symbol: "&clubs;", label: "Clubs", color: "black" },
    spades: { symbol: "&spades;", label: "Spades", color: "black" }
  };
  const SUIT_ORDER = Object.keys(SUITS);
  const RANK_LABELS = { 1:"A", 11:"J", 12:"Q", 13:"K" };

  window.createAfterglowSolitaire = function createAfterglowSolitaire() {
    const root = document.createElement("section");
    root.className = "solitaire-app";
    root.tabIndex = 0;
    root.setAttribute("aria-label", "Afterglow Solitaire game");
    root.innerHTML = `
      <div class="solitaire-menubar" role="toolbar" aria-label="Solitaire options">
        <button type="button" data-sol-new><u>G</u>ame</button>
        <button type="button" data-sol-undo disabled><u>U</u>ndo</button>
        <button type="button" data-sol-help><u>H</u>ow to play</button>
        <span class="sol-menu-title">AFTERGLOW CARD ROOM / TABLE 07</span>
      </div>
      <div class="solitaire-workspace">
        <main class="solitaire-main">
          <div class="solitaire-scorebar">
            <div><span>SCORE</span><strong data-sol-score>0000</strong></div>
            <div><span>MOVES</span><strong data-sol-moves>000</strong></div>
            <div><span>TIME</span><strong data-sol-time>00:00</strong></div>
            <div class="sol-progress"><span>FOUNDATION</span><strong data-sol-progress>0 / 52</strong><i><b data-sol-progress-bar></b></i></div>
          </div>
          <div class="solitaire-table" data-sol-table aria-label="Klondike solitaire table">
            <div class="sol-top-row">
              <div class="sol-pile-wrap"><span>STOCK</span><div class="sol-slot" data-sol-stock></div></div>
              <div class="sol-pile-wrap"><span>WASTE</span><div class="sol-slot" data-sol-waste></div></div>
              <div class="sol-top-spacer"><b>AFTERGLOW</b><span>RAINY NIGHT SOLITAIRE</span></div>
              ${SUIT_ORDER.map((suit) => `<div class="sol-pile-wrap foundation-${suit}"><span>${SUITS[suit].label.toUpperCase()}</span><div class="sol-slot sol-foundation" data-sol-foundation="${suit}" aria-label="${SUITS[suit].label} foundation"><i>${SUITS[suit].symbol}</i></div></div>`).join("")}
            </div>
            <div class="sol-tableau" data-sol-tableau-board></div>
            <div class="sol-help-panel hidden" data-sol-help-panel role="dialog" aria-modal="true" aria-label="How to play Solitaire">
              <button type="button" data-sol-help-close aria-label="Close instructions">&times;</button>
              <span>AFTERGLOW CARD ROOM FIELD GUIDE</span>
              <h2>Build through the rain</h2>
              <div class="sol-help-grid">
                <p><b>TABLEAU</b><br>Build downward in alternating red and black suits. Move any correctly ordered face-up stack.</p>
                <p><b>FOUNDATIONS</b><br>Build each suit upward from Ace to King. Double-click an eligible card to send it home.</p>
                <p><b>STOCK</b><br>Turn one card at a time. When empty, click the outline to recycle the waste pile.</p>
                <p><b>EMPTY COLUMN</b><br>Only a King, alone or heading a sequence, can move into an empty tableau column.</p>
              </div>
              <p>Drag cards, or click once to select and click a destination. <b>Ctrl+Z</b> undoes, <b>N</b> deals, and <b>H</b> opens this guide.</p>
            </div>
            <div class="sol-win-panel hidden" data-sol-win-panel>
              <span>ALL SUITS HOME</span><strong>NIGHT SHIFT COMPLETE</strong><p data-sol-win-copy></p>
              <button type="button" data-sol-win-new>Deal another hand</button>
            </div>
            <div class="sol-sparks" data-sol-sparks aria-hidden="true"></div>
          </div>
          <div class="solitaire-statusbar"><i></i><span data-sol-status>Click the stock to turn a card.</span><b data-sol-signal>TABLE READY</b></div>
        </main>
        <aside class="solitaire-sidebar">
          <div class="sol-brand"><span>AFTERGLOW MOTOR LODGE</span><strong>NIGHT<br>SOLITAIRE</strong><small>KLONDIKE / DRAW ONE</small></div>
          <div class="sol-record"><span>PERSONAL BEST</span><strong data-sol-best>NO WINS YET</strong><small data-sol-best-copy>Finish a table to set a record</small></div>
          <div class="sol-guide">
            <span>QUICK GUIDE</span>
            <p><i class="red"></i> Red on black</p><p><i class="black"></i> Black on red</p>
            <p><b>A &rarr; K</b> Same-suit foundations</p><p><b>K</b> Opens an empty column</p>
          </div>
          <button type="button" class="sol-auto" data-sol-auto>Auto-finish available cards</button>
          <button type="button" class="sol-sound" data-sol-sound aria-pressed="true">Sound: on</button>
          <div class="sol-tip"><b>CLICK / DRAG</b> move cards<br><b>DOUBLE CLICK</b> send to foundation<br><b>CTRL + Z</b> undo &nbsp; <b>N</b> new deal</div>
        </aside>
      </div>`;

    const table = root.querySelector("[data-sol-table]");
    const stockElement = root.querySelector("[data-sol-stock]");
    const wasteElement = root.querySelector("[data-sol-waste]");
    const tableauElement = root.querySelector("[data-sol-tableau-board]");
    const helpPanel = root.querySelector("[data-sol-help-panel]");
    const winPanel = root.querySelector("[data-sol-win-panel]");
    const undoButton = root.querySelector("[data-sol-undo]");
    const soundButton = root.querySelector("[data-sol-sound]");
    const statusElement = root.querySelector("[data-sol-status]");
    const signalElement = root.querySelector("[data-sol-signal]");
    const scoreElement = root.querySelector("[data-sol-score]");
    const movesElement = root.querySelector("[data-sol-moves]");
    const timeElement = root.querySelector("[data-sol-time]");
    const progressElement = root.querySelector("[data-sol-progress]");
    const progressBar = root.querySelector("[data-sol-progress-bar]");
    const bestElement = root.querySelector("[data-sol-best]");
    const bestCopy = root.querySelector("[data-sol-best-copy]");

    let stock = [];
    let waste = [];
    let tableau = Array.from({ length:7 }, () => []);
    let foundations = Object.fromEntries(SUIT_ORDER.map((suit) => [suit, []]));
    let selected = null;
    let undoStack = [];
    let score = 0;
    let moves = 0;
    let elapsed = 0;
    let startedAt = 0;
    let running = false;
    let won = false;
    let destroyed = false;
    let soundOn = true;
    let audioContext = null;
    let stats = loadStats();
    let statusTimer = null;

    function loadStats() {
      try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return value && typeof value === "object" ? value : { wins:0, bestTime:null, bestMoves:null };
      } catch (_) { return { wins:0, bestTime:null, bestMoves:null }; }
    }

    function saveStats() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (_) { /* Storage can be unavailable. */ }
    }

    function tone(frequency, duration = .055, volume = .018, type = "sine", delay = 0) {
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
        oscillator.start(start); oscillator.stop(start + duration);
      } catch (_) { /* Audio is optional. */ }
    }

    function rankLabel(rank) { return RANK_LABELS[rank] || String(rank); }
    function formatTime(seconds) {
      const safe = Math.max(0, Math.floor(seconds));
      return `${String(Math.floor(safe / 60)).padStart(2,"0")}:${String(safe % 60).padStart(2,"0")}`;
    }

    function currentElapsed() { return running ? Math.floor((Date.now() - startedAt) / 1000) : elapsed; }

    function beginClock() {
      if (running || won) return;
      running = true;
      startedAt = Date.now() - elapsed * 1000;
    }

    function createDeck() {
      const deck = [];
      SUIT_ORDER.forEach((suit) => {
        for (let rank = 1; rank <= 13; rank += 1) deck.push({ id:`${suit}-${rank}`, suit, rank, faceUp:false });
      });
      for (let index = deck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
      }
      return deck;
    }

    function cloneCards(cards) { return cards.map((card) => ({ ...card })); }

    function snapshotState() {
      return {
        stock:cloneCards(stock), waste:cloneCards(waste),
        tableau:tableau.map(cloneCards),
        foundations:Object.fromEntries(SUIT_ORDER.map((suit) => [suit, cloneCards(foundations[suit])])),
        score, moves, elapsed:currentElapsed(), running, won
      };
    }

    function pushUndo() {
      undoStack.push(snapshotState());
      if (undoStack.length > 80) undoStack.shift();
      undoButton.disabled = false;
    }

    function restoreState(state) {
      stock=cloneCards(state.stock); waste=cloneCards(state.waste);
      tableau=state.tableau.map(cloneCards);
      foundations=Object.fromEntries(SUIT_ORDER.map((suit) => [suit, cloneCards(state.foundations[suit])]));
      score=state.score; moves=state.moves; elapsed=state.elapsed; running=state.running; won=state.won;
      if (running) startedAt=Date.now()-elapsed*1000;
      selected=null; winPanel.classList.add("hidden"); root.classList.remove("solitaire-won");
      render();
    }

    function undo() {
      if (!undoStack.length) return;
      const state=undoStack.pop(); restoreState(state);
      undoButton.disabled=!undoStack.length;
      setStatus("Last move undone.", "UNDO COMPLETE"); tone(260,.045,.012,"triangle");
    }

    function deal() {
      const deck=createDeck();
      tableau=Array.from({length:7},()=>[]); foundations=Object.fromEntries(SUIT_ORDER.map((suit)=>[suit,[]])); waste=[];
      for(let column=0;column<7;column+=1){
        for(let row=0;row<=column;row+=1){const card=deck.pop();card.faceUp=row===column;tableau[column].push(card);}
      }
      stock=deck; stock.forEach((card)=>{card.faceUp=false;});
      selected=null; undoStack=[]; score=0; moves=0; elapsed=0; running=false; won=false;
      winPanel.classList.add("hidden"); root.classList.remove("solitaire-won"); undoButton.disabled=true;
      render(); setStatus("Fresh deck. Click the stock to turn a card.","TABLE READY"); tone(190,.045,.012,"square");tone(250,.04,.01,"square",.05);
      root.focus();
    }

    function setStatus(message, signal="TABLE ACTIVE") {
      statusElement.textContent=message; signalElement.textContent=signal;
      signalElement.classList.add("active"); clearTimeout(statusTimer);
      statusTimer=setTimeout(()=>signalElement.classList.remove("active"),900);
    }

    function cardColor(card) { return SUITS[card.suit].color; }
    function canPlaceOnTableau(card, column) {
      const target=tableau[column][tableau[column].length-1];
      return target ? target.faceUp && target.rank===card.rank+1 && cardColor(target)!==cardColor(card) : card.rank===13;
    }
    function canPlaceOnFoundation(card, suit) {
      if(card.suit!==suit)return false;
      const pile=foundations[suit]; const target=pile[pile.length-1];
      return target ? card.rank===target.rank+1 : card.rank===1;
    }
    function validSequence(cards) {
      return cards.every((card,index)=>index===0 || (cards[index-1].rank===card.rank+1 && cardColor(cards[index-1])!==cardColor(card) && card.faceUp));
    }

    function getSelectionCards(source=selected) {
      if(!source)return [];
      if(source.kind==="waste")return waste.length?[waste[waste.length-1]]:[];
      if(source.kind==="foundation")return foundations[source.suit].length?[foundations[source.suit][foundations[source.suit].length-1]]:[];
      if(source.kind==="tableau")return tableau[source.column].slice(source.index);
      return [];
    }

    function sourceKey(source) { return source ? `${source.kind}:${source.column??source.suit??""}:${source.index??""}` : ""; }

    function takeSelection(source) {
      if(source.kind==="waste")return [waste.pop()];
      if(source.kind==="foundation")return [foundations[source.suit].pop()];
      return tableau[source.column].splice(source.index);
    }

    function revealExposed(column) {
      if(column==null)return false;
      const cards=tableau[column]; const top=cards[cards.length-1];
      if(top&&!top.faceUp){top.faceUp=true;score+=5;tone(410,.04,.012,"triangle");return true;}
      return false;
    }

    function finalizeMove(source, points, message) {
      if(source.kind==="tableau")revealExposed(source.column);
      score=Math.max(0,score+points);moves+=1;selected=null;beginClock();tone(330,.04,.014,"triangle");tone(440,.04,.01,"triangle",.035);
      setStatus(message,"MOVE ACCEPTED");render();checkWin();
    }

    function moveToTableau(column, source=selected) {
      const cards=getSelectionCards(source); if(!cards.length||!validSequence(cards)||!canPlaceOnTableau(cards[0],column))return false;
      if(source.kind==="tableau"&&source.column===column)return false;
      pushUndo(); const moving=takeSelection(source);tableau[column].push(...moving);
      const points=source.kind==="waste"?5:source.kind==="foundation"?-15:0;
      finalizeMove(source,points,`${rankLabel(moving[0].rank)} of ${SUITS[moving[0].suit].label} moved to column ${column+1}.`);return true;
    }

    function moveToFoundation(suit, source=selected) {
      const cards=getSelectionCards(source);if(cards.length!==1||!canPlaceOnFoundation(cards[0],suit))return false;
      pushUndo();const moving=takeSelection(source)[0];foundations[suit].push(moving);
      finalizeMove(source,10,`${rankLabel(moving.rank)} of ${SUITS[moving.suit].label} moved home.`);return true;
    }

    function selectSource(source) {
      const cards=getSelectionCards(source);
      if(!cards.length||!cards[0].faceUp||!validSequence(cards)){selected=null;render();return;}
      selected=source;render();setStatus(`${rankLabel(cards[0].rank)} of ${SUITS[cards[0].suit].label} selected. Choose a destination.`,cards.length>1?`${cards.length} CARD STACK`:"CARD SELECTED");
      tone(240,.025,.009,"sine");
    }

    function sourceFromElement(element) {
      const card=element.closest("[data-sol-card]");if(!card)return null;
      const kind=card.dataset.source;
      if(kind==="waste")return {kind:"waste"};
      if(kind==="foundation")return {kind:"foundation",suit:card.dataset.suit};
      if(kind==="tableau")return {kind:"tableau",column:Number(card.dataset.column),index:Number(card.dataset.index)};
      return null;
    }

    function handleCardClick(source) {
      if(!source)return;
      if(selected){
        if(sourceKey(selected)===sourceKey(source)){selected=null;render();return;}
        if(source.kind==="tableau"&&moveToTableau(source.column))return;
        if(source.kind==="foundation"&&moveToFoundation(source.suit))return;
      }
      selectSource(source);
    }

    function autoFoundation(source) {
      const card=getSelectionCards(source)[0];
      if(!card)return false;
      if(moveToFoundation(card.suit,source))return true;
      setStatus("That card cannot move to its foundation yet.","MOVE BLOCKED");tone(135,.06,.014,"square");return false;
    }

    function drawStock() {
      if(won)return;
      pushUndo();beginClock();moves+=1;selected=null;
      if(stock.length){const card=stock.pop();card.faceUp=true;waste.push(card);score+=5;setStatus(`${rankLabel(card.rank)} of ${SUITS[card.suit].label} turned from the stock.`,"CARD DRAWN");tone(300,.035,.012,"triangle");}
      else if(waste.length){stock=waste.reverse();waste=[];stock.forEach((card)=>card.faceUp=false);score=Math.max(0,score-25);setStatus("Waste returned to the stock.","STOCK RECYCLED");tone(190,.06,.012,"square");}
      else {undoStack.pop();undoButton.disabled=!undoStack.length;setStatus("The stock and waste are empty.","NO CARDS");}
      render();
    }

    function autoFinish() {
      if(won)return;
      let source=null;
      if(waste.length&&canPlaceOnFoundation(waste[waste.length-1],waste[waste.length-1].suit))source={kind:"waste"};
      if(!source){
        for(let column=0;column<7;column+=1){const pile=tableau[column],card=pile[pile.length-1];if(card&&card.faceUp&&canPlaceOnFoundation(card,card.suit)){source={kind:"tableau",column,index:pile.length-1};break;}}
      }
      if(source){autoFoundation(source);setTimeout(()=>{if(!destroyed&&!won)autoFinish();},145);}
      else setStatus("No safe foundation moves are available right now.","AUTO-FINISH IDLE");
    }

    function cardMarkup(card,source,details={}) {
      const label=`${rankLabel(card.rank)} of ${SUITS[card.suit].label}`;
      if(!card.faceUp)return `<button type="button" class="sol-card face-down" tabindex="-1" aria-label="Face-down card"><span></span></button>`;
      const sourceObject=source==="waste"?{kind:"waste"}:source==="foundation"?{kind:"foundation",suit:card.suit}:{kind:"tableau",column:details.column,index:details.index};
      const isSelected=sourceKey(selected)===sourceKey(sourceObject);
      return `<button type="button" draggable="true" class="sol-card face-up ${SUITS[card.suit].color}${isSelected?" selected":""}" data-sol-card data-source="${source}" ${details.column!=null?`data-column="${details.column}" data-index="${details.index}"`:""} data-suit="${card.suit}" aria-label="${label}" aria-pressed="${isSelected}"><span class="sol-corner">${rankLabel(card.rank)}<i>${SUITS[card.suit].symbol}</i></span><b>${SUITS[card.suit].symbol}</b><span class="sol-corner bottom">${rankLabel(card.rank)}<i>${SUITS[card.suit].symbol}</i></span></button>`;
    }

    function render() {
      stockElement.innerHTML=stock.length?`<button type="button" class="sol-card face-down sol-stock-card" data-sol-stock-action aria-label="Draw from stock"><span></span><em>${stock.length}</em></button>`:`<button type="button" class="sol-empty-stock" data-sol-stock-action aria-label="Recycle waste pile"><i>&#8634;</i><span>RECYCLE</span></button>`;
      wasteElement.innerHTML=waste.length?cardMarkup(waste[waste.length-1],"waste"):`<span class="sol-empty-label">EMPTY</span>`;
      root.querySelectorAll("[data-sol-foundation]").forEach((element)=>{const suit=element.dataset.solFoundation,pile=foundations[suit],card=pile[pile.length-1];element.classList.toggle("occupied",Boolean(card));element.innerHTML=card?cardMarkup(card,"foundation"):`<i>${SUITS[suit].symbol}</i>`;});
      tableauElement.innerHTML=tableau.map((column,columnIndex)=>{
        let y=0;const cards=column.map((card,index)=>{const top=y;y+=card.faceUp?31:18;return `<div class="sol-tableau-card" style="--card-y:${top}px">${cardMarkup(card,"tableau",{column:columnIndex,index})}</div>`;}).join("");
        return `<div class="sol-column" data-sol-column="${columnIndex}" aria-label="Tableau column ${columnIndex+1}" style="--pile-height:${Math.max(112,y+82)}px"><span class="sol-column-empty"><b>K</b><small>EMPTY</small></span>${cards}</div>`;
      }).join("");
      const homeCount=SUIT_ORDER.reduce((sum,suit)=>sum+foundations[suit].length,0);
      scoreElement.textContent=String(score).padStart(4,"0");movesElement.textContent=String(moves).padStart(3,"0");timeElement.textContent=formatTime(currentElapsed());
      progressElement.textContent=`${homeCount} / 52`;progressBar.style.width=`${homeCount/52*100}%`;
      undoButton.disabled=!undoStack.length;
      updateBest();
    }

    function updateBest() {
      if(stats.wins){bestElement.textContent=stats.bestTime?formatTime(stats.bestTime):`${stats.wins} WIN${stats.wins===1?"":"S"}`;bestCopy.textContent=stats.bestMoves?`${stats.bestMoves} moves best · ${stats.wins} table${stats.wins===1?"":"s"} cleared`:`${stats.wins} table${stats.wins===1?"":"s"} cleared`;}
      else {bestElement.textContent="NO WINS YET";bestCopy.textContent="Finish a table to set a record";}
    }

    function checkWin() {
      const homeCount=SUIT_ORDER.reduce((sum,suit)=>sum+foundations[suit].length,0);if(homeCount!==52)return;
      elapsed=currentElapsed();running=false;won=true;score+=500;stats.wins=(stats.wins||0)+1;
      if(!stats.bestTime||elapsed<stats.bestTime)stats.bestTime=elapsed;if(!stats.bestMoves||moves<stats.bestMoves)stats.bestMoves=moves;saveStats();
      root.querySelector("[data-sol-win-copy]").textContent=`${formatTime(elapsed)} · ${moves} moves · ${score} points`;
      winPanel.classList.remove("hidden");root.classList.add("solitaire-won");createSparks();render();
      setStatus("Every suit made it home. Beautiful game.","TABLE COMPLETE");[392,494,587,784].forEach((note,index)=>tone(note,.18,.02,"triangle",index*.11));
    }

    function createSparks() {
      const holder=root.querySelector("[data-sol-sparks]");holder.innerHTML=Array.from({length:42},(_,index)=>`<i style="--x:${Math.random()*100}%;--delay:${Math.random()*.8}s;--drift:${-60+Math.random()*120}px;--color:${index%3===0?"#ed7d86":index%3===1?"#efc376":"#76bbaa"}"></i>`).join("");
    }

    function openHelp(){helpPanel.classList.remove("hidden");helpPanel.querySelector("button").focus();}
    function closeHelp(){helpPanel.classList.add("hidden");root.focus();}

    function onClick(event) {
      if(event.target.closest("[data-sol-stock-action]")){drawStock();return;}
      const source=sourceFromElement(event.target);if(source){handleCardClick(source);return;}
      const foundation=event.target.closest("[data-sol-foundation]");if(foundation&&selected){if(!moveToFoundation(foundation.dataset.solFoundation)){setStatus("That card does not belong on this foundation yet.","MOVE BLOCKED");tone(130,.05,.012,"square");}return;}
      const column=event.target.closest("[data-sol-column]");if(column&&selected){if(!moveToTableau(Number(column.dataset.solColumn))){setStatus("Build down in alternating colors. Empty columns need a King.","MOVE BLOCKED");tone(130,.05,.012,"square");}return;}
      if(event.target.closest("[data-sol-table]")){selected=null;render();}
    }

    function onDoubleClick(event){const source=sourceFromElement(event.target);if(source){event.preventDefault();selected=null;autoFoundation(source);}}
    function onDragStart(event){const source=sourceFromElement(event.target);if(!source||!getSelectionCards(source).length){event.preventDefault();return;}selected=source;event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",sourceKey(source));root.classList.add("solitaire-dragging");event.target.closest("[data-sol-card]")?.classList.add("selected");}
    function onDragOver(event){const target=event.target.closest("[data-sol-column],[data-sol-foundation]");if(!target)return;event.preventDefault();event.dataTransfer.dropEffect="move";root.querySelectorAll(".drop-ready").forEach((element)=>element.classList.remove("drop-ready"));target.classList.add("drop-ready");}
    function onDrop(event){event.preventDefault();const target=event.target.closest("[data-sol-column],[data-sol-foundation]");root.querySelectorAll(".drop-ready").forEach((element)=>element.classList.remove("drop-ready"));root.classList.remove("solitaire-dragging");if(!target||!selected)return;if(target.matches("[data-sol-column]")){if(!moveToTableau(Number(target.dataset.solColumn)))setStatus("That stack cannot be placed there.","MOVE BLOCKED");}else if(!moveToFoundation(target.dataset.solFoundation))setStatus("That card cannot move to this foundation.","MOVE BLOCKED");}
    function onDragEnd(){root.classList.remove("solitaire-dragging");root.querySelectorAll(".drop-ready").forEach((element)=>element.classList.remove("drop-ready"));}
    function onKeyDown(event){const key=event.key.toLowerCase();if((event.ctrlKey||event.metaKey)&&key==="z"){event.preventDefault();undo();}else if(key==="n"){event.preventDefault();deal();}else if(key==="h"){event.preventDefault();openHelp();}else if(key==="escape"){if(!helpPanel.classList.contains("hidden")){event.preventDefault();closeHelp();}else if(selected){selected=null;render();}}}

    table.addEventListener("click",onClick);table.addEventListener("dblclick",onDoubleClick);table.addEventListener("dragstart",onDragStart);table.addEventListener("dragover",onDragOver);table.addEventListener("drop",onDrop);table.addEventListener("dragend",onDragEnd);root.addEventListener("keydown",onKeyDown);
    root.querySelector("[data-sol-new]").onclick=deal;undoButton.onclick=undo;root.querySelector("[data-sol-help]").onclick=openHelp;root.querySelector("[data-sol-help-close]").onclick=closeHelp;root.querySelector("[data-sol-win-new]").onclick=deal;root.querySelector("[data-sol-auto]").onclick=autoFinish;
    soundButton.onclick=()=>{soundOn=!soundOn;soundButton.textContent=`Sound: ${soundOn?"on":"off"}`;soundButton.setAttribute("aria-pressed",String(soundOn));if(soundOn)tone(420,.06,.015,"sine");};

    const clockTimer=setInterval(()=>{if(running&&!destroyed)timeElement.textContent=formatTime(currentElapsed());},250);
    deal();
    return {
      element:root,
      focus(){root.focus();},
      snapshot(){return {score,moves,time:currentElapsed(),stock:stock.length,waste:waste.length,foundations:SUIT_ORDER.reduce((sum,suit)=>sum+foundations[suit].length,0),won};},
      destroy(){destroyed=true;clearInterval(clockTimer);clearTimeout(statusTimer);table.removeEventListener("click",onClick);table.removeEventListener("dblclick",onDoubleClick);table.removeEventListener("dragstart",onDragStart);table.removeEventListener("dragover",onDragOver);table.removeEventListener("drop",onDrop);table.removeEventListener("dragend",onDragEnd);root.removeEventListener("keydown",onKeyDown);if(audioContext&&audioContext.state!=="closed")audioContext.close();}
    };
  };
})();
