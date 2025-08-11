import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Error.module.css';

export default function CustomError({ statusCode }) {
  const router = useRouter();

  useEffect(() => {
    // If this is related to an access restriction, redirect to home
    if (statusCode === 403) {
      router.replace('/');
    }
  }, [statusCode, router]);

  return (
    <div className={styles.container}>
      <h1>Something went wrong</h1>
      <p>
        {statusCode 
          ? `An error ${statusCode} occurred on the server` 
          : 'An error occurred on the client'}
      </p>
      <button onClick={() => router.push('/')} className={styles.button}>
        Return to Home
      </button>
    </div>
  );
}
