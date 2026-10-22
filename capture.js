const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1440,900',
  'http://127.0.0.1:3000/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9227/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url && t.url.includes('127.0.0.1:3000'));
    if (!pageTab) {
      console.log('No tab found');
      chrome.kill();
      process.exit(1);
    }
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      // Set Teacher user and navigate to admin
      const script = `
        localStorage.setItem("netquest_current_user", JSON.stringify({
          user: { id: "demo-sarah", email: "s.jenkins@netlearn.edu", user_metadata: { full_name: "Dr. Sarah Jenkins", student_id: "STAFF-CS302", role: "teacher" } },
          role: "teacher",
          name: "Dr. Sarah Jenkins"
        }));
        location.reload();
      `;

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: { expression: script }
        }));
      }, 500);

      setTimeout(() => {
        // Navigate to admin
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: { expression: `window.navigateTo ? window.navigateTo('admin') : document.getElementById('nav-btn-admin')?.click();` }
        }));
      }, 2000);

      setTimeout(() => {
        ws.send(JSON.stringify({ id: 5, method: 'Page.captureScreenshot' }));
      }, 3500);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 5 && data.result && data.result.data) {
        fs.writeFileSync('teacher_modern_dashboard.png', Buffer.from(data.result.data, 'base64'));
        console.log('TEACHER DASHBOARD SCREENSHOT SAVED as teacher_modern_dashboard.png!');
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
