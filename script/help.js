module.exports.config = {
    name: 'help',
    version: '1.0.0',
    role: 0,
    hasPrefix: false,
    aliases: ['help'],
    description: "Beginner's guide",
    usage: "Help [page] or [command]",
    credits: 'ARI',
};

module.exports.run = async function({
    api,
    event,
    enableCommands,
    args,
    Utils,
    prefix
}) {
    const input = args.join(' ');
    try {
        const eventCommands = enableCommands[1].handleEvent;
        const commands = enableCommands[0].commands;

        if (!input) {
            const pages = 999;
            let page = 1;
            let start = (page - 1) * pages;
            let end = start + pages;

            let helpMessage = `✦ ━━ ✦ 𝑩𝑶𝑻 𝑯𝑬𝑳𝑷 ✦ ━━ ✦\n\n📜 Command List 📜\n\n`;

            for (let i = start; i < Math.min(end, commands.length); i++) {
                helpMessage += `╭〔${i + 1}〕 ${prefix}${commands[i]}\n╰───────────────\n`;
            }

            helpMessage += `\n🎯 Event List 🎯\n\n`;
            eventCommands.forEach((eventCommand, index) => {
                helpMessage += `╭〔${index + 1}〕 ${prefix}${eventCommand}\n╰───────────────\n`;
            });

            helpMessage += `\n✦ Page ${page}/${Math.ceil(commands.length / pages)} ✦\n`;
            helpMessage += `Type: ${prefix}help [page] | ${prefix}help [command]`;

            api.sendMessage(helpMessage, event.threadID, event.messageID);

        } else if (!isNaN(input)) {
            const page = parseInt(input);
            const pages = 999;
            let start = (page - 1) * pages;
            let end = start + pages;

            let helpMessage = `✦ ━━ ✦ Command List ✦ ━━ ✦\n\n`;

            for (let i = start; i < Math.min(end, commands.length); i++) {
                helpMessage += `〔${i + 1}〕 ${prefix}${commands[i]}\n`;
            }

            helpMessage += `\n🎯 Event List 🎯\n\n`;
            eventCommands.forEach((eventCommand, index) => {
                helpMessage += `〔${index + 1}〕 ${prefix}${eventCommand}\n`;
            });

            helpMessage += `\n✦ Page ${page}/${Math.ceil(commands.length / pages)} ✦`;

            api.sendMessage(helpMessage, event.threadID, event.messageID);

        } else {
            const command = [...Utils.handleEvent, ...Utils.commands]
                .find(([key]) => key.includes(input?.toLowerCase()))?.[1];

            if (command) {
                const {
                    name,
                    version,
                    role,
                    aliases = [],
                    description,
                    usage,
                    credits,
                    cooldown,
                    hasPrefix
                } = command;

                const roleMessage = role !== undefined ? 
                    (role === 0 ? '• Permission: User' : 
                    (role === 1 ? '• Permission: Admin' : 
                    (role === 2 ? '• Permission: Thread Admin' : 
                    (role === 3 ? '• Permission: Super Admin' : '')))) : '';

                const aliasesMessage = aliases.length ? `• Aliases: ${aliases.join(', ')}\n` : '';
                const descriptionMessage = description ? `• Description: ${description}\n` : '';
                const usageMessage = usage ? `• Usage: ${usage}\n` : '';
                const creditsMessage = credits ? `• Credits: ${credits}\n` : '';
                const versionMessage = version ? `• Version: ${version}\n` : '';
                const cooldownMessage = cooldown ? `• Cooldown: ${cooldown} second(s)\n` : '';

                const message = `☄️ 〔 Command Info 〕 ☄️\n\n• Name: ${name}\n${versionMessage}${roleMessage}\n${aliasesMessage}${descriptionMessage}${usageMessage}${creditsMessage}${cooldownMessage}`;

                api.sendMessage(message, event.threadID, event.messageID);

            } else {
                api.sendMessage('⚠️ Command not found.', event.threadID, event.messageID);
            }
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports.handleEvent = async function({
    api,
    event,
    prefix
}) {
    const { threadID, messageID, body } = event;
    const message = prefix ? 'This is my prefix: ' + prefix : "𝗠𝘆 𝗽𝗿𝗲𝗳𝗶𝘅 𝗶𝘀...";
    if (body?.toLowerCase().startsWith('prefix')) {
        api.sendMessage(message, threadID, messageID);
    }
};
