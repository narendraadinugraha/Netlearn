const { spawn } = require('child_process');
const fs = require('fs');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9251',
  '--no-first-run',
  '--no-default-browser-check',
  '--window-size=1440,900',
  'http://127.0.0.1:3000/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9251/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.type === 'page' && t.url && t.url.includes('3000'));
    const ws = new WebSocket(tab.webSocketDebuggerUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      // 1. Navigate to simulation (Topology view)
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                const app = await import('/js/app.js');
                app.state.currentUser = {
                  id: 'usr-student-99',
                  name: 'Narendra Dev',
                  role: 'student',
                  className: 'XII-TKJ-1'
                };
                app.showAppLayout();
                app.navigateTo('simulation');
                // Switch to topology tab
                const topoTab = document.querySelector('[data-mode-id="topology"]');
                if (topoTab) topoTab.click();
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 1000);

      // Screenshot 1: Topology
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 10, method: 'Page.captureScreenshot' }));
      }, 3000);

      // 2. Switch to Data Transmission Workbench
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (() => {
                const wbTab = document.querySelector('[data-mode-id="workbench"]');
                if (wbTab) wbTab.click();
                // Click Send Packet
                document.getElementById('btn-wb-send-ping')?.click();
              })()
            `
          }
        }));
      }, 4000);

      // Screenshot 2: Workbench Transmission
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 20, method: 'Page.captureScreenshot' }));
      }, 6000);

      // 3. Navigate to 3D Mini Game (Full Dense City Map)
      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 5,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              (async () => {
                const app = await import('/js/app.js');
                app.navigateTo('minigame');
              })()
            `,
            awaitPromise: true
          }
        }));
      }, 7000);

      // Screenshot 3: Full City Map in 3D Mini Game
      setTimeout(() => {
        ws.send(JSON.stringify({ id: 30, method: 'Page.captureScreenshot' }));
      }, 10500);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === 10) {
        fs.writeFileSync('test_topology.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved test_topology.png');
      }
      if (msg.id === 20) {
        fs.writeFileSync('test_workbench.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved test_workbench.png');
      }
      if (msg.id === 30) {
        fs.writeFileSync('test_minigame_fullcity.png', Buffer.from(msg.result.data, 'base64'));
        console.log('Saved test_minigame_fullcity.png');
        chrome.kill();
        process.exit(0);
      }
    };

  } catch (err) {
    console.error(err);
    chrome.kill();
    process.exit(1);
  }
}, 1200);

