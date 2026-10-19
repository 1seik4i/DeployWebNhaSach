export function isFeedbackContact(value) {
  if (!value) return true;
  return value.length <= 254 && (
    /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value) ||
    /^(?:0|\+84)(?:[35789]\d{8}|2\d{9})$/.test(value.replace(/[ .-]/g, ''))
  );
}
