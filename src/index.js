import {Telegraf} from "telegraf";
import 'dotenv/config';
import fs from 'fs';

const admins = process.env.USERS.split(',');
const activated_file = "data/activated.txt";
let activated = [];

function isUserInList(user) {
    return admins.includes(user);
}

function validateUser(ctx) {
    if (ctx.message.from.username) {
        return isUserInList(ctx.message.from.username);
    } else if (ctx.message.from.id) {
        return isUserInList(ctx.message.from.id);
    }

    return false;
}

function main() {
    const bot = new Telegraf(process.env.BOT_TOKEN);
    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }
    if (fs.existsSync(activated_file)) {
        activated = JSON.parse(fs.readFileSync(activated_file));
    }
    
    bot.start((ctx) => ctx.reply('Привет, я бот для отправки анонимных сообщений! Отправь мне сообщение и я его перешлю получателю анонимно!'));
    bot.help((ctx) => {
        if (!validateUser(ctx)) {
            ctx.reply('Отправь мне сообщение и я его перешлю получателю анонимно!')
        } else {
            ctx.reply('Отправь мне сообщение и я его перешлю получателю анонимно!\n\n' +
                'Команды:\n' +
                '/activate - активировать аккаунт админа\n');
        }
    });
    
    bot.command('activate', (ctx) => {
        if (!validateUser(ctx)) {
            return ctx.reply('Вам не разрешено использовать эту команду!');
        }
        ctx.reply(`Ваш аккаунт активирован!`);
        if (!activated.includes(ctx.chat.id)) {
            activated.push(ctx.chat.id);
        }
        fs.writeFileSync(activated_file, JSON.stringify(activated));
    });

    bot.command('deactivate', (ctx) => {
        if (!validateUser(ctx)) {
            return ctx.reply('Вам не разрешено использовать эту команду!');
        }
        ctx.reply(`Ваш аккаунт деактивирован!`);
        activated.splice(activated.indexOf(ctx.chat.id), 1);
        fs.writeFileSync(activated_file, JSON.stringify(activated));
    });


    bot.on('message', async (ctx) => {
        const message = ctx.message.text;
        const attachment = ctx.message.photo || ctx.message.document || ctx.message.video || ctx.message.voice || ctx.message.audio || ctx.message.sticker;
        let username = "Аноним";
        if (ctx.message.from.username) {
            username = ctx.message.from.username;
        } else {
            username = ctx.message.from.first_name + " " + ctx.message.from.last_name + " (id:" + ctx.message.from.id + ")";
        }
        
        for (let chat_id of activated) {
            await bot.telegram.sendMessage(chat_id, "Новое сообщение от пользователя @" + username);
            await bot.telegram.sendMessage(chat_id, message);
            if (attachment) {
                await bot.telegram.sendCopy(chat_id, attachment);
            }
        }
    });

    bot.launch();
}

main();
