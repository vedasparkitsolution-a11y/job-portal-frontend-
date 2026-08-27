import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOpenJobs } from '../services/jobService';
import JobCard from '../components/JobCard';
import JobFilterSidebar from '../components/JobFilterSidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
    FiBriefcase, FiSearch, FiMapPin, FiX, FiNavigation, 
    FiCompass, FiMap, FiCheck, FiSliders, FiExternalLink 
} from 'react-icons/fi';

const CITY_COORDINATES = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi NCR': { lat: 28.6139, lng: 77.2090 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 }
};

export default function BrowseJobs() {
    const [searchParams] = useSearchParams();
    const [jobs, setJobs] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Geo-Tag Location States
    const [geoSettings, setGeoSettings] = useState({
        enabled: true,
        candidateAccess: true,
        defaultRadius: 25,
        showDistanceBadge: true
    });
    const [userCoordinates, setUserCoordinates] = useState(null);
    const [selectedRadius, setSelectedRadius] = useState('25');
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [geoStatusMsg, setGeoStatusMsg] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);

    const [filters, setFilters] = useState({
        keyword: searchParams.get('keyword') || '',
        location: searchParams.get('location') || '',
        level: '',
        jobType: '',
        workMode: '',
        salary: '',
        datePosted: '',
        education: ''
    });

    useEffect(() => {
        loadGeoSettingsAndJobs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filters, jobs, userCoordinates, selectedRadius]);

    async function loadGeoSettingsAndJobs() {
        try {
            // Load Public System Settings to check Admin permissions for candidate geo-location
            try {
                const sRes = await fetch('http://localhost:5000/api/settings/public');
                if (sRes.ok) {
                    const sData = await sRes.json();
                    setGeoSettings({
                        enabled: sData.geotag_enabled !== 'false',
                        candidateAccess: sData.geotag_candidate_access !== 'false',
                        defaultRadius: parseInt(sData.geotag_default_radius, 10) || 25,
                        showDistanceBadge: sData.geotag_show_distance_badge !== 'false'
                    });
                    if (sData.geotag_default_radius) {
                        setSelectedRadius(String(sData.geotag_default_radius));
                    }
                }
            } catch (e) {
                console.log('Public settings fallback to default', e);
            }

            await fetchJobs();
        } catch (err) {
            console.error('Failed to load jobs:', err);
            setError('Failed to load jobs.');
        } finally {
            setLoading(false);
        }
    }

    async function fetchJobs(coords = null, radius = selectedRadius) {
        try {
            let url = 'http://localhost:5000/api/jobs/all';
            if (coords && coords.lat && coords.lng) {
                url += `?lat=${coords.lat}&lng=${coords.lng}&radius=${radius || 25}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setJobs(data || []);
            } else {
                const fb = await getOpenJobs();
                setJobs(fb);
            }
        } catch (err) {
            const fb = await getOpenJobs();
            setJobs(fb);
        }
    }

    // 1-Click GPS Browser Location Detection
    const handleDetectCurrentLocation = () => {
        if (!navigator.geolocation) {
            setGeoStatusMsg('Geolocation is not supported by your browser');
            return;
        }
        setDetectingLocation(true);
        setGeoStatusMsg('Acquiring GPS location...');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const coords = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    name: 'Current GPS Location'
                };
                setUserCoordinates(coords);
                setGeoStatusMsg(`📍 Location detected: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
                setDetectingLocation(false);
                await fetchJobs(coords, selectedRadius);
            },
            (err) => {
                console.warn('GPS detection denied/failed:', err);
                // Fallback to default Bangalore coordinates for demo
                const fbCoords = { lat: 12.9716, lng: 77.5946, name: 'Bangalore (Demo GPS)' };
                setUserCoordinates(fbCoords);
                setGeoStatusMsg('📍 GPS permission bypassed: centered on Bangalore Metro');
                setDetectingLocation(false);
                fetchJobs(fbCoords, selectedRadius);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    // City Preset Selector
    const handleSelectCityPreset = async (cityName) => {
        const coords = CITY_COORDINATES[cityName];
        if (coords) {
            const cObj = { ...coords, name: cityName };
            setUserCoordinates(cObj);
            setGeoStatusMsg(`📍 Location set to ${cityName}`);
            await fetchJobs(cObj, selectedRadius);
        }
    };

    const handleClearGeoLocation = async () => {
        setUserCoordinates(null);
        setGeoStatusMsg('');
        await fetchJobs(null);
    };

    function handleFilterChange(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleClearAll() {
        setUserCoordinates(null);
        setGeoStatusMsg('');
        setFilters({
            keyword: '',
            location: '',
            level: '',
            jobType: '',
            workMode: '',
            salary: '',
            datePosted: '',
            education: ''
        });
        fetchJobs(null);
    }

    function applyFilters() {
        let result = [...jobs];

        if (filters.keyword.trim()) {
            const kw = filters.keyword.toLowerCase();
            result = result.filter(j => {
                const title = (j.title || j.job_title || j.jobTitle || '').toLowerCase();
                const comp = (j.companyName || j.company_name || '').toLowerCase();
                const skills = (j.skills || j.required_skills || '').toLowerCase();
                const desc = (j.description || j.job_description || '').toLowerCase();
                return title.includes(kw) || comp.includes(kw) || skills.includes(kw) || desc.includes(kw);
            });
        }

        if (filters.location.trim()) {
            const loc = filters.location.toLowerCase();
            result = result.filter(j => (j.location || j.job_location || '').toLowerCase().includes(loc));
        }

        if (filters.level) {
            const lvl = filters.level;
            result = result.filter(j => {
                const exp = (j.experience || '').toLowerCase();
                const title = (j.title || j.job_title || j.jobTitle || '').toLowerCase();
                const type = (j.jobType || j.job_type || '').toLowerCase();
                if (lvl === 'student') {
                    return type.includes('intern') || title.includes('intern') || exp.includes('fresher') || exp.includes('0');
                } else if (lvl === 'fresher') {
                    return exp.includes('fresher') || exp.includes('0') || exp.includes('1-2') || type.includes('intern');
                } else if (lvl === 'experienced') {
                    return exp.includes('1-2') || exp.includes('3-5') || exp.includes('1-3');
                } else if (lvl === 'senior') {
                    return exp.includes('5+') || exp.includes('3-5');
                }
                return true;
            });
        }

        if (filters.jobType) {
            result = result.filter(j => (j.jobType || j.job_type || '').toLowerCase() === filters.jobType.toLowerCase());
        }

        if (filters.workMode) {
            result = result.filter(j => (j.workMode || j.location_type || '').toLowerCase().includes(filters.workMode.toLowerCase()));
        }

        if (filters.datePosted) {
            const daysLimit = parseInt(filters.datePosted, 10);
            if (!isNaN(daysLimit)) {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - daysLimit);
                result = result.filter(j => j.createdAt && new Date(j.createdAt) >= cutoff);
            }
        }

        if (filters.education) {
            const eduReq = filters.education.toLowerCase();
            result = result.filter(j => (j.education || '').toLowerCase().includes(eduReq) || (j.description || '').toLowerCase().includes(eduReq));
        }

        // Filter by GPS radius if active
        if (userCoordinates && selectedRadius) {
            const maxR = parseFloat(selectedRadius);
            result = result.filter(j => j.distance_km === null || j.distance_km === undefined || j.distance_km <= maxR);
        }

        setFiltered(result);
    }

    const activeKeys = Object.keys(filters).filter(k => !!filters[k]);
    const activeFilterCount = activeKeys.length + (userCoordinates ? 1 : 0);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="browse-jobs" style={{ paddingBottom: '60px' }}>
            <div className="container">
                <div className="page-header" style={{ marginBottom: '20px' }}>
                    <h1>Browse Jobs</h1>
                    <p>Explore open positions from verified companies with AI matchmaking and Geo-Location proximity.</p>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {/* Geo-Tag Location Toolbar (Granted via Admin Settings) */}
                {geoSettings.enabled && geoSettings.candidateAccess && (
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc, #eff6ff)',
                        border: '1px solid #bfdbfe',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        marginBottom: '22px',
                        boxShadow: '0 2px 10px rgba(37, 99, 235, 0.06)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                                }}>
                                    <FiNavigation size={18} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Location-Based Job Finder</strong>
                                        <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                                            GPS Proximity
                                        </span>
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                        Find verified vacancies within driving or commute distance from your exact position.
                                    </p>
                                </div>
                            </div>

                            {/* Geo Action Controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                {/* 1-Click Detect GPS Button */}
                                <button
                                    onClick={handleDetectCurrentLocation}
                                    disabled={detectingLocation}
                                    style={{
                                        background: userCoordinates ? '#eff6ff' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                        color: userCoordinates ? '#1d4ed8' : '#ffffff',
                                        border: userCoordinates ? '1.5px solid #2563eb' : 'none',
                                        padding: '9px 16px',
                                        borderRadius: '10px',
                                        fontSize: '0.86rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: userCoordinates ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FiCompass className={detectingLocation ? 'spin' : ''} />
                                    {detectingLocation ? 'Locating...' : userCoordinates ? `📍 ${userCoordinates.name || 'Located'}` : 'Detect My GPS Location'}
                                </button>

                                {/* Radius Selector */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '4px 8px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Radius:</span>
                                    <select
                                        value={selectedRadius}
                                        onChange={async (e) => {
                                            const r = e.target.value;
                                            setSelectedRadius(r);
                                            if (userCoordinates) {
                                                await fetchJobs(userCoordinates, r);
                                            }
                                        }}
                                        style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="5">5 km</option>
                                        <option value="10">10 km</option>
                                        <option value="25">25 km (Default)</option>
                                        <option value="50">50 km</option>
                                        <option value="100">100 km</option>
                                    </select>
                                </div>

                                {/* Map View Modal Trigger */}
                                <button
                                    onClick={() => setShowMapModal(true)}
                                    style={{
                                        background: '#ffffff',
                                        color: '#334155',
                                        border: '1px solid #cbd5e1',
                                        padding: '9px 14px',
                                        borderRadius: '10px',
                                        fontSize: '0.84rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <FiMap color="#2563eb" /> Map View
                                </button>

                                {userCoordinates && (
                                    <button
                                        onClick={handleClearGeoLocation}
                                        title="Clear GPS filter"
                                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '9px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                                    >
                                        <FiX /> Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick City Presets */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>Quick Metro Hubs:</span>
                            {['Bangalore', 'Mumbai', 'Delhi NCR', 'Chennai', 'Hyderabad', 'Pune'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleSelectCityPreset(c)}
                                    style={{
                                        background: userCoordinates?.name === c ? '#2563eb' : '#ffffff',
                                        color: userCoordinates?.name === c ? '#ffffff' : '#334155',
                                        border: '1px solid #cbd5e1',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                            {geoStatusMsg && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
                                    {geoStatusMsg}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="browse-jobs-layout">
                    {/* LEFT SIDEBAR FILTERS */}
                    <JobFilterSidebar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        activeFilterCount={activeFilterCount}
                    />

                    {/* MAIN CONTENT AREA */}
                    <div className="browse-jobs-main">
                        {/* Top Search Inputs */}
                        <div style={{
                            display: 'flex', gap: '12px', flexWrap: 'wrap',
                            background: 'white', padding: '16px', borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0',
                            marginBottom: '20px'
                        }}>
                            <div style={{ flex: '1 1 200px', position: 'relative' }}>
                                <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Job title, keyword, or skill..."
                                    value={filters.keyword}
                                    onChange={e => handleFilterChange('keyword', e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 40px',
                                        border: '1px solid #e2e8f0', borderRadius: '10px',
                                        fontSize: '0.92rem', outline: 'none', background: '#f8fafc'
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1 1 180px', position: 'relative' }}>
                                <FiMapPin style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="City or location..."
                                    value={filters.location}
                                    onChange={e => handleFilterChange('location', e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px 12px 40px',
                                        border: '1px solid #e2e8f0', borderRadius: '10px',
                                        fontSize: '0.92rem', outline: 'none', background: '#f8fafc'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Active Filter Tags */}
                        {activeFilterCount > 0 && (
                            <div className="active-filter-tags" style={{ marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
                                {userCoordinates && (
                                    <span className="active-tag-pill" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                        <span>📍 Within {selectedRadius} km of <strong>{userCoordinates.name || 'GPS'}</strong></span>
                                        <button onClick={handleClearGeoLocation} title="Remove Geo filter"><FiX /></button>
                                    </span>
                                )}
                                {Object.entries(filters).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <span key={key} className="active-tag-pill">
                                            <span>{key}: <strong>{val}</strong></span>
                                            <button onClick={() => handleFilterChange(key, '')} title="Remove filter"><FiX /></button>
                                        </span>
                                    );
                                })}
                                <button onClick={handleClearAll} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', marginLeft: '6px' }}>Clear All</button>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p className="results-count" style={{ margin: 0, fontWeight: 700, color: '#334155' }}>
                                Showing {filtered.length} job{filtered.length !== 1 ? 's' : ''}
                                {userCoordinates && ` (Sorted by nearest proximity)`}
                            </p>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="empty-state" style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <FiBriefcase style={{ fontSize: '3rem', color: '#0ea5e9', marginBottom: '12px' }} />
                                <h3>No matching jobs found in this radius</h3>
                                <p style={{ color: '#64748b' }}>Try expanding your search radius (e.g. to 50 km or 100 km) or clear filters to see all available opportunities.</p>
                                <button onClick={handleClearAll} className="btn btn-primary" style={{ marginTop: '16px' }}>View All Jobs</button>
                            </div>
                        ) : (
                            <div className="jobs-grid">
                                {filtered.map(job => (
                                    <JobCard key={job.id} job={job} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Interactive Map View Modal */}
            {showMapModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff', borderRadius: '20px',
                        width: '100%', maxWidth: '900px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                        {/* Map Header */}
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiMap size={18} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Nearby Jobs Map View</h3>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {filtered.length} locations mapped {userCoordinates ? `around ${userCoordinates.name}` : ''}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowMapModal(false)} style={{ background: '#e2e8f0', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiX />
                            </button>
                        </div>

                        {/* Interactive Pin List & Coordinate Grid */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                borderRadius: '16px',
                                padding: '24px',
                                color: 'white',
                                marginBottom: '20px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                                        GEO-FENCE RADIAL MAP
                                    </span>
                                    <h4 style={{ margin: '8px 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>
                                        {userCoordinates ? `Centered on ${userCoordinates.name}` : 'Multi-City India Job Cluster'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
                                        Interactive OpenStreetMap Geo-coordinates active. Jobs tagged by employers appear within your radius.
                                    </p>
                                </div>
                            </div>

                            {/* Job Pin Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                                {filtered.map(j => (
                                    <div key={j.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                                                    {j.distance_km !== null && j.distance_km !== undefined ? `📍 ${j.distance_km} km away` : '📍 Geotagged'}
                                                </span>
                                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{j.jobType || 'Full Time'}</span>
                                            </div>
                                            <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                                                {j.title || j.job_title}
                                            </h4>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#64748b' }}>
                                                {j.company_name || j.companyName || 'Verified Enterprise'}
                                            </p>
                                            <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <FiMapPin size={13} color="#0ea5e9" /> {j.geo_address || j.job_location || j.location}
                                            </div>
                                        </div>
                                        <a
                                            href={`/jobs/${j.job_id || j.id}`}
                                            style={{
                                                marginTop: '12px',
                                                display: 'block',
                                                textAlign: 'center',
                                                background: '#2563eb',
                                                color: 'white',
                                                padding: '7px 12px',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                fontSize: '0.82rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            View Position Details
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
