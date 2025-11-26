/**
  * Example de pseudo code pour ce qu'il y a faire 
 * POST /telegram-webhook
    body = JSON du Update Telegram
    chat_id = body.message.chat.id
    text    = body.message.text

    # 1. traiter le message
    reply_text = ma_fonction_de_traitement(text)

    # 2. renvoyer une réponse au user :
    POST https://api.telegram.org/bot<TON_TOKEN>/sendMessage
         { "chat_id": chat_id, "text": reply_text }
 */

import Elysia from "elysia";

export const telegramRoutes = new Elysia();
