// Native fetch is available in Node.js v18+

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: '123123' })
    });
    const status = res.status;
    const body = await res.json();
    console.log('API Response status:', status);
    console.log('API Response body:', body);
  } catch (err) {
    console.error('Error contacting login API:', err.message);
  }
}

test();
