✅ 🧾 Detailed Prompt: Influencer Registration and Role Flow (Multi-Tenant SaaS)
🎯 Goal:
Create a seamless landing page flow for influencers to register, get reviewed as a “Potential Influencer,” view available campaigns from all tenants, and upon approval, gain ability to join campaigns as a verified Influencer.

✅ 🔘 Step 1: "Join as Influencer" Button on Landing Page
Component: Button

Label: "Join as Influencer"

Action: Opens a registration modal/page

✅ 📝 Step 2: Influencer Registration Form
Fields to capture:

Full Name

Email

Phone Number

Social Media Handles (Instagram, YouTube, etc.)

Niche/Category (dropdown)

Country / Region

Optional: Bio or About

✅ Terms & Conditions Checkbox (must agree)

CTA Button: "Register"

✅ 🧠 Backend Logic Upon Registration
On form submission:

json
Copy
Edit
POST /api/influencer/register
{
  "name": "Komal",
  "email": "komal@example.com",
  "password": "*********",
  "role": "potential_influencer",
  "social_links": {
    "instagram": "https://instagram.com/komal_influencer"
  },
  "agreed_to_terms": true
}
🔐 Creates user with role = "potential_influencer"

Stores details in users and influencers tables

Sends internal notification/email to admin for review

✅ 🔍 Step 3: Admin Review & Role Upgrade
Admin reviews influencer details

Validates authenticity

Approves via dashboard

ts
Copy
Edit
PATCH /api/users/{id}/role
{
  "newRole": "influencer"
}
✅ 👀 Step 4: Campaign Visibility (Before Approval)
Role: potential_influencer

Access: Can only view campaigns (read-only mode)

Cannot join/participate

✅ 🟢 Step 5: Post-Approval (After Role Upgrade)
Role: influencer

Access:

✅ View all public campaigns across tenants

✅ Click Join Campaign

Backend records:

ts
Copy
Edit
{
  userId: "u123",
  tenantId: "t456",
  campaignId: "c789",
  role: "influencer",
  joinedAt: "2025-06-05"
}
🔁 Summary Workflow Diagram
text
Copy
Edit
[Landing Page]
     ↓ Click
[Join as Influencer Button]
     ↓
[Register Form → Save as potential_influencer]
     ↓
[Can View Campaigns Only] ←––––––––––––
     ↓                             ↑ Admin Approval
[Role Change to Influencer] –––––––
     ↓
[Can Join Campaigns]
✅ Role Definitions
Role	Description	Access
potential_influencer	Awaiting verification	View-only
influencer	Approved to join campaigns	View + Join
affiliate	Can refer users	Custom access
admin	Full platform access	All modules