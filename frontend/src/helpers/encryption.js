// Public Key
const publicKeyPEM = process.env.REACT_APP_ENCRYPTION_KEY;

// Convert PEM to ArrayBuffer
const pemToArrayBuffer = (pem) => {
    const b64 = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n)/g, '');
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// Encrypt Function
const encryption = async (data) => {
    try {
        // Import the Public Key
        const publicKey = await window.crypto.subtle.importKey(
            'spki',
            pemToArrayBuffer(publicKeyPEM),
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            true,
            ['encrypt']
        );

        // Encrypt the data using RSA
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            publicKey,
            new TextEncoder().encode(data)
        );

        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

        // Return the encrypted data
        return encryptedBase64;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};


export default encryption;