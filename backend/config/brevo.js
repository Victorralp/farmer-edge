const SibApiV3Sdk = require('@sib-api-v3-sdk');

// Initialize Brevo (Sendinblue) API client for email and SMS notifications
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
const smsApi = new SibApiV3Sdk.TransactionalSMSApi();

// Send verification email on signup
const sendVerificationEmail = async (email, name, verificationLink) => {
  try {
    const sendSmtpEmail = {
      to: [{ email, name }],
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      subject: 'Welcome to Nigeria Farmers Market - Verify Your Email',
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Nigeria Farmers Market!</h2>
            <p>Hello ${name},</p>
            <p>Thank you for joining our platform connecting farmers with local buyers.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #28a745; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>Or copy this link: ${verificationLink}</p>
            <p>Best regards,<br>Nigeria Farmers Market Team</p>
          </body>
        </html>
      `,
    };

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✓ Verification email sent:', result);
    return result;
  } catch (error) {
    console.error('✗ Error sending verification email:', error);
    throw error;
  }
};

// Notify buyer when order status changes
const sendOrderStatusEmail = async (email, name, orderDetails) => {
  const { orderId, status, produceName, farmerName } = orderDetails;
  
  const statusMessages = {
    accepted: `Your order has been accepted by ${farmerName}!`,
    shipped: `Your order is on the way!`,
    completed: `Your order has been completed.`,
    cancelled: `Your order has been cancelled.`,
  };

  try {
    const sendSmtpEmail = {
      to: [{ email, name }],
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      subject: `Order Update: ${statusMessages[status]}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Status Update</h2>
            <p>Hello ${name},</p>
            <p>${statusMessages[status]}</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Product:</strong> ${produceName}</p>
              <p><strong>Farmer:</strong> ${farmerName}</p>
              <p><strong>Status:</strong> ${status.toUpperCase()}</p>
            </div>
            <p>You can view your order details in your dashboard.</p>
            <p>Best regards,<br>Nigeria Farmers Market Team</p>
          </body>
        </html>
      `,
    };

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✓ Order status email sent:', result);
    return result;
  } catch (error) {
    console.error('✗ Error sending order status email:', error);
    throw error;
  }
};

// Alert farmer when buyer shows interest
const sendInterestNotificationEmail = async (email, name, interestDetails) => {
  const { produceName, buyerName, quantity, message } = interestDetails;

  try {
    const sendSmtpEmail = {
      to: [{ email, name }],
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME,
      },
      subject: `New Interest in Your Produce: ${produceName}`,
      htmlContent: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Order Request!</h2>
            <p>Hello ${name},</p>
            <p>A buyer is interested in your produce:</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Product:</strong> ${produceName}</p>
              <p><strong>Buyer:</strong> ${buyerName}</p>
              <p><strong>Quantity:</strong> ${quantity}</p>
              ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            </div>
            <p>Please log in to your dashboard to accept or decline this order.</p>
            <p>Best regards,<br>Nigeria Farmers Market Team</p>
          </body>
        </html>
      `,
    };

    const result = await emailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✓ Interest notification email sent:', result);
    return result;
  } catch (error) {
    console.error('✗ Error sending interest notification email:', error);
    throw error;
  }
};

// Send SMS notification (for low-bandwidth users)
const sendSMS = async (phoneNumber, message) => {
  try {
    const sendSms = {
      sender: 'FarmMarket',
      recipient: phoneNumber,
      content: message,
      type: 'transactional',
    };

    const result = await smsApi.sendTransacSms(sendSms);
    console.log('✓ SMS sent:', result);
    return result;
  } catch (error) {
    console.error('✗ Error sending SMS:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOrderStatusEmail,
  sendInterestNotificationEmail,
  sendSMS,
};
