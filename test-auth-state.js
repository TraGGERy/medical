// Simple test to check current authentication state
console.log('Testing authentication state...');

// This will help us understand if the user is properly authenticated
// when accessing the consultation page

// The consultation belongs to user: user_30YE3G7Wimt7RPSbs5Dy0tN0fBX
// We need to verify if the current user matches this ID

const testData = {
  consultationId: 'f80de441-677c-4c6a-8279-99e69e9b1841',
  expectedUserId: 'user_30YE3G7Wimt7RPSbs5Dy0tN0fBX',
  consultationExists: true,
  consultationStatus: 'active'
};

console.log('Test data:', testData);
console.log('\nTo debug the issue:');
console.log('1. Open browser console when accessing the consultation page');
console.log('2. Look for our debug logs with emojis (🔍, ✅, ❌)');
console.log('3. Check if the user ID matches:', testData.expectedUserId);
console.log('4. Verify API responses are successful (200 status)');
console.log('\nIf user ID doesn\'t match, the user needs to sign in with the correct account.');