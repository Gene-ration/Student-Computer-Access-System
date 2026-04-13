<template>
  <div class="login-wrapper">

    <!-- Login Box -->
    <div class="field">
      <div class="header-text">
        <p class="subtitle">
          ENTER YOUR {{ role === 'applicant' ? 'APPLICANT' : 'SCHOOL' }} ID TO ACCESS THE COMPUTER
        </p>
      </div>

      <!-- Input + Purpose dropdown inline -->
      <div class="input-row">

        <!-- Input Box -->
        <input id="studentId" type="text" :value="studentId" :class="{ error: errorMsg, valid: loggedIn }"
          :placeholder="role === 'applicant' ? 'e.g. APP-2026-0001' : 'e.g. STU-2026-0001'"
          @input="$emit('update:studentId', $event.target.value); $emit('clear-error')" @keyup.enter="$emit('submit')"
          maxlength="20" :disabled="loggedIn || loading" autocomplete="off" />

        <!-- Purpose Dropdown inline -->
        <div class="dropdown" ref="dropdownRef">
          <button type="button" @click="toggleDropdown" class="drop-btn" :disabled="loggedIn">
            {{ selectedPurpose || 'Purpose' }}
            <span class="arrow" :class="{ open: isOpen }">▼</span>
          </button>

          <transition name="fade">
            <ul v-if="isOpen" class="drop-menu">
              <li
                v-for="opt in purposes"
                :key="opt"
                :class="{ selected: selectedPurpose === opt }"
                @click="choosePurpose(opt)"
              >{{ opt }}</li>
            </ul>
          </transition>
        </div>

      </div>

      <!-- Labels row -->
      <div class="labels-row">
        <label for="studentId">{{ role === 'applicant' ? 'Applicant ID' : 'School ID' }}</label>
      </div>

      <b><span class="error-msg" v-if="errorMsg">{{ errorMsg }} — Try Again</span></b>
      <b><span class="error-msg" v-if="purposeError">{{ purposeError }}</span></b>
    </div>

    <!-- Button Login -->
    <button class="btn-login" v-if="!loggedIn" @click="$emit('submit')" :disabled="loading">
      {{ loading ? 'Verifying...' : 'Sign In' }}
    </button>

    <div class="login-success" v-if="loggedIn">
      <span>✓</span>
      <span>Logged in as <strong>{{ studentId }}</strong> — <em>{{ purpose }}</em></span>
    </div>

    <!-- Button Logout -->
    <br><button class="btn-logout" v-if="loggedIn" @click="$emit('logout')">
      ← Sign Out
    </button>

  </div>
</template>

<script>
const PURPOSES = ['Research', 'Laboratory', 'Assignment', 'Others']

export default {
  name: 'LoginForm',

  props: {
    studentId: { type: String,  default: '' },
    role:      { type: String,  default: 'student' },
    loggedIn:  { type: Boolean, default: false },
    loading:   { type: Boolean, default: false },
    errorMsg:  { type: String,  default: '' },
    purpose:   { type: String,  default: '' },   
  },

  emits: [
    'update:studentId',
    'update:purpose',   
    'clear-error',
    'submit',
    'logout',
    'back',
  ],

  data() {
    return {
      isOpen:          false,
      selectedPurpose: this.purpose || '',
      purposeError:    '',
      purposes:        PURPOSES,
    }
  },

  mounted() {
    this._outside = (e) => {
      if (this.$refs.dropdownRef && !this.$refs.dropdownRef.contains(e.target)) {
        this.isOpen = false
      }
    }
    window.addEventListener('click', this._outside)
  },

  beforeUnmount() {
    window.removeEventListener('click', this._outside)
  },

  methods: {
    toggleDropdown() {
      if (!this.loggedIn) this.isOpen = !this.isOpen
    },

    choosePurpose(opt) {
      this.selectedPurpose = opt
      this.purposeError    = ''
      this.isOpen          = false
      this.$emit('update:purpose', opt)   // ← tell App.vue the chosen purpose
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.login-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 515px;
}

.header-text { text-align: center; }

.subtitle {
  font-family: 'Poppins', sans-serif;
  font-size: 19px;
  color: #00611E;
  letter-spacing: 0.01em;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
}

/* ── Input + dropdown side by side ── */
.input-row {
  display: flex;
  gap: 8px;
  width: 100%;
  align-items: stretch;
}

.labels-row {
  display: flex;
  gap: 7px;
  width: 75%;
}

.labels-row label { flex: 1; }

label {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #00611E;
}

input {
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  padding: 12px 14px;
  border: 2px solid #b3d0bc;
  border-radius: 10px;
  background: #b3d0bc;
  color: #0d0f14;
  outline: none;
  flex: 1;                  /* takes remaining space */
  min-width: 0;
  transition: border-color 0.2s, box-shadow 0.2s;
  letter-spacing: 0.06em;
}
input:focus    { border-color: #2a6ae8; box-shadow: 3px 3px 0 #2a6ae8; }
input.error    { border-color: #e84b2a; box-shadow: 3px 3px 0 #e84b2a; }
input.valid    { border-color: #1a9c5a; box-shadow: 3px 3px 0 #1a9c5a; }
input:disabled { opacity: 0.55; cursor: not-allowed; }

/* ── Dropdown ── */
.dropdown {
  position: relative;
  flex-shrink: 0;
  width: 130px;
}

.drop-btn {
  width: 100%;
  height: 100%;
  padding: 12px 10px;
  cursor: pointer;
  background: #00611E;
  color: #fff;
  border: 2px solid #00611E;
  border-radius: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  white-space: nowrap;
  transition: background 0.15s;
}
.drop-btn:hover:not(:disabled) { background: #004d17; }
.drop-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.arrow {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
}
.arrow.open { transform: rotate(180deg); }

.drop-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  list-style: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  overflow: hidden;
}

.drop-menu li {
  padding: 9px 14px;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  color: #333;
  transition: background 0.12s;
}
.drop-menu li:hover    { background: #f0f8f4; color: #00611E; }
.drop-menu li.selected { background: #e6f4eb; color: #00611E; font-weight: 600; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Error ── */
.error-msg {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  color: #e84b2a;
  animation: shake 0.3s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  33%       { transform: translateX(-4px); }
  66%       { transform: translateX(4px); }
}

/* ── Sign In ── */
.btn-login {
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 13px;
  background: #00611E;
  color: #f5f2eb;
  border: 2px solid #00611E;
  cursor: pointer;
  margin-top: 20px;
  width: 30%;
}
.btn-login:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Success ── */
.login-success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #edfaf3;
  border: 2px solid #1a9c5a;
  color: #1a9c5a;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  width: 100%;
  margin-top: 12px;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Sign Out ── */
.btn-logout {
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px;
  background: transparent;
  color: #8a8578;
  border: 2px solid #d4cfc4;
  cursor: pointer;
  width: 100%;
  transition: all 0.15s;
}
.btn-logout:hover { border-color: #0d0f14; color: #0d0f14; }

.btn-back {
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 10px;
  margin-top: 4px;
  transition: color 0.15s;
}
.btn-back:hover { color: #00611E; }
</style>