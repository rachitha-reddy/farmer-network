

async function loadResources() {
  try {
    const res = await fetch('/api/resources');
    const resources = await res.json();

    const container = document.querySelector('.container');
    // Clear or manage existing resource cards here
    // For simplicity, just console log for now
    console.log(resources);
  } catch (err) {
    console.error('Failed to load resources:', err);
  }
}
loadResources();
async function addResource(resourceData) {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resourceData)
    });
    if (!response.ok) throw new Error('Failed to add resource');
    const newResource = await response.json();
    console.log('Resource added:', newResource);
    // Optionally update UI or reload resource list
  } catch (error) {
    console.error('Error adding resource:', error);
  }
}

// Example usage:
// addResource({
//   name: 'New Tractor',
//   owner: 'John Doe',
//   contact: '9998887776',
//   location: 'Village X',
//   status: 'Available',
//   nextAvailable: 'Immediately'
// });