// Quick test to check API response structure
const response = await fetch('http://localhost:5001/api/schemes?language=en');
const data = await response.json();

console.log('Number of schemes:', data.length);
console.log('First scheme structure:', JSON.stringify(data[0], null, 2));
console.log('First scheme has id?:', 'id' in data[0]);
console.log('First scheme has _id?:', '_id' in data[0]);
console.log('First scheme has schemeId?:', 'schemeId' in data[0]);
