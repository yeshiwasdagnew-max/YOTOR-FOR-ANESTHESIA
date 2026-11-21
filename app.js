
/* ==========================================
   YOTOR FOR ANESTHESIA
   Supabase Authentication and Dashboard
========================================== */

// SUPABASE CONNECTION
// Publishable key is safe for browser use.
// NEVER put a secret/service-role key here.

const SUPABASE_URL = "https://cpzenacrxbtrneduaxia.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-Z1g4WeyyH9UXDdaH8m06w_xvg_CK8E";


// INITIALIZE SUPABASE

const $ = (id) => document.getElementById(id);

const supabaseReady = Boolean(
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")
);

const client = supabaseReady
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    )
  : null;


// APPLICATION PANELS

const panels = [
  "auth-card",
  "status-card",
  "student-card",
  "admin-card"
];

function showPanel(id) {
  panels.forEach((panel) => {
    const element = $(panel);

    if (element) {
      element.classList.toggle("hidden", panel !== id);
    }
  });
}


// MESSAGE DISPLAY

function message(text = "", kind = "") {
  const element = $("auth-message");

  if (!element) return;

  element.textContent = text;
  element.className = "message " + kind;
}


// BUTTON LOADING

function setBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');

  if (!button) return;

  button.disabled = busy;

  button.textContent = busy
    ? "Please wait…"
    : form.id === "login-form"
      ? "Log in"
      : "Create account";
}


// LOGIN AND REGISTRATION TABS

function showTab(tab) {
  const login = tab === "login";

  $("login-form").classList.toggle("hidden", !login);
  $("register-form").classList.toggle("hidden", login);

  $("login-tab").classList.toggle("active", login);
  $("register-tab").classList.toggle("active", !login);

  message();
}

$("login-tab").addEventListener("click", () => {
  showTab("login");
});

$("register-tab").addEventListener("click", () => {
  showTab("register");
});


// FRIENDLY ERROR MESSAGES

function friendlyError(error) {
  const original = error?.message || "Something went wrong.";
  const text = original.toLowerCase();

  if (
    text.includes("already registered") ||
    text.includes("already been registered")
  ) {
    return "This email is already registered. Please log in.";
  }

  if (
    text.includes("duplicate key") ||
    text.includes("profiles_student_id_key")
  ) {
    return "This student ID is already registered.";
  }

  if (
    text.includes("invalid login") ||
    text.includes("invalid credentials")
  ) {
    return "Email or password is incorrect.";
  }

  if (text.includes("email not confirmed")) {
    return "Please confirm your email before logging in.";
  }

  if (text.includes("network")) {
    return "Network problem. Check your internet connection.";
  }

  return original;
}


// ==========================================
// ADMINISTRATOR: STUDENT MANAGEMENT
// ==========================================

async function loadAdminStudents() {
  const adminMessage = $("admin-message");
  const pendingContainer = $("pending-students");
  const allContainer = $("all-students");

  if (!client) return;

  adminMessage.textContent = "Loading student accounts...";

  try {
    const { data, error } = await client.functions.invoke(
      "admin-students",
      { method: "GET" }
    );

    if (error) throw error;

    const students = Array.isArray(data?.students)
      ? data.students
      : [];

    const pending = students.filter(
      student => student.status === "pending"
    );

    $("pending-count").textContent = pending.length;
    $("total-count").textContent = students.length;

    // PENDING REGISTRATIONS
    pendingContainer.replaceChildren();

    const pendingTitle = document.createElement("h3");
    pendingTitle.textContent = "Pending Registrations";
    pendingContainer.appendChild(pendingTitle);

    if (pending.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "No pending registrations.";
      pendingContainer.appendChild(empty);
    }

    pending.forEach(student => {
      const row = createStudentRow(student, true);
      pendingContainer.appendChild(row);
    });

    // ALL STUDENT ACCOUNTS
    allContainer.replaceChildren();

    const allTitle = document.createElement("h3");
    allTitle.textContent = "All Student Accounts";
    allContainer.appendChild(allTitle);

    if (students.length === 0) {
      const empty = document.createElement("p");
      empty.className = "muted small";
      empty.textContent = "No student accounts found.";
      allContainer.appendChild(empty);
    }

    students.forEach(student => {
      const row = createStudentRow(student, false);
      allContainer.appendChild(row);
    });

    adminMessage.textContent = "Student accounts loaded successfully.";

  } catch (error) {
    console.error("Admin loading error:", error);
    adminMessage.textContent =
      error.message || "Could not load student accounts.";
  }
}


// CREATE A STUDENT DISPLAY CARD

function createStudentRow(student, showActions) {
  const row = document.createElement("div");
  row.className = "student-row";

  const name = document.createElement("strong");
  name.textContent = student.full_name || "Unnamed student";

  const id = document.createElement("p");
  id.textContent = "Student ID: " + (student.student_id || "Not provided");

  const status = document.createElement("p");
  status.textContent = "Status: " + (student.status || "Unknown");

  row.append(name, id, status);

  if (showActions) {
    const approve = document.createElement("button");
    approve.type = "button";
    approve.className = "primary";
    approve.textContent = "Approve";

    approve.addEventListener("click", () => {
      updateStudentStatus(student.id, "approved");
    });

    const reject = document.createElement("button");
    reject.type = "button";
    reject.className = "secondary";
    reject.textContent = "Reject";

    reject.addEventListener("click", () => {
      updateStudentStatus(student.id, "rejected");
    });

    row.append(approve, reject);
  }

  return row;
}


// APPROVE OR REJECT A STUDENT

async function updateStudentStatus(id, status) {
  const adminMessage = $("admin-message");

  adminMessage.textContent = "Updating student account...";

  try {
    const { data, error } = await client.functions.invoke(
      "admin-students",
      {
        method: "POST",
        body: { id, status }
      }
    );

    if (error) throw error;

    adminMessage.textContent =
      data.message || "Student account updated.";

    await loadAdminStudents();

  } catch (error) {
    console.error("Student update error:", error);

    adminMessage.textContent =
      error.message || "Could not update student account.";
  }
}


// REFRESH STUDENT LIST

$("refresh-students").addEventListener("click", () => {
  loadAdminStudents();
});

// LOAD USER PROFILE AND ACCOUNT STATUS

async function loadAccount(user) {
  if (!client || !user) return;

  const { data: profile, error } = await client
    .from("profiles")
    .select("full_name,student_id,status,role")
    .eq("id", user.id)
    .single();

  // PROFILE LOADING ERROR

  if (error || !profile) {
    showPanel("status-card");

    $("status-title").textContent =
      "Account profile needs attention";

    $("status-description").textContent =
      "Your login succeeded, but your profile could not be loaded. Please contact the YOTOR administrator.";

    $("profile-name").textContent = user.email || "—";
    $("profile-student-id").textContent = "—";
    $("profile-status").textContent = "Check required";

    return;
  }


  // REJECTED ACCOUNT

  if (profile.status === "rejected") {
    showPanel("status-card");

    $("status-title").textContent =
      "Registration not approved";

    $("status-description").textContent =
      "Your registration was not approved. Please contact the YOTOR administrator.";

    $("profile-name").textContent =
      profile.full_name || "—";

    $("profile-student-id").textContent =
      profile.student_id || "—";

    $("profile-status").textContent = "Rejected";

    return;
  }


  // PENDING ACCOUNT

  if (profile.status !== "approved") {
    showPanel("status-card");

    $("status-title").textContent =
      "Pending administrator approval";

    $("status-description").textContent =
      "Your registration has been received. Please wait until a YOTOR administrator approves your account.";

    $("profile-name").textContent =
      profile.full_name || "—";

    $("profile-student-id").textContent =
      profile.student_id || "—";

    $("profile-status").textContent = "Pending";

    return;
  }

// ADMINISTRATOR ACCOUNT

if (profile.role === "admin") {
  showPanel("admin-card");
  await loadAdminStudents();
  return;
}

  // APPROVED STUDENT ACCOUNT

  $("student-welcome").textContent =
    `Welcome, ${profile.full_name || "student"}!`;

  showPanel("student-card");
}


// CHECK EXISTING LOGIN SESSION

async function refreshSession() {
  if (!client) return;

  try {
    const { data, error } = await client.auth.getSession();

    if (error) {
      message(friendlyError(error), "error");
      showPanel("auth-card");
      return;
    }

    if (data.session) {
      await loadAccount(data.session.user);
    } else {
      showPanel("auth-card");
    }

  } catch (error) {
    console.error("Session error:", error);

    showPanel("auth-card");
  }
}


// STUDENT REGISTRATION

$("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    message("Supabase connection is unavailable.", "error");
    return;
  }

  const form = event.currentTarget;

  setBusy(form, true);
  message();

  try {
    const full_name = $("reg-name").value.trim();
    const student_id = $("reg-student-id").value.trim();
    const email = $("reg-email").value.trim();
    const password = $("reg-password").value;
    const confirm = $("reg-confirm").value;


    // VALIDATE PASSWORD

    if (password.length < 8) {
      message(
        "Use a password with at least 8 characters.",
        "error"
      );

      return;
    }

    if (password !== confirm) {
      message(
        "The passwords do not match.",
        "error"
      );

      return;
    }

    if (!full_name || !student_id || !email) {
      message(
        "Please complete all required fields.",
        "error"
      );

      return;
    }


    // CREATE SUPABASE ACCOUNT

    const { data, error } = await client.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name,
          student_id
        }
      }
    });

    if (error) {
      message(friendlyError(error), "error");
      return;
    }


    // REGISTRATION WITH ACTIVE SESSION

    if (data.session && data.user) {
      message(
        "Registration received. Checking account approval…",
        "success"
      );

      await loadAccount(data.user);

    } else {

      // EMAIL CONFIRMATION REQUIRED

      message(
        "Registration submitted. Check your email for a confirmation link. After confirming, log in. Your account still needs administrator approval.",
        "success"
      );

      showTab("login");
    }

  } catch (error) {
    console.error("Registration error:", error);

    message(friendlyError(error), "error");

  } finally {
    setBusy(form, false);
  }
});


// STUDENT LOGIN

$("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    message("Supabase connection is unavailable.", "error");
    return;
  }

  const form = event.currentTarget;

  setBusy(form, true);
  message();

  try {

    const email = $("login-email").value.trim();
    const password = $("login-password").value;

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      message(friendlyError(error), "error");
      return;
    }

    if (data.user) {
      await loadAccount(data.user);
    }

  } catch (error) {
    console.error("Login error:", error);

    message(friendlyError(error), "error");

  } finally {
    setBusy(form, false);
  }
});


// LOGOUT

async function signOut() {
  if (!client) return;

  const { error } = await client.auth.signOut();

  if (error) {
    message(friendlyError(error), "error");
    return;
  }

  showPanel("auth-card");
  showTab("login");
}


// LOGOUT BUTTONS

[
  "status-signout",
  "student-signout",
  "admin-signout"
].forEach((id) => {

  const button = $(id);

  if (button) {
    button.addEventListener("click", signOut);
  }

});


// AUTHENTICATION STATE CHANGES

if (!supabaseReady) {

  $("config-warning").classList.remove("hidden");

  showPanel("auth-card");

} else {

  refreshSession();

  client.auth.onAuthStateChange((event, session) => {

    if (event === "SIGNED_OUT" || !session) {
      showPanel("auth-card");
    }

  });

}