"""
Notification service for sending emails and SMS
"""
import smtplib
import json
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, List
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioException

from ..core.config import settings
from ..models.user import User

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications via email and SMS"""
    
    def __init__(self):
        self.twilio_client = None
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                self.twilio_client = TwilioClient(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
            except Exception as e:
                logger.warning(f"Failed to initialize Twilio client: {e}")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """
        Send email notification
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body_html: HTML email body
            body_text: Plain text email body (optional)
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        # For now, we'll use a simple SMTP approach
        # In production, use a service like SendGrid, AWS SES, etc.
        
        # Check if email settings are configured
        smtp_host = getattr(settings, 'SMTP_HOST', None)
        smtp_port = getattr(settings, 'SMTP_PORT', 587)
        smtp_user = getattr(settings, 'SMTP_USER', None)
        smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
        smtp_from = getattr(settings, 'SMTP_FROM', 'noreply@mundamarket.co.zw')
        
        if not smtp_host or not smtp_user or not smtp_password:
            logger.warning("SMTP settings not configured. Email not sent.")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = smtp_from
            msg['To'] = to_email
            
            if body_text:
                part1 = MIMEText(body_text, 'plain')
                msg.attach(part1)
            
            part2 = MIMEText(body_html, 'html')
            msg.attach(part2)
            
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_sms(
        self,
        to_phone: str,
        message: str
    ) -> bool:
        """
        Send SMS notification via Twilio
        
        Args:
            to_phone: Recipient phone number (E.164 format)
            message: SMS message text
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        if not self.twilio_client or not settings.TWILIO_PHONE_NUMBER:
            logger.warning("Twilio not configured. SMS not sent.")
            return False
        
        try:
            message_obj = self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=to_phone
            )
            logger.info(f"SMS sent successfully to {to_phone}. SID: {message_obj.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to send SMS to {to_phone}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {to_phone}: {e}")
            return False
    
    def send_inventory_alert(
        self,
        user: User,
        alert_title: str,
        alert_message: str,
        alert_data: Optional[Dict] = None,
        notification_channels: Optional[Dict] = None
    ) -> Dict[str, bool]:
        """
        Send inventory alert notification via configured channels
        
        Args:
            user: User to notify
            alert_title: Alert title
            alert_message: Alert message
            alert_data: Additional alert data
            notification_channels: Channel preferences (from BuyerInventoryPreference)
        
        Returns:
            dict: Results for each channel {"email": True/False, "sms": True/False}
        """
        results = {"email": False, "sms": False}
        
        # Default to in_app only if no preferences set
        if notification_channels is None:
            notification_channels = {"in_app": True}
        
        # Prepare message content
        email_subject = f"Munda Market Alert: {alert_title}"
        email_body_html = f"""
        <html>
          <body>
            <h2>{alert_title}</h2>
            <p>{alert_message}</p>
            {f"<p><strong>Current Stock:</strong> {alert_data.get('current_stock_kg', 'N/A')}kg</p>" if alert_data and 'current_stock_kg' in alert_data else ""}
            {f"<p><strong>Threshold:</strong> {alert_data.get('threshold_kg', 'N/A')}kg</p>" if alert_data and 'threshold_kg' in alert_data else ""}
            <p><a href="https://buy.mundamarket.co.zw/inventory">View Inventory Dashboard</a></p>
          </body>
        </html>
        """
        
        sms_message = f"{alert_title}: {alert_message}"
        if alert_data and 'current_stock_kg' in alert_data:
            sms_message += f" Stock: {alert_data['current_stock_kg']}kg"
        
        # Send email if enabled
        if notification_channels.get("email", False) and user.email:
            results["email"] = self.send_email(
                to_email=user.email,
                subject=email_subject,
                body_html=email_body_html,
                body_text=alert_message
            )
        
        # Send SMS if enabled
        if notification_channels.get("sms", False) and user.phone:
            results["sms"] = self.send_sms(
                to_phone=user.phone,
                message=sms_message
            )
        
        return results


# Global notification service instance
notification_service = NotificationService()

