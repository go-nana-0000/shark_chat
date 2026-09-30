import './style.css'

const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const messageParagraph = document.querySelector("#message");
const sendButton = document.querySelector("#sendButton");
const sharkImage = document.querySelector(".shark-image");

const expressionImages = {
    neutral: "/shark_captain_neutral.png",
    happy: "/shark_captain_smile.png",
    sad: "/shark_captain_sad.png",
    angry: "/shark_captain_angry.png",
    surprised: "/shark_captain_surprised.png",
    thinking: "/shark_captain_thinking.png",
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

    try {
        const response = await fetch("/api/chat", {
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

        messageParagraph.textContent = data.reply;
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
