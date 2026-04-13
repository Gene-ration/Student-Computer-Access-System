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

    <!-- LoginForm — purpose dropdown is inside LoginForm, inline with the input -->
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
        🎓 Welcome, <strong>{{ studentId }}</strong>! Your session is now active.
      </div>
    </transition>

    <!-- Access Log -->
    <div class="log-panel" v-if="logs.length">
      <div class="log-header">
        <span class="log-title">Access Log</span>
        <button class="btn-clear" @click="logs = []">Clear</button>
      </div>
      <div class="log-list">
        <div class="log-entry" v-for="(entry, i) in [...logs].reverse()" :key="i" :class="entry.type.toLowerCase()">
          <span class="log-status" :class="entry.type.toLowerCase()">{{ entry.type }}</span>
          <span class="log-id">{{ entry.studentId }}</span>
          <!-- Purpose shown in the log -->
          <span class="log-purpose" v-if="entry.purpose">{{ entry.purpose }}</span>
          <span class="log-time">{{ entry.time }}</span>
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

const REGISTERED_IDS = {
  applicant: ['APP-2026-0001', 'APP-2026-0002', 'APP-2026-0003'],
  student:   ['24004.jimenez', 'STU-2026-0001', 'STU-2026-0002', 'ADMIN-001', 'STU-2026-0003'],
}

export default {
  name: 'App',
  components: { LoginForm },

  data() {
    return {
      selectedRole: null,
      studentId:    '',
      purpose:      '',      // ← bound to LoginForm via v-model:purpose
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

    const savedLogs = localStorage.getItem('bma_logs')
    if (savedLogs) {
      this.logs = JSON.parse(savedLogs)
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

    now() {
      return new Date().toLocaleTimeString('en-PH', { hour12: false })
    },

    addLog(type, id) {
      const newLog = {
        type,
        studentId: id,
        purpose:   this.purpose || '—',   // ← purpose saved in every log entry
        time:      this.now(),
      }
      this.logs.push(newLog)
      localStorage.setItem('bma_logs', JSON.stringify(this.logs))
    },

    selectRole(role) {
      if (this.loggedIn) return
      this.selectedRole = role
      this.studentId    = ''
      this.purpose      = ''   // reset purpose when switching roles
      this.errorMsg     = ''
    },

    async handleLogin() {
      if (this.loggedIn) return
      this.errorMsg = ''

      const id = this.studentId.trim()
      if (!id) {
        this.errorMsg = 'Please enter your Student ID.'
        return
      }

      // Require purpose before signing in
      if (!this.purpose) {
        this.errorMsg = 'Please select a purpose.'
        return
      }

      this.loading = true
      await new Promise(r => setTimeout(r, 800))

      const validIds = REGISTERED_IDS[this.selectedRole] || []
      if (validIds.includes(id)) {
        this.studentId = id
        this.loggedIn  = true
        this.addLog('SUCCESS', id)
        try {
          await fetch('YOUR_SHEET_BEST_URL', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              Time:    this.now(),
              ID:      id,
              Role:    this.selectedRole,
              Purpose: this.purpose,
              Status:  'SUCCESS'
            })
          })
        } catch (err) {
          console.warn('Offline: Log not synced.')
        }
      } else {
        this.errorMsg = 'Student ID not recognized.'
        this.addLog('FAILED', id)
      }

      this.loading = false
    },

    async handleLogout() {
      const lastId = this.studentId
      this.addLog('LOGOUT', lastId)
      this.loggedIn  = false
      this.studentId = ''
      this.purpose   = ''   // reset purpose on logout
      this.errorMsg  = ''
      try {
        await fetch('YOUR_SHEET_BEST_URL', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Time:    this.now(),
            ID:      lastId,
            Purpose: this.purpose,
            Status:  'LOGOUT'
          })
        })
      } catch (e) { }
    },

    exportLogs() {
      const data = JSON.stringify(this.logs, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `BMA-Logs-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
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
  right: 50px;
  transform: translateY(-50%);
  width: 420px;
  background: #0d0f14;
  border: 2px solid #0d0f14;
  padding: 20px;
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
  gap: 8px;
  padding: 8px 12px;
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
  font-size: 9px;
  letter-spacing: 0.15em;
  font-weight: 600;
  padding: 2px 6px;
  text-transform: uppercase;
  flex-shrink: 0;
}
.log-status.success { background: rgba(26,156,90,0.2);  color: #4eda95; }
.log-status.failed  { background: rgba(232,75,42,0.2);  color: #f47a5f; }
.log-status.logout  { background: rgba(85,85,85,0.2);   color: #aaa; }

.log-id {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  color: #ccc;
  flex: 1;
}

/* ── Purpose badge in log ── */
.log-purpose {
  font-family: 'Poppins', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #7ab6f5;
  background: rgba(42, 106, 232, 0.15);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: capitalize;
}

.log-time {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
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