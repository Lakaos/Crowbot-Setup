const Discord = require('discord.js');
const keep_alive = require('./keep_alive.js');  // Assure-toi que ce fichier est bien configuré.
const client = new Discord.Client({
    fetchAllMembers: true,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES'],
    intents: [
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_BANS,
        Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Discord.Intents.FLAGS.GUILD_INTEGRATIONS,
        Discord.Intents.FLAGS.GUILD_INVITES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING,
        Discord.Intents.FLAGS.GUILD_PRESENCES,
        Discord.Intents.FLAGS.GUILD_VOICE_STATES,
        Discord.Intents.FLAGS.GUILD_WEBHOOKS,
    ]
});

const { readdirSync } = require("fs");
const db = require('quick.db');
const ms = require("ms");
const { MessageEmbed } = require('discord.js');
const { login } = require("./util/login.js");

// Initialisation des collections pour les commandes
client.commands = new Discord.Collection();

login(client);

process.on("unhandledRejection", err => {
    if (err.message) return;
    console.error("Uncaught Promise Error: ", err);
});

const loadCommands = (dir = "./commands/") => {
    readdirSync(dir).forEach(dirs => {
        const commands = readdirSync(`${dir}/${dirs}/`).filter(files => files.endsWith(".js"));

        for (const file of commands) {
            const command = require(`${dir}/${dirs}/${file}`);
            client.commands.set(command.name, command);
            console.log(`> Commande chargée: ${command.name} [${dirs}]`);  // Ajout du log pour vérifier le chargement
        };
    });
};

const loadEvents = (dir = "./events/") => {
    readdirSync(dir).forEach(dirs => {
        const events = readdirSync(`${dir}/${dirs}/`).filter(files => files.endsWith(".js"));

        for (const event of events) {
            const evt = require(`${dir}/${dirs}/${event}`);
            const evtName = event.split(".")[0];
            client.on(evtName, evt.bind(null, client));
            console.log(`> Event chargé: ${evtName}`);  // Ajout du log pour vérifier le chargement
        };
    });
};

// Chargement des événements et des commandes
loadEvents();
loadCommands();

// Gestionnaire de commandes
client.on('messageCreate', message => {
    const prefix = "+";  // Assure-toi que le préfixe est correctement défini

    // Vérification du préfixe et de l'auteur du message (ignore les messages du bot)
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Séparation des arguments et extraction de la commande
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Recherche de la commande dans la collection
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        // Exécution de la commande
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Il y a eu une erreur en exécutant cette commande.');
    }
});

// Connexion du bot
client.login(process.env.TOKEN);

