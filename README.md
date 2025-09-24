<!-- Animated SVG Banner -->

<div align="center">
  <!-- Animated typing SVG banner: "Welcome to AutoBot" -->
  <svg xmlns="http://www.w3.org/2000/svg" width="820" height="140" viewBox="0 0 820 140" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="g" x1="0%" x2="100%">
        <stop offset="0%" stop-color="#7b2ff7" />
        <stop offset="100%" stop-color="#f107a3" />
      </linearGradient>
      <!-- Mask that reveals text like a typing cursor sweep -->
      <mask id="reveal">
        <!-- starts as narrow and grows to reveal text -->
        <rect x="0" y="0" width="0" height="140" fill="white">
          <animate attributeName="width" from="0" to="820" dur="3s" begin="0s" fill="freeze" />
        </rect>
      </mask>
    </defs><!-- background rounded panel -->
<rect x="10" y="10" rx="18" ry="18" width="800" height="120" fill="#0f172a" opacity="0.95" />

<!-- gradient title revealed by mask -->
<text x="46" y="82" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, monospace" font-size="40" font-weight="700" fill="url(#g)" mask="url(#reveal)">
  Welcome to AutoBot
</text>

<!-- subtle cursor blink at the end (positioned after the text) -->
<rect id="cursor" x="378" y="42" width="8" height="46" fill="#ffffff">
  <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" begin="3s"/>
</rect>

<!-- tagline fades in after typing -->
<text x="46" y="110" font-family="Inter, Roboto, Arial, sans-serif" font-size="14" fill="#cbd5e1" opacity="0">
  <tspan id="tag">✨ Automated. Customizable. Aesthetic.</tspan>
  <set attributeName="opacity" to="1" begin="3s" fill="freeze"/>
</text>

  </svg>
</div>
---

🤖 AutoBot

<p align="center">
  <img src="https://i.ibb.co/2tS4zN4/robot-banner.png" width="600" alt="AutoBot Banner"/>
</p><p align="center">  
✨ A customizable chatbot designed to automate tasks, respond to messages, and bring creativity to your conversations.  
</p>  
---

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/Platform-Messenger-blue?style=for-the-badge&logo=messenger" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Made%20With-Love❤️-purple?style=for-the-badge" />
</p>  
---

🌟 Features

⚡ Fast & Lightweight – optimized performance for smooth automation

🎨 Customizable – easy to add or modify commands

🔒 Safe & Secure – no sensitive data leaks

🛠 Modular System – commands are well-structured for easy editing

🎭 Fun Commands – canvas images, games, greetings, and more

🌐 API Ready – integrate external APIs with minimal setup



---

🚀 Installation

# Clone this repository
git clone https://github.com/yourusername/autobot.git  

# Navigate to project
cd autobot  

# Install dependencies
npm install  

# Run the bot
node index.js


---

⚙️ Configuration

🔑 Add your credentials in config.json

📂 Place custom commands inside commands/

🎨 Canvas/image templates in canvas/



---

🖼 Command Preview

Example: Billboard Canvas

<p align="center">
  <img src="https://i.ibb.co/pP7cy0P/sample-command.png" width="500" alt="AutoBot Command Preview"/>
</p>  
---

👨‍💻 Developer

Ari / AJ Chicano 💻

🚀 Passionate about automation and creative bot design


<p align="center">
  <img src="https://i.ibb.co/FYVFrn1/developer-pic.png" width="180" style="border-radius:50%" alt="Developer"/>
</p>  
---

⭐ Support

If you like this project, don’t forget to star the repo ⭐ and share with your friends!

<p align="center">  
Made with ❤️ and ☕ by Ari  
</p>
