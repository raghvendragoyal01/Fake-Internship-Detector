import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_job_alert_email(to_email: str, job_matches: list):
    """
    Sends an automated email notification with matched safe jobs.
    Uses SMTP configuration from environment variables.
    """
    # Fetch credentials from environment
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    subject = "🎉 ScamShield: New Safe Job Matches Found!"
    
    # Build HTML email body
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #2164f3;">ScamShield Alert</h2>
        <p>Hello!</p>
        <p>We actively scanned the job market based on your verified profile skills and found {len(job_matches)} highly secure, scam-free opportunities.</p>
        <hr />
    """
    
    for job in job_matches:
        html_content += f"""
        <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="margin: 0 0 5px 0;">{job.get('title')}</h3>
            <p style="margin: 0;"><strong>Company:</strong> {job.get('company')}</p>
            <p style="margin: 0;"><strong>Location:</strong> {job.get('location')}</p>
            <p style="margin: 0;"><strong>Salary:</strong> {job.get('salary', 'Not specified')}</p>
            <p style="margin-top: 10px;">
                <a href="{job.get('url')}" style="background-color: #2164f3; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px;">Apply Now</a>
            </p>
        </div>
        """
        
    html_content += """
        <hr />
        <p style="font-size: 12px; color: #888;">This is an automated message from ScamShield telemetry systems.</p>
      </body>
    </html>
    """
    
    # If no credentials, we mock send (print to terminal)
    if not smtp_user or not smtp_pass:
        print("\n" + "="*50)
        print(f"MOCK EMAIL ALERT TO: {to_email}")
        print("SUBJECT:", subject)
        print(f"BODY:\nFound {len(job_matches)} jobs. Please check your `.env` for real SMTP credentials to actually send.")
        for job in job_matches:
            print(f"- {job['title']} at {job['company']}")
        print("="*50 + "\n")
        return True, html_content

    # Real SMTP execution
    try:
        msg = MIMEMultipart()
        msg['From'] = f"ScamShield Alerts <{smtp_user}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html'))
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
            
        print(f"Successfully sent job alert to {to_email}")
        return True, html_content
    except Exception as e:
        print(f"Failed to send email alert: {e}")
        return False, None
