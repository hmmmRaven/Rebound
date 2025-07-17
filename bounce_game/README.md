# Basketball Bounce – Next.js Game

A small homage to the classic Nokia "Bounce" game, built with Next.js 14 and the App Router.

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Gameplay

* Move left / right with the arrow keys.
* Jump (bounce) with Space when on a platform.
* Stomp the basketball-player enemies to defeat them.
* Avoid spikes – touching them resets the level.

## Assets

Put the following images inside `public/` (same filenames):

* `background.jpg` – outdoor cityscape background.
* `ball.png` – basketball sprite (≈ 50 × 50px).
* `player.png` – enemy sprite (≈ 40 × 60px).
* `spike.png` – spike trap (≈ 40 × 40px).
* `trampoline.png` – platform image (≈ 120 × 20px). A simple colored rectangle will also work.

You can replace these with your own images of any size; they will be drawn to fit the specified entity dimensions.
