# status-pills

Faixa de "pílulas" logo acima do prompt do Claude Code (no terminal) com o que a status line mostra, num visual mais limpo:

![A faixa de pílulas no terminal: modelo e esforço, contexto, limites de 5 horas e 7 dias, projeto e branch](docs/preview.png)

- modelo e esforço (`Opus 5.5 high`);
- contexto usado (`ctx`), com barra;
- limite de 5 horas, com barra e o tempo que falta para renovar (`↻ 2h54`);
- limite de 7 dias, com barra e a data e hora da renovação (`↻ 11/10 19h`);
- projeto e branch.

As barras ficam verdes abaixo de 50%, amarelas abaixo de 80% e vermelhas daí para cima. Numa janela estreita as barras encurtam, e se ainda não couber as pílulas descem para uma segunda linha. O `[-]` à direita da faixa recolhe a faixa.

## Instalar num computador novo

1. Numa sessão do Claude Code, digite:

   ```
   /plugin install status-pills --marketplace carreirodev/mod-status-pills
   ```

2. Responda `y` para adicionar o marketplace e escolha o escopo de usuário (o primeiro da lista) com Enter. A mensagem `Installed status-pills` confirma; a faixa aparece a partir daí, em toda sessão nova.

Para receber uma versão nova depois: `/plugin marketplace update status-pills` numa sessão.

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
