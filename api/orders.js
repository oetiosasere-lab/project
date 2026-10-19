// Vercel Serverless Function: /api/orders
const inMemoryOrders = [];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // GET: Order lookup or list
  if (req.method === 'GET') {
    const { id } = req.query || {};
    if (id) {
      const found = inMemoryOrders.find(o => o.orderId.toLowerCase() === id.toLowerCase());
      if (found) {
        res.status(200).json({ success: true, order: found });
      } else {
        res.status(404).json({ success: false, message: 'Order not found' });
      }
      return;
    }
    res.status(200).json({ success: true, count: inMemoryOrders.length, orders: inMemoryOrders });
    return;
  }

  // POST: Create Order
  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { fullName, phone, email, deliveryAddress, quantity, productId, color, personalization, notes } = body;

      if (!fullName || !phone || !email || !deliveryAddress) {
        res.status(400).json({
          success: false,
          message: 'Please fill in all required fields (Full Name, Phone Number, Email, and Delivery Address).'
        });
        return;
      }

      const qty = parseInt(quantity, 10) || 1;
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const orderId = `KYB-${randomNum}`;
      const trackingNumber = `TRACK-KNB-${Date.now().toString().slice(-6)}`;

      const orderDate = new Date();
      const deliveryDate = new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000);

      const newOrder = {
        orderId,
        trackingNumber,
        createdAt: orderDate.toISOString(),
        estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        status: 'Confirmed & In Artisan Queue',
        currentStep: 1,
        steps: [
          { step: 1, title: 'Order Received', desc: 'Order logged & placed into artisan crafting queue', completed: true, time: 'Just now' },
          { step: 2, title: 'Handcrafting with Love', desc: 'Artisan hand-knitting your yarn with custom details', completed: false, time: 'Next 24-48 hrs' },
          { step: 3, title: 'Quality Check & Eco-Packing', desc: 'Inspected for flawless stitches and wrapped with signature ribbon', completed: false, time: 'Estimated Day 3' },
          { step: 4, title: 'Dispatched for Safe Delivery', desc: 'Handed to courier for express doorstep delivery', completed: false, time: 'Estimated Day 4-5' }
        ],
        customer: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          deliveryAddress: deliveryAddress.trim()
        },
        item: {
          id: productId || 'cloud-clutch',
          name: productId ? productId.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'The Cloud Knitted Clutch',
          image: '/images/cloud-clutch.jpeg',
          quantity: qty,
          color: color || 'Milky White',
          personalization: personalization ? personalization.trim() : 'Standard handcrafted edition',
          notes: notes ? notes.trim() : 'None provided'
        },
        confirmationMessage: 'Thank you for patronising us! We have got your order and will deliver them to you as soon as possible.',
        contactInfo: {
          phone: '3319565982',
          email: 'fabianojessica6@gmail.com',
          serviceHours: 'Open 24/7, 6 days a week, 365 days a year',
          instagram: '@knotyourbag'
        }
      };

      inMemoryOrders.unshift(newOrder);

      res.status(201).json({
        success: true,
        message: 'Thank you for patronising us! We have got your order and will deliver them to you as soon as possible.',
        order: newOrder
      });
    } catch (err) {
      res.status(400).json({ success: false, message: 'Invalid order data format' });
    }
    return;
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
