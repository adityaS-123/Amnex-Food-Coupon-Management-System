const fs = require('fs');
const path = require('path');

async function createMenuStorage() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'menus');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Menu storage directory created successfully:', uploadDir);
    } else {
      console.log('Menu storage directory already exists:', uploadDir);
    }

    // Create a simple index file to track uploaded menus
    const indexFile = path.join(uploadDir, 'index.json');
    if (!fs.existsSync(indexFile)) {
      fs.writeFileSync(indexFile, JSON.stringify({ menus: [] }, null, 2));
      console.log('Menu index file created successfully');
    }

  } catch (error) {
    console.error('Error creating menu storage:', error);
  }
}

createMenuStorage();
