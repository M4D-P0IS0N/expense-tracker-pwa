export function showNotification(message, type = 'info') {
  const existingToast = document.getElementById('app-toast');
  if (existingToast) existingToast.remove();

  const colorMap = {
    success: 'border-accent-green bg-accent-green/10 text-accent-green',
    error: 'border-accent-red bg-accent-red/10 text-accent-red',
    info: 'border-primary bg-primary/10 text-primary',
  };

  const notificationToast = document.createElement('div');
  notificationToast.id = 'app-toast';
  notificationToast.className = `fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-300 ${colorMap[type] || colorMap.info}`;
  notificationToast.textContent = message;
  notificationToast.style.opacity = '0';
  notificationToast.style.transform = 'translate(-50%, -10px)';
  document.body.appendChild(notificationToast);

  requestAnimationFrame(() => {
    notificationToast.style.opacity = '1';
    notificationToast.style.transform = 'translate(-50%, 0)';
  });

  setTimeout(() => {
    notificationToast.style.opacity = '0';
    notificationToast.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => notificationToast.remove(), 300);
  }, 3000);
}
