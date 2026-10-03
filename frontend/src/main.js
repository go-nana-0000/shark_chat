import './style.css'

import { backendUrl } from "./config.js";
import { marked } from "marked";
import DOMPurify from "dompurify";


const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messageParagraph = document.querySelector("#message");
const sendButton = document.querySelector("#sendButton");
const sharkImage = document.querySelector(".shark-image");

sharkImage.src =
  `${import.meta.env.BASE_URL}shark_captain_neutral.png`;

const expressionImages = {
  neutral: `${import.meta.env.BASE_URL}shark_captain_neutral.png`,
  happy: `${import.meta.env.BASE_URL}shark_captain_smile.png`,
  sad: `${import.meta.env.BASE_URL}shark_captain_sad.png`,
  angry: `${import.meta.env.BASE_URL}shark_captain_angry.png`,
  surprised: `${import.meta.env.BASE_URL}shark_captain_surprised.png`,
  thinking: `${import.meta.env.BASE_URL}shark_captain_thinking.png`,
};

function changeExpression(emotion) {
    switch (emotion) {
        case "happy":
            characterImage.src = "/images/happy.png";
            break;

        case "sad":
            characterImage.src = "/images/sad.png";
            break;

        case "angry":
            characterImage.src = "/images/angry.png";
            break;

        case "surprised":
            characterImage.src = "/images/surprised.png";
            break;

        case "thinking":
            characterImage.src = "/images/thinking.png";
            break;

        default:
            characterImage.src = "/images/neutral.png";
            break;
    }
}

chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (message.length === 0) {
        messageParagraph.textContent = "メッセージを入力してね！";
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent ="送信中"
    messageParagraph.textContent = "サメ船長思考中……";
    sharkImage.src = expressionImages["thinking"];
    const useLocalWorker = import.meta.env.VITE_USE_LOCAL_WORKER === "true";
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

        const html = await marked(data.reply);
        messageParagraph.innerHTML = DOMPurify.sanitize(html);
        // messageParagraph.textContent = data.reply;
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
