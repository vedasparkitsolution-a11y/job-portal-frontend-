import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getJob } from '../../services/jobService';
import { getApplicationsByJob, updateApplicationStatus } from '../../services/applicationService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FiArrowLeft, FiClock, FiCheckCircle, FiCalendar, FiStar, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

const COLUMNS = {
    pending: { id: 'pending', title: 'Applied', icon: <FiClock />, color: '#64748b' },
    shortlisted: { id: 'shortlisted', title: 'Shortlisted', icon: <FiStar />, color: '#3b82f6' },
    interview_scheduled: { id: 'interview_scheduled', title: 'Interviewing', icon: <FiCalendar />, color: '#8b5cf6' },
    hired: { id: 'hired', title: 'Hired', icon: <FiCheckCircle />, color: '#22c55e' },
    rejected: { id: 'rejected', title: 'Rejected', icon: <FiXCircle />, color: '#ef4444' }
};

export default function HiringPipeline() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [columns, setColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const { token } = useAuth();

    useEffect(() => {
        loadData();
    }, [jobId]);

    async function loadData() {
        try {
            const [jobData, apps] = await Promise.all([
                getJob(jobId),
                getApplicationsByJob(jobId)
            ]);
            setJob(jobData);

            // Group applications by status
            const initialCols = {
                pending: [],
                shortlisted: [],
                interview_scheduled: [],
                hired: [],
                rejected: []
            };

            apps.forEach(app => {
                const status = app.status || 'pending';
                if (initialCols[status]) {
                    initialCols[status].push(app);
                }
            });

            setColumns(initialCols);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Dropped outside the list
        if (!destination) return;

        // Dropped in the same place
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const sourceCol = source.droppableId;
        const destCol = destination.droppableId;

        // Clone the arrays
        const sourceItems = Array.from(columns[sourceCol]);
        const destItems = sourceCol === destCol ? sourceItems : Array.from(columns[destCol]);

        // Remove from source array
        const [movedItem] = sourceItems.splice(source.index, 1);
        movedItem.status = destCol; // Update item status locally

        // Add to destination array
        destItems.splice(destination.index, 0, movedItem);

        // Update state optimistically
        setColumns({
            ...columns,
            [sourceCol]: sourceItems,
            [destCol]: destItems
        });

        // If moved to a different column, update backend
        if (sourceCol !== destCol) {
            try {
                await updateApplicationStatus(movedItem.id, destCol);
                addToast('success', `Moved to ${COLUMNS[destCol].title}`);
                
                // If moved to interview_scheduled, remind them to actually schedule the time
                if (destCol === 'interview_scheduled') {
                    addToast('info', 'Don\'t forget to set the interview date & time in the applicants list.');
                }
            } catch (error) {
                console.error(error);
                addToast('error', 'Failed to update status');
                // Revert state on error (reload data)
                loadData();
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{ padding: '20px', minHeight: '100vh', background: '#f8fafc', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                <button 
                    onClick={() => navigate(`/company/view-applicants/${jobId}`)} 
                    style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#475569' }}
                >
                    <FiArrowLeft /> Back to List
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    {job?.title} Pipeline
                </h1>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: '20px', minWidth: 'min-content' }}>
                    {Object.values(COLUMNS).map(column => (
                        <div key={column.id} style={{ background: '#f1f5f9', borderRadius: '12px', width: '320px', flexShrink: 0, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}>
                            <div style={{ padding: '16px', borderBottom: '2px solid', borderBottomColor: column.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#1e293b' }}>
                                    <span style={{ color: column.color }}>{column.icon}</span>
                                    {column.title}
                                </div>
                                <span style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                                    {columns[column.id]?.length || 0}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{
                                            padding: '16px',
                                            flex: 1,
                                            overflowY: 'auto',
                                            background: snapshot.isDraggingOver ? '#e2e8f0' : 'transparent',
                                            transition: 'background 0.2s ease',
                                            minHeight: '150px'
                                        }}
                                    >
                                        {columns[column.id]?.map((item, index) => (
                                            <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            userSelect: 'none',
                                                            padding: '16px',
                                                            margin: '0 0 12px 0',
                                                            background: 'white',
                                                            borderRadius: '8px',
                                                            boxShadow: snapshot.isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                                                            border: '1px solid #e2e8f0',
                                                            ...provided.draggableProps.style
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                                                            {item.applicantName || 'Candidate'}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                                                            {item.applicantEmail}
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#475569' }}>
                                                                Score: {item.testScore || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
