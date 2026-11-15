
const SUPABASE_URL = "https://voktqhrqyeiqguhxxzvs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MAuo1fxc6leCShGq4D_5_A_MN4fx6_F";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

function message(text, error = false) {
  const el = $("message");
  if (!el) return;
  el.textContent = text;
  el.style.color = error ? "red" : "green";
}

// STUDENT SIGN UP
$("signup")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = $("full-name")?.value.trim();
  const email = $("signup-email")?.value.trim();
  const password = $("signup-password")?.value;

  if (!fullName || !email || !password) {
    return message("Please complete all fields.", true);
  }

  if (password.length < 8) {
    return message("Password must be at least 8 characters.", true);
  }

  message("Creating your account...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });

  if (error) return message(error.message, true);

  message(
    data.session
      ? "Account created successfully!"
      : "Check your email to confirm your account."
  );

  $("signup").reset();
});

// STUDENT SIGN IN
$("signin")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = $("login-email")?.value.trim();
  const password = $("login-password")?.value;

  message("Signing in...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return message(error.message, true);

  message("Welcome back!");

  if ($("user")) {
    $("user").textContent = data.user.email;
  }

  $("signin").reset();
  loadEnrollments();
});

// SIGN OUT
$("logout")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) return message(error.message, true);

  message("You have signed out.");
  if ($("user")) $("user").textContent = "";
});

// PASSWORD RESET
$("reset")?.addEventListener("click", async () => {
  const email = $("login-email")?.value.trim();

  if (!email) {
    return message("Enter your email first.", true);
  }

  const { error } =
    await supabase.auth.resetPasswordForEmail(email);

  if (error) return message(error.message, true);

  message("Password reset email sent.");
});

// LOAD COURSES
async function loadCourses() {
  const list = $("course-list");
  if (!list) return;

  list.textContent = "Loading courses...";

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("is_active", true);

  if (error) {
    list.textContent = "Could not load courses.";
    console.error(error);
    return;
  }

  list.replaceChildren();

  if (!data.length) {
    list.textContent = "No courses available yet.";
    return;
  }

  data.forEach(course => {
    const card = document.createElement("div");
    card.className = "panel";

    const title = document.createElement("h3");
    title.textContent = course.title;

    const description = document.createElement("p");
    description.textContent = course.description || "";

    const button = document.createElement("button");
    button.className = "button";
    button.textContent = "Enroll";

    button.onclick = () => enroll(course.id);

    card.append(title, description, button);
    list.append(card);
  });
}

// ENROLL STUDENT
async function enroll(courseId) {
  const { data: { user } } =
    await supabase.auth.getUser();

  if (!user) {
    return message("Please sign in before enrolling.", true);
  }

  const { error } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      course_id: courseId
    });

  if (error) return message(error.message, true);

  message("You have enrolled successfully!");
  loadEnrollments();
}

// LOAD STUDENT ENROLLMENTS
async function loadEnrollments() {
  const list = $("enrollments");
  if (!list) return;

  const { data: { user } } =
    await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, courses(title)")
    .eq("user_id", user.id);

  if (error) {
    list.textContent = "Could not load enrollments.";
    return;
  }

  list.replaceChildren();

  if (!data.length) {
    list.textContent = "You have no enrollments yet.";
    return;
  }

  const ul = document.createElement("ul");

  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item.courses?.title || "Enrolled course";
    ul.append(li);
  });

  list.append(ul);
}

// INITIALIZE WEBSITE
async function initialize() {
  const year = $("year");
  if (year) year.textContent = new Date().getFullYear();

  const { data } = await supabase.auth.getSession();

  if (data.session) {
    if ($("user")) {
      $("user").textContent = data.session.user.email;
    }
    loadEnrollments();
  }

  await loadCourses();

  supabase.auth.onAuthStateChange((_event, session) => {
    if ($("user")) {
      $("user").textContent =
        session?.user?.email || "";
    }

    if (session) loadEnrollments();
  });
}

document.addEventListener("DOMContentLoaded", initialize);
