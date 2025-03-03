import nodemailer from 'nodemailer'

// Configure email transport based on environment
const createTransport = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, use Ethereal (fake SMTP service)
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'ethereal_password'
      }
    };
  } else {
    // For production, use real SMTP server
    return {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    };
  }
};

// Create a reusable transporter object
let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;
  
  if (process.env.NODE_ENV === 'development' && !process.env.ETHEREAL_EMAIL) {
    // Create a test account on Ethereal for development
    const testAccount = await nodemailer.createTestAccount();
    process.env.ETHEREAL_EMAIL = testAccount.user;
    process.env.ETHEREAL_PASSWORD = testAccount.pass;
    
    console.log('Created Ethereal test account:', {
      email: testAccount.user,
      password: testAccount.pass
    });
  }
  
  const config = createTransport();
  transporter = nodemailer.createTransport(config);
  return transporter;
};

interface SendEmailParams {
  to: string
  subject: string
  html: string
  from?: string
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
  try {
    const transport = await getTransporter();
    
    const mailOptions = {
      from: from || process.env.EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      html,
    }

    const info = await transport.sendMail(mailOptions)
    
    // For development with Ethereal, log the preview URL
    if (process.env.NODE_ENV === 'development') {
      console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
      console.log('Email sent to:', to);
      console.log('Email subject:', subject);
    } else {
      console.log('Email sent:', info.messageId);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a5568; text-align: center;">Verify your email address</h2>
      <p style="color: #718096; line-height: 1.5;">
        Thank you for signing up! Please click the button below to verify your email address.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p style="color: #718096; line-height: 1.5;">
        If you didn't create an account, you can safely ignore this email.
      </p>
      <p style="color: #718096; line-height: 1.5;">
        If the button doesn't work, copy and paste this link into your browser:
        <br>
        <a href="${verificationUrl}" style="color: #3182ce; word-break: break-all;">${verificationUrl}</a>
      </p>
    </div>
  `

  return sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
  })
}