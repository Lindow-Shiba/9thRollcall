@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html, body {
  background: #0a0a0b;
  color: #e7e7ea;
  min-height: 100%;
}

body {
  font-feature-settings: "ss01", "cv11";
}

/* subtle grid background */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 20% -10%, rgba(200, 55, 45, 0.08), transparent 40%),
    radial-gradient(circle at 100% 110%, rgba(200, 55, 45, 0.05), transparent 50%);
  z-index: -1;
}

/* form field defaults */
input[type="text"],
input[type="password"],
input[type="datetime-local"],
input[type="number"],
textarea,
select {
  background: #0f0f14;
  border: 1px solid #262630;
  color: #e7e7ea;
  border-radius: 6px;
  padding: 0.55rem 0.75rem;
  width: 100%;
  font-size: 0.95rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #c8372d;
  box-shadow: 0 0 0 3px rgba(200, 55, 45, 0.15);
}

label {
  display: block;
  font-size: 0.85rem;
  color: #a0a0ac;
  margin-bottom: 0.35rem;
  font-weight: 500;
}
