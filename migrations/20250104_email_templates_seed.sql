-- Email Templates Seed Data
-- Insert default email templates for transactional emails

INSERT INTO public."EmailTemplate" (name, subject, "htmlBody", "textBody", "variables", "isActive") VALUES
(
  'email_verification',
  'Verify your {{appName}} account',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Verify Your Email Address</h1>
  </div>
  
  <p>Hi {{name}},</p>
  
  <p>Thank you for signing up for {{appName}}! Please verify your email address by clicking the button below:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{verificationUrl}}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #3498db;">{{verificationUrl}}</p>
  
  <p>This link will expire in 7 days.</p>
  
  <p>If you didn''t create an account with {{appName}}, you can safely ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi {{name}},

Thank you for signing up for {{appName}}! Please verify your email address by visiting this link:

{{verificationUrl}}

This link will expire in 7 days.

If you didn''t create an account with {{appName}}, you can safely ignore this email.

This is an automated message from {{appName}}.',
  ARRAY['name', 'verificationUrl', 'appName'],
  true
),
(
  'password_reset',
  'Reset your {{appName}} password',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #e74c3c; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: white; margin-top: 0;">Reset Your Password</h1>
  </div>
  
  <p>Hi {{name}},</p>
  
  <p>You requested to reset your password for your {{appName}} account. Click the button below to set a new password:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resetUrl}}" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #e74c3c;">{{resetUrl}}</p>
  
  <p>This link will expire in 1 hour.</p>
  
  <p><strong>If you didn''t request a password reset, please ignore this email. Your password will remain unchanged.</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi {{name}},

You requested to reset your password for your {{appName}} account. Visit this link to set a new password:

{{resetUrl}}

This link will expire in 1 hour.

If you didn''t request a password reset, please ignore this email. Your password will remain unchanged.

This is an automated message from {{appName}}.',
  ARRAY['name', 'resetUrl', 'appName'],
  true
),
(
  'invitation',
  'You''ve been invited to join {{organizationName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #9b59b6; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: white; margin-top: 0;">You''ve Been Invited!</h1>
  </div>
  
  <p>Hi there,</p>
  
  <p><strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> on {{appName}} as a <strong>{{role}}</strong>.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{inviteUrl}}" style="background-color: #9b59b6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Accept Invitation</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #9b59b6;">{{inviteUrl}}</p>
  
  <p>This invitation will expire in 7 days.</p>
  
  <p>If you weren''t expecting this invitation, you can safely ignore this email.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi there,

{{inviterName}} has invited you to join {{organizationName}} on {{appName}} as a {{role}}.

Accept the invitation by visiting this link:

{{inviteUrl}}

This invitation will expire in 7 days.

If you weren''t expecting this invitation, you can safely ignore this email.

This is an automated message from {{appName}}.',
  ARRAY['inviterName', 'organizationName', 'role', 'inviteUrl', 'appName'],
  true
),
(
  'receipt',
  'Payment receipt from {{appName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #27ae60; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: white; margin-top: 0;">Thank You for Your Payment!</h1>
  </div>
  
  <p>Hi {{name}},</p>
  
  <p>This is a confirmation that we received your payment.</p>
  
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <h2 style="margin-top: 0;">Invoice Details</h2>
    <table style="width: 100%;">
      <tr>
        <td style="padding: 5px 0;"><strong>Invoice ID:</strong></td>
        <td style="padding: 5px 0;">{{invoiceId}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Amount:</strong></td>
        <td style="padding: 5px 0;">{{currency}} {{amount}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Plan:</strong></td>
        <td style="padding: 5px 0;">{{plan}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Paid At:</strong></td>
        <td style="padding: 5px 0;">{{paidAt}}</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invoiceUrl}}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Invoice</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi {{name}},

This is a confirmation that we received your payment.

Invoice Details:
- Invoice ID: {{invoiceId}}
- Amount: {{currency}} {{amount}}
- Plan: {{plan}}
- Paid At: {{paidAt}}

View your invoice: {{invoiceUrl}}

This is an automated message from {{appName}}.',
  ARRAY['name', 'invoiceId', 'amount', 'currency', 'plan', 'paidAt', 'invoiceUrl', 'appName'],
  true
),
(
  'dunning',
  'Payment failed - Action required',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #e74c3c; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: white; margin-top: 0;">Payment Failed</h1>
  </div>
  
  <p>Hi {{name}},</p>
  
  <p>We attempted to process your payment but it failed. Please update your payment method to avoid service interruption.</p>
  
  <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
    <h2 style="margin-top: 0;">Invoice Details</h2>
    <table style="width: 100%;">
      <tr>
        <td style="padding: 5px 0;"><strong>Invoice ID:</strong></td>
        <td style="padding: 5px 0;">{{invoiceId}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Amount:</strong></td>
        <td style="padding: 5px 0;">{{currency}} {{amount}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Due Date:</strong></td>
        <td style="padding: 5px 0;">{{dueDate}}</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{paymentUrl}}" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Update Payment Method</a>
  </div>
  
  <p>If you have any questions, please contact our support team.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi {{name}},

We attempted to process your payment but it failed. Please update your payment method to avoid service interruption.

Invoice Details:
- Invoice ID: {{invoiceId}}
- Amount: {{currency}} {{amount}}
- Due Date: {{dueDate}}

Update your payment method: {{paymentUrl}}

If you have any questions, please contact our support team.

This is an automated message from {{appName}}.',
  ARRAY['name', 'invoiceId', 'amount', 'currency', 'dueDate', 'paymentUrl', 'appName'],
  true
),
(
  'usage_alert',
  'Usage Alert: {{alertType}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Usage Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f39c12; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
    <h1 style="color: white; margin-top: 0;">Usage Alert</h1>
  </div>
  
  <p>Hi {{name}},</p>
  
  <p>{{message}}</p>
  
  <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin: 20px 0;">
    <table style="width: 100%;">
      <tr>
        <td style="padding: 5px 0;"><strong>Type:</strong></td>
        <td style="padding: 5px 0;">{{alertType}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Threshold:</strong></td>
        <td style="padding: 5px 0;">{{threshold}}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0;"><strong>Current Value:</strong></td>
        <td style="padding: 5px 0;">{{currentValue}}</td>
      </tr>
    </table>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" style="background-color: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dashboard</a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #999; font-size: 12px;">This is an automated message from {{appName}}.</p>
</body>
</html>',
  'Hi {{name}},

{{message}}

Details:
- Type: {{alertType}}
- Threshold: {{threshold}}
- Current Value: {{currentValue}}

View your dashboard: {{dashboardUrl}}

This is an automated message from {{appName}}.',
  ARRAY['name', 'alertType', 'threshold', 'currentValue', 'message', 'dashboardUrl', 'appName'],
  true
)
ON CONFLICT (name) DO NOTHING;

