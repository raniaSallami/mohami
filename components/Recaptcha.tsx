import React, { useEffect, useState, useCallback } from 'react';

// Site key for reCAPTCHA v3
const RECAPTCHA_SITE_KEY = '6LfUwIUsAAAAAHhZ9shKyoYxjV0Yjgp2loqj4tFN';

interface RecaptchaProps {
  onVerify: (token: string) => void;
  action?: string;
}

export const Recaptcha: React.FC<RecaptchaProps> = ({ 
  onVerify,
  action = 'login'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if grecaptcha is already loaded
    if (window.grecaptcha) {
      setIsLoaded(true);
    } else {
      // Wait for grecaptcha to load
      const timer = setInterval(() => {
        if (window.grecaptcha) {
          setIsLoaded(true);
          clearInterval(timer);
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(timer), 10000);

      return () => clearInterval(timer);
    }
  }, []);

  // Function to execute reCAPTCHA v3
  const executeRecaptcha = useCallback(async () => {
    if (window.grecaptcha && isLoaded) {
      try {
        const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
        onVerify(token);
      } catch (error) {
        console.error('reCAPTCHA error:', error);
      }
    }
  }, [onVerify, action, isLoaded]);

  // Execute on mount
  useEffect(() => {
    if (isLoaded) {
      executeRecaptcha();
    }
  }, [isLoaded, executeRecaptcha]);

  // For reCAPTCHA v3, we don't render a visible widget
  // But we can show a badge as required by Google
  return (
    <div className="recaptcha-badge">
      <div 
        className="grecaptcha-badge"
        style={{
          visibility: 'visible'
        }}
      >
        {/* This div is required for reCAPTCHA v3 - it shows the Google badge */}
      </div>
    </div>
  );
};

// Export function to execute reCAPTCHA manually
export const executeRecaptcha = async (action: string = 'login'): Promise<string | null> => {
  if (window.grecaptcha) {
    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
      return token;
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return null;
    }
  }
  return null;
};

// Export function to reset reCAPTCHA
export const resetGlobalRecaptcha = () => {
  // No reset needed for v3 as it generates new tokens on each call
};

// Type declaration for window.grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, config: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}

export default Recaptcha;

