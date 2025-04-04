// Script to test the subscription validation endpoint
// Using dynamic import for node-fetch (ESM module)

async function testSubscriptionValidation() {
  // Dynamically import node-fetch
  const { default: fetch } = await import('node-fetch');
  try {
    // Test with an invalid payment ID
    console.log('Testing with invalid payment ID...');
    const response = await fetch('http://localhost:7001/api/customers/validate-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ paymentId: 'test-payment-id' })
    });

    const data = await response.json();
    console.log('Response:', data);

    // You can add more test cases here if needed
    // For example, testing with no payment ID, or with a valid payment ID if available
  } catch (error) {
    console.error('Error testing subscription validation:', error);
  }
}

// Run the test function
testSubscriptionValidation();