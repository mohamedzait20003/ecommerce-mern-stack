const crypto = require('crypto');
const fs = require('fs');

// Load keys
const publicKey = fs.readFileSync('secrets/public.pem', 'utf8');
const privateKey = fs.readFileSync('secrets/private.pem', 'utf8');

// Test data
const testData = 'test';

// Encrypt with public key
const encryptedData = crypto.publicEncrypt(
    {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
    },
    Buffer.from(testData)
);

console.log('Encrypted data:', encryptedData.toString('base64'));

// Decrypt with private key
try {
    const decryptedData = crypto.privateDecrypt(
        {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedData
    );

    console.log('Decrypted data:', decryptedData.toString('utf8'));
} catch (error) {
    console.error('Decryption failed:', error);
}