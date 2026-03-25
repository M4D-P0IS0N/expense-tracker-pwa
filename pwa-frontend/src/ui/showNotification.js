export function showNotification(message, type = 'info') {
  const existingToastElement = document.getElementById('app-toast');
  if (existingToastElement) existingToastElement.remove();

  const notificationColorMap = {
    success: 'border-accent-green bg-accent-green/10 text-accent-green',
    error: 'border-accent-red bg-accent-red/10 text-accent-red',
    info: 'border-primary bg-primary/10 text-primary',
  };
  const notificationColors = notificationColorMap[type] || notificationColorMap.info;

  const toastElement = document.createElement('div');
  toastElement.id = 'app-toast';
  toastElement.className = `fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-300 ${notificationColors}`;
  toastElement.textContent = message;
  toastElement.style.opacity = '0';
  toastElement.style.transform = 'translate(-50%, -10px)';
  document.body.appendChild(toastElement);

  requestAnimationFrame(() => {
    toastElement.style.opacity = '1';
    toastElement.style.transform = 'translate(-50%, 0)';
  });

  setTimeout(() => {
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => toastElement.remove(), 300);
  }, 3000);
}
