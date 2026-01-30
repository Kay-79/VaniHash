export function validatePattern(pattern: string): boolean {
    // Only hex allowed
    const hexRegex = /^[0-9a-fA-F]*$/;
    return hexRegex.test(pattern);
}

export function isValidAddress(address: string): boolean {
    return address.startsWith('0x') && address.length === 66; // Standard Sui address
}
