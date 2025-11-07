// System Checklist - Interactive functionality
(function() {
  'use strict';
  
  // State management
  let checklistState = loadState();
  
  // Initialize
  document.addEventListener('DOMContentLoaded', function() {
    initializeCheckboxes();
    initializeCollapsible();
    updateProgress();
  });
  
  // Checkbox handling
  function initializeCheckboxes() {
    const checkboxes = document.querySelectorAll('.checkbox');
    
    checkboxes.forEach((checkbox, index) => {
      const itemId = `item-${index}`;
      
      // Restore state
      if (checklistState[itemId]) {
        checkbox.classList.add('checked');
        checkbox.closest('.checklist-item').classList.add('completed');
      }
      
      // Click handler
      checkbox.addEventListener('click', function() {
        const isChecked = this.classList.toggle('checked');
        const item = this.closest('.checklist-item');
        item.classList.toggle('completed', isChecked);
        
        // Save state
        checklistState[itemId] = isChecked;
        saveState();
        updateProgress();
        
        // Animate
        if (isChecked) {
          this.style.transform = 'scale(1.2)';
          setTimeout(() => {
            this.style.transform = 'scale(1)';
          }, 200);
        }
      });
    });
  }
  
  // Collapsible sections
  function initializeCollapsible() {
    const headers = document.querySelectorAll('.section-header');
    
    headers.forEach(header => {
      header.addEventListener('click', function() {
        const section = this.closest('.section');
        const content = section.querySelector('.section-content');
        const icon = this.querySelector('.collapse-icon');
        
        content.classList.toggle('collapsed');
        icon.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
      });
    });
  }
  
  // Progress tracking
  function updateProgress() {
    const total = document.querySelectorAll('.checkbox').length;
    const checked = document.querySelectorAll('.checkbox.checked').length;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    
    // Update UI
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-percent').textContent = percent;
    document.getElementById('progress-text').textContent = `${checked}/${total} Complete`;
    
    // Update status
    const statusEl = document.getElementById('overall-status');
    if (percent === 100) {
      statusEl.textContent = '🎉 Complete!';
      statusEl.style.color = 'var(--success)';
    } else if (percent > 50) {
      statusEl.textContent = '⚡ In Progress';
      statusEl.style.color = 'var(--warning)';
    } else {
      statusEl.textContent = '🚀 Getting Started';
      statusEl.style.color = 'var(--info)';
    }
    
    // Update section badges
    updateSectionBadges();
  }
  
  // Update section completion badges
  function updateSectionBadges() {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
      const items = section.querySelectorAll('.checkbox');
      const checked = section.querySelectorAll('.checkbox.checked');
      const badge = section.querySelector('.section-badge');
      
      if (!badge || items.length === 0) return;
      
      const percent = Math.round((checked.length / items.length) * 100);
      
      if (percent === 100) {
        badge.textContent = '✓ Complete';
        badge.className = 'section-badge badge-success';
      } else if (percent > 0) {
        badge.textContent = `${checked.length}/${items.length}`;
        badge.className = 'section-badge badge-warning';
      } else {
        badge.textContent = 'Pending';
        badge.className = 'section-badge badge-info';
      }
    });
  }
  
  // Mark all complete
  window.markAllComplete = function() {
    const checkboxes = document.querySelectorAll('.checkbox:not(.checked)');
    
    if (checkboxes.length === 0) {
      alert('All items are already complete! 🎉');
      return;
    }
    
    if (confirm(`Mark ${checkboxes.length} items as complete?`)) {
      checkboxes.forEach((checkbox, index) => {
        setTimeout(() => {
          checkbox.click();
        }, index * 50);
      });
    }
  };
  
  // State persistence
  function loadState() {
    try {
      const stored = localStorage.getItem('checklistState');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  }
  
  function saveState() {
    try {
      localStorage.setItem('checklistState', JSON.stringify(checklistState));
    } catch (e) {
      console.warn('Could not save checklist state');
    }
  }
  
  // Reset state (for debugging)
  window.resetChecklist = function() {
    if (confirm('Reset all checklist progress?')) {
      localStorage.removeItem('checklistState');
      location.reload();
    }
  };
})();

