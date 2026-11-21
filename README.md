# My Life Dashboard — запуск сайта

Что внутри: `index.html`, `style.css`, `app.js` (сайт), `firebase-config.js` (сюда вставишь ключи), `firestore.rules` (защита данных), `manifest.webmanifest`, `icon.svg`, `sw.js` (установка на телефон как приложения).

## Шаг 1. Создай проект Firebase (бесплатно)
1. Открой https://console.firebase.google.com и войди через Google.
2. Нажми «Add project» (Создать проект), придумай имя, например `my-life-dashboard`. Google Analytics можно выключить.

## Шаг 2. Включи вход
1. Слева: **Build → Authentication → Get started**.
2. Вкладка **Sign-in method**: включи **Email/Password**. Если хочешь вход через Google, включи и **Google** (нужно выбрать свою почту поддержки).

## Шаг 3. Создай базу данных
1. Слева: **Build → Firestore Database → Create database**.
2. Режим: **Production mode**. Регион выбери ближайший (например `europe-west`).
3. Открой вкладку **Rules**, удали всё, вставь содержимое файла `firestore.rules`, нажми **Publish**. Эти правила делают так, что каждый видит только свои данные.

## Шаг 4. Получи ключи
1. Нажми шестерёнку ⚙️ → **Project settings**.
2. Внизу в блоке **Your apps** нажми значок `</>` (Web), придумай название, **Register app**.
3. Появится блок `firebaseConfig`. Скопируй значения в файл `firebase-config.js` вместо `ВСТАВЬ_СЮДА`.
   (Эти ключи не секретные: защита данных держится на правилах из шага 3.)

## Шаг 5. Проверь на своём компьютере
Страница не откроется двойным кликом, нужен маленький сервер. В папке сайта выполни:
`python3 -m http.server 8000` и открой http://localhost:8000
(Или в VS Code установи расширение Live Server.) Создай аккаунт и попробуй добавить привычку.

## Шаг 6. Выложи в интернет (бесплатно)
**Вариант А, самый простой: Netlify Drop.**
1. Открой https://app.netlify.com/drop и перетащи туда всю папку сайта.
2. Получишь ссылку вида `https://что-то.netlify.app`.
3. ВАЖНО: в Firebase зайди в **Authentication → Settings → Authorized domains → Add domain** и добавь этот адрес без `https://`. Иначе вход не заработает.

**Вариант Б: Firebase Hosting** (адрес `...web.app` добавится в разрешённые сам).
`npm install -g firebase-tools`, затем `firebase login`, `firebase init hosting` (папка public: `.`, single-page app: No), `firebase deploy`.

## Свой домен и телефон
- Домен (например `mylife.com`) можно подключить в настройках Netlify или Firebase Hosting. Не забудь добавить его в Authorized domains.
- На телефоне открой сайт и выбери «Добавить на главный экран»: он будет открываться как приложение.

## Если что-то не работает
- «Add domain to Authorized domains»: см. шаг 6.
- Белый экран: проверь, что открываешь через http://localhost, а не файлом, и что ключи вставлены.
- Нет сохранения: проверь, что правила из шага 3 опубликованы и в Firestore создана база.
