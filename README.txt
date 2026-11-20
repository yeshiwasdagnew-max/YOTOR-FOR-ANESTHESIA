YOTOR FOR ANESTHESIA — Version 0.2 (registration/login prototype)

FILES
- index.html: application screens
- styles.css: responsive visual design
- app.js: Supabase connection and registration/login behavior

WHAT THIS VERSION DOES
- Connects to the YOTOR Supabase project using the Project URL and publishable key.
- Allows student registration with full name, student ID, email and password.
- Sends full_name and student_id as auth metadata. The database trigger created in Supabase should create the pending profile.
- Allows email/password login.
- Reads the signed-in user's own profile and displays pending, rejected, approved student, or admin screens.

IMPORTANT LIMITATIONS
- This is an early development prototype, not a finished or production-ready application.
- The current database policy allows a user to read their own profile. We still need to add and test robust server-side authorization policies for every protected feature and admin action.
- Do not treat a screen being hidden in JavaScript as security. Real approval enforcement must be done by database policies/server-side checks before protected data is released.
- The administrator approval dashboard and secure first-admin setup are not implemented yet.
- Email confirmation and redirects need to be tested after deployment. Supabase's default email service may have sending limits; production may require custom SMTP.
- Do not place Supabase secret keys or service_role keys in this project.
- Use HTTPS hosting for normal browser use. Opening index.html directly may not support all authentication redirect behavior.
- This is not clinical decision-support software.

NEXT
1. Test locally/host on HTTPS.
2. Verify a test registration creates a profiles row with status=pending and role=student.
3. Implement secure admin provisioning and approval.
4. Add RLS policies for all content tables before storing student/private data.
