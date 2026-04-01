async function handleFile() {
  const fileInput = document.getElementById("fileInput");
  const responseBox = document.getElementById("response");
  const quizSection = document.getElementById("quizSection");
  const quizContainer = document.getElementById("quizContainer");
  const quizResult = document.getElementById("quizResult");

  if (!fileInput.files.length) {
    alert("Please select a PDF file first.");
    return;
  }

  const file = fileInput.files[0];
  responseBox.textContent = "Uploading and processing...";
  quizContainer.innerHTML = "";
  quizResult.textContent = "";

  try {
    const formData = new FormData();
    formData.append("pdf", file);

    const res = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    responseBox.textContent = data.reply;

    // Show quiz section
    quizSection.style.display = "block";

    // Render multiple choice quiz if provided
    if (data.quiz && Array.isArray(data.quiz)) {
      data.quiz.forEach((q, index) => {
        const qDiv = document.createElement("div");
        qDiv.className = "quiz-question";

        const qText = document.createElement("p");
        qText.textContent = `${index + 1}. ${q.question}`;
        qDiv.appendChild(qText);

        q.options.forEach(opt => {
          const label = document.createElement("label");
          label.style.display = "block";

          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = `question${index}`;
          radio.value = opt;

          label.appendChild(radio);
          label.appendChild(document.createTextNode(" " + opt));
          qDiv.appendChild(label);
        });

        quizContainer.appendChild(qDiv);
      });

      // Store answers for scoring
      quizContainer.dataset.answers = JSON.stringify(
        data.quiz.map(q => q.answer)
      );
    }

  } catch (err) {
    console.error(err);
    responseBox.textContent = "Error uploading file.";
  }
}

function submitQuiz() {
  const quizContainer = document.getElementById("quizContainer");
  const quizResult = document.getElementById("quizResult");
  const answers = JSON.parse(quizContainer.dataset.answers || "[]");

  let score = 0;
  answers.forEach((ans, index) => {
    const selected = document.querySelector(
      `input[name="question${index}"]:checked`
    );
    if (selected && selected.value === ans) {
      score++;
    }
  });

  quizResult.textContent = `You scored ${score} out of ${answers.length}`;
}
