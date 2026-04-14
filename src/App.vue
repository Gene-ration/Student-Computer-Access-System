<template>
  <div class="app-wrapper">

    <!-- Page Title Logo & Text -->
    <div class="page-header">
      <div class="title-logo">
        <img src="./assets/bma-logo.png" alt="BMA Logo" class="logo" />
        <div class="page-title">
          <span class="green">Baliwag Maritime Academy</span>
        </div>
        <div class="page-desc">
          <p>Knowledge · Discipline · Excellence</p>
        </div>
      </div>
    </div>

    <!-- Role Buttons -->
    <div class="field-btn">
      <button class="btn-roles" :class="{ active: selectedRole === 'applicant' }" @click="selectRole('applicant')">
        <i class="fa-solid fa-user-group fa-lg"></i>
        <span>Log in as Applicant</span>
      </button>
      <button class="btn-roles" :class="{ active: selectedRole === 'student' }" @click="selectRole('student')">
        <i class="fa-solid fa-user-group fa-lg"></i>
        <span>Log in as Student / Faculty</span>
      </button>
    </div>

    <!-- LoginForm -->
    <LoginForm
      v-if="selectedRole"
      v-model:studentId="studentId"
      v-model:purpose="purpose"
      :role="selectedRole"
      :logged-in="loggedIn"
      :loading="loading"
      :error-msg="errorMsg"
      @clear-error="errorMsg = ''"
      @submit="handleLogin"
      @logout="handleLogout"
    />

    <!-- Welcome message after login -->
    <transition name="banner">
      <div class="welcome-banner" v-if="loggedIn">
        🎓 Welcome, <strong>{{ username }}</strong>! Your session is now active.
      </div>
    </transition>

    <!-- Access Log -->
    <div class="log-panel" v-if="logs.length">
      <div class="log-header">
        <span class="log-title">Access Log</span>
          <button class="btn-clear" @click="clearLogs">Clear</button>
      </div>
      <div class="log-list">
        <div
          class="log-entry"
          v-for="(entry, i) in [...logs].reverse()"
          :key="i"
          :class="entry.status.toLowerCase()"
        >
          <span class="log-status" :class="entry.status.toLowerCase()">{{ entry.status }}</span>
          <span class="log-pc">PC{{ entry.pcNumber }}</span>
          <span class="log-id">{{ entry.username }}</span>
          <span class="log-purpose" v-if="entry.purpose">{{ entry.purpose }}</span>
          <span class="log-time">{{ entry.timeIn }}</span>
        </div>
      </div>
    </div>

    <div class="app-footer">
      © {{ currentYear }} Baliwag Maritime Academy · Powered by Vue.js
    </div>

  </div>
</template>

<script>
import LoginForm from './components/LoginForm.vue'

const PC_NUMBER = '01'
const EMAIL_DOMAIN = '@bma.edu.ph'

const REGISTERED_IDS = {
  applicant: ['APP-2026-0001', 'APP-2026-0002', 'APP-2026-0003'],
  student:   ['23132.cruz', '24004.jimenez', '12345.rivera'],
}

export default {
  name: 'App',
  components: { LoginForm },

  data() {
    return {
      selectedRole: null,
      studentId:    '',     
      username:     '',     
      purpose:      '',
      loggedIn:     false,
      loading:      false,
      errorMsg:     '',
      logs:         [],
      currentYear:  new Date().getFullYear(),
    }
  },

  mounted() {
    this.focusInput()
    this.focuTimer = setInterval(this.focusInput, 5000)

    // Load saved logs from localStorage
    const savedLogs = localStorage.getItem('bma_logs')
    if (savedLogs) {
      try { this.logs = JSON.parse(savedLogs) } catch (e) { this.logs = [] }
    }
  },

  beforeUnmount() {
    clearInterval(this.focuTimer)
  },

  methods: {
    focusInput() {
      const el = document.getElementById('studentId')
      if (el) el.focus()
    },

    cleanUsername(raw) {
      return raw.trim().replace(EMAIL_DOMAIN, '').trim()
    },

    now() {
      return new Date().toLocaleTimeString('en-PH', { hour12: false })
    },

    today() {
      return new Date().toLocaleDateString('en-PH', {
        year:  'numeric',
        month: '2-digit',
        day:   '2-digit',
      })
    },

    // ── Save log entry with all required fields ───────────────────────────
    addLog(status, username) {
      const entry = {
        pcNumber: PC_NUMBER,          // which computer
        username,                     // cleaned username e.g. 23132.cruz
        purpose:  this.purpose || '—',
        timeIn:   this.now(),
        date:     this.today(),
        status,                        // SUCCESS | FAILED | LOGOUT
      }
      this.logs.push(entry)
      localStorage.setItem('bma_logs', JSON.stringify(this.logs))
      return entry
    },

    selectRole(role) {
      if (this.loggedIn) return
      this.selectedRole = role
      this.studentId    = ''
      this.username     = ''
      this.purpose      = ''
      this.errorMsg     = ''
    },

    async handleLogin() {
      if (this.loggedIn) return
      this.errorMsg = ''

      const cleaned = this.cleanUsername(this.studentId)

      if (!cleaned) {
        this.errorMsg = 'Please enter your username.'
        return
      }

      if (!this.purpose) {
        this.errorMsg = 'Please select a purpose.'
        return
      }

      this.loading = true
      await new Promise(r => setTimeout(r, 800))

      const validIds = REGISTERED_IDS[this.selectedRole] || []

      if (validIds.includes(cleaned)) {
        this.username  = cleaned           // save cleaned version
        this.studentId = cleaned           // update input display too
        this.loggedIn  = true

        const entry = this.addLog('SUCCESS', cleaned)

        // ── Send to your API ──────────────────────────────────────────────
        try {
          await fetch('YOUR_API_URL_HERE', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(entry),
          })
        } catch (err) {
          console.warn('Offline — entry not sent to API.')
        }

      } else {
        this.errorMsg = 'Username not recognized. Please try again.'
        this.addLog('FAILED', cleaned)
      }

      this.loading = false
    },

    async handleLogout() {
      const entry = this.addLog('LOGOUT', this.username)

      this.loggedIn  = false
      this.studentId = ''
      this.username  = ''
      this.purpose   = ''
      this.errorMsg  = ''

      // ── Send logout to your API ───────────────────────────────────────
      try {
        await fetch('YOUR_API_URL_HERE', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(entry),
        })
      } catch (e) { }
    },

    clearLogs() {
      this.logs = []
      localStorage.removeItem('bma_logs')
    },
  },
}
</script>

<!-- ── Global styles ── -->
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Poppins', sans-serif;
  color: #0d0f14;
  min-height: 100vh;
}

@font-face {
  font-family: 'AllrounderMonumentTest-Medium';
  src: url('./assets/AllrounderMonumentTest-Medium.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
}
</style>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

.app-wrapper {
  min-height: 80vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 60px 16px 80px;
  position: relative;
  overflow: hidden;
}

.app-wrapper > * { position: relative; z-index: 1; }

/* ── Page Header ── */
.page-header {
  text-align: center;
  display: flex;
  font-weight: bold;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.logo {
  width: 150px;
  height: 150px;
  object-fit: contain;
  border-radius: 50%;
  display: block;
}

.page-title {
  font-family: 'AllrounderMonumentTest-Medium', sans-serif;
  font-size: 30px;
  color: #0d0f14;
  line-height: 1;
  letter-spacing: 0.04em;
}
.page-title .green { color: #00611E; font-style: normal; }

.page-desc {
  font-family: 'AllrounderMonumentTest-Medium', sans-serif;
  font-size: 12px;
  color: #00611E;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── Role Buttons ── */
.field-btn { display: flex; gap: 10px; width: 90%; }

.btn-roles {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 10px 15px;
  background: #00611E;
  color: #f5f2eb;
  border: 2px solid #00611E;
  cursor: pointer;
  width: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.2s ease;
}
.btn-roles.active {
  background: #ffffff;
  color: #00611E;
  border: 2px solid #00611E;
  cursor: default;
}

/* ── Welcome Banner ── */
.welcome-banner {
  position: fixed;
  bottom: 7vh;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  padding: 10px 20px;
  background: #edfaf3;
  border: 2px solid #00611E;
  color: #00611E;
  max-width: 400px;
  width: 100%;
  text-align: center;
}
.banner-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.banner-leave-active { transition: all 0.2s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-10px); }

/* ── Access Log ── */
.log-panel {
  position: fixed;
  bottom: 25%;
  right: 30px;
  transform: translateY(-50%);
  width: 440px;
  background: #0d0f14;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
  z-index: 999;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-50%) translateX(20px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

.log-header { display: flex; justify-content: space-between; align-items: center; }

.log-title {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f5f2eb;
}

.btn-clear {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  border: 1px solid #333;
  color: #555;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-clear:hover { border-color: #e84b2a; color: #e84b2a; }

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}
.log-list::-webkit-scrollbar       { width: 3px; }
.log-list::-webkit-scrollbar-track { background: #1a1c24; }
.log-list::-webkit-scrollbar-thumb { background: #333; }

.log-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #161820;
  border-left: 3px solid #2a6ae8;
  animation: logIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.log-entry.failed { border-left-color: #e84b2a; }
.log-entry.logout { border-left-color: #555; }

@keyframes logIn {
  from { opacity: 0; transform: translateX(10px); }
  to   { opacity: 1; transform: translateX(0); }
}

.log-status {
  font-family: 'Poppins', sans-serif;
  font-size: 8px;
  letter-spacing: 0.12em;
  font-weight: 600;
  padding: 2px 5px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.log-status.success { background: rgba(26,156,90,0.2);  color: #4eda95; }
.log-status.failed  { background: rgba(232,75,42,0.2);  color: #f47a5f; }
.log-status.logout  { background: rgba(85,85,85,0.2);   color: #aaa; }

.log-pc {
  font-family: 'Poppins', sans-serif;
  font-size: 9px;
  font-weight: 600;
  color: #888;
  flex-shrink: 0;
  letter-spacing: 0.06em;
}

.log-id {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  color: #ccc;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-purpose {
  font-family: 'Poppins', sans-serif;
  font-size: 9px;
  font-weight: 500;
  color: #7ab6f5;
  background: rgba(42,106,232,0.15);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: capitalize;
}

.log-time {
  font-family: 'Poppins', sans-serif;
  font-size: 9px;
  color: #444;
  flex-shrink: 0;
}

/* ── Footer ── */
.app-footer {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b5b0a8;
  position: fixed;
  bottom: 10px;
}
</style>