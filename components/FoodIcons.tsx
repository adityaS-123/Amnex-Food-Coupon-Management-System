import React from 'react';

export const PlateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
    <path d="M12 6C9.79 6 8 7.79 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 7.79 14.21 6 12 6ZM12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12Z" fill="currentColor"/>
  </svg>
);

export const ForkKnifeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 3H13V21H11V3Z" fill="currentColor"/>
    <path d="M6 8C6 5.79 7.79 4 10 4V11L6 16V8Z" fill="currentColor"/>
    <path d="M18 8C18 5.79 16.21 4 14 4V11L18 16V8Z" fill="currentColor"/>
  </svg>
);

export const BurgerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 5H3C2.45 5 2 5.45 2 6V8C2 8.55 2.45 9 3 9H21C21.55 9 22 8.55 22 8V6C22 5.45 21.55 5 21 5Z" fill="currentColor"/>
    <path d="M21 11H3C2.45 11 2 11.45 2 12C2 12.55 2.45 13 3 13H21C21.55 13 22 12.55 22 12C22 11.45 21.55 11 21 11Z" fill="currentColor"/>
    <path d="M21 15H3C2.45 15 2 15.45 2 16V18C2 18.55 2.45 19 3 19H21C21.55 19 22 18.55 22 18V16C22 15.45 21.55 15 21 15Z" fill="currentColor"/>
  </svg>
);
