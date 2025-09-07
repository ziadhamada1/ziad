let questions = [];
let selectedQuestions = [];
let userAnswers = [];
let mode = "practice";
let timerInterval;
let timeLeft = 0;

let studentName = "";
let studentPhone = "";

// تحميل الأسئلة
async function loadQuestions() {
  try {
    const res = await fetch("questions.json");
    questions = await res.json();
  } catch (err) {
    console.error("خطأ في تحميل الأسئلة:", err);
  }
}

// ✅ دالة التحقق من رقم الهاتف المصري
function isValidEgyptianPhoneNumber(phone) {
  const pattern = /^(010|011|012|015)\d{8}$/;
  return pattern.test(phone);
}

// ✅ تفعيل زر المتابعة إذا الاسم ورقم الهاتف صحيحين
function validateUserInfo() {
  const nameInput = document.getElementById("student-name").value.trim();
  const phoneInput = document.getElementById("student-phone").value.trim();
  const continueBtn = document.getElementById("continue-btn");

  // تفعيل الزر فقط إذا الاسم غير فارغ والرقم صحيح
  continueBtn.disabled = !(nameInput && isValidEgyptianPhoneNumber(phoneInput));
}

// استمع لحقول الاسم ورقم الهاتف
document.getElementById("student-name").addEventListener("input", validateUserInfo);
document.getElementById("student-phone").addEventListener("input", validateUserInfo);

// عند الضغط على متابعة
function submitUserInfo() {
  const nameInput = document.getElementById("student-name").value.trim();
  const phoneInput = document.getElementById("student-phone").value.trim();

  if (!nameInput || !phoneInput) {
    alert("من فضلك أدخل الاسم ورقم الهاتف.");
    return;
  }

  // ✅ تحقق من صحة الرقم
  if (!isValidEgyptianPhoneNumber(phoneInput)) {
    alert("رقم الهاتف غير صحيح. يجب أن يبدأ بـ 010 أو 011 أو 012 أو015.");
    return;
  }

  studentName = nameInput;
  studentPhone = phoneInput;

  // إخفاء الفورم واظهار اختيار الوضع وزر بدء الامتحان
  document.getElementById("user-info").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");

  // تفعيل زر بدء الامتحان
  document.getElementById("start-exam-btn").disabled = false;
}

// بدء الامتحان
async function startExam() {
  if (!studentName || !studentPhone) {
    alert("يجب إدخال الاسم ورقم الهاتف والضغط على متابعة أولاً.");
    return;
  }

  await loadQuestions();

  const selectedMode = document.querySelector('input[name="mode"]:checked');
  mode = selectedMode ? selectedMode.value : "practice";

  selectedQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 50);

  if (mode === "exam") {
    timeLeft = selectedQuestions.length * 60;
    startTimer();
  } else {
    document.getElementById("timer").innerText = "";
  }

  userAnswers = new Array(selectedQuestions.length).fill(-1);

  document.getElementById("home").classList.add("hidden");
  document.getElementById("exam").classList.remove("hidden");
  showQuestions();
}

// عرض الأسئلة
function showQuestions() {
  const container = document.getElementById("question-container");
  container.innerHTML = "";

  selectedQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    div.classList.add("question");

    let html = `<p><strong>س${index + 1}:</strong> ${q.question}</p>`;
    q.options.forEach((opt, i) => {
      html += `<label>
                 <input type="radio" name="q${index}" value="${i}" onchange="handleAnswer(${index}, ${i})">
                 ${opt}
               </label><br>`;
    });

    div.innerHTML = html;
    container.appendChild(div);
  });
}

// حفظ إجابات المستخدم
function handleAnswer(qIndex, answerIndex) {
  userAnswers[qIndex] = answerIndex;
}

// تسليم الامتحان
function submitExam() {
  clearInterval(timerInterval);

  selectedQuestions.forEach((q, index) => {
    const selected = document.querySelector(`input[name="q${index}"]:checked`);
    userAnswers[index] = selected ? parseInt(selected.value) : -1;
  });

  let score = 0;
  selectedQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.answer) score++;
  });

  // إرسال النتيجة
  sendResult(studentName, studentPhone, score);

  // عرض النتيجة
  document.getElementById("exam").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("score").innerText = `درجتك: ${score} من ${selectedQuestions.length}`;

  showReview();
}

// إرسال البيانات للإيميل عبر emailjs SDK v4
function sendResult(name, phone, score) {
  const total = selectedQuestions.length;
  const date = new Date().toLocaleString("ar-EG");

  const templateParams = {
    name: name,
    phone: phone,
    score: score,
    total: total,
    date: date
  };

  // استخدام الدالة العالمية sendEmailJS المعرفة في السكريبت الموديول
  sendEmailJS("service_my8vliq", "template_0c9zqwp", templateParams)
    .then(() => {
      alert("✅ تم إرسال النتيجة إلى بريدك بنجاح");
    })
    .catch((error) => {
      console.error("❌ فشل في إرسال الإيميل:", error);
      alert("❌ حدث خطأ أثناء إرسال النتيجة عبر البريد");
    });
}

// إعادة المحاولة
function restartExam() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
}

// المؤقت
function startTimer() {
  const timerDisplay = document.getElementById("timer");
  timerInterval = setInterval(() => {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    timerDisplay.innerText = `الوقت المتبقي: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("انتهى الوقت!");
      submitExam();
    }
    timeLeft--;
  }, 1000);
}

// مراجعة الأسئلة
function showReview() {
  const reviewContainer = document.getElementById("review-container");
  if (!reviewContainer) return;

  reviewContainer.innerHTML = "";

  selectedQuestions.forEach((q, index) => {
    const div = document.createElement("div");
    div.classList.add("review");

    const userAnswerIndex = userAnswers[index];
    const correctAnswerIndex = q.answer;

    div.innerHTML = `
      <p><strong>س${index + 1}:</strong> ${q.question}</p>
      <p>إجابتك: <span style="color:${userAnswerIndex === correctAnswerIndex ? "green" : "red"}">
      ${userAnswerIndex >= 0 ? q.options[userAnswerIndex] : "لم تجب"}</span></p>
      <p>الإجابة الصحيحة: <span style="color:green">${q.options[correctAnswerIndex]}</span></p>
      <hr>`;

    reviewContainer.appendChild(div);
  });
}
