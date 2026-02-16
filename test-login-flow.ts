import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testLoginFlow() {
    try {
        // 1. Register a new user (random email to avoid conflict)
        const email = `test-${Date.now()}@example.com`;
        const password = 'password123';

        console.log('1. Registering user:', email);
        await axios.post(`${API_URL}/auth/register`, { email, password });

        // 2. Login
        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });

        console.log('Login Status:', loginRes.status);
        console.log('Login Response Data:', JSON.stringify(loginRes.data, null, 2));

        const { token, user } = loginRes.data.data;

        if (!token) {
            console.error('❌ Token is missing in response!');
            return;
        }

        console.log('Token received:', token.substring(0, 20) + '...');

        // 3. Access Protected Route (Dashboard/Wallets) using the token
        console.log('3. Accessing protected route (/api/wallets)...');
        try {
            const walletRes = await axios.get(`${API_URL}/api/wallets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Wallets Access Successful! Status:', walletRes.status);
            console.log('Wallets Data:', JSON.stringify(walletRes.data, null, 2));
        } catch (err: any) {
            console.error('❌ Wallets Access Failed!');
            console.error('Status:', err.response?.status);
            console.error('Message:', err.response?.data);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testLoginFlow();
