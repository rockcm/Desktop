(() => {
  "use strict";

  const DEFAULT_WIDTH = 960;
  const DEFAULT_HEIGHT = 600;
  const HISTORY_LIMIT = 20;
  const TOOLS = [
    { id:"brush", label:"Neon brush", key:"B", icon:"✦" },
    { id:"pencil", label:"Pencil", key:"P", icon:"╱" },
    { id:"eraser", label:"Eraser", key:"E", icon:"▱" },
    { id:"line", label:"Line", key:"L", icon:"╲" },
    { id:"rectangle", label:"Rectangle", key:"R", icon:"□" },
    { id:"ellipse", label:"Ellipse", key:"O", icon:"○" },
    { id:"fill", label:"Flood fill", key:"F", icon:"◒" },
    { id:"eyedropper", label:"Eyedropper", key:"I", icon:"⌁" }
  ];
  const PALETTE = ["#071c24", "#17363b", "#42665f", "#72a995", "#b7d4bf", "#f3ead9", "#ffffff", "#ef747f", "#ff9d8d", "#efbd71", "#ffe1a0", "#74c7bd", "#75bbd2", "#7286bf", "#a38ac7", "#d981b5"];

  window.createAfterglowPaint = function createAfterglowPaint(options = {}) {
    const root = document.createElement("section");
    root.className = "paint-app";
    root.tabIndex = 0;
    root.setAttribute("aria-label", "Neon Paint image editor");
    root.innerHTML = `
      <div class="paint-menubar" role="menubar" aria-label="Paint menus">
        <button type="button" data-paint-new><u>F</u>ile</button>
        <button type="button" data-paint-open>Open</button>
        <button type="button" data-paint-save>Save PNG</button>
        <span class="paint-menu-divider"></span>
        <button type="button" data-paint-undo title="Undo (Ctrl+Z)">Undo</button>
        <button type="button" data-paint-redo title="Redo (Ctrl+Y)">Redo</button>
        <button type="button" data-paint-grid aria-pressed="false">Grid</button>
        <button type="button" data-paint-help>Help</button>
        <span class="paint-menu-title">AFTERGLOW CREATIVE SUITE / NEON PAINT 97</span>
      </div>
      <div class="paint-workspace">
        <aside class="paint-toolbox" aria-label="Drawing tools">
          <div class="paint-brand"><span>AFTERGLOW</span><strong>NEON<br>PAINT</strong><small>NIGHT EDITION</small></div>
          <div class="paint-tools">${TOOLS.map(tool => `<button type="button" data-paint-tool="${tool.id}" aria-label="${tool.label}" title="${tool.label} (${tool.key})"><i>${tool.icon}</i><span>${tool.label}</span><kbd>${tool.key}</kbd></button>`).join("")}</div>
          <div class="paint-options">
            <label><span>BRUSH SIZE <b data-paint-size-label>8 PX</b></span><input data-paint-size type="range" min="1" max="48" value="8"></label>
            <div class="paint-size-presets">${[2,5,8,16,28,42].map(size => `<button type="button" data-paint-size-preset="${size}" title="${size} pixels"><i style="width:${Math.max(2,Math.min(20,size))}px;height:${Math.max(2,Math.min(20,size))}px"></i></button>`).join("")}</div>
            <label class="paint-shape-option"><input type="checkbox" data-paint-fill-shape><span>Fill shapes</span></label>
          </div>
        </aside>
        <main class="paint-main">
          <div class="paint-ribbon">
            <div class="paint-color-wells" title="Press X to swap colors"><button type="button" data-paint-swap aria-label="Swap foreground and background colors"><i data-paint-primary></i><i data-paint-secondary></i><span>↔</span></button><small>COLOR 1<br>COLOR 2</small></div>
            <div class="paint-palette" aria-label="Neon color palette">${PALETTE.map(color => `<button type="button" data-paint-color="${color}" style="--swatch:${color}" aria-label="Select ${color}" title="Click: Color 1 · Right click: Color 2"></button>`).join("")}</div>
            <label class="paint-custom-color"><input type="color" data-paint-custom value="#ef747f"><span>Custom</span></label>
            <div class="paint-zoom"><button type="button" data-paint-zoom-out aria-label="Zoom out">−</button><strong data-paint-zoom>75%</strong><button type="button" data-paint-zoom-in aria-label="Zoom in">+</button></div>
          </div>
          <div class="paint-canvas-viewport" data-paint-viewport>
            <div class="paint-canvas-shell" data-paint-shell>
              <canvas class="paint-canvas" width="${Number(options.width) || DEFAULT_WIDTH}" height="${Number(options.height) || DEFAULT_HEIGHT}" aria-label="Drawing canvas"></canvas>
            </div>
          </div>
          <div class="paint-statusbar">
            <span><i></i><b data-paint-status>Ready. Hold and drag to paint.</b></span>
            <span data-paint-position>0, 0 PX</span><span data-paint-dimensions>${Number(options.width) || DEFAULT_WIDTH} × ${Number(options.height) || DEFAULT_HEIGHT} PX</span><span data-paint-history>HISTORY 1/1</span>
          </div>
        </main>
      </div>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-paint-file hidden>
      <div class="paint-dialog-layer hidden" data-paint-dialog>
        <div class="paint-dialog" role="dialog" aria-modal="true" aria-labelledby="paint-dialog-title">
          <span>NEON PAINT / NEW CANVAS</span><strong id="paint-dialog-title">Start a fresh picture?</strong>
          <p>Your current picture will be removed from the canvas. Save it first if you want to keep a copy.</p>
          <div><button type="button" data-paint-dialog-cancel>Cancel</button><button type="button" data-paint-dialog-transparent>Transparent</button><button type="button" class="primary" data-paint-dialog-paper>Night paper</button></div>
        </div>
      </div>
      <div class="paint-help hidden" data-paint-help-panel>
        <button type="button" data-paint-help-close aria-label="Close help">×</button>
        <span>NEON PAINT FIELD GUIDE</span><strong>Paint the motel lights</strong>
        <div><p><b>DRAW</b> Choose a tool, then click and drag. Hold Shift for straight angles, squares, and circles.</p><p><b>COLORS</b> Click a swatch for Color 1. Right-click for Color 2. Draw with right-click to use Color 2.</p><p><b>EDIT</b> Ctrl+Z undoes, Ctrl+Y redoes. Use [ and ] to change brush size.</p><p><b>FILES</b> Open PNG, JPEG, WebP, or GIF. Ctrl+S downloads a full-quality PNG.</p></div>
        <small>B Brush · P Pencil · E Eraser · L Line · R Rectangle · O Ellipse · F Fill · I Eyedropper · X Swap</small>
      </div>`;

    const canvas = root.querySelector(".paint-canvas");
    const context = canvas.getContext("2d", { willReadFrequently:true });
    const shell = root.querySelector("[data-paint-shell]");
    const viewport = root.querySelector("[data-paint-viewport]");
    const statusElement = root.querySelector("[data-paint-status]");
    const positionElement = root.querySelector("[data-paint-position]");
    const dimensionsElement = root.querySelector("[data-paint-dimensions]");
    const historyElement = root.querySelector("[data-paint-history]");
    const primaryWell = root.querySelector("[data-paint-primary]");
    const secondaryWell = root.querySelector("[data-paint-secondary]");
    const sizeInput = root.querySelector("[data-paint-size]");
    const sizeLabel = root.querySelector("[data-paint-size-label]");
    const fillShapeInput = root.querySelector("[data-paint-fill-shape]");
    const fileInput = root.querySelector("[data-paint-file]");
    const dialogLayer = root.querySelector("[data-paint-dialog]");
    const helpPanel = root.querySelector("[data-paint-help-panel]");
    const undoButton = root.querySelector("[data-paint-undo]");
    const redoButton = root.querySelector("[data-paint-redo]");
    const gridButton = root.querySelector("[data-paint-grid]");
    const zoomElement = root.querySelector("[data-paint-zoom]");

    let tool = "brush";
    let primaryColor = options.primaryColor || "#ef747f";
    let secondaryColor = options.secondaryColor || "#071c24";
    let brushSize = 8;
    let zoom = 75;
    let pointerDown = false;
    let pointerId = null;
    let pointerButton = 0;
    let startPoint = null;
    let lastPoint = null;
    let previewImage = null;
    let history = [];
    let historyIndex = -1;
    let dirty = false;
    let destroyed = false;
    let fileName = "afterglow-neon-paint";

    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function setStatus(message) { statusElement.textContent = message; }
    function activeColor(button = pointerButton) { return button === 2 ? secondaryColor : primaryColor; }
    function hexFromPixel(red, green, blue) { return `#${[red,green,blue].map(value => value.toString(16).padStart(2,"0")).join("")}`; }
    function cleanName(name) { return (name || "afterglow-neon-paint").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "afterglow-neon-paint"; }

    function updateColorUI() {
      primaryWell.style.background = primaryColor;
      secondaryWell.style.background = secondaryColor;
      root.querySelector("[data-paint-custom]").value = primaryColor;
      root.querySelectorAll("[data-paint-color]").forEach(button => {
        button.classList.toggle("primary", button.dataset.paintColor.toLowerCase() === primaryColor.toLowerCase());
        button.classList.toggle("secondary", button.dataset.paintColor.toLowerCase() === secondaryColor.toLowerCase());
      });
    }

    function selectTool(nextTool, announce = true) {
      if (!TOOLS.some(item => item.id === nextTool)) return;
      tool = nextTool;
      root.dataset.paintTool = tool;
      root.querySelectorAll("[data-paint-tool]").forEach(button => {
        const selected = button.dataset.paintTool === tool;
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (announce) setStatus(`${TOOLS.find(item => item.id === tool).label} selected.`);
    }

    function updateZoom() {
      shell.style.width = `${Math.round(canvas.width * zoom / 100)}px`;
      shell.style.height = `${Math.round(canvas.height * zoom / 100)}px`;
      shell.style.setProperty("--paint-grid-step", `${Math.max(4, 16 * zoom / 100)}px`);
      zoomElement.textContent = `${zoom}%`;
    }

    function updateHistoryUI() {
      undoButton.disabled = historyIndex <= 0;
      redoButton.disabled = historyIndex >= history.length - 1;
      historyElement.textContent = `HISTORY ${historyIndex + 1}/${history.length}`;
    }

    function snapshot(reset = false) {
      if (reset) { history = []; historyIndex = -1; }
      if (historyIndex < history.length - 1) history.splice(historyIndex + 1);
      history.push(context.getImageData(0, 0, canvas.width, canvas.height));
      if (history.length > HISTORY_LIMIT) history.shift();
      historyIndex = history.length - 1;
      dirty = true;
      updateHistoryUI();
    }

    function restoreHistory(nextIndex) {
      if (nextIndex < 0 || nextIndex >= history.length || pointerDown) return;
      const previousIndex = historyIndex;
      historyIndex = nextIndex;
      context.putImageData(history[historyIndex], 0, 0);
      dirty = true;
      updateHistoryUI();
      setStatus(nextIndex > previousIndex ? "Redid the last stroke." : "Undid the last stroke.");
    }

    function pointFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x:clamp((event.clientX - rect.left) * canvas.width / rect.width, 0, canvas.width),
        y:clamp((event.clientY - rect.top) * canvas.height / rect.height, 0, canvas.height)
      };
    }

    function drawSegment(from, to, color, currentTool = tool) {
      context.save();
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalCompositeOperation = currentTool === "eraser" ? "destination-out" : "source-over";
      context.strokeStyle = currentTool === "eraser" ? "rgba(0,0,0,1)" : color;
      context.lineWidth = currentTool === "pencil" ? 1 : brushSize;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.restore();
    }

    function constrainedPoint(origin, point, event) {
      if (!event.shiftKey) return point;
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      if (tool === "line") {
        const distance = Math.hypot(dx, dy);
        const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4;
        return { x:origin.x + Math.cos(angle) * distance, y:origin.y + Math.sin(angle) * distance };
      }
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      return { x:origin.x + Math.sign(dx || 1) * size, y:origin.y + Math.sign(dy || 1) * size };
    }

    function drawShape(origin, rawPoint, event, color) {
      const point = constrainedPoint(origin, rawPoint, event);
      const x = Math.min(origin.x, point.x);
      const y = Math.min(origin.y, point.y);
      const width = Math.abs(point.x - origin.x);
      const height = Math.abs(point.y - origin.y);
      context.save();
      context.strokeStyle = color;
      context.fillStyle = color;
      context.lineWidth = brushSize;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      if (tool === "line") { context.moveTo(origin.x, origin.y);context.lineTo(point.x, point.y); }
      else if (tool === "rectangle") context.rect(x, y, width, height);
      else context.ellipse(x + width / 2, y + height / 2, Math.max(.1,width / 2), Math.max(.1,height / 2), 0, 0, Math.PI * 2);
      if (fillShapeInput.checked && tool !== "line") context.fill();
      else context.stroke();
      context.restore();
    }

    function floodFill(point, color) {
      const x = clamp(Math.floor(point.x), 0, canvas.width - 1);
      const y = clamp(Math.floor(point.y), 0, canvas.height - 1);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;
      const targetIndex = (y * canvas.width + x) * 4;
      const target = [data[targetIndex], data[targetIndex + 1], data[targetIndex + 2], data[targetIndex + 3]];
      const rgb = color.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16));
      const replacement = [rgb[0], rgb[1], rgb[2], 255];
      if (target.every((value,index) => value === replacement[index])) return false;
      const matches = index => data[index] === target[0] && data[index+1] === target[1] && data[index+2] === target[2] && data[index+3] === target[3];
      const paintPixel = index => { data[index]=replacement[0];data[index+1]=replacement[1];data[index+2]=replacement[2];data[index+3]=255; };
      const stack = [[x,y]];
      while (stack.length) {
        const [seedX, seedY] = stack.pop();
        let scanX = seedX;
        let index = (seedY * canvas.width + scanX) * 4;
        while (scanX >= 0 && matches(index)) { scanX -= 1;index -= 4; }
        scanX += 1;index += 4;
        let spanAbove = false;
        let spanBelow = false;
        for (; scanX < canvas.width && matches(index); scanX += 1, index += 4) {
          paintPixel(index);
          if (seedY > 0) {
            const above = index - canvas.width * 4;
            if (matches(above) && !spanAbove) { stack.push([scanX,seedY-1]);spanAbove=true; }
            else if (!matches(above)) spanAbove=false;
          }
          if (seedY < canvas.height - 1) {
            const below = index + canvas.width * 4;
            if (matches(below) && !spanBelow) { stack.push([scanX,seedY+1]);spanBelow=true; }
            else if (!matches(below)) spanBelow=false;
          }
        }
      }
      context.putImageData(image, 0, 0);
      return true;
    }

    function pickColor(point, secondary = false) {
      const pixel = context.getImageData(clamp(Math.floor(point.x),0,canvas.width-1),clamp(Math.floor(point.y),0,canvas.height-1),1,1).data;
      if (pixel[3] === 0) { setStatus("That pixel is transparent.");return; }
      const color = hexFromPixel(pixel[0], pixel[1], pixel[2]);
      if (secondary) secondaryColor = color; else primaryColor = color;
      updateColorUI();
      setStatus(`${secondary ? "Color 2" : "Color 1"} sampled: ${color.toUpperCase()}.`);
    }

    function beginPointer(event) {
      if (event.button !== 0 && event.button !== 2) return;
      if (!helpPanel.classList.contains("hidden") || !dialogLayer.classList.contains("hidden")) return;
      event.preventDefault();
      root.focus();
      pointerButton = event.button;
      const point = pointFromEvent(event);
      if (tool === "fill") {
        if (floodFill(point, activeColor())) { snapshot();setStatus("Area filled."); }
        else setStatus("That area already has this color.");
        return;
      }
      if (tool === "eyedropper") { pickColor(point, event.button === 2);return; }
      pointerDown = true;
      pointerId = event.pointerId;
      startPoint = point;
      lastPoint = point;
      try { canvas.setPointerCapture?.(event.pointerId); } catch (_) { /* synthetic or legacy pointer events may not support capture */ }
      if (["line","rectangle","ellipse"].includes(tool)) previewImage = context.getImageData(0,0,canvas.width,canvas.height);
      else {
        const offset = { x:point.x + .01, y:point.y + .01 };
        drawSegment(point, offset, activeColor());
      }
    }

    function movePointer(event) {
      const point = pointFromEvent(event);
      positionElement.textContent = `${Math.round(point.x)}, ${Math.round(point.y)} PX`;
      if (!pointerDown || event.pointerId !== pointerId) return;
      event.preventDefault();
      if (["brush","pencil","eraser"].includes(tool)) {
        const mid = { x:(lastPoint.x + point.x) / 2, y:(lastPoint.y + point.y) / 2 };
        drawSegment(lastPoint, mid, activeColor());
        drawSegment(mid, point, activeColor());
      } else {
        context.putImageData(previewImage, 0, 0);
        drawShape(startPoint, point, event, activeColor());
      }
      lastPoint = point;
    }

    function endPointer(event) {
      if (!pointerDown || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      if (["line","rectangle","ellipse"].includes(tool) && previewImage) {
        context.putImageData(previewImage, 0, 0);
        drawShape(startPoint, lastPoint, event, activeColor());
      }
      try { if (canvas.hasPointerCapture?.(pointerId)) canvas.releasePointerCapture(pointerId); } catch (_) { /* already released */ }
      pointerDown = false;
      pointerId = null;
      previewImage = null;
      snapshot();
      setStatus(`${TOOLS.find(item => item.id === tool).label} stroke added.`);
    }

    function resetCanvas(background = null) {
      context.clearRect(0,0,canvas.width,canvas.height);
      if (background) { context.fillStyle=background;context.fillRect(0,0,canvas.width,canvas.height); }
      fileName = "afterglow-neon-paint";
      snapshot(true);
      dirty = false;
      dialogLayer.classList.add("hidden");
      setStatus(background ? "New night-paper canvas ready." : "New transparent canvas ready.");
      root.focus();
    }

    function openDialog() { dialogLayer.classList.remove("hidden");root.querySelector("[data-paint-dialog-cancel]").focus(); }
    function closeDialog() { dialogLayer.classList.add("hidden");root.focus(); }

    function openImage(file) {
      if (!file || !file.type.startsWith("image/")) { setStatus("Choose a PNG, JPEG, WebP, or GIF image.");return; }
      const reader = new FileReader();
      reader.onerror = () => setStatus("That image could not be read.");
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => setStatus("That image format could not be opened.");
        image.onload = () => {
          context.clearRect(0,0,canvas.width,canvas.height);
          const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight, 1);
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          context.drawImage(image, (canvas.width-width)/2, (canvas.height-height)/2, width, height);
          fileName = cleanName(file.name);
          snapshot(true);
          dirty = false;
          setStatus(`${file.name} opened${scale < 1 ? " and fitted to the canvas" : ""}.`);
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function savePng() {
      canvas.toBlob(blob => {
        if (!blob) { setStatus("The PNG could not be created.");return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${cleanName(fileName)}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        dirty = false;
        setStatus(`Saved ${link.download}.`);
      }, "image/png");
    }

    function changeZoom(amount) {
      zoom = clamp(Math.round((zoom + amount) / 25) * 25, 25, 200);
      updateZoom();
      setStatus(`Canvas zoom: ${zoom}%.`);
    }

    function onKeyDown(event) {
      if (event.target.matches("input") && event.target !== sizeInput) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") { event.preventDefault();restoreHistory(historyIndex + (event.shiftKey ? 1 : -1));return; }
      if ((event.ctrlKey || event.metaKey) && key === "y") { event.preventDefault();restoreHistory(historyIndex + 1);return; }
      if ((event.ctrlKey || event.metaKey) && key === "s") { event.preventDefault();savePng();return; }
      if ((event.ctrlKey || event.metaKey) && key === "o") { event.preventDefault();fileInput.click();return; }
      if ((event.ctrlKey || event.metaKey) && key === "n") { event.preventDefault();openDialog();return; }
      if (key === "escape") { if (!dialogLayer.classList.contains("hidden")) closeDialog();else helpPanel.classList.add("hidden");return; }
      const shortcut = TOOLS.find(item => item.key.toLowerCase() === key);
      if (shortcut) { event.preventDefault();selectTool(shortcut.id); }
      else if (key === "x") { event.preventDefault();[primaryColor,secondaryColor]=[secondaryColor,primaryColor];updateColorUI();setStatus("Colors swapped."); }
      else if (key === "[") { brushSize=clamp(brushSize-1,1,48);sizeInput.value=brushSize;sizeLabel.textContent=`${brushSize} PX`; }
      else if (key === "]") { brushSize=clamp(brushSize+1,1,48);sizeInput.value=brushSize;sizeLabel.textContent=`${brushSize} PX`; }
    }

    canvas.addEventListener("pointerdown", beginPointer);
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("contextmenu", event => event.preventDefault());
    root.addEventListener("keydown", onKeyDown);
    root.querySelectorAll("[data-paint-tool]").forEach(button => button.onclick = () => { selectTool(button.dataset.paintTool);root.focus(); });
    root.querySelectorAll("[data-paint-color]").forEach(button => {
      button.onclick = () => { primaryColor=button.dataset.paintColor;updateColorUI();setStatus(`Color 1: ${primaryColor.toUpperCase()}.`); };
      button.oncontextmenu = event => { event.preventDefault();secondaryColor=button.dataset.paintColor;updateColorUI();setStatus(`Color 2: ${secondaryColor.toUpperCase()}.`); };
    });
    root.querySelector("[data-paint-custom]").oninput = event => { primaryColor=event.target.value;updateColorUI();setStatus(`Custom color: ${primaryColor.toUpperCase()}.`); };
    root.querySelector("[data-paint-swap]").onclick = () => { [primaryColor,secondaryColor]=[secondaryColor,primaryColor];updateColorUI();setStatus("Colors swapped.");root.focus(); };
    sizeInput.oninput = () => { brushSize=Number(sizeInput.value);sizeLabel.textContent=`${brushSize} PX`; };
    root.querySelectorAll("[data-paint-size-preset]").forEach(button => button.onclick = () => { brushSize=Number(button.dataset.paintSizePreset);sizeInput.value=brushSize;sizeLabel.textContent=`${brushSize} PX`;root.focus(); });
    root.querySelector("[data-paint-new]").onclick = openDialog;
    root.querySelector("[data-paint-open]").onclick = () => fileInput.click();
    root.querySelector("[data-paint-save]").onclick = savePng;
    undoButton.onclick = () => restoreHistory(historyIndex - 1);
    redoButton.onclick = () => restoreHistory(historyIndex + 1);
    gridButton.onclick = () => { const active=shell.classList.toggle("show-grid");gridButton.setAttribute("aria-pressed",String(active));gridButton.classList.toggle("active",active);setStatus(`Pixel grid ${active ? "shown" : "hidden"}.`); };
    root.querySelector("[data-paint-help]").onclick = () => { helpPanel.classList.remove("hidden");root.querySelector("[data-paint-help-close]").focus(); };
    root.querySelector("[data-paint-help-close]").onclick = () => { helpPanel.classList.add("hidden");root.focus(); };
    root.querySelector("[data-paint-zoom-out]").onclick = () => changeZoom(-25);
    root.querySelector("[data-paint-zoom-in]").onclick = () => changeZoom(25);
    root.querySelector("[data-paint-dialog-cancel]").onclick = closeDialog;
    root.querySelector("[data-paint-dialog-transparent]").onclick = () => resetCanvas(null);
    root.querySelector("[data-paint-dialog-paper]").onclick = () => resetCanvas(options.background || "#071c24");
    fileInput.onchange = () => { openImage(fileInput.files?.[0]);fileInput.value=""; };

    context.clearRect(0,0,canvas.width,canvas.height);
    if (options.background) { context.fillStyle=options.background;context.fillRect(0,0,canvas.width,canvas.height); }
    history.push(context.getImageData(0,0,canvas.width,canvas.height));
    historyIndex = 0;
    dirty = false;
    dimensionsElement.textContent = `${canvas.width} × ${canvas.height} PX`;
    updateColorUI();
    updateZoom();
    updateHistoryUI();
    selectTool("brush", false);

    return {
      element:root,
      focus(){root.focus();},
      snapshot(){return { tool, brushSize, primaryColor, secondaryColor, zoom, dirty, history:history.length, dimensions:[canvas.width,canvas.height] };},
      isDirty(){return dirty;},
      destroy(){destroyed=true;canvas.removeEventListener("pointerdown",beginPointer);canvas.removeEventListener("pointermove",movePointer);canvas.removeEventListener("pointerup",endPointer);canvas.removeEventListener("pointercancel",endPointer);root.removeEventListener("keydown",onKeyDown);history=[];previewImage=null;}
    };
  };
})();
