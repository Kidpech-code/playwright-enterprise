const STORAGE_KEYS = {
  agentUrl: 'testingCompanionAgentUrl',
  cursorVisible: 'testingCompanionCursorVisible'
};

	const state = {
	  socket: null,
	  connected: false,
	  paused: false,
	  manualStarted: false,
	  controllerState: 'idle',
	  cursorVisible: true,
	  requestId: 0,
	  guideDelayMs: 3000,
	  toastTimer: null
	};

const elements = {
	  statusText: document.getElementById('statusText'),
	  stateBadge: document.getElementById('stateBadge'),
	  workspacePath: document.getElementById('workspacePath'),
	  phaseInitialization: document.getElementById('phaseInitialization'),
	  phaseRecording: document.getElementById('phaseRecording'),
	  phaseCapture: document.getElementById('phaseCapture'),
	  phaseConclusion: document.getElementById('phaseConclusion'),
	  agentUrl: document.getElementById('agentUrl'),
  connectButton: document.getElementById('connectButton'),
  startButton: document.getElementById('startButton'),
  pauseButton: document.getElementById('pauseButton'),
  stepForwardButton: document.getElementById('stepForwardButton'),
  screenshotButton: document.getElementById('screenshotButton'),
  checkpointButton: document.getElementById('checkpointButton'),
  bugButton: document.getElementById('bugButton'),
  cursorButton: document.getElementById('cursorButton'),
  noteText: document.getElementById('noteText'),
  noteButton: document.getElementById('noteButton'),
  severitySelect: document.getElementById('severitySelect'),
  stopButton: document.getElementById('stopButton'),
  reportPanel: document.getElementById('reportPanel'),
	  reportLink: document.getElementById('reportLink'),
	  zipPath: document.getElementById('zipPath'),
	  activityList: document.getElementById('activityList'),
	  toast: document.getElementById('toast')
	};

function setStatus(text) {
  elements.statusText.textContent = text;
}

	function setControllerState(nextState, detailText) {
	  state.controllerState = nextState || 'idle';
	  state.paused = state.controllerState === 'paused';
	  elements.stateBadge.className = `state-badge state-${state.controllerState}`;
  elements.stateBadge.textContent = state.controllerState
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
	  if (detailText) {
	    setStatus(detailText);
	  }
	  setPhaseFromControllerState(state.controllerState);
	  updateButtons();
	}

	function setWorkspacePath(reportDir) {
	  if (reportDir) {
	    elements.workspacePath.textContent = reportDir;
	  }
	}

	function setPhase(phase) {
	  const phases = {
	    initialization: elements.phaseInitialization,
	    recording: elements.phaseRecording,
	    capture: elements.phaseCapture,
	    conclusion: elements.phaseConclusion
	  };
	
	  Object.values(phases).forEach((element) => {
	    element.classList.remove('active');
	  });
	  (phases[phase] || phases.initialization).classList.add('active');
	}

	function setPhaseFromControllerState(controllerState) {
	  if (controllerState === 'preparing' || controllerState === 'idle') {
	    setPhase('initialization');
	    return;
	  }
	  if (controllerState === 'capturing') {
	    setPhase('capture');
	    return;
	  }
	  if (controllerState === 'stopping' || controllerState === 'report-ready') {
	    setPhase('conclusion');
	    return;
	  }
	  setPhase('recording');
	}

	function showToast(text, timeoutMs = 3000) {
	  window.clearTimeout(state.toastTimer);
	  elements.toast.textContent = text;
	  elements.toast.hidden = false;
	  state.toastTimer = window.setTimeout(() => {
	    elements.toast.hidden = true;
	  }, timeoutMs);
	}

	function sendGuidedCommand(type, payload, phase, pendingText, completedText) {
	  setPhase(phase);
	  setStatus(`${pendingText} in ${state.guideDelayMs / 1000}s...`);
	  showToast(pendingText, state.guideDelayMs);
	  window.setTimeout(() => {
	    sendCommand(type, payload);
	    if (completedText) {
	      setStatus(completedText);
	    }
	  }, state.guideDelayMs);
	}

function addActivity(text) {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()} ${text}`;
  elements.activityList.prepend(item);
}

function updateButtons() {
  const disabled = !state.connected;
  [
    elements.startButton,
    elements.pauseButton,
    elements.stepForwardButton,
    elements.screenshotButton,
    elements.checkpointButton,
    elements.bugButton,
    elements.cursorButton,
    elements.noteButton,
    elements.stopButton
  ].forEach((button) => {
    button.disabled = disabled;
  });

  elements.pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
  elements.cursorButton.textContent = state.cursorVisible ? 'Hide Cursor' : 'Show Cursor';
	  elements.startButton.disabled = disabled
	    || state.manualStarted
	    || ['capturing', 'stopping', 'report-ready'].includes(state.controllerState);
	  elements.stepForwardButton.disabled = disabled || state.controllerState === 'stopping' || state.controllerState === 'report-ready';
	  elements.stopButton.disabled = disabled || state.controllerState === 'stopping' || state.controllerState === 'report-ready';
	}

function connect() {
  const url = elements.agentUrl.value.trim() || 'ws://127.0.0.1:3737';
  chrome.storage.local.set({ [STORAGE_KEYS.agentUrl]: url });

  if (state.socket) {
    state.socket.close();
  }

  setStatus('Connecting to local agent...');
  state.socket = new WebSocket(url);

	  state.socket.addEventListener('open', () => {
	    state.connected = true;
	    setControllerState('idle', 'Connected to local Playwright Agent');
	    addActivity('Connected');
	    updateButtons();
	    sendCommand('agent:status');
  });

  state.socket.addEventListener('close', () => {
    state.connected = false;
    setControllerState('idle', 'Agent disconnected');
    updateButtons();
  });

  state.socket.addEventListener('error', () => {
    state.connected = false;
    setControllerState('error', 'Could not connect to local agent');
    updateButtons();
  });

  state.socket.addEventListener('message', (event) => {
    handleAgentMessage(event.data);
  });
}

function sendCommand(type, payload = {}) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    setStatus('Connect to the local agent first');
    return;
  }

  state.requestId += 1;
  state.socket.send(JSON.stringify({
    type,
    requestId: String(state.requestId),
    payload
  }));
}

function handleAgentMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }

	  if (message.type === 'agent:status') {
	    const payload = message.payload || {};
	    state.cursorVisible = payload.cursorVisible !== false;
	    setWorkspacePath(payload.reportDir);
	    setControllerState(payload.controllerState || 'idle', `Connected: ${payload.status || 'ready'}`);
	    updateButtons();
	    return;
  }

  if (message.type === 'agent:error') {
    setControllerState('error', (message.payload && message.payload.message) || 'Agent error');
    addActivity('Agent error');
    return;
  }

	  if (message.type === 'controller:state') {
	    const payload = message.payload || {};
	    const label = payload.label ? ` ${payload.label}` : '';
	    setWorkspacePath(payload.reportDir);
	    setControllerState(payload.state || 'idle', `${payload.state || 'idle'}${label}`);
	    if (payload.state) {
      addActivity(`State: ${payload.state}${label}`);
    }
    return;
  }

	  if (message.type === 'step:recorded') {
	    const step = message.payload && message.payload.step;
	    if (step) {
	      if (step.kind === 'session-start') {
	        state.manualStarted = true;
	      }
	      if (['screenshot', 'checkpoint', 'bug', 'note'].includes(step.kind)) {
	        showToast('Captured screenshot and DOM snapshot', 3000);
	      }
	      addActivity(`${step.kind}: ${step.label}`);
	      updateButtons();
	    }
	    return;
  }

  if (message.type === 'cursor:state') {
    const visible = Boolean(message.payload && message.payload.visible);
    state.cursorVisible = visible;
    chrome.storage.local.set({ [STORAGE_KEYS.cursorVisible]: visible });
    sendCursorToActiveTab(visible);
    updateButtons();
    return;
  }

  if (message.type === 'report:ready') {
    const payload = message.payload || {};
    if (payload.htmlUrl) {
      elements.reportLink.href = payload.htmlUrl;
      elements.reportPanel.hidden = false;
    }
	    if (payload.zipPath) {
	      elements.zipPath.textContent = payload.zipPath;
	    }
	    setWorkspacePath(payload.reportDir);
	    addActivity('Report generated');
	    setControllerState('report-ready', 'Report ready');
    return;
  }

  if (message.type === 'tutorial:advanced') {
    addActivity('Step forward requested');
  }
}

function getNote() {
  return elements.noteText.value.trim();
}

function clearNote() {
  elements.noteText.value = '';
}

function sendCursorToActiveTab(visible) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: 'cursor:set', visible }, () => {
      chrome.runtime.lastError;
    });
  });
}

elements.connectButton.addEventListener('click', connect);

	elements.startButton.addEventListener('click', () => {
	  state.manualStarted = true;
	  sendGuidedCommand(
	    'session:start',
	    { label: 'Start Manual Test', note: getNote() },
	    'initialization',
	    'Initializing workspace and WebSocket session',
	    'Manual test started'
	  );
	  clearNote();
	  updateButtons();
	});

elements.pauseButton.addEventListener('click', () => {
  state.paused = !state.paused;
  sendCommand(state.paused ? 'session:pause' : 'session:resume', { note: getNote() });
  clearNote();
  updateButtons();
});

elements.stepForwardButton.addEventListener('click', () => {
  sendCommand('tutorial:step-forward');
});

	elements.screenshotButton.addEventListener('click', () => {
	  sendGuidedCommand(
	    'screenshot:capture',
	    { note: getNote() },
	    'capture',
	    'Auto-capture queued',
	    'Capturing screenshot and DOM snapshot'
	  );
	  clearNote();
	});

	elements.checkpointButton.addEventListener('click', () => {
	  sendGuidedCommand(
	    'checkpoint:add',
	    { note: getNote(), category: 'checkpoint' },
	    'capture',
	    'Checkpoint capture queued',
	    'Capturing checkpoint'
	  );
	  clearNote();
	});

	elements.bugButton.addEventListener('click', () => {
	  sendGuidedCommand(
	    'bug:mark',
	    {
	      note: getNote(),
	      severity: elements.severitySelect.value,
	      category: 'bug'
	    },
	    'capture',
	    'Bug capture queued',
	    'Capturing bug evidence'
	  );
	  clearNote();
	});

elements.cursorButton.addEventListener('click', () => {
  state.cursorVisible = !state.cursorVisible;
  chrome.storage.local.set({ [STORAGE_KEYS.cursorVisible]: state.cursorVisible });
  sendCursorToActiveTab(state.cursorVisible);
  sendCommand('cursor:toggle', { visible: state.cursorVisible });
  updateButtons();
});

	elements.noteButton.addEventListener('click', () => {
	  sendGuidedCommand(
	    'step:note',
	    { note: getNote(), category: 'note' },
	    'capture',
	    'Note capture queued',
	    'Capturing note evidence'
	  );
	  clearNote();
	});

	elements.stopButton.addEventListener('click', () => {
	  sendGuidedCommand(
	    'session:stop',
	    { note: getNote() },
	    'conclusion',
	    'Stopping and generating report',
	    'Generating report...'
	  );
	  clearNote();
	});

chrome.storage.local.get([STORAGE_KEYS.agentUrl, STORAGE_KEYS.cursorVisible], (result) => {
  if (result[STORAGE_KEYS.agentUrl]) {
    elements.agentUrl.value = result[STORAGE_KEYS.agentUrl];
  }
  state.cursorVisible = result[STORAGE_KEYS.cursorVisible] !== false;
  updateButtons();
  connect();
});
