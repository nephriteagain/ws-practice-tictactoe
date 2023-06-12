function generateClientId() {
  const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let clientId = '';

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
    clientId += alphanumericChars.charAt(randomIndex);
  }

  return clientId;
}

module.exports = { generateClientId }