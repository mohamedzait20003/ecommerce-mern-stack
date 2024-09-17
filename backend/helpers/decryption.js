// Libraries Import
const crypto = require('crypto');
const fs = require('fs');

// Load private key from file
const privateKey = fs.readFileSync('secrets/private.pem', 'utf8');

// Decrypt Function
function decryptData(encryptedData) {
    try {
        if (!privateKey) {
            throw new Error('Private key is not defined');
        }

        // Decrypt the data using RSA
        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(encryptedData, 'base64')
        );

        // Return the decrypted data as a string
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Decryption failed:', error);
        throw error;
    }
}

// Export the function
module.exports = decryptData;