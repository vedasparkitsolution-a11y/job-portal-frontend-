import { Link } from 'react-router-dom';
import { FiBriefcase, FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Column 1: Brand & Social */}
                    <div className="footer-col brand-col">
                        <Link to="/" className="footer-logo">
                            <FiBriefcase className="logo-icon" />
                            <span>Job<span className="logo-highlight">Connect</span></span>
                        </Link>

                        <div className="connect-with-us">
                            <p className="social-title">Connect with us</p>
                            <div className="social-icons">
                                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                                    <FiFacebook />
                                </a>
                                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                                    <FiInstagram />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                                    <FiTwitter />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                                    <FiLinkedin />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Company Info */}
                    <div className="footer-col">
                        <ul className="footer-link-list">
                            <li><Link to="/about">About us</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/login?role=company">Employer home</Link></li>
                            <li><Link to="/login?role=admin">Admin Portal</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal & Policy */}
                    <div className="footer-col">
                        <ul className="footer-link-list">
                            <li><Link to="/privacy">Privacy policy</Link></li>
                            <li><Link to="/terms">Terms & conditions</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom-bar">
                    <p>© {new Date().getFullYear()} JobConnect Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
