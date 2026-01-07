console.log('LOCAL ENV CHECK', {
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
});
import dotenv from 'dotenv';

// Load environment variables from .env file


export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  console.log('Email API called');
  
  try {
    const { to, subject, orderDetails } = await request.json();
    console.log('Request data:', { to, subject, orderId: orderDetails?.orderId });

    // Validate required fields
    if (!to || !subject || !orderDetails) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check required environment variables
    // app/api/send-email/route.ts - TEMPORARY FIX
// Replace the variable loading section with:

const emailUser = process.env.EMAIL_USER ;
const emailPass = process.env.EMAIL_PASSWORD;

console.log('Using email user:', emailUser);
console.log('Using email pass:', emailPass ? 'SET' : 'NOT SET');

    if (!emailUser || !emailPass) {
      console.error('Email credentials are not configured');
      return NextResponse.json(
        { error: 'Email credentials are not configured' },
        { status: 500 }
      );
    }

    // Skip sending emails in development if disabled
    if (process.env.NODE_ENV === 'development' && process.env.SEND_EMAILS === 'false') {
      console.log('Email sending disabled in development. Would send to:', to);
      return NextResponse.json({
        message: 'Email sending disabled in development',
        preview: { to, subject, orderDetails }
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true, // Add this for Gmail
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        ciphers: 'SSLv3' // Add this for older Node versions
      }
    });

    // Verify transporter
    try {
      await transporter.verify();
      console.log("SMTP server is ready to send emails");
    } catch (verifyError: unknown) {
      console.error("SMTP verification failed:", verifyError);
      const message = verifyError instanceof Error ? verifyError.message : String(verifyError);
      return NextResponse.json(
        { error: 'SMTP server verification failed', details: message },
        { status: 500 }
      );
    }

    // Prepare email content - fix the HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f43f5e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .order-details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase!</p>
          </div>
          <div class="content">
            <h2>Order #${orderDetails.orderId}</h2>
            <p>Dear ${orderDetails.userName},</p>
            <p>Your order has been successfully placed.</p>
            
            <div class="order-details">
              <h3>Order Summary:</h3>
              <p><strong>Total Amount:</strong> PKR ${orderDetails.totalAmount?.toLocaleString('en-PK') || 'N/A'}</p>
              <p><strong>Shipping Address:</strong> ${orderDetails.shippingAddress?.street || ''}, ${orderDetails.shippingAddress?.city || ''}</p>
              <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod || 'Not specified'}</p>
            </div>
            
            <p>You will receive another email when your order ships.</p>
            <p>Thank you for shopping with us!</p>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>© ${new Date().getFullYear()} Fashion Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: `"Fashion Store" <${process.env.EMAIL_FROM || emailUser}>`,
      to: to,
      subject: subject,
      html: htmlContent,
      text: `Order Confirmation #${orderDetails.orderId} for ${orderDetails.userName}. Total: PKR ${orderDetails.totalAmount?.toLocaleString('en-PK') || 'N/A'}`,
    };

    console.log('Sending email with options:', { 
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject 
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    console.log('Response:', info.response);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error: unknown) {
    console.error('Error in email API:', error);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined
      },
      { status: 500 }
    );
  }
}