const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,850',
  'http://127.0.0.1:8085/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9230/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url && t.url.includes('127.0.0.1:8085'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      // 1. Capture Login View first
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 3, method: 'Page.captureScreenshot' }));
      }, 1000);

      // 2. Log in and go to Dashboard
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: { expression: `
            localStorage.setItem("netquest_current_user", JSON.stringify({
              user: { id: "usr-student-01", email: "ahmad.reza@siswa.id", name: "Ahmad Reza Pratama", role: "student" },
              role: "student",
              name: "Ahmad Reza Pratama"
            }));
            location.hash = "dashboard";
            location.reload();
          ` }
        }));
      }, 2000);

      // 3. Capture Dashboard
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 5, method: 'Page.captureScreenshot' }));
      }, 4000);

      // 4. Navigate to Materials
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 6,
          method: 'Runtime.evaluate',
          params: { expression: `
            const btn = document.getElementById("nav-btn-materials");
            if (btn) btn.click();
            Boolean(btn);
          ` }
        }));
      }, 5500);

      // 5. Capture Materials
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 7, method: 'Page.captureScreenshot' }));
      }, 7000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 3 && data.result && data.result.data) {
        fs.writeFileSync('skillup_login_view.png', Buffer.from(data.result.data, 'base64'));
        console.log('CAPTURED: skillup_login_view.png');
      }
      if (data.id === 5 && data.result && data.result.data) {
        fs.writeFileSync('skillup_dashboard_view.png', Buffer.from(data.result.data, 'base64'));
        console.log('CAPTURED: skillup_dashboard_view.png');
      }
      if (data.id === 7 && data.result && data.result.data) {
        fs.writeFileSync('skillup_materials_view.png', Buffer.from(data.result.data, 'base64'));
        console.log('CAPTURED: skillup_materials_view.png');
        ws.close();
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (err) {
    console.error('Error during capture:', err);
    chrome.kill();
    process.exit(1);
  }
}, 1500);
