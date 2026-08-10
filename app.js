(() => {
  "use strict";

  const STORAGE_KEY = "afterglow-os-v1";
  const desktop = document.querySelector("#desktop");
  const iconGrid = document.querySelector("#desktop-icons");
  const windowLayer = document.querySelector("#window-layer");
  const taskItems = document.querySelector("#task-items");
  const contextMenu = document.querySelector("#context-menu");
  const startMenu = document.querySelector("#start-menu");
  const startButton = document.querySelector("#start-button");
  const windowTemplate = document.querySelector("#window-template");
  let zIndex = 20;
  let windowOffset = 0;
  const selectedDesktopIds = new Set();
  let iconWasDragged = false;
  const windows = new Map();
  const explorerRefreshers = new Set();
  const DESKTOP_GRID = { originX: 12, originY: 12, columnWidth: 84, rowHeight: 88 };

  const icons = {
    computer: "#i-computer", folder: "#i-folder", note: "#i-note",
    document: "#i-document", bin: "#i-bin", headphones: "#i-headphones", minesweeper: "#i-minesweeper", fishing: "#i-fishing", chrome: "#i-chrome"
  };

  const seedState = {
    items: [
      { id: "documents", name: "My Documents", type: "folder", parentId: "desktop", system: true, created: Date.now() - 86400000 },
      { id: "journal", name: "Journal", type: "folder", parentId: "desktop", created: Date.now() - 5400000 },
      { id: "welcome", name: "welcome.txt", type: "text", parentId: "desktop", content: "Welcome to Afterglow OS.\n\nThis is your quiet little corner of the internet. Double-click folders to explore, or open this note in Notepad.\n\nRight-click the desktop to create something new. Everything you make stays here, even after you close the tab.\n\n— take it slow ☁", created: Date.now() - 3600000, modified: Date.now() - 3600000 },
      { id: "thoughts", name: "small thoughts.txt", type: "text", parentId: "journal", content: "buy oranges\nwater the plants\nfinish that song\n\nremember: not every day has to be productive.", created: Date.now() - 2500000, modified: Date.now() - 2500000 }
    ],
    trash: []
  };

  let state = loadState();
  state.iconPositions ||= {};

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && Array.isArray(stored.items) && Array.isArray(stored.trash)) return stored;
    } catch (_) { /* use seed */ }
    return JSON.parse(JSON.stringify(seedState));
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function svg(name) { return `<svg aria-hidden="true"><use href="${icons[name] || icons.document}"/></svg>`; }
  function escapeHtml(value = "") { const el = document.createElement("div"); el.textContent = value; return el.innerHTML; }
  function getItem(id) { return state.items.find(item => item.id === id) || state.trash.find(item => item.id === id); }
  function uid() { return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function uniqueName(base, parentId, type, collection = state.items) {
    const names = collection.filter(i => i.parentId === parentId).map(i => i.name.toLowerCase());
    const extension = type === "text" && !base.toLowerCase().endsWith(".txt") ? ".txt" : "";
    let desired = base + extension;
    let n = 2;
    while (names.includes(desired.toLowerCase())) desired = `${base} (${n++})${extension}`;
    return desired;
  }

  function refreshFileViews() {
    renderDesktop();
    explorerRefreshers.forEach(refresh => refresh());
  }

  function isFolderInside(folderId, possibleAncestorId) {
    let cursor = getItem(folderId);
    while (cursor) {
      if (cursor.id === possibleAncestorId) return true;
      cursor = getItem(cursor.parentId);
    }
    return false;
  }

  function movedItemName(item, targetParentId) {
    const taken = new Set(state.items.filter(candidate => candidate.parentId === targetParentId && candidate.id !== item.id).map(candidate => candidate.name.toLowerCase()));
    if (!taken.has(item.name.toLowerCase())) return item.name;
    const dot = item.type === "text" ? item.name.lastIndexOf(".") : -1;
    const stem = dot > 0 ? item.name.slice(0, dot) : item.name;
    const extension = dot > 0 ? item.name.slice(dot) : "";
    let number = 2;
    let candidate = `${stem} (${number})${extension}`;
    while (taken.has(candidate.toLowerCase())) candidate = `${stem} (${++number})${extension}`;
    return candidate;
  }

  function movableItems(ids) {
    return [...new Set(ids)].map(getItem).filter(item => item && state.items.includes(item) && !item.system);
  }

  function canMoveItemsTo(ids, targetParentId) {
    const target = targetParentId === "desktop" ? { type:"folder" } : getItem(targetParentId);
    const moving = movableItems(ids);
    if (!moving.length || !target || target.type !== "folder") return false;
    return moving.some(item => item.parentId !== targetParentId) && moving.every(item => item.id !== targetParentId && !(item.type === "folder" && isFolderInside(targetParentId, item.id)));
  }

  function moveItemsToFolder(ids, targetParentId) {
    if (!canMoveItemsTo(ids, targetParentId)) return false;
    const moving = movableItems(ids).filter(item => item.parentId !== targetParentId);
    moving.forEach(item => {
      item.name = movedItemName(item, targetParentId);
      item.parentId = targetParentId;
      delete state.iconPositions[item.id];
    });
    saveState();
    refreshFileViews();
    const targetName = targetParentId === "desktop" ? "Desktop" : getItem(targetParentId)?.name || "folder";
    toast(moving.length === 1 ? `${moving[0].name} moved to ${targetName}.` : `${moving.length} items moved to ${targetName}.`);
    return true;
  }

  function clearDropTargets() {
    document.querySelectorAll(".drop-target").forEach(element => element.classList.remove("drop-target"));
  }

  function resolveDropTarget(clientX, clientY, movingIds, sourceParentId) {
    clearDropTargets();
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;
    const recycle = element.closest('.desktop-icon[data-id="recycle"]');
    if (recycle && movableItems(movingIds).length) return { kind:"trash", element:recycle };
    const folderElement = element.closest("[data-drop-folder-id]");
    if (folderElement) {
      const folderId = folderElement.dataset.dropFolderId;
      if (folderId !== sourceParentId && canMoveItemsTo(movingIds, folderId)) return { kind:"folder", folderId, element:folderElement };
    }
    const fileArea = element.closest(".file-area[data-folder-id]");
    if (fileArea) {
      const folderId = fileArea.dataset.folderId;
      if (folderId !== "trash" && folderId !== sourceParentId && canMoveItemsTo(movingIds, folderId)) return { kind:"folder", folderId, element:fileArea };
    }
    const desktopSurface = element === desktop || element.closest("#desktop-icons,.rain-wallpaper,.sky-grain,.sun-haze,.landscape,.power-lines");
    if (desktopSurface && sourceParentId !== "desktop" && canMoveItemsTo(movingIds, "desktop")) return { kind:"folder", folderId:"desktop", element:desktop };
    return null;
  }

  function renderDesktop() {
    const dynamic = state.items.filter(item => item.parentId === "desktop");
    const entries = [
      { id: "computer", name: "My Computer", type: "computer", action: () => openExplorer("desktop") },
      { id: "google-chrome", name: "Google Chrome", type: "chrome", system: true, action: openChrome },
      ...dynamic.map(item => ({ ...item, action: () => openItem(item.id) })),
      { id: "night-mines", name: "Night Mines", type: "minesweeper", system: true, action: openMinesweeper },
      { id: "rainy-lake-fishing", name: "Rainy Lake Fishing", type: "fishing", system: true, action: openFishing },
      { id: "recycle", name: "Recycle Bin", type: "bin", action: () => openExplorer("trash") }
    ];
    iconGrid.innerHTML = "";
    const rows = desktopGridDimensions().rows;
    entries.forEach((entry, index) => {
      const button = document.createElement("button");
      button.className = `desktop-icon${selectedDesktopIds.has(entry.id) ? " selected" : ""}`;
      button.dataset.id = entry.id;
      button.dataset.entryType = entry.type;
      if (entry.type === "folder") button.dataset.dropFolderId = entry.id;
      const fallback = { x: DESKTOP_GRID.originX + Math.floor(index / rows) * DESKTOP_GRID.columnWidth, y: DESKTOP_GRID.originY + (index % rows) * DESKTOP_GRID.rowHeight };
      const position = state.iconPositions[entry.id] || fallback;
      button.style.left = `${position.x}px`;
      button.style.top = `${position.y}px`;
      button.innerHTML = `${svg(entry.type === "text" ? "document" : entry.type)}<span>${escapeHtml(entry.name)}</span>`;
      button.addEventListener("pointerdown", e => beginIconDrag(e, entry.id));
      button.addEventListener("click", e => {
        e.stopPropagation();
        if (iconWasDragged) { iconWasDragged = false; e.preventDefault(); return; }
        if (!e.ctrlKey && !e.metaKey) selectedDesktopIds.clear();
        selectedDesktopIds.add(entry.id);
        syncDesktopSelection();
      });
      button.addEventListener("dblclick", e => { if (!iconWasDragged) { e.stopPropagation(); entry.action(); } });
      if (!entry.system && !["computer", "recycle"].includes(entry.id)) {
        button.addEventListener("contextmenu", e => showContext(e, [
          { label: "Open", action: entry.action },
          { label: "Rename", action: () => promptRename(entry.id) },
          "separator",
          { label: "Move to Recycle Bin", action: () => moveToTrash(entry.id) }
        ]));
      }
      iconGrid.append(button);
    });
  }

  function syncDesktopSelection() {
    iconGrid.querySelectorAll(".desktop-icon").forEach(icon => icon.classList.toggle("selected", selectedDesktopIds.has(icon.dataset.id)));
  }

  function clampIconPosition(x, y, icon) {
    return {
      x: Math.max(4, Math.min(desktop.clientWidth - icon.offsetWidth - 4, x)),
      y: Math.max(4, Math.min(desktop.clientHeight - 48 - icon.offsetHeight - 4, y))
    };
  }

  function desktopGridDimensions() {
    return {
      columns: Math.max(1, Math.floor((desktop.clientWidth - DESKTOP_GRID.originX) / DESKTOP_GRID.columnWidth)),
      rows: Math.max(1, Math.floor((desktop.clientHeight - 58 - DESKTOP_GRID.originY) / DESKTOP_GRID.rowHeight))
    };
  }

  function desktopCellFromPosition(x, y) {
    const { columns, rows } = desktopGridDimensions();
    return {
      column: Math.max(0, Math.min(columns - 1, Math.round((x - DESKTOP_GRID.originX) / DESKTOP_GRID.columnWidth))),
      row: Math.max(0, Math.min(rows - 1, Math.round((y - DESKTOP_GRID.originY) / DESKTOP_GRID.rowHeight)))
    };
  }

  function desktopPositionFromCell(column, row, icon) {
    return clampIconPosition(DESKTOP_GRID.originX + column * DESKTOP_GRID.columnWidth, DESKTOP_GRID.originY + row * DESKTOP_GRID.rowHeight, icon);
  }

  function snapDesktopIcons(moving) {
    const movingIds = new Set(moving.map(item => item.id));
    const occupied = new Set();
    iconGrid.querySelectorAll(".desktop-icon").forEach(icon => {
      if (movingIds.has(icon.dataset.id)) return;
      const cell = desktopCellFromPosition(parseFloat(icon.style.left) || 0, parseFloat(icon.style.top) || 0);
      occupied.add(`${cell.column}:${cell.row}`);
    });
    const { columns, rows } = desktopGridDimensions();
    moving.sort((a,b) => a.y - b.y || a.x - b.x).forEach(item => {
      const desired = desktopCellFromPosition(parseFloat(item.icon.style.left) || item.x, parseFloat(item.icon.style.top) || item.y);
      const candidates = [];
      for (let column = 0; column < columns; column += 1) for (let row = 0; row < rows; row += 1) candidates.push({ column, row, distance:Math.abs(column - desired.column) + Math.abs(row - desired.row) });
      candidates.sort((a,b) => a.distance - b.distance || a.column - b.column || a.row - b.row);
      const chosen = candidates.find(cell => !occupied.has(`${cell.column}:${cell.row}`)) || desired;
      occupied.add(`${chosen.column}:${chosen.row}`);
      const position = desktopPositionFromCell(chosen.column, chosen.row, item.icon);
      item.icon.classList.add("snapping");
      item.icon.style.left = `${position.x}px`;
      item.icon.style.top = `${position.y}px`;
      setTimeout(() => item.icon.classList.remove("snapping"), 240);
      state.iconPositions[item.id] = position;
    });
  }

  function beginIconDrag(event, id) {
    if (event.button !== 0) return;
    event.stopPropagation();
    if (!selectedDesktopIds.has(id)) {
      if (!event.ctrlKey && !event.metaKey) selectedDesktopIds.clear();
      selectedDesktopIds.add(id);
      syncDesktopSelection();
    }
    const startX = event.clientX, startY = event.clientY;
    const moving = [...selectedDesktopIds].map(itemId => {
      const icon = iconGrid.querySelector(`[data-id="${CSS.escape(itemId)}"]`);
      return icon ? { id:itemId, icon, x:parseFloat(icon.style.left) || 0, y:parseFloat(icon.style.top) || 0 } : null;
    }).filter(Boolean);
    let moved = false;
    let dropTarget = null;
    const move = pointerEvent => {
      const dx = pointerEvent.clientX - startX, dy = pointerEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) {
        moved = true;
        moving.forEach(item => item.icon.classList.add("dragging"));
      }
      moving.forEach(item => {
        const next = clampIconPosition(item.x + dx, item.y + dy, item.icon);
        item.icon.style.left = `${next.x}px`;
        item.icon.style.top = `${next.y}px`;
      });
      dropTarget = resolveDropTarget(pointerEvent.clientX, pointerEvent.clientY, moving.map(item => item.id), "desktop");
      if (dropTarget) dropTarget.element.classList.add("drop-target");
    };
    const up = pointerEvent => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      moving.forEach(item => item.icon.classList.remove("dragging"));
      clearDropTargets();
      if (!moved) return;
      iconWasDragged = true;
      if (dropTarget?.kind === "folder") {
        if (moveItemsToFolder(moving.map(item => item.id), dropTarget.folderId)) return;
      } else if (dropTarget?.kind === "trash") {
        moveToTrash(moving.map(item => item.id), refreshFileViews);
        renderDesktop();
        return;
      }
      snapDesktopIcons(moving);
      saveState();
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  function beginDesktopSelection(event) {
    if (event.button !== 0 || event.target !== desktop) return;
    const desktopRect = desktop.getBoundingClientRect();
    const originX = event.clientX - desktopRect.left;
    const originY = Math.min(event.clientY - desktopRect.top, desktop.clientHeight - 48);
    const additive = event.ctrlKey || event.metaKey;
    const originalSelection = new Set(selectedDesktopIds);
    const box = document.createElement("div");
    box.className = "selection-box";
    box.style.left = `${originX}px`;
    box.style.top = `${originY}px`;
    desktop.append(box);
    let moved = false;
    const move = pointerEvent => {
      const currentX = Math.max(0, Math.min(desktop.clientWidth, pointerEvent.clientX - desktopRect.left));
      const currentY = Math.max(0, Math.min(desktop.clientHeight - 48, pointerEvent.clientY - desktopRect.top));
      const left = Math.min(originX, currentX), top = Math.min(originY, currentY);
      const width = Math.abs(currentX - originX), height = Math.abs(currentY - originY);
      moved ||= width > 2 || height > 2;
      Object.assign(box.style, { left:`${left}px`, top:`${top}px`, width:`${width}px`, height:`${height}px` });
      const selectionRect = box.getBoundingClientRect();
      if (!additive) selectedDesktopIds.clear(); else { selectedDesktopIds.clear(); originalSelection.forEach(id => selectedDesktopIds.add(id)); }
      iconGrid.querySelectorAll(".desktop-icon").forEach(icon => {
        const rect = icon.getBoundingClientRect();
        if (rect.left < selectionRect.right && rect.right > selectionRect.left && rect.top < selectionRect.bottom && rect.bottom > selectionRect.top) selectedDesktopIds.add(icon.dataset.id);
      });
      syncDesktopSelection();
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      box.remove();
      if (!moved && !additive) { selectedDesktopIds.clear(); syncDesktopSelection(); }
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  function openItem(id) {
    const item = getItem(id);
    if (!item) return;
    if (item.type === "folder") openExplorer(item.id);
    else openNotepad(item.id);
  }

  function openChrome() {
    if(windows.has("chrome"))return restoreAndFocus("chrome");
    const homeUrl="https://www.google.com/webhp?igu=1";
    const root=document.createElement("div");root.className="browser-app";
    root.innerHTML=`<div class="browser-tabs"><div class="browser-tab active">${svg("chrome")}<span data-browser-tab-title>Google</span><i>×</i></div><button class="browser-new-tab" type="button" aria-label="New tab" title="One tab at a time in Afterglow Chrome">+</button><div class="browser-window-drag"></div></div><div class="browser-toolbar"><button type="button" data-browser="back" aria-label="Back">←</button><button type="button" data-browser="forward" aria-label="Forward">→</button><button type="button" data-browser="reload" aria-label="Reload">↻</button><button type="button" data-browser="home" aria-label="Home">⌂</button><form class="browser-address-form"><span class="browser-security" title="Secure connection">●</span><input class="browser-address" aria-label="Address and search bar" autocomplete="off" spellcheck="false" value="google.com" /><button type="submit" aria-label="Go">Go</button></form><button type="button" data-browser="menu" aria-label="Browser menu">⋮</button></div><div class="browser-bookmarks"><button type="button" data-bookmark="https://www.google.com/webhp?igu=1">Google</button><button type="button" data-bookmark="https://en.wikipedia.org/wiki/Main_Page">Wikipedia</button><span>Pages that block embedding cannot display inside Afterglow.</span></div><div class="browser-viewport"><iframe class="browser-frame" title="Embedded web browser" referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-forms allow-scripts allow-same-origin allow-downloads"></iframe><div class="browser-loading"><i></i><span>Connecting to the web…</span></div></div><div class="browser-status"><span data-browser-status>Ready</span><span>Afterglow Chrome · embedded view</span></div>`;
    const frame=root.querySelector(".browser-frame"),address=root.querySelector(".browser-address"),loading=root.querySelector(".browser-loading"),status=root.querySelector("[data-browser-status]"),tabTitle=root.querySelector("[data-browser-tab-title]");
    const navigation=[homeUrl];let navigationIndex=0;
    function normalizeAddress(value){const input=value.trim();if(!input)return homeUrl;if(/^https?:\/\//i.test(input))return input;if(/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(input))return `https://${input}`;return `https://www.google.com/search?igu=1&q=${encodeURIComponent(input)}`;}
    function displayAddress(url){try{const parsed=new URL(url);address.value=parsed.hostname.replace(/^www\./,"")+(`${parsed.pathname}${parsed.search}`==="/webhp?igu=1"?"":parsed.pathname+parsed.search);}catch(_){address.value=url;}}
    function visit(value,push=true){const url=normalizeAddress(value);if(push){navigation.splice(navigationIndex+1);navigation.push(url);navigationIndex=navigation.length-1;}loading.classList.remove("hidden");status.textContent="Loading…";displayAddress(url);tabTitle.textContent=url.includes("google.com")?"Google":(()=>{try{return new URL(url).hostname.replace(/^www\./,"");}catch(_){return "New Tab";}})();frame.src=url;syncNav();}
    function syncNav(){root.querySelector('[data-browser="back"]').disabled=navigationIndex<=0;root.querySelector('[data-browser="forward"]').disabled=navigationIndex>=navigation.length-1;}
    function moveHistory(offset){const next=navigationIndex+offset;if(next<0||next>=navigation.length)return;navigationIndex=next;visit(navigation[navigationIndex],false);}
    root.querySelector(".browser-address-form").onsubmit=event=>{event.preventDefault();visit(address.value);};
    root.querySelector('[data-browser="back"]').onclick=()=>moveHistory(-1);root.querySelector('[data-browser="forward"]').onclick=()=>moveHistory(1);root.querySelector('[data-browser="reload"]').onclick=()=>visit(navigation[navigationIndex],false);root.querySelector('[data-browser="home"]').onclick=()=>visit(homeUrl);root.querySelector('[data-browser="menu"]').onclick=event=>showContext(event,[{label:"New search",action:()=>{address.value="";address.focus();}},{label:"Reload page",action:()=>visit(navigation[navigationIndex],false)},"separator",{label:"Close Chrome",action:()=>closeWindow("chrome")}]);root.querySelector(".browser-new-tab").onclick=()=>{address.value="";address.focus();toast("Afterglow Chrome is ready for a new address.");};root.querySelector(".browser-tab i").onclick=()=>closeWindow("chrome");root.querySelectorAll("[data-bookmark]").forEach(button=>button.onclick=()=>visit(button.dataset.bookmark));
    frame.addEventListener("load",()=>{loading.classList.add("hidden");status.textContent="Done";});
    createWindow({id:"chrome",title:"Google Chrome",icon:"chrome",width:900,height:650,content:root});visit(homeUrl,false);setTimeout(()=>address.focus(),350);
  }

  function createWindow({ id, title, icon = "document", width = 720, height = 480, content, onClose }) {
    if (windows.has(id)) { restoreAndFocus(id); return windows.get(id).element; }
    const element = windowTemplate.content.firstElementChild.cloneNode(true);
    const safeLeft = Math.max(8, Math.min(window.innerWidth - width - 20, 110 + windowOffset));
    const safeTop = Math.max(8, Math.min(window.innerHeight - height - 60, 48 + windowOffset));
    element.style.cssText = `width:${width}px;height:${height}px;left:${safeLeft}px;top:${safeTop}px;z-index:${++zIndex}`;
    windowOffset = (windowOffset + 28) % 170;
    element.dataset.windowId = id;
    element.querySelector(".window-title").textContent = title;
    element.querySelector(".title-icon").innerHTML = svg(icon);
    element.querySelector(".window-content").append(content);
    windowLayer.append(element);

    const task = document.createElement("button");
    task.className = "task-item active";
    task.innerHTML = `${svg(icon)}<span>${escapeHtml(title)}</span>`;
    task.addEventListener("click", () => {
      if (element.classList.contains("minimized")) restoreAndFocus(id);
      else if (element.classList.contains("inactive")) focusWindow(id);
      else minimizeWindow(id);
    });
    taskItems.append(task);
    windows.set(id, { element, task, onClose, title, icon });
    wireWindow(element, id);
    focusWindow(id);
    element.focus();
    return element;
  }

  function wireWindow(element, id) {
    element.addEventListener("pointerdown", () => focusWindow(id));
    element.querySelectorAll("[data-control]").forEach(button => button.addEventListener("click", e => {
      e.stopPropagation();
      const control = button.dataset.control;
      if (control === "close") closeWindow(id);
      if (control === "minimize") minimizeWindow(id);
      if (control === "maximize") toggleMaximize(id);
    }));
    const titlebar = element.querySelector(".titlebar");
    titlebar.addEventListener("dblclick", e => { if (!e.target.closest("button")) toggleMaximize(id); });
    titlebar.addEventListener("pointerdown", e => {
      if (e.target.closest("button") || element.classList.contains("maximized")) return;
      e.preventDefault(); focusWindow(id);
      const rect = element.getBoundingClientRect();
      const dx = e.clientX - rect.left, dy = e.clientY - rect.top;
      const move = ev => {
        element.style.left = `${Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - dx))}px`;
        element.style.top = `${Math.max(0, Math.min(window.innerHeight - 80, ev.clientY - dy))}px`;
      };
      const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    });
    const handle = element.querySelector(".resize-handle");
    handle.addEventListener("pointerdown", e => {
      e.preventDefault(); e.stopPropagation();
      const rect = element.getBoundingClientRect(); const sx = e.clientX, sy = e.clientY;
      const move = ev => { element.style.width = `${Math.max(330, rect.width + ev.clientX - sx)}px`; element.style.height = `${Math.max(240, rect.height + ev.clientY - sy)}px`; };
      const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    });
  }

  function focusWindow(id) {
    windows.forEach(win => { win.element.classList.add("inactive"); win.task.classList.remove("active"); });
    const win = windows.get(id); if (!win) return;
    win.element.classList.remove("inactive", "minimized"); win.element.style.zIndex = ++zIndex; win.task.classList.add("active");
  }
  function restoreAndFocus(id) { const win = windows.get(id); if (win) { win.element.classList.remove("minimized"); focusWindow(id); } }
  function minimizeWindow(id) { const win = windows.get(id); if (win) { win.element.classList.add("minimized"); win.task.classList.remove("active"); } }
  function toggleMaximize(id) { const win = windows.get(id); if (win) win.element.classList.toggle("maximized"); }
  function closeWindow(id) { const win = windows.get(id); if (!win) return; if (win.onClose && win.onClose() === false) return; win.element.remove(); win.task.remove(); windows.delete(id); }
  function updateWindowTitle(id, title) { const win = windows.get(id); if (!win) return; win.title = title; win.element.querySelector(".window-title").textContent = title; win.task.querySelector("span").textContent = title; }

  function openExplorer(startId = "desktop") {
    const id = `explorer-${startId}`;
    if (windows.has(id)) return restoreAndFocus(id);
    const root = document.createElement("div"); root.className = "explorer";
    let currentId = startId;
    let history = [startId]; let historyIndex = 0;
    const selectedIds = new Set();
    let lastSelectedId = null;
    let visibleItems = [];
    let fileWasDragged = false;
    root.innerHTML = `
      <div class="menubar"><button data-menu="file"><u>F</u>ile</button><button><u>E</u>dit</button><button><u>V</u>iew</button><button><u>H</u>elp</button></div>
      <div class="toolbar">
        <button class="tool-button" data-nav="back"><span class="tool-glyph">←</span><span>Back</span></button>
        <button class="tool-button" data-nav="up"><span class="tool-glyph">↑</span><span>Up</span></button>
        <span class="toolbar-divider"></span>
        <button class="tool-button" data-new="folder">${svg("folder")}<span>New folder</span></button>
        <button class="tool-button" data-new="text">${svg("document")}<span>New note</span></button>
        <button class="tool-button" data-delete><span class="tool-glyph">×</span><span>Delete</span></button>
      </div>
      <div class="addressbar"><label>Address</label><div class="address-field">${svg("folder")}<span></span></div></div>
      <div class="explorer-body">
        <aside class="places"><div class="place-card"><h3>PLACES</h3><button data-place="desktop">${svg("computer")} Desktop</button><button data-place="documents">${svg("folder")} My Documents</button><button data-place="trash">${svg("bin")} Recycle Bin</button></div><div class="place-card"><h3>LITTLE TIP</h3><p style="padding:3px 8px 8px;margin:0;font-size:9px;line-height:1.5">Double-click to open. Right-click for more options.</p></div></aside>
        <section class="file-area"></section>
      </div>
      <div class="statusbar"><span class="item-count"></span><span>Afterglow Local Disk</span></div>`;

    function syncExplorerSelection() {
      root.querySelectorAll(".file-item").forEach(button => button.classList.toggle("selected", selectedIds.has(button.dataset.id)));
      const selectedCount = selectedIds.size;
      const deletableCount = [...selectedIds].filter(itemId => {
        const item = getItem(itemId);
        return item && (currentId === "trash" || !item.system);
      }).length;
      root.querySelector("[data-delete]").disabled = deletableCount === 0;
      root.querySelector(".item-count").textContent = selectedCount
        ? `${selectedCount} selected · ${visibleItems.length} object${visibleItems.length === 1 ? "" : "s"}`
        : `${visibleItems.length} object${visibleItems.length === 1 ? "" : "s"}`;
    }
    function selectExplorerItem(itemId, event) {
      const additive = event.ctrlKey || event.metaKey;
      if (event.shiftKey && lastSelectedId) {
        const from = visibleItems.findIndex(item => item.id === lastSelectedId);
        const to = visibleItems.findIndex(item => item.id === itemId);
        if (!additive) selectedIds.clear();
        if (from >= 0 && to >= 0) visibleItems.slice(Math.min(from, to), Math.max(from, to) + 1).forEach(item => selectedIds.add(item.id));
      } else if (additive) {
        selectedIds.has(itemId) ? selectedIds.delete(itemId) : selectedIds.add(itemId);
      } else {
        selectedIds.clear();
        selectedIds.add(itemId);
      }
      lastSelectedId = itemId;
      syncExplorerSelection();
    }
    function beginFileDrag(event, itemId) {
      if (event.button !== 0 || currentId === "trash") return;
      const originX = event.clientX, originY = event.clientY;
      let moved = false;
      let ghost = null;
      let dropTarget = null;
      let dragIds = [];
      const move = pointerEvent => {
        if (!moved && Math.hypot(pointerEvent.clientX - originX, pointerEvent.clientY - originY) < 5) return;
        if (!moved) {
          moved = true;
          fileWasDragged = true;
          if (!selectedIds.has(itemId)) {
            if (!event.ctrlKey && !event.metaKey) selectedIds.clear();
            selectedIds.add(itemId);
            lastSelectedId = itemId;
            syncExplorerSelection();
          }
          dragIds = [...selectedIds];
          const draggedItem = getItem(itemId);
          ghost = document.createElement("div");
          ghost.className = "file-drag-ghost";
          ghost.innerHTML = `${svg(draggedItem?.type === "folder" ? "folder" : "document")}<span>${dragIds.length === 1 ? escapeHtml(draggedItem?.name || "Item") : `${dragIds.length} items`}</span>`;
          document.body.append(ghost);
          root.querySelectorAll(".file-item").forEach(button => button.classList.toggle("dragging", selectedIds.has(button.dataset.id)));
        }
        ghost.style.left = `${pointerEvent.clientX + 14}px`;
        ghost.style.top = `${pointerEvent.clientY + 12}px`;
        dropTarget = resolveDropTarget(pointerEvent.clientX, pointerEvent.clientY, dragIds, currentId);
        if (dropTarget) dropTarget.element.classList.add("drop-target");
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        clearDropTargets();
        ghost?.remove();
        root.querySelectorAll(".file-item.dragging").forEach(button => button.classList.remove("dragging"));
        if (!moved) return;
        setTimeout(() => { fileWasDragged = false; }, 0);
        if (dropTarget?.kind === "folder") moveItemsToFolder(dragIds, dropTarget.folderId);
        else if (dropTarget?.kind === "trash") moveToTrash(dragIds, refreshFileViews);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    }
    function deleteExplorerSelection() {
      const ids = [...selectedIds];
      if (!ids.length) return;
      const afterDelete = () => { selectedIds.clear(); lastSelectedId = null; render(); };
      currentId === "trash" ? permanentlyDelete(ids, afterDelete) : moveToTrash(ids, afterDelete);
    }
    function beginFileSelection(event) {
      if (event.button !== 0 || event.target.closest(".file-item")) return;
      const fileArea = root.querySelector(".file-area");
      fileArea.dataset.folderId = currentId;
      const areaRect = fileArea.getBoundingClientRect();
      const originX = Math.max(areaRect.left, Math.min(areaRect.right, event.clientX));
      const originY = Math.max(areaRect.top, Math.min(areaRect.bottom, event.clientY));
      const originalSelection = new Set(selectedIds);
      const additive = event.ctrlKey || event.metaKey;
      const box = document.createElement("div");
      box.className = "folder-selection-box";
      fileArea.append(box);
      let moved = false;
      const move = pointerEvent => {
        const currentX = Math.max(areaRect.left, Math.min(areaRect.right, pointerEvent.clientX));
        const currentY = Math.max(areaRect.top, Math.min(areaRect.bottom, pointerEvent.clientY));
        if (Math.abs(currentX - originX) + Math.abs(currentY - originY) > 4) moved = true;
        const left = Math.min(originX, currentX), top = Math.min(originY, currentY);
        const right = Math.max(originX, currentX), bottom = Math.max(originY, currentY);
        box.style.left = `${left - areaRect.left + fileArea.scrollLeft}px`;
        box.style.top = `${top - areaRect.top + fileArea.scrollTop}px`;
        box.style.width = `${right - left}px`;
        box.style.height = `${bottom - top}px`;
        selectedIds.clear();
        if (additive) originalSelection.forEach(id => selectedIds.add(id));
        root.querySelectorAll(".file-item").forEach(button => {
          const rect = button.getBoundingClientRect();
          if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) selectedIds.add(button.dataset.id);
        });
        syncExplorerSelection();
      };
      const up = () => {
        box.remove();
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        if (!moved && !additive) { selectedIds.clear(); lastSelectedId = null; syncExplorerSelection(); }
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    }
    function pathName(folderId) {
      if (folderId === "desktop") return "My Computer / Desktop";
      if (folderId === "trash") return "My Computer / Recycle Bin";
      const parts = []; let cursor = getItem(folderId);
      while (cursor) { parts.unshift(cursor.name); cursor = getItem(cursor.parentId); }
      return `My Computer / ${parts.join(" / ")}`;
    }
    function navigate(target, push = true) {
      currentId = target; selectedIds.clear(); lastSelectedId = null;
      if (push) { history = history.slice(0, historyIndex + 1); history.push(target); historyIndex++; }
      render();
    }
    function render() {
      const source = currentId === "trash" ? state.trash.filter(i => !state.trash.some(p => p.id === i.parentId)) : state.items.filter(i => i.parentId === currentId);
      visibleItems = source.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
      const fileArea = root.querySelector(".file-area");
      fileArea.dataset.folderId = currentId;
      const visibleIds = new Set(visibleItems.map(item => item.id));
      selectedIds.forEach(itemId => { if (!visibleIds.has(itemId)) selectedIds.delete(itemId); });
      root.querySelector(".address-field span").textContent = pathName(currentId);
      root.querySelector("[data-nav=back]").disabled = historyIndex <= 0;
      root.querySelector("[data-nav=up]").disabled = currentId === "desktop" || currentId === "trash";
      root.querySelector("[data-new=folder]").disabled = currentId === "trash";
      root.querySelector("[data-new=text]").disabled = currentId === "trash";
      fileArea.innerHTML = source.length ? `<div class="file-grid"></div>` : `<div class="empty-folder">${currentId === "trash" ? "Recycle Bin is empty.<br>Nothing but dust motes here." : "This folder is empty.<br>Right-click to make something."}</div>`;
      const grid = fileArea.querySelector(".file-grid");
      if (grid) visibleItems.forEach(item => {
        const button = document.createElement("button"); button.dataset.id=item.id;button.dataset.itemType=item.type;button.className = `file-item${selectedIds.has(item.id) ? " selected" : ""}`; button.innerHTML = `${svg(item.type === "folder" ? "folder" : "document")}<span>${escapeHtml(item.name)}</span>`;
        if (item.type === "folder") button.dataset.dropFolderId = item.id;
        button.addEventListener("pointerdown", e => beginFileDrag(e, item.id));
        button.addEventListener("click", e => { e.stopPropagation();if(fileWasDragged){fileWasDragged=false;e.preventDefault();return;}selectExplorerItem(item.id, e); });
        button.addEventListener("dblclick", () => currentId === "trash" ? restoreItem(item.id) : item.type === "folder" ? navigate(item.id) : openNotepad(item.id));
        button.addEventListener("contextmenu", e => {
          if(!selectedIds.has(item.id)){selectedIds.clear();selectedIds.add(item.id);lastSelectedId=item.id;syncExplorerSelection();}
          const chosen=[...selectedIds];
          showContext(e, currentId === "trash" ? [
            { label:`Restore${chosen.length>1?` ${chosen.length} items`:""}`, action:() => { restoreItems(chosen); selectedIds.clear(); render(); } }, { label:`Delete permanently${chosen.length>1?` (${chosen.length})`:""}`, action:() => permanentlyDelete(chosen,()=>{selectedIds.clear();render();}) }
          ] : [ { label:"Open", action:() => item.type === "folder" ? navigate(item.id) : openNotepad(item.id) }, ...(chosen.length===1?[{ label:"Rename", action:() => promptRename(item.id, render) }]:[]), "separator", { label:`Move to Recycle Bin${chosen.length>1?` (${chosen.length})`:""}`, action:() => moveToTrash(chosen,()=>{selectedIds.clear();render();}) } ]);
        });
        grid.append(button);
      });
      fileArea.onpointerdown = beginFileSelection;
      fileArea.oncontextmenu = e => showContext(e, currentId === "trash" ? [{label:"Empty Recycle Bin", action:() => emptyTrash(render)}] : [{label:"New Folder",action:() => promptCreate("folder", currentId, render)},{label:"New Text File",action:() => promptCreate("text",currentId,render)}]);
      syncExplorerSelection();
      const win = windows.get(id); if (win) updateWindowTitle(id, currentId === "trash" ? "Recycle Bin" : `${currentId === "desktop" ? "My Computer" : getItem(currentId)?.name || "Explorer"}`);
    }
    root.querySelector("[data-nav=back]").onclick = () => { if (historyIndex > 0) { historyIndex--; currentId = history[historyIndex]; render(); } };
    root.querySelector("[data-nav=up]").onclick = () => { const current = getItem(currentId); navigate(current?.parentId || "desktop"); };
    root.querySelectorAll("[data-place]").forEach(btn => btn.onclick = () => navigate(btn.dataset.place));
    root.querySelectorAll("[data-new]").forEach(btn => btn.onclick = () => promptCreate(btn.dataset.new, currentId, render));
    root.querySelector("[data-delete]").onclick = deleteExplorerSelection;
    root.addEventListener("keydown",event=>{if(event.key==="Delete"){event.preventDefault();deleteExplorerSelection();}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="a"){event.preventDefault();visibleItems.forEach(item=>selectedIds.add(item.id));syncExplorerSelection();}});
    root.querySelector("[data-menu=file]").onclick = e => showContext(e, [{label:"New Folder",action:() => promptCreate("folder",currentId,render)},{label:"New Text File",action:() => promptCreate("text",currentId,render)},"separator",{label:"Close",action:() => closeWindow(id)}]);
    explorerRefreshers.add(render);
    createWindow({ id, title: startId === "trash" ? "Recycle Bin" : "My Computer", icon: startId === "trash" ? "bin" : "computer", content: root, onClose:()=>{explorerRefreshers.delete(render);return true;} });
    render();
  }

  function openNotepad(fileId = null) {
    const file = fileId ? getItem(fileId) : null;
    const id = file ? `notepad-${file.id}` : `notepad-new-${uid()}`;
    if (windows.has(id)) return restoreAndFocus(id);
    const root = document.createElement("div"); root.className = "notepad";
    root.innerHTML = `<div class="menubar"><button data-note="new"><u>F</u>ile</button><button data-note="save"><u>S</u>ave</button><button data-note="time"><u>T</u>ime/date</button><button data-note="help"><u>H</u>elp</button></div><div class="editor-shell"><textarea class="editor" spellcheck="true" aria-label="Text editor"></textarea></div><div class="editor-status"><span>Plain text · UTF-8</span><span class="char-count">0 characters</span></div>`;
    const editor = root.querySelector(".editor"); editor.value = file?.content || "";
    let dirty = false;
    const title = () => `${dirty ? "• " : ""}${file?.name || "Untitled.txt"} — Notepad`;
    function count() { root.querySelector(".char-count").textContent = `${editor.value.length} characters`; }
    function save() {
      if (file) { file.content = editor.value; file.modified = Date.now(); dirty = false; saveState(); updateWindowTitle(id,title()); toast("Note saved to local disk."); }
      else promptCreate("text", "desktop", () => {}, editor.value, created => { dirty = false; closeWindow(id); openNotepad(created.id); });
    }
    editor.addEventListener("input", () => { dirty = true; count(); updateWindowTitle(id,title()); });
    root.querySelector("[data-note=save]").onclick = save;
    root.querySelector("[data-note=new]").onclick = e => showContext(e, [{label:"New note", action:() => openNotepad()},{label:"Save",action:save},"separator",{label:"Close",action:() => closeWindow(id)}]);
    root.querySelector("[data-note=time]").onclick = () => { const start = editor.selectionStart; const stamp = new Date().toLocaleString(); editor.setRangeText(stamp,start,editor.selectionEnd,"end"); editor.dispatchEvent(new Event("input")); editor.focus(); };
    root.querySelector("[data-note=help]").onclick = () => toast("Tip: your notes save inside this browser.");
    createWindow({ id, title:title(), icon:"note", width:630, height:455, content:root, onClose:() => { if (!dirty) return true; return confirm("Close without saving your changes?"); } });
    count(); setTimeout(() => editor.focus(), 0);
  }

  function promptCreate(type, parentId, callback = () => {}, content = "", afterCreate) {
    const form = document.createElement("form"); form.className = "dialog-wrap";
    form.innerHTML = `<div class="prompt-form"><label>${type === "folder" ? "Name this new folder" : "Name this new text file"}<input value="${type === "folder" ? "New Folder" : "Untitled"}" maxlength="60" autocomplete="off"></label><div class="dialog-actions"><button type="button" class="dialog-button" data-cancel>Cancel</button><button class="dialog-button primary">Create</button></div></div>`;
    const dialogId = `dialog-${uid()}`;
    createWindow({id:dialogId,title:type === "folder" ? "Create New Folder" : "Create New Text File",icon:type === "folder" ? "folder" : "document",width:390,height:190,content:form});
    const input = form.querySelector("input"); setTimeout(() => { input.focus(); input.select(); },0);
    form.querySelector("[data-cancel]").onclick = () => closeWindow(dialogId);
    form.onsubmit = e => {
      e.preventDefault(); const value = input.value.trim(); if (!value) return;
      const item = {id:uid(),name:uniqueName(value,parentId,type),type,parentId,created:Date.now()};
      if (type === "text") { item.content=content; item.modified=Date.now(); }
      state.items.push(item); saveState(); renderDesktop(); closeWindow(dialogId); callback(item); if (afterCreate) afterCreate(item); toast(`${item.name} created.`);
    };
  }

  function promptRename(id, callback = () => {}) {
    const item = getItem(id); if (!item) return;
    const form = document.createElement("form"); form.className="dialog-wrap";
    form.innerHTML=`<div class="prompt-form"><label>Enter a new name<input value="${escapeHtml(item.name)}" maxlength="60" autocomplete="off"></label><div class="dialog-actions"><button type="button" class="dialog-button" data-cancel>Cancel</button><button class="dialog-button primary">Rename</button></div></div>`;
    const dialogId=`dialog-${uid()}`; createWindow({id:dialogId,title:"Rename",icon:item.type === "folder" ? "folder" : "document",width:390,height:190,content:form});
    const input=form.querySelector("input"); setTimeout(()=>{input.focus();input.select()},0); form.querySelector("[data-cancel]").onclick=()=>closeWindow(dialogId);
    form.onsubmit=e=>{e.preventDefault();const value=input.value.trim();if(!value)return;item.name=uniqueName(value,item.parentId,item.type,state.items.filter(i=>i.id!==id));saveState();renderDesktop();callback();closeWindow(dialogId);toast("Item renamed.");};
  }

  function descendants(id, collection) { const found=[]; const walk=parent=>collection.filter(i=>i.parentId===parent).forEach(i=>{found.push(i);walk(i.id)}); walk(id); return found; }
  function confirmDesktop({title,message,detail="",confirmLabel="Confirm",icon="bin",danger=false,onConfirm}) {
    const dialogId=`confirm-${uid()}`;
    const form=document.createElement("form");form.className="dialog-wrap confirmation-wrap";
    form.innerHTML=`<div class="confirmation-panel"><div class="confirmation-icon">${svg(icon)}</div><div class="confirmation-copy"><h2>${escapeHtml(message)}</h2>${detail?`<p>${escapeHtml(detail)}</p>`:""}</div><div class="dialog-actions"><button type="button" class="dialog-button" data-cancel>Cancel</button><button class="dialog-button ${danger?"danger":"primary"}">${escapeHtml(confirmLabel)}</button></div></div>`;
    createWindow({id:dialogId,title,icon,width:445,height:235,content:form});
    const cancel=()=>closeWindow(dialogId);
    form.querySelector("[data-cancel]").onclick=cancel;
    form.onsubmit=event=>{event.preventDefault();closeWindow(dialogId);onConfirm();};
    form.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();cancel();}});
    setTimeout(()=>form.querySelector(danger?".danger":".primary").focus(),0);
  }
  function normalizeIds(ids){return [...new Set(Array.isArray(ids)?ids:[ids])];}
  function collectItems(ids,collection){
    const collected=new Map();
    normalizeIds(ids).forEach(id=>{const item=collection.find(candidate=>candidate.id===id);if(item)[item,...descendants(id,collection)].forEach(candidate=>collected.set(candidate.id,candidate));});
    return [...collected.values()];
  }
  function moveToTrash(ids,callback=()=>{}) {
    const requested=normalizeIds(ids).map(id=>state.items.find(item=>item.id===id)).filter(item=>item&&!item.system);
    if(!requested.length){toast("That system item stays where it is.");return;}
    const moving=collectItems(requested.map(item=>item.id),state.items);
    const label=requested.length===1?requested[0].name:`${requested.length} selected items`;
    confirmDesktop({title:"Move to Recycle Bin",message:`Move ${label} to the Recycle Bin?`,detail:"You can restore it later from the Recycle Bin.",confirmLabel:"Move to Bin",onConfirm:()=>{
      const movingIds=new Set(moving.map(item=>item.id));
      moving.forEach(item=>{item.originalParentId=item.parentId;item.deletedAt=Date.now();});state.items=state.items.filter(item=>!movingIds.has(item.id));state.trash.push(...moving);saveState();renderDesktop();toast(requested.length===1?`${requested[0].name} moved to Recycle Bin.`:`${requested.length} items moved to Recycle Bin.`);
      [...windows.keys()].filter(key=>movingIds.size&&[...movingIds].some(itemId=>key.includes(itemId))).forEach(closeWindow);callback();
    }});
  }
  function restoreItems(ids) {
    const requested=normalizeIds(ids).map(id=>state.trash.find(item=>item.id===id)).filter(Boolean);if(!requested.length)return;
    const restoring=collectItems(requested.map(item=>item.id),state.trash),restoringIds=new Set(restoring.map(item=>item.id));
    restoring.forEach(item=>{item.parentId=item.originalParentId||"desktop";delete item.originalParentId;delete item.deletedAt;});state.trash=state.trash.filter(item=>!restoringIds.has(item.id));state.items.push(...restoring);saveState();renderDesktop();toast(requested.length===1?`${requested[0].name} restored.`:`${requested.length} items restored.`);
  }
  function restoreItem(id){restoreItems([id]);}
  function permanentlyDelete(ids,callback=()=>{}) {
    const requested=normalizeIds(ids).map(id=>state.trash.find(item=>item.id===id)).filter(Boolean);if(!requested.length)return;
    const deleting=collectItems(requested.map(item=>item.id),state.trash),label=requested.length===1?requested[0].name:`${requested.length} selected items`;
    confirmDesktop({title:"Confirm Permanent Delete",message:`Permanently delete ${label}?`,detail:"This action cannot be undone.",confirmLabel:"Delete Forever",danger:true,onConfirm:()=>{const deletingIds=new Set(deleting.map(item=>item.id));state.trash=state.trash.filter(item=>!deletingIds.has(item.id));saveState();toast(requested.length===1?"Item permanently deleted.":`${requested.length} items permanently deleted.`);callback();}});
  }
  function emptyTrash(callback=()=>{}){if(!state.trash.length)return;confirmDesktop({title:"Empty Recycle Bin",message:"Permanently delete everything in the Recycle Bin?",detail:`${state.trash.length} item${state.trash.length===1?"":"s"} will be removed. This cannot be undone.`,confirmLabel:"Empty Bin",danger:true,onConfirm:()=>{state.trash=[];saveState();renderDesktop();toast("Recycle Bin emptied.");callback();}});}

  function showContext(event, entries) {
    event.preventDefault(); event.stopPropagation(); contextMenu.innerHTML="";
    entries.forEach(entry=>{if(entry==="separator"){contextMenu.append(document.createElement("hr"));return;}const button=document.createElement("button");button.textContent=entry.label;button.onclick=()=>{hideContext();entry.action();};contextMenu.append(button);});
    contextMenu.classList.remove("hidden"); const x=Math.min(event.clientX,window.innerWidth-200),y=Math.min(event.clientY,window.innerHeight-contextMenu.offsetHeight-52);contextMenu.style.left=`${Math.max(4,x)}px`;contextMenu.style.top=`${Math.max(4,y)}px`;
  }
  function hideContext(){contextMenu.classList.add("hidden");}
  function toast(message){const el=document.createElement("div");el.className="toast";el.textContent=message;document.querySelector("#toast-region").append(el);setTimeout(()=>el.remove(),2600);}

  desktop.addEventListener("pointerdown", beginDesktopSelection);
  desktop.addEventListener("click", e=>{hideContext();if(!e.target.closest("#start-menu,#start-button")){startMenu.classList.add("hidden");startButton.classList.remove("active");startButton.setAttribute("aria-expanded","false");}});
  desktop.addEventListener("contextmenu", e=>{if(e.target===desktop || e.target.classList.contains("sky-grain") || e.target.classList.contains("landscape"))showContext(e,[{label:"New Folder",action:()=>promptCreate("folder","desktop")},{label:"New Text File",action:()=>promptCreate("text","desktop")},"separator",{label:"Open My Computer",action:()=>openExplorer("desktop")},{label:"Refresh",action:()=>{renderDesktop();toast("Desktop refreshed.");}}]);});
  startButton.onclick=e=>{e.stopPropagation();const open=startMenu.classList.toggle("hidden")===false;startButton.classList.toggle("active",open);startButton.setAttribute("aria-expanded",String(open));};
  startMenu.querySelectorAll("[data-start-action]").forEach(btn=>btn.onclick=()=>{const action=btn.dataset.startAction;startMenu.classList.add("hidden");if(action==="computer")openExplorer("desktop");if(action==="notes")openNotepad();if(action==="music")togglePlayer();if(action==="minesweeper")openMinesweeper();if(action==="fishing")openFishing();if(action==="about")openAbout();if(action==="sleep")restMode();});

  function openMinesweeper(){
    if(windows.has("minesweeper"))return restoreAndFocus("minesweeper");
    const game=window.createAfterglowMinesweeper();
    createWindow({id:"minesweeper",title:"Night Mines",icon:"minesweeper",width:840,height:630,content:game.element,onClose:()=>{game.destroy();return true;}});
    setTimeout(()=>game.focus(),0);
  }

  function openFishing(){
    if(windows.has("fishing"))return restoreAndFocus("fishing");
    const game=window.createAfterglowFishing();
    createWindow({id:"fishing",title:"Rainy Lake Fishing",icon:"fishing",width:940,height:660,content:game.element,onClose:()=>{game.destroy();return true;}});
    setTimeout(()=>game.focus(),0);
  }

  function openAbout(){const root=document.createElement("div");root.className="dialog-wrap";root.innerHTML=`<div class="dialog-body">${svg("computer")}<h2>Afterglow OS</h2><p>A small, soft operating system for notes, folders, and unhurried evenings.<br><br>Version 0.1 · Everything is stored locally in your browser.</p><button class="dialog-button primary">that's lovely</button></div>`;createWindow({id:"about",title:"About Afterglow OS",icon:"computer",width:450,height:345,content:root});root.querySelector("button").onclick=()=>closeWindow("about");}
  function restMode(){const overlay=document.createElement("div");overlay.className="sleep-overlay";overlay.innerHTML="<button>☾ &nbsp; click to wake afterglow</button>";desktop.append(overlay);overlay.onclick=()=>overlay.remove();}

  const lofiAudio=document.querySelector("#lofi-audio"),cassettePlayer=document.querySelector("#cassette-player"),playButton=document.querySelector("#play-button"),cassetteButton=document.querySelector("#cassette-button"),trackSeek=document.querySelector("#track-seek"),trackProgress=document.querySelector("#track-progress"),trackTime=document.querySelector("#track-time"),volumeButton=document.querySelector("#volume-button"),volumePopover=document.querySelector("#volume-popover"),volumeSlider=document.querySelector("#volume-slider"),volumeValue=document.querySelector("#volume-value");
  const savedVolume=Math.max(0,Math.min(1,Number(localStorage.getItem("afterglow-volume")??.78)));lofiAudio.volume=savedVolume;volumeSlider.value=String(Math.round(savedVolume*100));volumeValue.textContent=`${volumeSlider.value}%`;
  if(localStorage.getItem("afterglow-player-discovered")!=="yes")playButton.classList.add("player-attention");
  function dismissPlayerHint(){if(!playButton.classList.contains("player-attention"))return;playButton.classList.remove("player-attention");localStorage.setItem("afterglow-player-discovered","yes");}
  let defaultPlaybackPending=true;
  function removeDefaultPlaybackFallback(){document.removeEventListener("pointerdown",startDefaultPlayback,true);document.removeEventListener("keydown",startDefaultPlayback,true);}
  async function startDefaultPlayback(event){
    if(!defaultPlaybackPending)return;
    if(event?.target?.closest?.("#cassette-player,#sound-toggle"))return;
    try{await lofiAudio.play();defaultPlaybackPending=false;removeDefaultPlaybackFallback();syncPlayer();}
    catch(_){/* Audible autoplay will retry on the first desktop interaction. */}
  }
  document.addEventListener("pointerdown",startDefaultPlayback,true);document.addEventListener("keydown",startDefaultPlayback,true);startDefaultPlayback();
  function formatTime(seconds){if(!Number.isFinite(seconds))return "0:00";const minutes=Math.floor(seconds/60),remaining=Math.floor(seconds%60);return `${minutes}:${String(remaining).padStart(2,"0")}`;}
  function syncPlayer(){const playing=!lofiAudio.paused;if(playing){dismissPlayerHint();if(defaultPlaybackPending){defaultPlaybackPending=false;removeDefaultPlaybackFallback();}}playButton.textContent=playing?"Ⅱ":"▶";playButton.setAttribute("aria-label",playing?"Pause Raining in Osaka":"Play Raining in Osaka");cassetteButton.setAttribute("aria-label",playing?"Pause Raining in Osaka":"Play Raining in Osaka");cassettePlayer.classList.toggle("playing",playing);}
  async function togglePlayer(){
    if(lofiAudio.paused){
      try{await lofiAudio.play();toast("Now playing: Raining in Osaka");}
      catch(_){lofiAudio.pause();toast("Your browser blocked audio. Click play once more.");}
    }else{lofiAudio.pause();}
    syncPlayer();
  }
  function updateTrackProgress(){const duration=lofiAudio.duration||0,current=lofiAudio.currentTime||0,progress=duration?current/duration*100:0;trackProgress.style.width=`${progress}%`;trackSeek.setAttribute("aria-valuenow",String(Math.round(progress)));trackTime.textContent=`${formatTime(current)} / ${formatTime(duration)}`;}
  function seekTrack(event){const rect=trackSeek.getBoundingClientRect();const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));if(Number.isFinite(lofiAudio.duration))lofiAudio.currentTime=lofiAudio.duration*ratio;updateTrackProgress();}
  playButton.onclick=()=>{dismissPlayerHint();togglePlayer();};cassetteButton.onclick=togglePlayer;cassetteButton.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();togglePlayer();}};trackSeek.onclick=seekTrack;
  trackSeek.onkeydown=event=>{if(!Number.isFinite(lofiAudio.duration))return;if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();lofiAudio.currentTime=Math.max(0,Math.min(lofiAudio.duration,lofiAudio.currentTime+(event.key==="ArrowRight"?5:-5)));updateTrackProgress();}};
  lofiAudio.addEventListener("timeupdate",updateTrackProgress);lofiAudio.addEventListener("loadedmetadata",updateTrackProgress);lofiAudio.addEventListener("play",syncPlayer);lofiAudio.addEventListener("pause",syncPlayer);
  volumeButton.onclick=event=>{event.stopPropagation();const open=volumePopover.classList.toggle("hidden")===false;volumeButton.setAttribute("aria-expanded",String(open));if(open)volumeSlider.focus();};
  volumePopover.onclick=event=>event.stopPropagation();
  volumeSlider.oninput=()=>{const volume=Number(volumeSlider.value)/100;lofiAudio.volume=volume;lofiAudio.muted=false;volumeValue.textContent=`${volumeSlider.value}%`;volumeButton.textContent=volume===0?"♩":"♫";document.querySelector("#sound-toggle").textContent=volume===0?"♩":"♫";localStorage.setItem("afterglow-volume",String(volume));};
  document.querySelector("#sound-toggle").onclick=()=>{lofiAudio.muted=!lofiAudio.muted;const symbol=lofiAudio.muted?"♩":"♫";document.querySelector("#sound-toggle").textContent=symbol;volumeButton.textContent=symbol;toast(lofiAudio.muted?"Cassette muted.":"Cassette sound restored.");};
  document.addEventListener("click",event=>{if(event.target.closest(".player-controls"))return;volumePopover.classList.add("hidden");volumeButton.setAttribute("aria-expanded","false");});
  document.addEventListener("pointerdown",event=>{if(!event.target.closest("button,[role=button],.file-item"))return;const pulse=document.createElement("span");pulse.className="click-pulse";pulse.style.left=`${event.clientX}px`;pulse.style.top=`${event.clientY}px`;desktop.append(pulse);setTimeout(()=>pulse.remove(),450);});

  function updateClock(){const now=new Date();document.querySelector("#clock").textContent=`${now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}\n${now.toLocaleDateString([],{month:"short",day:"numeric"})}`;}
  updateClock();setInterval(updateClock,30000);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){hideContext();startMenu.classList.add("hidden");}if(e.ctrlKey&&e.key.toLowerCase()==="s"){const active=[...windows.values()].find(w=>!w.element.classList.contains("inactive")&&!w.element.classList.contains("minimized"));const save=active?.element.querySelector("[data-note=save]");if(save){e.preventDefault();save.click();}}});
  window.addEventListener("resize",()=>windows.forEach(win=>{const r=win.element.getBoundingClientRect();if(r.left>window.innerWidth-80)win.element.style.left=`${Math.max(0,window.innerWidth-r.width)}px`;if(r.top>window.innerHeight-70)win.element.style.top="6px";}));

  renderDesktop();
  setTimeout(()=>toast("Welcome back. Double-click an icon to begin."),500);
})();
