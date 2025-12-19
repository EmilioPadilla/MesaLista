import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Sample Postmark webhook events
const sampleEvents = {
  delivery: {
    RecordType: 'Delivery',
    MessageID: 'test-message-1',
    Recipient: 'guest@example.com',
    Subject: 'Confirmación de pago - Regalo para Sol y Emilio',
    Tag: 'payment_confirmation',
    DeliveredAt: new Date().toISOString(),
    Metadata: { cartId: '123' },
  },
  open: {
    RecordType: 'Open',
    MessageID: 'test-message-1',
    Recipient: 'guest@example.com',
    Subject: 'Confirmación de pago - Regalo para Sol y Emilio',
    Tag: 'payment_confirmation',
    FirstOpen: true,
    ReceivedAt: new Date().toISOString(),
  },
  click: {
    RecordType: 'Click',
    MessageID: 'test-message-1',
    Recipient: 'guest@example.com',
    Subject: 'Confirmación de pago - Regalo para Sol y Emilio',
    Tag: 'payment_confirmation',
    ClickedAt: new Date().toISOString(),
  },
  bounce: {
    RecordType: 'Bounce',
    MessageID: 'test-message-2',
    Recipient: 'invalid@example.com',
    Subject: 'Confirmación de pago',
    Tag: 'payment_confirmation',
    BouncedAt: new Date().toISOString(),
    Metadata: { bounceType: 'HardBounce' },
  },
};

async function testWebhook() {
  console.log('🧪 Testing Email Analytics Webhook...\n');

  try {
    // Test delivery event
    console.log('1. Testing DELIVERY event...');
    await axios.post(`${API_BASE_URL}/webhooks/postmark`, sampleEvents.delivery);
    console.log('✅ Delivery event processed\n');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test open event
    console.log('2. Testing OPEN event...');
    await axios.post(`${API_BASE_URL}/webhooks/postmark`, sampleEvents.open);
    console.log('✅ Open event processed\n');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test click event
    console.log('3. Testing CLICK event...');
    await axios.post(`${API_BASE_URL}/webhooks/postmark`, sampleEvents.click);
    console.log('✅ Click event processed\n');

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test bounce event
    console.log('4. Testing BOUNCE event...');
    await axios.post(`${API_BASE_URL}/webhooks/postmark`, sampleEvents.bounce);
    console.log('✅ Bounce event processed\n');

    console.log('✅ All webhook events processed successfully!');
    console.log('\n📊 Now check your Analytics dashboard at: http://localhost:5173/admin/analytics');
    console.log('   Go to the "Analíticas de Email" tab to see the results\n');
  } catch (error: any) {
    console.error('❌ Error testing webhook:', error.response?.data || error.message);
  }
}

testWebhook();
