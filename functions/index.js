const functions = require('firebase-functions');
const admin = require('firebase-admin');
const SibApiV3Sdk = require('sib-api-v3-sdk');

admin.initializeApp();

// Initialize Brevo API
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = functions.config().brevo.apikey;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Firestore trigger: Send welcome email when new user is created
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    const { email, name, role } = user;

    try {
      const sendSmtpEmail = {
        to: [{ email, name }],
        sender: {
          email: functions.config().brevo.sender_email,
          name: 'Nigeria Farmers Market',
        },
        subject: 'Welcome to Nigeria Farmers Market!',
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Nigeria Farmers Market!</h2>
              <p>Hello ${name},</p>
              <p>Thank you for joining our platform as a <strong>${role}</strong>.</p>
              ${role === 'farmer' 
                ? '<p>You can now start listing your produce and connecting with local buyers.</p>'
                : '<p>You can now browse fresh produce from local farmers in your area.</p>'
              }
              <p>Our platform is designed to work on low-bandwidth connections, ensuring you can access the marketplace from anywhere.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${functions.config().app.url}" 
                   style="background-color: #28a745; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                  Visit Marketplace
                </a>
              </div>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>Nigeria Farmers Market Team</p>
            </body>
          </html>
        `,
      };

      await emailApi.sendTransacEmail(sendSmtpEmail);
      console.log('Welcome email sent to:', email);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  });

// Firestore trigger: Send notification when order status changes
exports.onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only proceed if status changed
    if (before.status === after.status) {
      return null;
    }

    const orderId = context.params.orderId;
    const statusMessages = {
      accepted: 'has been accepted',
      declined: 'has been declined',
      shipped: 'has been shipped',
      completed: 'has been completed',
      cancelled: 'has been cancelled',
    };

    try {
      // Notify buyer
      const buyerEmail = {
        to: [{ email: after.buyerEmail, name: after.buyerName }],
        sender: {
          email: functions.config().brevo.sender_email,
          name: 'Nigeria Farmers Market',
        },
        subject: `Order Update: ${after.produceName}`,
        htmlContent: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Status Update</h2>
              <p>Hello ${after.buyerName},</p>
              <p>Your order ${statusMessages[after.status]}.</p>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Product:</strong> ${after.produceName}</p>
                <p><strong>Quantity:</strong> ${after.quantity} ${after.unit}</p>
                <p><strong>Total Price:</strong> ₦${after.totalPrice.toLocaleString()}</p>
                <p><strong>Status:</strong> ${after.status.toUpperCase()}</p>
              </div>
              ${after.status === 'accepted' 
                ? `<p>The farmer will prepare your order. You can contact them via the messaging system.</p>`
                : ''
              }
              ${after.status === 'shipped' 
                ? `<p>Your order is on the way! Please coordinate with the farmer for delivery details.</p>`
                : ''
              }
              <p>Best regards,<br>Nigeria Farmers Market Team</p>
            </body>
          </html>
        `,
      };

      await emailApi.sendTransacEmail(buyerEmail);
      console.log('Order status notification sent to buyer:', after.buyerEmail);
    } catch (error) {
      console.error('Error sending order status notification:', error);
    }

    return null;
  });

// Scheduled function: Send daily digest to farmers with pending orders
exports.dailyFarmerDigest = functions.pubsub
  .schedule('every day 08:00')
  .timeZone('Africa/Lagos')
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      // Get all pending orders
      const ordersSnapshot = await db
        .collection('orders')
        .where('status', '==', 'pending')
        .get();

      // Group orders by farmer
      const farmerOrders = {};
      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        if (!farmerOrders[order.farmerId]) {
          farmerOrders[order.farmerId] = [];
        }
        farmerOrders[order.farmerId].push({
          id: doc.id,
          ...order,
        });
      });

      // Send digest to each farmer with pending orders
      for (const [farmerId, orders] of Object.entries(farmerOrders)) {
        const farmerDoc = await db.collection('users').doc(farmerId).get();
        if (!farmerDoc.exists) continue;

        const farmer = farmerDoc.data();

        const ordersHtml = orders.map(order => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${order.produceName}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${order.buyerName}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${order.quantity} ${order.unit}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">₦${order.totalPrice.toLocaleString()}</td>
          </tr>
        `).join('');

        try {
          await emailApi.sendTransacEmail({
            to: [{ email: farmer.email, name: farmer.name }],
            sender: {
              email: functions.config().brevo.sender_email,
              name: 'Nigeria Farmers Market',
            },
            subject: `Daily Digest: You have ${orders.length} pending order(s)`,
            htmlContent: `
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Daily Order Digest</h2>
                  <p>Hello ${farmer.name},</p>
                  <p>You have <strong>${orders.length}</strong> pending order(s) waiting for your action:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <thead>
                      <tr style="background-color: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Buyer</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Quantity</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ordersHtml}
                    </tbody>
                  </table>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${functions.config().app.url}/dashboard" 
                       style="background-color: #28a745; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                      View Dashboard
                    </a>
                  </div>
                  <p>Best regards,<br>Nigeria Farmers Market Team</p>
                </body>
              </html>
            `,
          });

          console.log('Daily digest sent to farmer:', farmer.email);
        } catch (error) {
          console.error('Error sending digest to farmer:', farmer.email, error);
        }
      }
    } catch (error) {
      console.error('Error in daily digest function:', error);
    }

    return null;
  });

// HTTP function: Handle SMS/USSD webhook (for future integration with Africa's Talking)
exports.ussdWebhook = functions.https.onRequest(async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  let response = '';

  if (text === '') {
    // First interaction
    response = 'CON Welcome to Farmers Market\n';
    response += '1. View Available Produce\n';
    response += '2. Check My Orders\n';
    response += '3. Contact Support';
  } else if (text === '1') {
    // View produce - fetch latest listings
    const db = admin.firestore();
    const snapshot = await db
      .collection('listings')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    response = 'CON Latest Produce:\n';
    let index = 1;
    snapshot.forEach(doc => {
      const listing = doc.data();
      response += `${index}. ${listing.title} - ₦${listing.price}/${listing.unit}\n`;
      index++;
    });
    response += '0. Back';
  } else if (text === '2') {
    // Check orders - would need user authentication
    response = 'CON To check your orders, please visit our website or call us at:\n';
    response += '080-FARMERS-MKT\n';
    response += '0. Back';
  } else if (text === '3') {
    // Contact support
    response = 'END Support Contact:\n';
    response += 'Phone: 080-FARMERS-MKT\n';
    response += 'Email: support@farmersmarket.ng\n';
    response += 'Thank you!';
  } else if (text.endsWith('*0')) {
    // Back to main menu
    response = 'CON Welcome to Farmers Market\n';
    response += '1. View Available Produce\n';
    response += '2. Check My Orders\n';
    response += '3. Contact Support';
  } else {
    response = 'END Invalid option. Please try again.';
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// HTTP function: Handle SMS commands
exports.smsWebhook = functions.https.onRequest(async (req, res) => {
  const { from, text } = req.body;
  const command = text.trim().toUpperCase();

  let responseMessage = '';

  try {
    const db = admin.firestore();

    if (command === 'HELP') {
      responseMessage = 'Farmers Market Commands:\n';
      responseMessage += 'LIST - View available produce\n';
      responseMessage += 'ORDERS - Check your orders\n';
      responseMessage += 'HELP - Show this message';
    } else if (command === 'LIST') {
      const snapshot = await db
        .collection('listings')
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(3)
        .get();

      responseMessage = 'Latest Produce:\n';
      snapshot.forEach(doc => {
        const listing = doc.data();
        responseMessage += `${listing.title} - ₦${listing.price}/${listing.unit}\n`;
      });
      responseMessage += 'Visit farmersmarket.ng for more';
    } else if (command === 'ORDERS') {
      responseMessage = 'To check your orders, visit farmersmarket.ng or call 080-FARMERS-MKT';
    } else {
      responseMessage = 'Unknown command. Reply HELP for available commands.';
    }
  } catch (error) {
    console.error('SMS webhook error:', error);
    responseMessage = 'An error occurred. Please try again later.';
  }

  res.json({ message: responseMessage });
});
// Firestore trigger: Notify subscribers when new listing is created
exports.onListingCreated = functions.firestore
  .document('listings/{listingId}')
  .onCreate(async (snap, context) => {
    const listing = snap.data()
    const db = admin.firestore()
    try {
      const subsSnap = await db
        .collection('subscriptions')
        .where('type', '==', listing.type)
        .where('state', '==', listing.location?.state || '')
        .get()

      const tokens = []
      const emails = []
      for (const doc of subsSnap.docs) {
        const sub = doc.data()
        const userDoc = await db.collection('users').doc(sub.buyerId).get()
        if (userDoc.exists) {
          const user = userDoc.data()
          if (user.fcmToken) tokens.push(user.fcmToken)
          if (user.email) emails.push({ email: user.email, name: user.name })
        }
      }

      if (tokens.length) {
        await admin.messaging().sendMulticast({
          tokens,
          notification: {
            title: 'New Listing Alert',
            body: `${listing.title} in ${listing.location?.state}`
          },
          data: { listingId: context.params.listingId }
        })
      }

      if (emails.length) {
        try {
          const emailApi = new SibApiV3Sdk.TransactionalEmailsApi()
          await emailApi.sendTransacEmail({
            to: emails,
            sender: {
              email: functions.config().brevo.sender_email,
              name: 'Nigeria Farmers Market',
            },
            subject: `New Listing: ${listing.title}`,
            htmlContent: `
              <html>
                <body>
                  <h2>New Listing Alert</h2>
                  <p>${listing.title} is now available in ${listing.location?.state}.</p>
                  <p>Price: ₦${listing.price}/${listing.unit}</p>
                </body>
              </html>
            `,
          })
        } catch (e) {}
      }
    } catch (error) {
      console.error('onListingCreated error', error)
    }
    return null
  })
