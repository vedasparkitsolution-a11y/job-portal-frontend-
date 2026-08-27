// Mock Message Service for Employer/Candidate Chat

const MESSAGES_KEY = 'mock_messages';

function getMessages() {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
}

function saveMessages(msgs) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

function generateId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

// Initial mock data if empty
if (getMessages().length === 0) {
    saveMessages([
        {
            id: 'msg_1',
            companyId: 'mock_company_1',
            candidateId: 'mock_user_1',
            candidateName: 'John Doe',
            sender: 'candidate',
            text: 'Hello, I submitted my application for the Software Engineer role.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 'msg_2',
            companyId: 'mock_company_1',
            candidateId: 'mock_user_1',
            candidateName: 'John Doe',
            sender: 'company',
            text: 'Hi John, we received it and are reviewing your portfolio. Looks great so far!',
            timestamp: new Date(Date.now() - 1800000).toISOString()
        }
    ]);
}

export async function getMessagesForCompany(companyId) {
    // Returns conversations grouped by candidate
    const msgs = getMessages().filter(m => m.companyId === companyId);
    
    // Grouping
    const convos = {};
    for (let m of msgs) {
        if (!convos[m.candidateId]) {
            convos[m.candidateId] = {
                candidateId: m.candidateId,
                candidateName: m.candidateName,
                messages: []
            };
        }
        convos[m.candidateId].messages.push(m);
    }
    
    return Object.values(convos);
}

export async function sendMessage(companyId, candidateId, candidateName, sender, text) {
    const msgs = getMessages();
    const newMsg = {
        id: generateId(),
        companyId,
        candidateId,
        candidateName,
        sender,
        text,
        timestamp: new Date().toISOString()
    };
    msgs.push(newMsg);
    saveMessages(msgs);
    return newMsg;
}
