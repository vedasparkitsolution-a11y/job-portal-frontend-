import { motion } from 'framer-motion';
import { FiBookOpen, FiCalendar, FiArrowRight } from 'react-icons/fi';

const blogPosts = [
    {
        emoji: '📝',
        category: 'Career Tips',
        title: '10 Resume Tips That Will Help You Get Hired',
        excerpt: 'Your resume is your first impression. Learn how to make it count with these expert tips that hiring managers actually care about.',
        date: 'Feb 28, 2026',
        readTime: '5 min read'
    },
    {
        emoji: '💼',
        category: 'Interview Prep',
        title: 'How to Ace Your Technical Interview',
        excerpt: 'From data structures to system design, here\'s a comprehensive guide to preparing for your next technical interview.',
        date: 'Feb 25, 2026',
        readTime: '8 min read'
    },
    {
        emoji: '🚀',
        category: 'Industry Trends',
        title: 'Top 10 In-Demand Tech Skills for 2026',
        excerpt: 'Stay ahead of the curve with the most sought-after skills in the tech industry this year, from AI to cloud computing.',
        date: 'Feb 22, 2026',
        readTime: '6 min read'
    },
    {
        emoji: '🎯',
        category: 'Job Search',
        title: 'How to Network Effectively in the Digital Age',
        excerpt: 'Building professional connections has never been more important. Learn strategies for online networking that actually work.',
        date: 'Feb 20, 2026',
        readTime: '4 min read'
    },
    {
        emoji: '📊',
        category: 'Salary Guide',
        title: 'Software Developer Salary Guide: India 2026',
        excerpt: 'A comprehensive breakdown of salaries across different roles, experience levels, and cities in India\'s tech industry.',
        date: 'Feb 18, 2026',
        readTime: '7 min read'
    },
    {
        emoji: '🌟',
        category: 'Career Growth',
        title: 'From Junior to Senior Developer: A Roadmap',
        excerpt: 'The journey from junior to senior developer is about more than just years of experience. Here\'s what you really need to focus on.',
        date: 'Feb 15, 2026',
        readTime: '10 min read'
    }
];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
    })
};

export default function Blog() {
    return (
        <div className="blog-page">
            <div className="container">
                <motion.div
                    className="page-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1><FiBookOpen style={{ verticalAlign: 'middle', marginRight: '10px' }} />Career Blog</h1>
                    <p>Tips, guides, and insights to boost your career</p>
                </motion.div>

                <div className="blog-grid">
                    {blogPosts.map((post, i) => (
                        <motion.div
                            key={i}
                            className="blog-card"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.2 }}
                            custom={i}
                            variants={fadeUp}
                        >
                            <div className="blog-card-image">
                                <span>{post.emoji}</span>
                            </div>
                            <div className="blog-card-body">
                                <span className="blog-card-category">{post.category}</span>
                                <h3>{post.title}</h3>
                                <p>{post.excerpt}</p>
                                <div className="blog-card-footer">
                                    <span><FiCalendar /> {post.date}</span>
                                    <span>{post.readTime}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
