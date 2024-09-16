// Libraries
import CryptoJS from 'crypto-js';

// Load encryption key from environment variables
const encryptionKey = process.env.REACT_APP_ENCRYPTION_KEY || 'default_test_key';

// Encrypt Function
const encryption = (data) => {
    console.log(process.env.REACT_APP_ENCRYPTION_KEY);
    try {
        if (!encryptionKey) {
            throw new Error('Encryption key is not defined');
        }

        console.log('Encryption key:', encryptionKey);
        // Encrypt the data using AES
        const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();

        // Return the encrypted data
        return encrypted;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};

// Export the function
export default encryption;