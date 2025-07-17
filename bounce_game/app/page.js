'use client';

import GameCanvas from '../components/GameCanvas';

export default function HomePage() {
  return (
    <main style={{ textAlign: 'center', color: '#fff' }}>
      <h1>Basketball Bounce</h1>
      <p>Use ← → to move, SPACE to jump. Stomp the players, avoid spikes!</p>
      <GameCanvas />
    </main>
  );
}
