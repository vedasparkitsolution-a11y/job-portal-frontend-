import { useState, useEffect, createContext, useContext } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext();

export function useToast() {
    const ctx = useContext(ToastContext);
    return ctx || { addToast: (msg) => console.log(msg) };
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    function addToast(arg1, arg2 = 'info', duration = 4000) {
        let message = '';
        let type = 'info';

        const KNOWN_TYPES = ['success', 'error', 'info', 'warning'];

        if (typeof arg1 === 'object' && arg1 !== null) {
            // Case 1: addToast({ type: 'success', message: '...', title: '...' })
            message = arg1.message || arg1.title || JSON.stringify(arg1);
            type = arg1.type || 'info';
            if (arg1.duration) duration = arg1.duration;
        } else if (KNOWN_TYPES.includes(String(arg1).toLowerCase())) {
            // Case 2: addToast('success', 'Message here')
            type = String(arg1).toLowerCase();
            message = typeof arg2 === 'object' && arg2 !== null ? (arg2.message || JSON.stringify(arg2)) : String(arg2 || '');
        } else {
            // Case 3: addToast('Message here', 'success')
            message = String(arg1 || '');
            type = typeof arg2 === 'string' && KNOWN_TYPES.includes(arg2.toLowerCase()) ? arg2.toLowerCase() : 'info';
        }

        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message: String(message), type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }

    function removeToast(id) {
        setToasts(prev => prev.filter(t => t.id !== id));
    }

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span className="toast-icon">
                            {toast.type === 'success' && <FiCheckCircle />}
                            {toast.type === 'error' && <FiAlertCircle />}
                            {toast.type === 'info' && <FiInfo />}
                        </span>
                        <span className="toast-message">
                            {typeof toast.message === 'string' ? toast.message : String(toast.message)}
                        </span>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <FiX />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
