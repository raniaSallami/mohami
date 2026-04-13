/**
 * Email Service - Handles email sending via EmailJS
 */
import emailjs from '@emailjs/browser';

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';

class EmailService {
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    if (!EMAILJS_PUBLIC_KEY) {
      console.warn('⚠️ EmailJS public key missing. Emails will not be sent.');
      return;
    }
    
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      this.initialized = true;
      console.log('✅ EmailJS initialized');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
    }
  }

  async sendNotificationEmail(options: {
    to_email: string;
    to_name: string;
    subject: string;
    message: string;
  }): Promise<void> {
    if (!this.initialized) this.initialize();
    if (!this.initialized) return;

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: options.to_email,
        to_name: options.to_name,
        subject: options.subject,
        message: options.message,
        reply_to: 'noreply@mouhami-ai.tn',
      });
      console.log('✅ Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: 'Mouhami User',
      subject: 'Password Reset Request',
      message: `Click the link below to reset your password:\n${resetLink}`,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: name,
      subject: 'Welcome to Mouhami AI',
      message: 'Welcome to Mouhami, your AI legal assistant. You can now start managing your cases.',
    });
  }

  async sendInvitationEmail(email: string, invitationLink: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: 'Colleague',
      subject: 'You have been invited to Mouhami',
      message: `You have been invited to join Mouhami. Click the link to accept:\n${invitationLink}`,
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: 'Mouhami User',
      subject: 'Email Verification Code',
      message: `Your verification code is: ${code}`,
    });
  }

  async sendCaseCreatedEmail(email: string, name: string, caseTitle: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: name,
      subject: 'تم إنشاء قضية جديدة',
      message: `تم إنشاء قضية جديدة بنجاح: ${caseTitle}`,
    });
  }

  async sendAttendanceCreatedEmail(email: string, name: string, eventTitle: string, date: string): Promise<void> {
    await this.sendNotificationEmail({
      to_email: email,
      to_name: name,
      subject: 'موعد جديد في التقويم',
      message: `تمت إضافة موعد جديد بنجاح: ${eventTitle} يوم ${date}`,
    });
  }
}

export const emailService = new EmailService();
emailService.initialize();
