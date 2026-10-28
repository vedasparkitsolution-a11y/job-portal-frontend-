// REST Company Service — interacts purely with MySQL Backend API

import { API_BASE_URL } from '../config/api';

const API_BASE = `${API_BASE_URL}/api/employer`;

function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function getCompany(companyId) {
    if (!companyId) return null;
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return data.company || data.user || null;
        }
    } catch (e) {
        console.error(`Error fetching company ${companyId}:`, e);
    }
    return null;
}

export async function getAllCompanies() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users?role=company`, {
            headers: { ...getAuthHeader() }
        });
        if (res.ok) {
            const data = await res.json();
            return data.users || [];
        }
    } catch (e) {
        console.error('Error fetching companies:', e);
    }
    return [];
}

export async function getPendingCompanies() {
    const companies = await getAllCompanies();
    return companies.filter(c => c.status === 'pending' || c.approved_access === 0);
}

export async function approveCompany(companyId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/companies/${companyId}/approved-access`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ approved_access: 1 })
        });
        return res.ok;
    } catch (e) {
        console.error(`Error approving company ${companyId}:`, e);
        return false;
    }
}

export async function rejectCompany(companyId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/companies/${companyId}/approved-access`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({ approved_access: 0 })
        });
        return res.ok;
    } catch (e) {
        console.error(`Error rejecting company ${companyId}:`, e);
        return false;
    }
}

export async function updateCompanyProfile(companyId, data) {
    try {
        const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (e) {
        console.error(`Error updating company profile ${companyId}:`, e);
        return false;
    }
}

export async function createCompanyByAdmin(companyData) {
    return await updateCompanyProfile(companyData.id, companyData);
}
