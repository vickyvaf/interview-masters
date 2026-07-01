// ponytail: simple node server initiation using stdlib http
const http = require('http');

const PORT = process.env.PORT || 5005;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200);
  res.end(JSON.stringify({ status: 'ok', message: 'Backend is running' }));
});

server.listen(PORT, () => {
  console.log(`Backend Node.js service initialized. Listening on port ${PORT}`);
});
