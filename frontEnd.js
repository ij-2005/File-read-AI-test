async function handleFile() {
  const fileInput = document.getElementById("fileInput");
  const responseBox = document.getElementById("response");

  if (!fileInput.files.length) {
    alert("Please select a PDF file first.");
    return;
  }

  const file = fileInput.files[0];

  // Show loading state
  responseBox.textContent = "Uploading and processing...";

  try {
    const formData = new FormData();
    formData.append("pdf", file); // "pdf" = key name (important)

    const res = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    responseBox.textContent = data.reply;

  } catch (err) {
    console.error(err);
    responseBox.textContent = "Error uploading file.";
  }
}