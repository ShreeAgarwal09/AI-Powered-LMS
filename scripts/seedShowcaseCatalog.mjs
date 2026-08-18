import "dotenv/config";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed EduSphere.");

const thumbnailUrls = [
  "/manus-storage/edusphere-hero_8d260c0b.jpg",
  "/manus-storage/edusphere-instructor_80a2feb5.jpg",
];

const instructors = [
  { openId: "edusphere-showcase-instructor-1", name: "Maya Chen", email: "maya.chen@edusphere.demo", headline: "Full-stack engineer and learning designer", bio: "Maya helps emerging developers build durable engineering habits through clear, project-led instruction." },
  { openId: "edusphere-showcase-instructor-2", name: "Jon Bell", email: "jon.bell@edusphere.demo", headline: "Data and cloud educator", bio: "Jon turns complex data, cloud, and AI systems into practical learning paths." },
];

const catalog = [
  ["Web Development", "Modern Web Foundations", "Build accessible, responsive websites with semantic HTML, modern CSS, and a practical deployment workflow.", "beginner", 420, ["Structure semantic, accessible web pages", "Build responsive interfaces with modern CSS", "Publish a small web project with confidence"], ["A computer and modern web browser", "No programming experience required"], ["html", "css", "responsive design", "accessibility"]],
  ["JavaScript", "JavaScript from First Principles", "Develop a rigorous mental model for JavaScript through functions, objects, asynchronous workflows, and browser APIs.", "beginner", 540, ["Write expressive JavaScript functions", "Work confidently with objects and arrays", "Handle asynchronous browser interactions"], ["Basic HTML familiarity", "A modern code editor"], ["javascript", "es modules", "async", "dom"]],
  ["React", "React Interface Patterns", "Create maintainable React interfaces with component composition, hooks, typed state, and thoughtful UX states.", "intermediate", 600, ["Compose reusable React components", "Model UI state with hooks", "Build accessible loading, error, and empty states"], ["Comfort with JavaScript", "Node.js installed locally"], ["react", "hooks", "components", "frontend"]],
  ["Python", "Python for Practical Automation", "Use Python to automate repetitive work, manipulate files, consume APIs, and build reliable command-line utilities.", "beginner", 480, ["Write readable Python programs", "Work with files and structured data", "Automate repeatable workflows"], ["A computer with Python 3", "No prior Python experience required"], ["python", "automation", "scripting", "apis"]],
  ["Data Science", "Data Analysis with Pandas", "Turn raw tabular data into trustworthy insights with cleaning, exploratory analysis, grouping, and visual storytelling.", "intermediate", 570, ["Clean inconsistent tabular data", "Analyze trends with Pandas", "Communicate findings with clear charts"], ["Foundational Python knowledge", "Python and Jupyter installed"], ["pandas", "data analysis", "python", "visualization"]],
  ["Artificial Intelligence", "Applied AI Systems", "Understand modern AI product patterns, evaluation basics, safe prompting, and practical integration decisions.", "intermediate", 510, ["Explain core AI system components", "Design useful AI-assisted workflows", "Evaluate outputs for quality and safety"], ["Comfort with web applications", "Curiosity about AI products"], ["artificial intelligence", "ai products", "evaluation", "llms"]],
  ["Machine Learning", "Machine Learning Workflow", "Learn the end-to-end machine learning workflow from datasets and features to validation, metrics, and deployment tradeoffs.", "intermediate", 630, ["Prepare features for modeling", "Choose meaningful evaluation metrics", "Recognize overfitting and validation risks"], ["Python fundamentals", "Basic algebra and statistics"], ["machine learning", "modeling", "metrics", "scikit-learn"]],
  ["Database", "Relational Database Design", "Design dependable relational systems with entities, constraints, normalized schemas, SQL queries, and indexing strategies.", "intermediate", 525, ["Model relationships with confidence", "Write useful SQL queries", "Choose indexes and constraints deliberately"], ["No database experience required", "A SQL client or database playground"], ["sql", "database design", "mysql", "normalization"]],
  ["Cloud Computing", "Cloud Deployment Essentials", "Learn pragmatic cloud deployment concepts: environments, secrets, containers, observability, and scalable delivery.", "intermediate", 495, ["Explain essential cloud deployment concepts", "Configure environment-based applications", "Plan observability and delivery workflows"], ["Basic web development experience", "Familiarity with command-line tools"], ["cloud", "deployment", "containers", "devops"]],
  ["Cybersecurity", "Secure Application Basics", "Build security habits into application work with authentication, authorization, threat awareness, secrets management, and secure defaults.", "beginner", 465, ["Recognize common application security risks", "Apply secure authentication patterns", "Manage secrets and permissions safely"], ["Basic web development familiarity", "A willingness to inspect details"], ["security", "authentication", "authorization", "owasp"]],
  ["UI/UX Design", "Product Design for Developers", "Translate user needs into usable interfaces with information hierarchy, interaction states, accessibility, and thoughtful critique.", "beginner", 450, ["Plan interface hierarchy", "Design inclusive interaction states", "Turn feedback into focused design improvements"], ["No design software is required", "A curious product mindset"], ["ui ux", "product design", "accessibility", "prototyping"]],
  ["Prompt Engineering", "Prompt Design and Evaluation", "Create structured prompts, evaluate model responses, build reusable prompt patterns, and know when prompting is not enough.", "beginner", 435, ["Write precise task prompts", "Build repeatable prompt templates", "Evaluate responses with useful criteria"], ["Familiarity with generative AI tools", "No coding required"], ["prompt engineering", "llms", "evaluation", "ai literacy"]],
];

const lessonTemplates = [
  ["Start with the problem", "Frame the real-world problem this discipline solves and identify a useful first project."],
  ["Build the core mental model", "Learn the concepts, vocabulary, and tradeoffs that guide good implementation choices."],
  ["Practice with a guided workflow", "Apply the core ideas through a focused, repeatable implementation exercise."],
  ["Review quality and common pitfalls", "Use practical checks to spot mistakes, improve clarity, and make the work more reliable."],
  ["Plan your next project", "Turn the course into a concrete next step with a small, achievable practice plan."],
];

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pool = await mysql.createPool(process.env.DATABASE_URL);

async function idFor(table, field, value) {
  const [rows] = await pool.execute(`SELECT id FROM ${table} WHERE ${field} = ? LIMIT 1`, [value]);
  if (!rows[0]) throw new Error(`Missing ${table} record for ${value}`);
  return rows[0].id;
}

try {
  for (const person of instructors) {
    await pool.execute(
      `INSERT INTO users (openId, name, email, loginMethod, role, headline, bio, lastSignedIn)
       VALUES (?, ?, ?, 'showcase-seed', 'instructor', ?, ?, NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role='instructor', headline=VALUES(headline), bio=VALUES(bio), lastSignedIn=NOW()`,
      [person.openId, person.name, person.email, person.headline, person.bio],
    );
  }

  const categoryNames = [...new Set(catalog.map(([category]) => category))];
  for (const name of categoryNames) {
    const slug = slugify(name);
    await pool.execute(
      `INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)`,
      [name, slug, `Focused EduSphere learning paths in ${name}.`],
    );
  }

  const seedSlugs = catalog.map(([, title]) => slugify(title));
  if (seedSlugs.length) await pool.execute(`DELETE FROM courses WHERE slug IN (${seedSlugs.map(() => "?").join(",")})`, seedSlugs);

  for (let index = 0; index < catalog.length; index += 1) {
    const [category, title, shortDescription, level, durationMinutes, objectives, requirements, tags] = catalog[index];
    const slug = slugify(title);
    const categoryId = await idFor("categories", "slug", slugify(category));
    const instructorId = await idFor("users", "openId", instructors[index % instructors.length].openId);
    await pool.execute(
      `INSERT INTO courses (title, slug, shortDescription, description, thumbnailUrl, instructorId, categoryId, level, priceCents, currency, status, objectives, requirements, tags, durationMinutes, publishedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'USD', 'published', ?, ?, ?, ?, NOW())`,
      [title, slug, shortDescription, `${shortDescription}\n\nThis project-led course pairs explanations with short, deliberate practice so learners can build a useful foundation and leave with a practical next step.`, thumbnailUrls[index % thumbnailUrls.length], instructorId, categoryId, level, JSON.stringify(objectives), JSON.stringify(requirements), JSON.stringify(tags), durationMinutes],
    );
    const courseId = await idFor("courses", "slug", slug);
    const sectionTitle = "Learning path";
    await pool.execute(`INSERT INTO courseSections (courseId, title, description, sortOrder) VALUES (?, ?, ?, 0)`, [courseId, sectionTitle, "Five focused lessons that build a durable foundation."]);
    const sectionId = await idFor("courseSections", "courseId", courseId);
    for (let lessonIndex = 0; lessonIndex < lessonTemplates.length; lessonIndex += 1) {
      const [lessonTitle, lessonDescription] = lessonTemplates[lessonIndex];
      await pool.execute(
        `INSERT INTO lessons (courseId, sectionId, title, description, videoUrl, resources, durationSeconds, sortOrder, isPreview)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
        [courseId, sectionId, `${lessonIndex + 1}. ${lessonTitle}`, `${lessonDescription} The examples and practice are tailored to ${title}.`, JSON.stringify([{ label: "Practice worksheet", url: "https://developer.mozilla.org/" }]), Math.round((durationMinutes / lessonTemplates.length) * 60), lessonIndex, lessonIndex === 0],
      );
    }
    await pool.execute(`INSERT INTO quizzes (courseId, title, description, passingScore, sortOrder, isRequired) VALUES (?, ?, ?, 70, 0, true)`, [courseId, `${title} knowledge check`, "Confirm your understanding of the course foundations before moving on."]);
    const quizId = await idFor("quizzes", "courseId", courseId);
    const question = `Which approach best supports progress in ${title}?`;
    await pool.execute(`INSERT INTO quizQuestions (quizId, question, options, correctOption, explanation, points, sortOrder) VALUES (?, ?, ?, 0, ?, 1, 0)`, [quizId, question, JSON.stringify(["Practice the core workflow in small, deliberate steps", "Skip directly to advanced shortcuts", "Avoid checking your work", "Memorize terminology without applying it"]), "Consistent practice and feedback make new skills durable."]);
  }
  console.log(`Seeded ${catalog.length} published EduSphere courses with ${lessonTemplates.length} lessons and one assessment each.`);
} finally {
  await pool.end();
}
