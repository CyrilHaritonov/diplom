import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import cors from "cors";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN as string;
const BACKEND_URL = process.env.BACKEND_URL;

const bot = new TelegramBot(token, { polling: true });

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

const router = express.Router();

router.post('/send-message', async (req, res) => {
    const { username, workspace_name, timestamp, subject, action, chatId } = req.body;

    if (!chatId) {
        res.status(400).json({ error: 'chatId is required' });
        return;
    }

    const message = `Пользователь: ${username}\nРабочее пространство: ${workspace_name}\nДата: ${new Date(timestamp).toLocaleString("ru-RU")}\nСущность: ${subject}\nДействие: ${action}`;
    
    await sendMessage(chatId, message);
    res.json({ success: true, message: 'Message sent successfully' });
});

export default router;

app.use(router);

app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});



async function sendMessage(chatId: string, message: string) {
  try {
      await bot.sendMessage(chatId, message);
      console.log(`Message sent to ${chatId}: ${message}`);
  } catch (error) {
      console.error('Error sending message:', error);
  }
}



bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  // Check if the message is a command
  if (userMessage && userMessage.startsWith('/')) {
    // Process the command separately
    await handleCommand(chatId, userMessage);
  } else {
    // The code is sent as a whole message
    const code = userMessage?.trim();
    if (code) {
      try {
        // Make a PUT request to update the chat binding using the backend URL
        const response = await axios.put(`${BACKEND_URL}/chat-bindings`, {
          chat_id: chatId.toString(), // Convert chatId to string if necessary
          code: code,
        }, {
          headers: {
            'X-Requested-By': process.env.ORIGINS_HEADER,
          }
        });

        // Send success message
        bot.sendMessage(chatId, `Код успешно обновлен: ${response.data.code}`);
      } catch (error) {
        console.error('Ошибка при обновлении кода:', error);
        bot.sendMessage(chatId, 'Произошла ошибка при обновлении кода. Пожалуйста, попробуйте еще раз.');
      }
    } else {
      bot.sendMessage(chatId, 'Пожалуйста, отправьте код в формате: "code: YOUR_CODE"');
    }
  }
});

// Function to handle commands
const handleCommand = async (chatId: number, command: string) => {
  switch (command) {
    case '/start':
      bot.sendMessage(chatId, 'Добро пожаловать! Чтобы авторизироваться отправтьте боту код, отображающийся в Secret Storage. Используйте /help для получения списка команд.');
      break;
    case '/help':
      bot.sendMessage(chatId, 'Доступные команды:\n/start - Начать взаимодействие\n/help - Показать это сообщение');
      break;
    default:
      bot.sendMessage(chatId, 'Неизвестная команда. Пожалуйста, используйте /help для получения списка команд.');
      break;
  }
};

console.log('Bot is running...');