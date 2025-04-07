import React, { useEffect, useState } from 'react';
import { isSubscriptionValid } from '../services/subscriptionService';
import StandaloneSubscriptionModal from './modals/StandaloneSubscriptionModal';

interface SubscriptionValidatorProps {
  children: React.ReactNode;
}

const SubscriptionValidator: React.FC<SubscriptionValidatorProps> = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(true);

  const checkSubscription = async () => {
    setIsValidating(true);
    try {
      const valid = await isSubscriptionValid();
      setIsValid(valid);
    } catch (error) {
      console.error('Error checking subscription:', error);
      window.toast?.warning('Error checking subscription:');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleSubscriptionUpdated = () => {
    checkSubscription();
  };

  // Show loading state while validating
  if (isValidating) {
    return <div className="loading-container">Validating subscription...</div>;
  }

  return (
    <>
      {!isValid && (
        <StandaloneSubscriptionModal 
          isOpen={!isValid} 
          onSubscriptionUpdated={handleSubscriptionUpdated} 
        />
      )}
      {isValid && children}
    </>
  );
};

export default SubscriptionValidator;