/**
 * Custom Modal System for SMMS
 * Replaces native alerts and confirms with themed modals
 * Function-based approach for better reliability
 */

console.log('[Modal] modal.js script loaded');

// Initialize modal overlay on page load
function initializeModal() {
  console.log('[Modal] initializeModal() called');
  
  // Check if overlay already exists
  if (document.getElementById('modal-overlay')) {
    console.log('[Modal] Modal overlay already exists, skipping creation');
    attachModalEventListeners();
    return;
  }

  console.log('[Modal] Creating modal overlay...');
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  // enforce viewport-level positioning and centering via inline styles
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;visibility:hidden;opacity:0;pointer-events:none;z-index:99999;background:rgba(0,0,0,0.8);transition:opacity .2s ease,visibility .2s ease;';

  overlay.innerHTML = `
    <div class="modal-content" id="modal-content">
      <div class="modal-header">
        <h2 id="modal-title"></h2>
      </div>
      <div class="modal-body" id="modal-body">
        <!-- Content will be inserted here -->
      </div>
      <div class="modal-footer" id="modal-footer">
        <!-- Buttons will be inserted here -->
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // enforce modal content sizing so it centers reliably
  const contentEl = document.getElementById('modal-content');
  if (contentEl) {
    contentEl.style.cssText = 'max-width:720px;width:90%;box-sizing:border-box;margin:0 auto;';
  }
  console.log('[Modal] Modal overlay created successfully');
  
  // Attach event listeners
  attachModalEventListeners();
}

// Attach click and keyboard event listeners
function attachModalEventListeners() {
  console.log('[Modal] attachModalEventListeners() called');
  const overlay = document.getElementById('modal-overlay');
  
  if (!overlay) {
    console.error('[Modal] Overlay not found, cannot attach listeners');
    return;
  }

  // Click outside to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      console.log('[Modal] Clicked outside modal, closing');
      closeModal();
    }
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (overlay.classList.contains('active')) {
        console.log('[Modal] ESC pressed, closing modal');
        closeModal();
      }
    }
  });
}

// Close modal
function closeModal() {
  console.log('[Modal] closeModal() called');
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.visibility = 'hidden';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    console.log('[Modal] Modal closed');
  }
}

// Show modal
function showModal() {
  console.log('[Modal] showModal() called');
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    console.log('[Modal] Modal shown');
  }
}

// Show confirmation dialog
function showConfirm(title, message, onConfirm, onCancel = null, options = {}) {
  console.log('[Modal] showConfirm() called with title:', title);
  
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    console.error('[Modal] Overlay not found!');
    return;
  }

  const content = document.getElementById('modal-content');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  content.className = 'modal-content modal-delete';
  titleEl.textContent = title;
  bodyEl.innerHTML = `<p>${message}</p>`;

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.textContent = options.confirmText || 'Confirm';
  confirmBtn.onclick = () => {
    console.log('[Modal] Confirm button clicked');
    closeModal();
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = options.cancelText || 'Cancel';
  cancelBtn.onclick = () => {
    console.log('[Modal] Cancel button clicked');
    closeModal();
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  footerEl.innerHTML = '';
  footerEl.appendChild(cancelBtn);
  footerEl.appendChild(confirmBtn);

  showModal();
  console.log('[Modal] Confirm modal displayed');
}

// Show alert dialog
function showAlert(title, message, type = 'info', onClose = null) {
  console.log('[Modal] showAlert() called with title:', title, 'type:', type);
  
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    console.error('[Modal] Overlay not found!');
    return;
  }

  const content = document.getElementById('modal-content');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  content.className = `modal-content modal-alert ${type}`;

  // No emoji icons - keep alert content clean and consistent with site styling
  titleEl.textContent = title;
  bodyEl.innerHTML = `<p>${message}</p>`;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-primary';
  closeBtn.textContent = 'OK';
  closeBtn.onclick = () => {
    console.log('[Modal] Alert close button clicked');
    closeModal();
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  footerEl.innerHTML = '';
  footerEl.appendChild(closeBtn);

  showModal();
  console.log('[Modal] Alert modal displayed');
}

// Show schedule dialog
function showSchedule(title, onSchedule) {
  console.log('[Modal] showSchedule() called');
  
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) {
    console.error('[Modal] Overlay not found!');
    return;
  }

  const content = document.getElementById('modal-content');
  const titleEl = document.getElementById('modal-title');
  const bodyEl = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');

  content.className = 'modal-content modal-schedule';
  titleEl.textContent = title;

  // Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDate = now.getDate();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Generate year options (current year to 5 years ahead)
  let yearOptions = '';
  for (let y = currentYear; y <= currentYear + 5; y++) {
    yearOptions += `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`;
  }

  // Generate month options
  let monthOptions = '';
  for (let m = 1; m <= 12; m++) {
    const monthName = new Date(2024, m - 1).toLocaleString('en-US', { month: 'long' });
    monthOptions += `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${monthName} (${m})</option>`;
  }

  // Generate date options
  let dateOptions = '';
  for (let d = 1; d <= 31; d++) {
    dateOptions += `<option value="${d}" ${d === currentDate ? 'selected' : ''}>${d}</option>`;
  }

  // Generate hour options
  let hourOptions = '';
  for (let h = 0; h < 24; h++) {
    const displayHour = h < 10 ? '0' + h : h;
    hourOptions += `<option value="${h}" ${h === currentHour ? 'selected' : ''}>${displayHour}:00</option>`;
  }

  // Generate minute options
  let minuteOptions = '';
  for (let min = 0; min < 60; min += 5) {
    const displayMin = min < 10 ? '0' + min : min;
    minuteOptions += `<option value="${min}" ${min === currentMinute ? 'selected' : ''}>${displayMin}</option>`;
  }

  bodyEl.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div>
        <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; color: #e0e0e0; font-size: 0.9rem;">
          Select Date
        </label>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="display: block; margin-bottom: 0.3rem; color: #a0a0b0; font-size: 0.85rem;">Year</label>
            <select id="schedule-year" style="width: 100%; padding: 0.8rem; border: 1px solid rgba(138, 43, 226, 0.3); border-radius: 8px; background: rgba(40, 40, 60, 0.6); color: #e0e0e0; font-size: 0.95rem; cursor: pointer;">
              ${yearOptions}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.3rem; color: #a0a0b0; font-size: 0.85rem;">Month</label>
            <select id="schedule-month" style="width: 100%; padding: 0.8rem; border: 1px solid rgba(138, 43, 226, 0.3); border-radius: 8px; background: rgba(40, 40, 60, 0.6); color: #e0e0e0; font-size: 0.95rem; cursor: pointer;">
              ${monthOptions}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.3rem; color: #a0a0b0; font-size: 0.85rem;">Date</label>
            <select id="schedule-date" style="width: 100%; padding: 0.8rem; border: 1px solid rgba(138, 43, 226, 0.3); border-radius: 8px; background: rgba(40, 40, 60, 0.6); color: #e0e0e0; font-size: 0.95rem; cursor: pointer;">
              ${dateOptions}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; color: #e0e0e0; font-size: 0.9rem;">
          Select Time
        </label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
          <div>
            <label style="display: block; margin-bottom: 0.3rem; color: #a0a0b0; font-size: 0.85rem;">Hour</label>
            <select id="schedule-hour" style="width: 100%; padding: 0.8rem; border: 1px solid rgba(138, 43, 226, 0.3); border-radius: 8px; background: rgba(40, 40, 60, 0.6); color: #e0e0e0; font-size: 0.95rem; cursor: pointer;">
              ${hourOptions}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.3rem; color: #a0a0b0; font-size: 0.85rem;">Minute</label>
            <select id="schedule-minute" style="width: 100%; padding: 0.8rem; border: 1px solid rgba(138, 43, 226, 0.3); border-radius: 8px; background: rgba(40, 40, 60, 0.6); color: #e0e0e0; font-size: 0.95rem; cursor: pointer;">
              ${minuteOptions}
            </select>
          </div>
        </div>
      </div>

      <div style="background: rgba(138, 43, 226, 0.1); border: 1px solid rgba(138, 43, 226, 0.3); padding: 1rem; border-radius: 8px;">
        <p style="margin: 0; color: #c0c0d0; font-size: 0.9rem;">
          <strong>Scheduled for:</strong> <span id="schedule-preview" style="color: #d946ef;">Loading...</span>
        </p>
      </div>
    </div>
  `;

  // Update preview function
  const updatePreview = () => {
    const year = document.getElementById('schedule-year').value;
    const month = document.getElementById('schedule-month').value;
    const date = document.getElementById('schedule-date').value;
    const hour = document.getElementById('schedule-hour').value;
    const minute = document.getElementById('schedule-minute').value;
    
    const scheduledDate = new Date(year, month - 1, date, hour, minute);
    const preview = scheduledDate.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const previewEl = document.getElementById('schedule-preview');
    if (previewEl) {
      previewEl.textContent = preview;
    }
  };

  // Schedule button
  const scheduleBtn = document.createElement('button');
  scheduleBtn.className = 'btn btn-primary';
  scheduleBtn.textContent = 'Schedule Post';
  scheduleBtn.onclick = () => {
    console.log('[Modal] Schedule button clicked');
    const year = document.getElementById('schedule-year').value;
    const month = document.getElementById('schedule-month').value;
    const date = document.getElementById('schedule-date').value;
    const hour = document.getElementById('schedule-hour').value;
    const minute = document.getElementById('schedule-minute').value;

    const scheduledDate = new Date(year, month - 1, date, hour, minute);
    
    if (isNaN(scheduledDate.getTime())) {
      console.error('[Modal] Invalid date selected');
      showAlert('Invalid Date', 'Please select a valid date and time', 'error');
      return;
    }

    if (scheduledDate <= new Date()) {
      console.error('[Modal] Selected date is in the past');
      showAlert('Invalid Time', 'Please select a future date and time', 'error');
      return;
    }

    closeModal();
    if (typeof onSchedule === 'function') {
      // Convert local time to ISO string without timezone shift
      // This ensures a local time like "3:00 PM" stays as "3:00 PM" in the database
      const pad = (n) => String(n).padStart(2, '0');
      const localISO = `${year}-${pad(month)}-${pad(date)}T${pad(hour)}:${pad(minute)}:00`;
      console.log('[Modal] Sending scheduled time (local):', localISO);
      onSchedule(localISO);
    }
  };

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    console.log('[Modal] Schedule cancel button clicked');
    closeModal();
  };

  footerEl.innerHTML = '';
  footerEl.appendChild(cancelBtn);
  footerEl.appendChild(scheduleBtn);

  showModal();

  // Add event listeners for preview update - delayed to ensure elements exist
  setTimeout(() => {
    const yearEl = document.getElementById('schedule-year');
    const monthEl = document.getElementById('schedule-month');
    const dateEl = document.getElementById('schedule-date');
    const hourEl = document.getElementById('schedule-hour');
    const minuteEl = document.getElementById('schedule-minute');

    if (yearEl) yearEl.addEventListener('change', updatePreview);
    if (monthEl) monthEl.addEventListener('change', updatePreview);
    if (dateEl) dateEl.addEventListener('change', updatePreview);
    if (hourEl) hourEl.addEventListener('change', updatePreview);
    if (minuteEl) minuteEl.addEventListener('change', updatePreview);

    // Initial preview update
    updatePreview();
  }, 100);

  console.log('[Modal] Schedule modal displayed');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  console.log('[Modal] DOM is still loading, waiting for DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Modal] DOMContentLoaded event fired');
    initializeModal();
  });
} else {
  console.log('[Modal] DOM already loaded, initializing now');
  initializeModal();
}

console.log('[Modal] modal.js fully loaded and ready');
