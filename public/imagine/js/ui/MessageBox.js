// ui/MessageBox.js – Simple message display (already integrated in UIManager, but kept separate for structure)
export class MessageBox {
    static show(text, duration = 3000) {
        const msgBox = document.getElementById('message-box');
        msgBox.textContent = text;
        msgBox.classList.remove('hidden');
        
        setTimeout(() => {
            msgBox.classList.add('hidden');
        }, duration);
    }
}