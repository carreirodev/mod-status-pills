# status-pills

Faixa de "pílulas" colada no prompt do Claude Code, com o que a status line mostra, num visual mais limpo. No terminal ela fica logo abaixo do prompt, embaixo da linha de dicas e do modo de permissão; na aba Code do app desktop, logo acima da caixa de texto:

![A faixa de pílulas no terminal: modelo e esforço, contexto, limites de 5 horas e 7 dias, projeto e branch](docs/preview.png)

- modelo e esforço (`Opus 5.5 high`);
- contexto usado (`ctx`), com barra;
- limite de 5 horas, com barra e o tempo que falta para renovar (`2h54`);
- limite de 7 dias, com barra e a data e hora da renovação (`11/10 19h`);
- projeto e branch.

As barras ficam verdes abaixo de 50%, amarelas abaixo de 80% e vermelhas daí para cima. Numa janela estreita as barras encurtam, e se ainda não couber as pílulas descem para uma segunda linha, com as duas linhas centralizadas.

No terminal, a linha de dicas do Claude Code continua como ele a desenha, logo acima das pílulas. O que outros mods põem embaixo dela (o botão do launchpad, por exemplo) também fica, acima ou abaixo das pílulas conforme a ordem em que os mods carregam.

No app desktop, a linha embaixo da caixa de texto é do próprio app (o modo de permissão, o modelo), e ele não deixa os mods desenharem nela. Por isso lá as pílulas ficam na faixa acima da caixa, sempre por último, coladas nela. O que outros mods desenham nessa faixa (os botões do prompt-enhancer, por exemplo) fica acima das pílulas.

Essa posição depende da ordem em que o Claude Code carrega os mods, que um mod não escolhe. Os mods carregados de uma pasta (`--plugin-dir` ou `CLAUDE_CODE_PLUGIN_DIRS`, como em [Editar o mod](#editar-o-mod)) vêm antes dos instalados pelo marketplace; vindo antes, o status-pills recebe a faixa dos outros pronta e se põe embaixo dela. Instalado pelo marketplace, ele entra na fila dos outros mods instalados, na ordem que o Claude Code decidir: um mod que venha antes dele e desenhe a faixa sozinho, sem deixar os de baixo desenharem, esconde as pílulas no desktop (o prompt-enhancer 0.2.0 faz isso).

No terminal cada pílula ocupa uma linha, com fundo colorido e pontas arredondadas; os ícones pedem uma [Nerd Font](https://www.nerdfonts.com/) no terminal. No app desktop as pílulas são desenhadas como figuras, nas cores do tema claro ou escuro.

No WSL e no Linux, o Claude Code só usa cores reais quando o terminal anuncia que as tem. Confira com `echo $COLORTERM`: se não aparecer `truecolor`, as cores são reduzidas a uma paleta de 256, e os ícones e as barras perdem o tom exato. Se o terminal desenha cores reais, como o Windows Terminal, acrescente `export COLORTERM=truecolor` ao `~/.bashrc` (ou ao `~/.zshrc`) e abra um terminal novo antes de iniciar o Claude Code.

## Instalar num computador novo

1. Numa sessão do Claude Code, digite:

   ```
   /plugin install status-pills --marketplace carreirodev/mod-status-pills
   ```

2. Responda `y` para adicionar o marketplace e escolha o escopo de usuário (o primeiro da lista) com Enter. A mensagem `Installed status-pills` confirma; a faixa aparece a partir daí, em toda sessão nova.

## Atualizar para uma versão nova

A atualização não é automática: cada computador que instalou pelo marketplace precisa pedir a versão nova.

1. No terminal, fora do Claude Code, rode:

   ```
   claude plugin update status-pills@status-pills
   ```

   A resposta diz de qual versão para qual foi, por exemplo `updated from 0.2.2 to 0.2.3`. Se já estiver na última, ela diz `already at the latest version`.

2. Abra uma sessão nova do Claude Code, ou rode `/reload-plugins` numa sessão já aberta. A sessão que estava aberta durante a atualização continua com a versão antiga até isso.

Dentro de uma sessão, `/plugin marketplace update status-pills` faz o mesmo que o passo 1.

O WSL tem a sua própria instalação do Claude Code, separada da do Windows: rode o passo 1 dentro do WSL também.

Para conferir a versão instalada, rode `claude plugin list` e procure `status-pills@status-pills`.

Para não ter de lembrar: em `/plugin`, na aba **Marketplaces**, escolha `status-pills` e depois **Enable auto-update**. Daí em diante, cada sessão nova busca a versão nova sozinha e avisa com `Plugin updated: status-pills · Run /reload-plugins to apply`.

## Editar o mod

Para mexer no mod, use a pasta clonada em vez da instalação acima (um jeito ou o outro, não os dois):

1. Clone o repositório:

   ```
   git clone https://github.com/carreirodev/mod-status-pills.git C:\Users\SEU_USUARIO\mods\status-pills
   ```

2. Em `~/.claude/settings.json`, no bloco `env`, acrescente essa pasta a `CLAUDE_CODE_PLUGIN_DIRS`. Várias pastas são separadas por `;` no Windows:

   ```json
   "env": {
     "CLAUDE_CODE_PLUGIN_DIRS": "C:\\Users\\SEU_USUARIO\\mods\\agents-panel;C:\\Users\\SEU_USUARIO\\mods\\status-pills"
   }
   ```

3. Abra uma sessão nova. Daí em diante, cada mudança salva na pasta recarrega o mod ao fim da resposta do Claude.

Antes de subir uma mudança, rode na pasta do mod:

```
claude plugin validate .
claude plugin test .
```

E aumente `version` em `.claude-plugin/plugin.json`: os computadores que instalaram pelo marketplace só recebem a mudança quando a versão muda.
