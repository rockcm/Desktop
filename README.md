# Afterglow OS

A dependency-free, late-90s-inspired lofi desktop that runs entirely in the browser.

## Run it

Open `index.html` directly, or serve the folder with any static web server:

```powershell
npx serve .
```

No build step or package installation is required. Files and folders are stored in the browser's `localStorage` under `afterglow-os-v1`.

## Included in this first pass

- Custom retro SVG icon set
- Original high-resolution Afterglow rainy-night wallpaper with a lightweight animated rain layer and matching teal and neon UI palette
- Classic click-drag selection, multi-icon dragging, cursor-aware desktop creation and Explorer-to-desktop drops, nearest-free collision-resistant grid snapping, and folder/Recycle Bin drop targets across the desktop, Explorer places, breadcrumbs, and open bin windows
- Draggable, resizable, minimizable, maximizable windows
- Searchable two-column Start menu, quick-launch taskbar, task-button menus, show-desktop control, live clock/calendar, expanded Windows-style context menus, and rest mode
- Persistent Control Panel with live wallpaper previews, rain opacity and motion controls, five accent themes, separate interface-sound styles, compact/normal/roomy icon spacing, 12/24-hour clock formats, and automatic icon arrangement
- Rainy Motel Gallery with six built-in photographs, thumbnail browsing, keyboard controls, zoom/fit, slideshow, metadata, and Set as Wallpaper
- Standard Calculator with keyboard input, memory controls, percent/square-root/reciprocal operations, and a compact calculation tape
- Neon Paint with brushes, pencil, eraser, shapes, flood fill, eyedropper, neon palette, custom colors, zoom/grid, undo/redo, image import, and PNG export
- Afterglow Solitaire, a complete draw-one Klondike game with legal stack dragging, double-click auto-foundation, undo, auto-finish, saved statistics, timer, scoring, help, and sound
- Embedded Google Chrome-style browser window with Google search, an address bar, navigation controls, bookmarks, and guarded in-desktop browsing
- Native cassette player with the local Raining in Osaka mix, live time, seeking, saved volume, mute, and pause/play
- Night Mines, a complete Minesweeper game with first-click protection, flood reveal, flagging, number chording, three difficulties, keyboard/touch controls, sound, and persistent best times
- Rainy Lake Fishing, an original one-button cast-and-reel game with six illustrated species, responsive line tension, species-specific safe zones, telegraphed runs, jumps and dives, species-specific behavior, three specialized lures, streak scoring, upgraded animated lake/motel graphics, sound, and a persistent specimen archive
- Neon Snake, a polished neon-rain arcade game with three routes, combo scoring, escalating speed and barriers, special pickups, saved records, keyboard/touch controls, particles, pause, help, and sound
- Folder creation, clickable hover-highlighted breadcrumb paths, navigation, renaming, drag-box/Ctrl/Shift multi-selection, and keyboard deletion
- Text-file creation, editing, saving, and timestamps
- Recycle Bin with multi-item restore, themed desktop confirmation windows, permanent delete, and empty actions
- Responsive layout for smaller screens
- Custom neon AOS browser-tab and touch icon

The app remains dependency-free. The desktop lives in `index.html`, `styles.css`, and `app.js`; larger applications are isolated in `controlpanel.js`, `paint.js`, `solitaire.js`, `minesweeper.js`, `fishing.js`, and `snake.js` so features can grow without introducing a framework prematurely.

## Wallpaper

The project-local `assets/photos/rainGif.gif` animation is composited at low opacity over the high-resolution Afterglow artwork so the scene stays sharp while the rain moves.

## Audio

The cassette uses the project-local `assets/audio/RAINING IN ＯＳＡＫＡ.mp3` track. Playback, seeking, mute, and the saved volume level are handled with the native browser audio API.
