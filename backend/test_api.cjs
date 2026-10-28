const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: 6, email: 'divya@gmail.com', role: 'employer', companyName: 'Mahendira' },
    'your_super_secret_jwt_key_here'
);

Promise.all([
    fetch('http://localhost:5000/api/subscriptions/status', {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json()),
    fetch('http://localhost:5000/api/subscriptions/employer-quota', {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(r => r.json())
]).then(([status, quota]) => {
    console.log('STATUS:', JSON.stringify(status, null, 2));
    console.log('QUOTA:', JSON.stringify(quota, null, 2));
    process.exit(0);
});
