const WebSocket = require('ws')
const Discord = require('discord.js')
const dotenv = require('dotenv')
const fetch = require('node-fetch')
dotenv.config()

const client = new Discord.Client({
    intents: [ Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES ]
})

var bot
var body

client.once('ready', async () => {
    
    console.log(`Loaded Discord bot: ${client.user.tag}`)

    try {
        const socket = new WebSocket('wss://s-usc1b-nss-2123.firebaseio.com/.ws?v=5&ns=chai-959f8-default-rtdb')

        socket.onopen = () => {
            socket.send(JSON.stringify({"t":"d","d":{"r":2,"a":"q","b":{"p":"/botConfigs/bots/" + process.env.CHAI_BOT_ID,"h":""}}}))
            socket.onmessage = (event) => {
                if (JSON.parse(event.data).d.b?.p) {
                    bot = JSON.parse(event.data).d.b.d
    
                    body = {
                        "text": `${bot.prompt}\n${bot.botLabel}: ${bot.firstMessage}`,
                        "temperature": bot.temperature,
                        "repetition_penalty": bot.repetitionPenalty,
                        "model": bot.model,
                        "top_p": bot.topP,
                        "top_k": bot.topK,
                        "response_length": bot.responseLength,
                        "stop_sequences": [
                            "\n",
                            `${bot.botLabel}:`,
                            `${bot.userLabel}:`
                        ]
                    }
                    console.log(`Fetched bot data: ${bot.name}`)
                }
            }
        }
    } catch (error) {
        throw new Error(`Error while connecting to websocket: ${error}`)
    }
})

client.on('messageCreate', message => {
    if (message.author.bot || message.channel.id != process.env.DISCORD_CHANNEL_ID || !bot) return

    body.text += `\n${bot.userLabel}: ${message}\n${bot.botLabel}:`
    message.channel.sendTyping()
    
    fetch("https://europe-west2-chai-959f8.cloudfunctions.net/gptj_v2", {
        "headers": {
            "content-type": "application/json",
            "developer_key": process.env.CHAI_DEV_KEY,
            "developer_uid": process.env.CHAI_DEV_UID,
        },
        "body": JSON.stringify(body),
        "method": "POST"
    }).then(res => res.json()).then(d => {
            body.text += d.data

            message.reply({
                content: d.data
            }).catch(error => {
                throw new Error(`Error while sending the message: ${error}`)
            })
        })
})

client.login(process.env.DISCORD_BOT_TOKEN)