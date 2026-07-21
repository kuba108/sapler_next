'use client';

import { useEffect, useState } from 'react';
import styles from './HomeSlider.module.css';

const SLIDES = [
  'sapler_2.jpeg',
  'sapler_6.jpeg',
  'sapler_5.jpeg',
  'sapler_4.jpeg',
];

export default function HomeSlider() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className={styles.hero} aria-label="Úvodní fotografie" aria-roledescription="carousel">
      {SLIDES.map((slide, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide}
          src={`/assets/template/header/${slide}`}
          alt=""
          className={`${styles.slide}${index === active ? ` ${styles.active}` : ''}`}
          aria-hidden={index !== active}
          fetchPriority={index === 0 ? 'high' : 'auto'}
        />
      ))}
      <div key={active} className={styles.timer} aria-hidden="true" />
    </section>
  );
}
