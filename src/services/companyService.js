// Mock Company Service — uses localStorage instead of Firestore

const COMPANIES_KEY = 'mock_companies';

function getCompanies() {
    return JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
}

function saveCompanies(companies) {
    try {
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
    } catch (e) {
        console.warn('localStorage quota exceeded in saveCompanies. Stripping large logo Base64 strings...', e);
        try {
            const sanitized = companies.map(c => ({
                ...c,
                logoURL: (c.logoURL && c.logoURL.length > 30000) ? '' : c.logoURL,
                companyLogo: (c.companyLogo && c.companyLogo.length > 30000) ? '' : c.companyLogo
            }));
            localStorage.setItem(COMPANIES_KEY, JSON.stringify(sanitized));
        } catch (innerErr) {
            console.error('Failed to save companies to localStorage:', innerErr);
        }
    }
}


function generateId() {
    return 'company_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

export async function getCompany(companyId) {
    const companies = getCompanies();
    return companies.find(c => c.id === companyId) || null;
}

export async function getAllCompanies() {
    return getCompanies().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPendingCompanies() {
    return getCompanies().filter(c => c.status === 'pending');
}

export async function approveCompany(companyId) {
    const companies = getCompanies();
    const index = companies.findIndex(c => c.id === companyId);
    if (index !== -1) {
        companies[index].status = 'approved';
        saveCompanies(companies);
    }
}

export async function rejectCompany(companyId) {
    const companies = getCompanies();
    const index = companies.findIndex(c => c.id === companyId);
    if (index !== -1) {
        companies[index].status = 'rejected';
        saveCompanies(companies);
    }
}

export async function updateCompanyProfile(companyId, data) {
    const companies = getCompanies();
    const index = companies.findIndex(c => c.id === companyId);
    if (index !== -1) {
        companies[index] = { ...companies[index], ...data };
        saveCompanies(companies);
    }
}

export async function createCompanyByAdmin(companyData) {
    const companies = getCompanies();
    const id = generateId();
    companies.unshift({ id, ...companyData, status: 'approved', addedByAdmin: true, createdAt: new Date().toISOString() });
    saveCompanies(companies);
    return id;
}
