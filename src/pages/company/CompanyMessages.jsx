import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMessagesForCompany, sendMessage } from '../../services/messageService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CompanyMessages() {
    const { currentUser, userData } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    async function loadData() {
        try {
            const convos = await getMessagesForCompany(currentUser.uid);
            setConversations(convos);
            if (convos.length > 0 && !activeConvo) {
                setActiveConvo(convos[0]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeConvo || !currentUser) return;

        try {
            await sendMessage(
                currentUser.uid, 
                activeConvo.candidateId, 
                activeConvo.candidateName, 
                'company', 
                text
            );
            setText('');
            loadData(); // Re-fetch to display
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <h2 style={{ marginBottom: '24px' }}>Candidate Messages</h2>
            
            <div style={{ display: 'flex', gap: '24px', height: '600px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* Contacts List */}
                <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Conversations</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 ? (
                            <p style={{ padding: '16px', color: 'var(--text-muted)' }}>No messages yet.</p>
                        ) : (
                            conversations.map(c => (
                                <div 
                                    key={c.candidateId} 
                                    onClick={() => setActiveConvo(c)}
                                    style={{ 
                                        padding: '16px', 
                                        cursor: 'pointer', 
                                        borderBottom: '1px solid var(--border-light)',
                                        backgroundColor: activeConvo?.candidateId === c.candidateId ? 'var(--primary-50)' : 'transparent'
                                    }}
                                >
                                    <strong>{c.candidateName}</strong>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.messages[c.messages.length - 1].text}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
                    {activeConvo ? (
                        <>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
                                <h3 style={{ margin: 0 }}>{activeConvo.candidateName}</h3>
                            </div>
                            
                            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {activeConvo.messages.map(m => (
                                    <div 
                                        key={m.id} 
                                        style={{ 
                                            maxWidth: '70%', 
                                            alignSelf: m.sender === 'company' ? 'flex-end' : 'flex-start',
                                            backgroundColor: m.sender === 'company' ? 'var(--primary)' : 'var(--bg-light)',
                                            color: m.sender === 'company' ? 'white' : 'var(--text-primary)',
                                            padding: '12px 16px',
                                            borderRadius: 'var(--radius-md)',
                                            borderBottomRightRadius: m.sender === 'company' ? '0' : 'var(--radius-md)',
                                            borderBottomLeftRadius: m.sender === 'candidate' ? '0' : 'var(--radius-md)',
                                        }}
                                    >
                                        <p style={{ margin: 0 }}>{m.text}</p>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7, display: 'block', marginTop: '4px', textAlign: 'right' }}>
                                            {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ padding: '16px', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
                                <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
                                    <input 
                                        type="text" 
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Type a message..." 
                                        style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                                    />
                                    <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Send</button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            Select a conversation to start messaging
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
