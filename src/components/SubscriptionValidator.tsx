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
      // Default to valid in case of errors to prevent blocking the app unnecessarily
      setIsValid(true);
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