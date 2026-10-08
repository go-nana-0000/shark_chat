import './style.css'

import { backendUrl } from "./config.js";
import { marked } from "marked";
import DOMPurify from "dompurify";


const chatForm = document.querySelector("#chatForm");
const messageInput = document.getElementById("messageInput");
const messageParagraph = document.querySelector("#message");
const sendButton = document.getElementById("sendButton");
const sharkImage = document.querySelector(".shark-image");

const agreeButton = document.getElementById("notice-agree");
const overlay = document.getElementById("notice-overlay");

const NOTICE_VERSION = "2026-10"; // 文面を変えて再同意してほしいときに更新
const NOTICE_KEY = "noticeAgreedVersion";

let agreed = hasAgreed();
function hasAgreed() {
  try {
    return localStorage.getItem(NOTICE_KEY) === NOTICE_VERSION;
  } catch {
    return false; // localStorageが使えない環境では毎回表示する
  }
}

function saveAgreement() {
  try {
    localStorage.setItem(NOTICE_KEY, NOTICE_VERSION);
  } catch {
    // 保存できなくても、そのセッション中は使えるようにする
  }
}

if (hasAgreed()) {
  overlay.classList.add("hidden");
}

function applyNoticeState() {
  overlay.classList.toggle("hidden", agreed);
  messageInput.disabled = !agreed;
  sendButton.disabled = !agreed;
}

applyNoticeState();

agreeButton.addEventListener("click", () => {
  saveAgreement();
  agreed = true;
  applyNoticeState();
});

sharkImage.src =
  `${import.meta.env.BASE_URL}shark_captain_neutral.png`;

const expressionImages = {
  neutral: `${import.meta.env.BASE_URL}shark_captain_neutral.png`,
  happy: `${import.meta.env.BASE_URL}shark_captain_smile.png`,
  sad: `${import.meta.env.BASE_URL}shark_captain_sad.png`,
  angry: `${import.meta.env.BASE_URL}shark_captain_angry.png`,
  surprised: `${import.meta.env.BASE_URL}shark_captain_surprised.png`,
  thinking: `${import.meta.env.BASE_URL}shark_captain_thinking.png`,
  embarrassed: `${import.meta.env.BASE_URL}shark_captain_embarrassed.png`,
  scheming: `${import.meta.env.BASE_URL}shark_captain_scheming.png`,
};

document.getElementById("notice-agree").addEventListener("click", () => {
  overlay.classList.add("hidden");
});

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!agreed) return; // 未同意なら何もしない

    const message = messageInput.value.trim();

    if (message.length === 0) {
        messageParagraph.textContent = "メッセージを入力してくれ。";
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent ="送信中"
    messageParagraph.textContent = "サメ船長思考中……";
    sharkImage.src = expressionImages["thinking"];
    const apiUrl = `${backendUrl}/api/chat`;

    if (import.meta.env.DEV) {
        console.log("front:local");
        console.log("back:", apiUrl);
    }
    else {
        console.log("front:cloud");
    }

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();

        if (!response.ok) {
            messageParagraph.textContent = data.error ?? "サメ船長からの返答を取得できませんでした。";
            return;
        }
        const html = await marked(data.reply, { breaks: true });
        messageParagraph.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: ["p", "br", "strong", "em", "b", "i"] });
        messageInput.value = "";
        console.log(data.emotion);
        sharkImage.src = expressionImages[data.emotion] ?? expressionImages.neutral;

    } catch {
        messageParagraph.textContent = "通信に失敗しました。時間をおいて再度お試しください。"
    } finally {
        sendButton.disabled = false;
        sendButton.textContent ="送信"
    }
});

agreeButton.addEventListener("click", () => {
  saveAgreement();
  overlay.classList.add("hidden");
});
