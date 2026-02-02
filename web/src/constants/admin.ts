// Admin addresses that have access to the admin dashboard
export const ADMIN_ADDRESSES = [
    '0x32ff5fdf9cb8be86dd9be6d5904717a1348b3917bc270305745e08123981ec30', // Deployer address
];

export function isAdmin(address: string | undefined): boolean {
    if (!address) return false;
    const normalizedAddress = address.toLowerCase();
    return ADMIN_ADDRESSES.some(adminAddr => adminAddr.toLowerCase() === normalizedAddress);
}
