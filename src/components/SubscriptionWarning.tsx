import React, { useEffect, useState } from 'react';
import { getSubscription, isSubscriptionValid, validateOfflineSubscription, validateOnlineSubscription } from '../services/subscriptionService';
import { isOnline } from '../services/networkService';
import './SubscriptionWarning.css';

interface SubscriptionWarningProps {
  variant?: 'topbar' | 'pos';
}

const SubscriptionWarning: React.FC<SubscriptionWarningProps> = ({ variant = 'topbar' }) => {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    
    // Check subscription status every hour
    const intervalId = setInterval(checkSubscriptionStatus, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscription = await getSubscription();
      
      if (!subscription || !subscription.paymentDate) {
        return;
      }
      
      // Check subscription validity based on connectivity status
      let isValid = false;
      
      if (isOnline()) {
        // If online, validate with backend server
        if (subscription.paymentId) {
          isValid = await validateOnlineSubscription(subscription.paymentId);
        }
      } else {
        // If offline, use local validation
        isValid = await validateOfflineSubscription();
      }
      
      // If subscription is not valid, don't show warning
      if (!isValid) {
        setDaysRemaining(null);
        return;
      }
      
      const paymentDate = new Date(subscription.paymentDate);
      const currentDate = new Date();
      const expiryDate = new Date(paymentDate);
      expiryDate.setDate(expiryDate.getDate() + 32); // Subscription expires after 32 days
      
      const remainingTime = expiryDate.getTime() - currentDate.getTime();
      const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
      
      if (remainingDays <= 10 && remainingDays > 0) {
        setDaysRemaining(remainingDays);
      } else {
        setDaysRemaining(null);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setDaysRemaining(null);
    }
  };
  
  if (daysRemaining === null) {
    return null;
  }
  
  return (
    <div className={`subscription-warning`}>
      <div className="warning-content">
        <svg className="warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="warning-text">
          Your subscription expires in <strong>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong>. 
          <a href="https://prynova.netlify.app/payment" target="_blank" rel="noopener noreferrer" className="renew-link">
            Renew now
          </a>
        </span>
      </div>
    </div>
  );
};

export default SubscriptionWarning;