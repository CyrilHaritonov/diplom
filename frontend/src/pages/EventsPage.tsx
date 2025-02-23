import { FC } from 'react'

interface Log {
  id: string;
  user_id: string;
  action: string;
  subject: string;
  timestamp: Date;
  workspace_id?: string;
  subject_name?: string;
}

interface EventBinding {
  id: string;
  user_id: string;
  type: string;
}

const EventsPage: FC = () => {
  return (
    <div>
      <h2>События</h2>

      {/* Event Bindings Configuration */}
      <div className="event-bindings">
        <h3>Настройка уведомлений</h3>
        <form>
          {/* Checkboxes for different event types */}
          <div className="event-types">
            <label><input type="checkbox" /> Создание</label>
            <label><input type="checkbox" /> Чтение</label>
            <label><input type="checkbox" /> Обновление</label>
            <label><input type="checkbox" /> Удаление</label>
          </div>
        </form>
      </div>

      {/* Events Log */}
      <div className="events-log">
        <h3>Журнал событий</h3>
        {/* Filter controls */}
        <div className="filters">
          <select>
            <option>Все действия</option>
            {/* Add action types */}
          </select>
          <select>
            <option>Все объекты</option>
            {/* Add subject types */}
          </select>
        </div>

        {/* Log entries list */}
        <div className="log-entries">
          {/* Map through logs */}
          {/* Each log entry should show: */}
          {/* - Timestamp */}
          {/* - Action */}
          {/* - Subject */}
          {/* - User */}
          {/* - Workspace (if applicable) */}
        </div>

        {/* Export button */}
        <button>Экспорт логов</button>
      </div>
    </div>
  )
}

export default EventsPage 