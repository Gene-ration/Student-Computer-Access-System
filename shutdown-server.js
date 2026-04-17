/**
 * shutdown-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A tiny local server that listens on port 3001 and shuts down the machine
 * when it receives POST /shutdown from the Vue app.
 *
 * SETUP (run once on each PC):
 *   1.  npm install express
 *   2.  Add sudoers entry so this can shutdown without a password:
 *         sudo visudo
 *         # Add this line (replace `bma` with your actual Linux username):
 *         bma ALL=(ALL) NOPASSWD: /sbin/shutdown
 *   3.  Start the server (runs on boot via autostart — see below):
 *         node shutdown-server.js
 *
 * AUTOSTART on Lubuntu (LXQt):
 *   - Open  Session Settings → Autostart → Add
 *   - Command:  node /home/bma/shutdown-server.js
 *   ─── OR ───
 *   - Create /etc/systemd/system/bma-shutdown.service  (see comment below)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express')
const { exec }  = require('child_process')

const app = express()

// Allow the Vue dev server (localhost:5173) and any local origin to call this
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  next()
})

app.options('/shutdown', (req, res) => res.sendStatus(204))

app.post('/shutdown', (req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] Shutdown requested — powering off…`)
  res.json({ ok: true, message: 'Shutting down…' })

  // Give the response 400 ms to reach the browser before the OS dies
  setTimeout(() => {
    exec('sudo /sbin/shutdown -h now', (err) => {
      if (err) console.error('shutdown failed:', err.message)
    })
  }, 400)
})

app.listen(3001, '127.0.0.1', () => {
  console.log('BMA Shutdown server listening on http://127.0.0.1:3001')
})

/*
─────────────────────────────────────────────────────────────────────────────
OPTIONAL: run as a systemd service so it survives reboots automatically

Create /etc/systemd/system/bma-shutdown.service:

  [Unit]
  Description=BMA Shutdown Helper
  After=network.target

  [Service]
  ExecStart=/usr/bin/node /home/bma/shutdown-server.js
  Restart=always
  User=bma

  [Install]
  WantedBy=multi-user.target

Then run:
  sudo systemctl enable bma-shutdown
  sudo systemctl start  bma-shutdown
─────────────────────────────────────────────────────────────────────────────
*/
