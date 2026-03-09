// --- Pull-to-Refresh (iOS PWA) ---
// Handles the pull-to-refresh gesture for mobile PWA experience.
// No external dependencies — only uses DOM elements from the PTR indicator.

export function initPullToRefresh() {
    let pStart = { y: 0 };
    let pCurrent = { y: 0 };
    const ptrContainer = document.getElementById('ptr-indicator');
    const ptrIcon = document.getElementById('ptr-icon');
    const ptrText = document.getElementById('ptr-text');
    const MAX_PULL = 150;
    const TRIGGER_PULL = 80;
    let isPulling = false;

    if (!ptrContainer || !ptrIcon || !ptrText) return;

    document.addEventListener('touchstart', (e) => {
        // Use scrollY or scrollTop to be extremely safe about position 0
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        if (scrollTop <= 5) {
            pStart.y = e.touches[0].clientY;
            isPulling = true;
            ptrContainer.style.transition = 'none';
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        pCurrent.y = e.touches[0].clientY;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        let pullDistance = pCurrent.y - pStart.y;

        // Only pull down when at the top
        if (pullDistance > 0 && scrollTop <= 5) {
            // CRITICAL for iOS Safari: Prevent native bouncing
            if (e.cancelable) {
                e.preventDefault();
            }

            let visualPull = pullDistance * 0.45;

            // Hard cap
            if (visualPull > MAX_PULL) visualPull = MAX_PULL + (visualPull - MAX_PULL) * 0.1;

            ptrContainer.style.transform = `translateY(${visualPull}px)`;
            ptrContainer.classList.remove('opacity-0', '-translate-y-full'); // Unhide fast

            if (visualPull >= TRIGGER_PULL) {
                ptrIcon.textContent = 'autorenew';
                ptrIcon.classList.add('animate-spin');
                ptrText.textContent = 'Solte para atualizar';
            } else {
                ptrIcon.textContent = 'arrow_downward';
                ptrIcon.classList.remove('animate-spin');
                ptrText.textContent = 'Puxe para atualizar';
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!isPulling) return;
        isPulling = false;

        const pullDistance = pCurrent.y - pStart.y;
        let visualPull = pullDistance * 0.45;
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

        ptrContainer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease';

        if (visualPull >= TRIGGER_PULL && scrollTop <= 5) {
            ptrContainer.style.transform = `translateY(${TRIGGER_PULL - 20}px)`;
            ptrText.textContent = 'Atualizando...';

            setTimeout(() => {
                window.location.reload(true);
            }, 400);
        } else {
            // Snap back and hide completely
            ptrContainer.style.transform = `translateY(-150px)`;
            ptrContainer.classList.add('opacity-0');
            setTimeout(() => {
                ptrIcon.classList.remove('animate-spin');
                ptrIcon.textContent = 'arrow_downward';
                ptrContainer.classList.add('-translate-y-full');
            }, 400);
        }
    });
}
