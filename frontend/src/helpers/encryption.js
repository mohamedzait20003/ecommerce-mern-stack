// Public Key
const publicKeyPEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoIEFZF1k0TeU9vPjyP8I
5k0AzlnwQYyW7kW+hci8T12aXJZb+QvZPZVMR1SGYbQOCG/zz/O9/hCND11ZJBw/
6kmEloYo4TANe5LR0pAoRBY2Y27ZGAogw+3sakSo4SOxnqsdvfkZLE7XQLYCGqMR
P/7wt87i9A+Z3K8+7rQ/BN3n6X0MNp7D3+P6tmhEmo6nET0cV5FeerbAl41XMYKZ
1GoeVE/oMzkbsQaxXvBK2IswmqlIk8f9BAjsLE6WWK3gsXJFPsVRDivAVIdLK9R9
Mw+Tfw8N/OtzkILYn7c/b+eCM0AlYlKz7cqu/ipwi7pe47Psg2ZCpXKqXEZcoycM
lwIDAQAB
-----END PUBLIC KEY-----`;

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
        console.log('Public key:', publicKeyPEM);

        // Import the public key
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

        console.log('Public key imported:', publicKey);

        // Encrypt the data using RSA
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            publicKey,
            new TextEncoder().encode(data)
        );

        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        console.log('Encrypted data:', encryptedBase64);

        // Return the encrypted data
        return encryptedBase64;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw error;
    }
};

// Export the function
export default encryption;