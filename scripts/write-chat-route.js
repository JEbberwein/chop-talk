const fs = require('fs');
const path = require('path');

const routePath = path.join(__dirname, '..', 'app', 'api', 'chat', 'route.js');

if (!fs.existsSync(routePath)) {
  throw new Error('Chat route not found at app/api/chat/route.js');
}

console.log('Chat route exists:', routePath);
