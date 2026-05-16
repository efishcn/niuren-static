/**
 * Modern Invite System v2 — Frontend JS
 * Lightweight shared utilities. Template-specific logic is inline.
 */
(function() {
    'use strict';

    // Shared toast notification
    window.misToast = function(message, type) {
        type = type || 'success';
        var existing = document.querySelector('.mis-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'mis-toast ' + type;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.4s';
            setTimeout(function() { toast.remove(); }, 400);
        }, 2500);
    };

    // Modal click-outside-to-close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mis-viral-modal')) {
            e.target.style.display = 'none';
        }
    });
})();
