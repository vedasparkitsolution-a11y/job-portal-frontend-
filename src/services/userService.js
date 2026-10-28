// REST User Service — interacts purely with MySQL Backend API

import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/admin`;

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getUser(userId) {
    if (!userId) return null;
    try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return data.user || data;
        }
    } catch (e) {
        console.error(`Error fetching user ${userId}:`, e);
    }
    return null;
}

export async function getAllUsers() {
    try {
        const res = await fetch(`${API_BASE}/users`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return data.users || [];
        }
    } catch (e) {
        console.error('Error fetching all users:', e);
    }
    return [];
}

export async function updateUserProfile(userId, data) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) {
        console.error(`Error updating user ${userId}:`, e);
        return false;
    }
}
