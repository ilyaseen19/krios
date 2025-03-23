import { useEffect, useState } from 'react';

// Default settings for cash drawer communication
const DEFAULT_BAUD_RATE = 9600;
const DEFAULT_OPEN_COMMAND = [0x1B, 0x70, 0x00, 0x19, 0xFA]; // ESC p 0 25 250 - Standard EPSON command

interface CashDrawerOptions {
  baudRate?: number;
  openCommand?: number[];
}

/**
 * Opens the cash drawer using Web Serial API
 * @param options Configuration options for the cash drawer
 * @returns Promise that resolves when the drawer is opened or rejects with an error
 */
export const openCashDrawer = async (options: CashDrawerOptions = {}): Promise<void> => {
  const { baudRate = DEFAULT_BAUD_RATE, openCommand = DEFAULT_OPEN_COMMAND } = options;
  
  try {
    // Request port access
    const port = await navigator.serial.requestPort();
    
    // Open the port
    await port.open({ baudRate });
    
    // Create a writer to send commands
    const writer = port.writable.getWriter();
    
    // Send the open drawer command
    await writer.write(new Uint8Array(openCommand));
    
    // Release the writer
    writer.releaseLock();
    
    // Close the port
    await port.close();
    
    console.log('Cash drawer command sent successfully');
    return Promise.resolve();
  } catch (error) {
    console.error('Error opening cash drawer:', error);
    return Promise.reject(error);
  }
};

/**
 * Hook to manage cash drawer state and operations
 * @param options Configuration options for the cash drawer
 * @returns Object with drawer state and functions
 */
export const useCashDrawer = (options: CashDrawerOptions = {}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  // Check if Web Serial API is supported
  useEffect(() => {
    setIsSupported('serial' in navigator);
  }, []);
  
  // Function to open the cash drawer
  const openDrawer = async () => {
    if (!isSupported) {
      setError(new Error('Web Serial API is not supported in this browser'));
      return;
    }
    
    setIsOpening(true);
    setError(null);
    
    try {
      await openCashDrawer(options);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error opening cash drawer'));
    } finally {
      setIsOpening(false);
    }
  };
  
  return {
    openDrawer,
    isOpening,
    error,
    isSupported
  };
};

/**
 * Simulates opening a cash drawer for development/testing
 * This can be used when actual hardware is not available
 */
export const simulateOpenCashDrawer = (): Promise<void> => {
  console.log('Simulating cash drawer opening...');
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Cash drawer simulation completed');
      resolve();
    }, 500);
  });
};