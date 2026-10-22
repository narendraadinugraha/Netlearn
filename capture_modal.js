const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1280,850',
  'http://127.0.0.1:8085/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9229/json');
    const tabs = await res.json();
    const pageTab = tabs.find(t => t.url && t.url.includes('127.0.0.1:8085'));
    const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      // Step 1: Set user session and reload page so app initializes logged in
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: { expression: `
            localStorage.setItem("netquest_current_user", JSON.stringify({
              user: { id: "usr-student-01", email: "ahmad.reza@siswa.id", name: "Ahmad Reza Pratama", role: "student" },
              role: "student",
              name: "Ahmad Reza Pratama"
            }));
            location.hash = "materials";
            location.reload();
          ` }
        }));
      }, 600);

      // Step 2: After reload, open Video Modal
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: { expression: `
            const matNav = document.getElementById("nav-btn-materials");
            if (matNav) matNav.click();
            setTimeout(() => {
              const videoBtn = document.querySelector(".open-video-btn");
              if (videoBtn) videoBtn.click();
            }, 500);
          ` }
        }));
      }, 2500);

      // Step 3: Screenshot Video Modal
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 5, method: 'Page.captureScreenshot' }));
      }, 4500);

      // Step 4: Close video modal & Open Material Modal
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 6,
          method: 'Runtime.evaluate',
          params: { expression: `
            const closeBtn = document.getElementById("modal-video-close-btn");
            if (closeBtn) closeBtn.click();
            setTimeout(() => {
              const matBtn = document.querySelector(".open-material-btn");
              if (matBtn) matBtn.click();
            }, 300);
          ` }
        }));
      }, 5500);

      // Step 5: Screenshot Material Modal
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 7, method: 'Page.captureScreenshot' }));
      }, 7000);
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id === 5 && data.result && data.result.data) {
        fs.writeFileSync('video_modal_view.png', Buffer.from(data.result.data, 'base64'));
        console.log('VIDEO MODAL CAPTURED: video_modal_view.png');
      }
      if (data.id === 7 && data.result && data.result.data) {
        fs.writeFileSync('material_modal_view.png', Buffer.from(data.result.data, 'base64'));
        console.log('MATERIAL MODAL CAPTURED: material_modal_view.png');
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
