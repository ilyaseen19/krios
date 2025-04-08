import React, { useEffect, useState } from 'react';
import './Toast.css';
import { useOffline } from '../contexts/OfflineContext';


const PersistentOfflineToast: React.FC = () => {
  const [show, setShow] = useState(false);
  const { 
    isOffline
  } = useOffline();

  useEffect(() => {
    if (isOffline) {
      setShow(true);
    } else {
      // Add a small delay before hiding to ensure smooth transition
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!show) return null;

  return (
    <div className="persistent-toast-container">
      <div className="toast error show">
        <div className="toast-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="toast-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>You are currently offline. Some features may be unavailable.</span>
        </div>
      </div>
    </div>
  );
};

export default PersistentOfflineToast;