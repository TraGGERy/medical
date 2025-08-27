// Test file to check if Input component can be imported
try {
  const { Input } = require('./src/components/ui/input.tsx');
  console.log('Input component imported successfully:', Input);
} catch (error) {
  console.error('Error importing Input component:', error.message);
}