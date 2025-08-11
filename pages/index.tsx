import Head from 'next/head';
import Image from 'next/image';
import CouponGenerator from '../components/CouponGenerator';
import OpenCouponGenerator from '../components/OpenCouponGenerator';
import styles from '../styles/Home.module.css';

export default function Home() {
  const isAdmin = true; // Replace with actual admin check logic

  return (
    <div className={styles.container}>
      <Head>
        <title>AMNEX Food Service</title>
        <meta name="description" content="Generate your daily meal coupon" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <img 
              src="/amnex-logo.png" 
              alt="AMNEX" 
              className={styles.logoImage}
            />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={`${styles.foodIcons} ${styles.icon1}`}>🍕</span>
          <span className={`${styles.foodIcons} ${styles.icon2}`}>🍔</span>
          <span className={`${styles.foodIcons} ${styles.icon3}`}>🍲</span>
          <span className={`${styles.foodIcons} ${styles.icon4}`}>🥗</span>
          
          <h1 className={styles.title}>
            Welcome to <span className={styles.brand}>AMNEX</span> Food Service
          </h1>
          <p className={styles.description}>
            Generate your daily meal coupon and enjoy fresh, delicious food prepared just for you
          </p>
        </section>

        <div className={styles.content}>
          <div className={styles.contentHeader}>
            <h2>Daily Meal Coupon Generator</h2>
          </div>
          <div className={styles.contentBody}>
            <CouponGenerator />
            {isAdmin && <OpenCouponGenerator />}
          </div>
        </div>
      </main>
    </div>
  );
}