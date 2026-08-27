// Mock User Service — uses localStorage instead of Firestore

const USERS_KEY = 'mock_users';

function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user || null;
}

export async function getAllUsers() {
    return getUsers().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function updateUserProfile(userId, data) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveUsers(users);
    } else {
        users.push({ id: userId, ...data });
        saveUsers(users);
    }

    // Also update mock_auth_users
    try {
        const authUsers = JSON.parse(localStorage.getItem('mock_auth_users') || '{}');
        let updated = false;
        for (let key in authUsers) {
            if (authUsers[key].uid === userId || authUsers[key].data?.id === userId || authUsers[key].email === data.email) {
                authUsers[key].data = { ...authUsers[key].data, ...data };
                updated = true;
            }
        }
        if (updated) {
            localStorage.setItem('mock_auth_users', JSON.stringify(authUsers));
        }
    } catch (e) {
        console.error('Error updating mock_auth_users:', e);
    }

    // Also update current session
    try {
        const session = JSON.parse(localStorage.getItem('mock_current_session') || 'null');
        if (session && (session.uid === userId || session.data?.id === userId || session.email === data.email)) {
            session.data = { ...session.data, ...data };
            localStorage.setItem('mock_current_session', JSON.stringify(session));
        }
    } catch (e) {
        console.error('Error updating mock_current_session:', e);
    }
}

