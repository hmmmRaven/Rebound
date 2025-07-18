'use client';

import { useEffect } from 'react';
import GameCanvas from '../components/GameCanvas';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Rebound Game</h1>
      <div className={styles.gameContainer}>
        <GameCanvas />
      </div>
    </main>
  );
}
