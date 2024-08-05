function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidInterval(interval) {
  return !isNaN(interval) && interval > 0;
}

module.exports = { isValidUrl, isValidInterval };
