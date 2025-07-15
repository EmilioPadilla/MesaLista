// Simple script to start the server using Node.js
const { exec } = require('child_process');

console.log('Compiling TypeScript...');
exec('npx tsc', (error, stdout, stderr) => {
  if (error) {
    console.error(`Compilation error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Compilation stderr: ${stderr}`);
  }
  
  console.log('TypeScript compiled successfully');
  console.log('Starting server...');
  
  // Run the compiled JavaScript
  const server = exec('node dist/index.js');
  
  server.stdout.on('data', (data) => {
    console.log(data);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
});
