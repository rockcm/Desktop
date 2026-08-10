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
- Classic click-drag selection, multi-icon dragging, smooth collision-free high-density grid snapping, and folder/recycle-bin drop targets across the desktop and Explorer
- Draggable, resizable, minimizable, maximizable windows
- Working Start menu, taskbar, clock, context menus, and rest mode
- Embedded Google Chrome-style browser window with Google search, an address bar, navigation controls, bookmarks, and guarded in-desktop browsing
- Native cassette player with the local Raining in Osaka mix, live time, seeking, saved volume, mute, and pause/play
- Night Mines, a complete Minesweeper game with first-click protection, flood reveal, flagging, number chording, three difficulties, keyboard/touch controls, sound, and persistent best times
- Rainy Lake Fishing, an original cast-and-reel game with six illustrated fish species, three specialized lures, streak scoring, timing and line-tension mechanics, animated lake life, sound, and a persistent specimen archive with per-species records
- Folder creation, navigation, renaming, drag-box/Ctrl/Shift multi-selection, and keyboard deletion
- Text-file creation, editing, saving, and timestamps
- Recycle Bin with multi-item restore, themed desktop confirmation windows, permanent delete, and empty actions
- Responsive layout for smaller screens
- Custom neon AOS browser-tab and touch icon

The app remains dependency-free. The desktop lives in `index.html`, `styles.css`, and `app.js`; game logic is isolated in `minesweeper.js` and `fishing.js` so new applications can be added without introducing a framework prematurely.

## Wallpaper

The project-local `assets/photos/rainGif.gif` animation is composited at low opacity over the high-resolution Afterglow artwork so the scene stays sharp while the rain moves.

## Audio

The cassette uses the project-local `assets/audio/RAINING IN ＯＳＡＫＡ.mp3` track. Playback, seeking, mute, and the saved volume level are handled with the native browser audio API.
