from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID, uuid4

from app.database import get_db
from app.models import ChatSession, ChatMessage, Employee
from app.schemas import ChatRequest, ChatResponse, ChatMessageOut, ChatSessionOut
from app.routers.auth import get_current_user_id

router = APIRouter()


def generate_ai_response(user_message: str) -> str:
    msg = user_message.lower()

    # Приветствия
    if any(word in msg for word in ["привет", "здравствуй", "хай", "hello", "hi"]):
        return (
            "Привет! 👋 Я твой AI-наставник в T&D Platform.\n\n"
            "Я могу помочь тебе с:\n"
            "• **Подбором курсов** — подскажу, что изучать для роста\n"
            "• **Карьерным треком** — расскажу, какие навыки нужны для следующего грейда\n"
            "• **Онбордингом** — помогу разобраться в первые недели\n"
            "• **IDP** — составлю план развития на квартал\n"
            "• **Встречами** — подготовлю повестку для 1-on-1\n\n"
            "Чем могу помочь сегодня?"
        )

    # Курсы и обучение
    if any(word in msg for word in ["курс", "обучен", "learn", "учиться", "учеба", "тренинг", "материал"]):
        return (
            "Вот курсы, которые я рекомендую именно тебе:\n\n"
            "**Для технического роста:**\n"
            "1. **System Design Fundamentals** — повысит архитектурное мышление\n"
            "2. **Advanced CI/CD with GitLab** — закроет пробелы в автоматизации\n"
            "3. **Go for Backend Developers** — расширит стек технологий\n\n"
            "**Для soft skills:**\n"
            "4. **Управление командой** — если думаешь о переходе в Lead\n"
            "5. **Технические презентации** — научит доносить сложные идеи просто\n\n"
            "Хочешь, я добавлю подходящие в твой **ИПР** на Q2?"
        )

    # Карьера и рост
    if any(word in msg for word in ["карьер", "рост", "senior", "lead", "повышение", "грейд", "продвижение", "развитие карьеры"]):
        return (
            "Давай разберём твой карьерный путь! 📈\n\n"
            "**Текущая позиция:** Middle Backend Developer\n"
            "**Цель:** Senior Backend Developer\n\n"
            "**Что нужно усилить:**\n"
            "• **System Design** — сейчас уровень 2, нужен 4\n"
            "• **Kubernetes** — сейчас 3, нужен 4\n"
            "• **Go** — новый язык, стоит освоить на базовом уровне\n"
            "• **Менторство** — Senior должен расти команду\n\n"
            "**Примерный таймлайн:** 8–10 месяцев при регулярном обучении 5–7 ч/неделю.\n\n"
            "Хочешь, я составлю подробный план с курсами и дедлайнами?"
        )

    # Онбординг
    if any(word in msg for word in ["онбординг", "новичок", "первая недел", "первый день", "новый сотрудник", "адаптация"]):
        return (
            "Приветствую в команде! 🎉 Вот твой чек-лист на первую неделю:\n\n"
            "**День 1 — обязательное:**\n"
            "1. Завершить **вводный курс по безопасности** (Corporate Security Basics)\n"
            "2. Настроить рабочее окружение — VPN, доступы, ПО\n"
            "3. Встретиться с buddy и руководителем\n\n"
            "**Дни 2–3:**\n"
            "4. Ознакомиться с архитектурой сервиса и документацией\n"
            "5. Пройти **Kubernetes Basics** (ролевой курс)\n\n"
            "**Дни 4–5:**\n"
            "6. Первый code review в команде\n"
            "7. Завести **ИПР** на квартал вместе с руководителем\n\n"
            "Если что-то непонятно — спрашивай, я на связи!"
        )

    # Встречи и 1-on-1
    if any(word in msg for word in ["встреч", "1-on-1", "one on one", "one-on-one", "повестка", "встреча с руководителем", "1on1"]):
        return (
            "Готов помочь с планированием встречи! 📅\n\n"
            "**Шаблон повестки для 1-on-1 с руководителем:**\n\n"
            "1. **Обратная связь** по прошедшему спринту/периоду\n"
            "2. **Обучение** — прогресс по курсам, что было полезно\n"
            "3. **Блокеры** — что мешает работать эффективнее\n"
            "4. **Цели** — корректировка ИПР и карьерного плана\n"
            "5. **Развитие** — новые навыки, которые хочется освоить\n\n"
            "Укажи участников и предпочтительное время — я подберу оптимальный слот в календаре."
        )

    # IDP и план развития
    if any(word in msg for word in ["идп", "idp", "план развития", "индивидуальный план", "цель", "цели на квартал", "q2", "q3", "квартал"]):
        return (
            "Давай составим ИПР на Q2! 🎯\n\n"
            "**На основе твоего профиля предлагаю:**\n\n"
            "**Технические цели:**\n"
            "• Завершить **System Design Fundamentals** (до 15 июня)\n"
            "• Освоить **GitLab CI/CD** на уровне настройки пайплайнов (до 1 мая)\n"
            "• Пройти 2 code review на Go\n\n"
            "**Soft skills:**\n"
            "• Подготовить и провести tech talk для команды\n"
            "• Пройти курс **Технические презентации**\n\n"
            "**Менторство:**\n"
            "• Стать buddy для нового сотрудника\n\n"
            "Хочешь, я formalизую это в виде ИПР-задач в системе?"
        )

    # Навыки и компетенции
    if any(word in msg for word in ["навык", "скилл", "компетенци", "skill", "что умею", "сильные стороны", "пробел"]):
        return (
            "Вот твоя текущая матрица компетенций:\n\n"
            "**Сильные стороны 💪**\n"
            "• **Kubernetes** — уровень 3 (Middle+)\n"
            "• **Docker** — уровень 4 (Senior)\n"
            "• **CI/CD** — уровень 3 (Middle+)\n\n"
            "**Зоны роста 📈**\n"
            "• **System Design** — уровень 2 (Junior), рекомендую повышать\n"
            "• **Go** — не зафиксирован, стоит освоить для бэкенд-стека\n"
            "• **Менторство** — развивается, пока уровень 2\n\n"
            "**Рекомендация:** сфокусируйся на System Design в ближайшие 3 месяца — это ключевой навык для перехода на Senior."
        )

    # Мотивация и выгорание
    if any(word in msg for word in ["мотиваци", "выгорание", "устал", " burnout", "не хочу", "скучно", "интересно", "вдохновение"]):
        return (
            "Понимаю тебя, это важная тема. 🤝\n\n"
            "**Что могу предложить:**\n\n"
            "1. **Сменить фокус** — попробуй курс из смежной области:\n"
            "   • Data Engineering (Spark, Airflow) — новый вызов\n"
            "   • ML/AI — если интересует будущее технологий\n"
            "   • DevOps/SRE — системный взгляд на инфраструктуру\n\n"
            "2. **Пет-проект** — возьми задачу вне работы, чтобы поэкспериментировать\n\n"
            "3. **Менторство** — поделиться знаниями с junior часто возвращает мотивацию\n\n"
            "4. **1-on-1 с руководителем** — обсуди смену проекта или роли в команде\n\n"
            "Если хочешь — составлю план «перезагрузки» с конкретными шагами."
        )

    # Зарплата и бонусы (HR-вопросы)
    if any(word in msg for word in ["зарплат", "зп", "оклад", "бонус", "премия", "review", "performance review", "аттестаци", "оценка"]):
        return (
            "Я не имею доступа к данным о зарплате, но могу подготовить тебя к performance review! 📊\n\n"
            "**Что стоит подготовить:**\n\n"
            "1. **Достижения за период** — конкретные метрики и проекты\n"
            "2. **Обучение** — список пройденных курсов и применённых навыков\n"
            "3. **Обратная связь** — что получил от коллег и заказчиков\n"
            "4. **Цели на следующий период** — готовый ИПР\n\n"
            "**По карьерному росту:**\n"
            "Для повышения грейда нужно закрыть пробелы в матрице компетенций.\n\n"
            "Для вопросов по компенсации рекомендую обратиться к **HR-партнёру** — я могу помочь найти контакт."
        )

    # Поиск по базе знаний
    if any(word in msg for word in ["найти", "поиск", "где", "как", "документаци", "wiki", "база знаний", "confluence", "notion"]):
        return (
            "Я могу направить тебя к нужным ресурсам! 🔍\n\n"
            "**Внутренние источники:**\n"
            "• **Confluence** — архитектура сервисов, runbooks, постмортемы\n"
            "• **GitLab Wiki** — технические гайды по кодстайлу и процессам\n"
            "• **LMS** — все курсы и материалы для самообучения\n"
            "• **HR-портал** — политики, бенефиты, организационная структура\n\n"
            "**Уточни, пожалуйста:**\n"
            "• Какой конкретно вопрос тебя интересует?\n"
            "• Это про технологию, процесс или организационный момент?\n\n"
            "Тогда я дам точную ссылку или объясню сам."
        )

    # Благодарность / прощание
    if any(word in msg for word in ["спасибо", "благодар", "пока", "до свидан", "bye", "thanks", "thx"]):
        return (
            "Всегда рад помочь! 🙌\n\n"
            "Если появятся вопросы — обращайся в любое время.\n"
            "Удачи в обучении и развитии! 🚀"
        )

    # Fallback
    return (
        "Интересный вопрос! 🤔\n\n"
        "Я фиксирую его в твоей истории. Давай уточним тему, и я помогу подробнее:\n\n"
        "• **Обучение** — подбор курсов и материалов\n"
        "• **Карьера** — план роста и матрица компетенций\n"
        "• **Онбординг** — помощь новым сотрудникам\n"
        "• **ИПР** — индивидуальный план развития\n"
        "• **Встречи** — планирование 1-on-1\n\n"
        "Или задай вопрос конкретнее — я разберусь!"
    )


@router.get("/history", response_model=ChatSessionOut)
def chat_history(
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    session = db.query(ChatSession).filter(ChatSession.user_id == user_id).order_by(ChatSession.created_at.desc()).first()
    if not session:
        session = ChatSession(id=uuid4(), user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()
    session.messages = msgs
    return session


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    session_id = req.session_id
    if not session_id:
        session = ChatSession(id=uuid4(), user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        session_id = session.id
    else:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    user_msg = ChatMessage(id=uuid4(), session_id=session_id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    ai_content = generate_ai_response(req.message)
    ai_msg = ChatMessage(id=uuid4(), session_id=session_id, role="assistant", content=ai_content)
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatResponse(
        message=ChatMessageOut.model_validate(ai_msg),
        session_id=session_id,
    )
