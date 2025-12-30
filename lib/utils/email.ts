// lib/utils/email.ts
interface OrderDetails {
  orderId: string;
  userName: string;
  items: Array<{
    name: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    province: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
  paymentDetails?: any;
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: OrderDetails
): Promise<{ success: boolean; message?: string; error?: any }> {
  console.log('Attempting to send order confirmation email to:', email);
  console.log('Order ID:', orderDetails.orderId);
  
  try {
    // Get the base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : '');
    
    console.log('Base URL:', baseUrl);
    
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: `Order Confirmation #${orderDetails.orderId}`,
        orderDetails,
      }),
    });

    console.log('Email API response status:', response.status);
    
    const result = await response.json();
    console.log('Email API response:', result);

    if (!response.ok) {
      console.error('Email API error:', result.error);
      return {
        success: false,
        message: result.error || `Failed to send email: ${response.statusText}`,
        error: result
      };
    }

    console.log('Email sent successfully');
    return {
      success: true,
      message: 'Confirmation email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: 'Network error while sending email',
      error: error
    };
  }
}