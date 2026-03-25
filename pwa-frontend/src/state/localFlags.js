const ONBOARDING_COMPLETED_STORAGE_KEY = 'onboardingCompleted';
const PATRIMONIO_CALIBRATED_STORAGE_KEY = 'patrimonioCalibrated';

export function isOnboardingCompleted() {
  return localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY) === 'true';
}

export function markOnboardingCompleted() {
  localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, 'true');
}

export function isPatrimonioCalibrated() {
  return localStorage.getItem(PATRIMONIO_CALIBRATED_STORAGE_KEY) === 'true';
}

export function markPatrimonioCalibrated() {
  localStorage.setItem(PATRIMONIO_CALIBRATED_STORAGE_KEY, 'true');
}
