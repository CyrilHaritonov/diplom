import { FC } from 'react'

const TelegramPage: FC = () => {
  return (
    <div>
      <h2>Интеграция с Telegram</h2>

      {/* Bot Connection Status */}
      <div className="bot-status">
        <h3>Статус подключения</h3>
        {/* Show connection status */}
        {/* Show bot username if connected */}
      </div>

      {/* Connection Instructions */}
      <div className="connection-instructions">
        <h3>Как подключить бота</h3>
        <ol>
          <li>Найдите бота @YourBotName в Telegram</li>
          <li>Начните диалог с ботом</li>
          <li>Введите код подтверждения:</li>
        </ol>
        <div className="verification-code">
          <code>XXXX-XXXX-XXXX</code>
        </div>
      </div>

      {/* Disconnect Button */}
      <button className="disconnect-bot">Отключить бота</button>
    </div>
  )
}

export default TelegramPage 