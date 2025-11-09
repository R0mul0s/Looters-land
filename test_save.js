// Test localStorage
const saved = localStorage.getItem('looters-land-autosave');
if (saved) {
  const data = JSON.parse(saved);
  console.log('Saved data structure:', JSON.stringify(data, null, 2));
} else {
  console.log('No save found');
}
