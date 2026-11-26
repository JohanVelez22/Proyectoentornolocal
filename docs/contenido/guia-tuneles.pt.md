# Guia de túneis locais (Cloudflare e ngrok)

Este guia explica como mostrar um site que roda no seu computador (por exemplo `http://localhost:8000` ou `https://mi-sitio.test`) por meio de um endereço público temporário na internet, de forma segura e sem configurar o seu roteador.

---

## 0. No WolfCore Dev: o jeito mais fácil

Você não precisa digitar comandos. Em **Projetos**, no cartão do seu site, ative o interruptor **Túnel**. O app cuida do resto:
- **pede confirmação antes de publicar** (botão **Publicar**): o site fica na internet enquanto o túnel estiver aberto. Nos sites marcados como **Tem dados reais de clientes** o aviso é mais forte, e com o Expose diretamente não é permitido;
- usa por padrão o túnel rápido da Cloudflare (sem conta). Para escolher outro provedor (Cloudflare com nome, ngrok, Expose ou Tailscale), clique na engrenagem **Opções do túnel**, ao lado do interruptor;
- precisa do Nginx ligado e, com a Cloudflare, do cloudflared instalado em **Serviços**; se faltar algo, o interruptor avisa;
- abre o túnel para o seu site local com o domínio `.test` correto;
- se o site tem uma **Variável de URL base** configurada (no Laravel é detectada a `APP_URL`), grava o link público no seu `.env` enquanto o túnel estiver aberto e o deixa como estava ao fechá-lo;
- mostra o link no cartão, com os botões **Abrir o link público**, **Copiar o link público**, **Mostrar o código QR do link** e **Renovar (novo link)**. O código QR também está em **Ferramentas → Gerador de QR**.

Para fechá-lo, desligue o interruptor **Túnel**. A tela **Túneis** lista os que estão abertos.

Os comandos deste guia servem para entender o que acontece por baixo dos panos ou para usar os túneis fora do app.

---

## 1. O que é um túnel e quando usá-lo

Um **túnel** cria uma ponte temporária e criptografada entre um servidor público na internet e uma porta do seu computador. Quem abrir o endereço público do túnel verá o seu projeto local como se estivesse publicado em um servidor.

Quando vale a pena usá-lo:
- **Mostrar um andamento a um cliente**: você compartilha um link temporário para que ele revise o design ou uma tela sem precisar subir o projeto para uma hospedagem.
- **Testar no celular ou em outro equipamento**: você abre o seu site no telefone com dados móveis (sem estar no mesmo Wi-Fi) para conferir o design responsivo, a câmera ou pagamentos.
- **Receber webhooks no local**: serviços externos (gateways de pagamento, bots, GitHub, mensageria) precisam de um endereço HTTPS público para avisar a sua aplicação quando acontece um evento.

---

## 2. Riscos e regras de segurança

> **ATENÇÃO:** Ao abrir um túnel, **o seu site local fica publicado na internet**. Qualquer pessoa que tenha ou descubra o link pode entrar.

Siga sempre estas regras:
1. **NUNCA abra túneis de sites que contenham dados reais de clientes** (bancos de dados de produção, e-mails reais, documentos, senhas ou chaves ativas). Use sempre dados fictícios ou de teste (usuário `"demo"`, e-mails `@ejemplo.com`).
2. **Feche o túnel assim que terminar** o teste ou a demonstração (`Ctrl+C` no terminal ou pelo botão de parar).
3. **Desative ferramentas perigosas** antes de compartilhar: não exponha painéis de banco de dados (phpMyAdmin/Adminer), rotas de depuração sem senha nem arquivos `.env`.
4. **Não deixe `APP_DEBUG=true`** se for passar o link a terceiros, pois uma página de erro pode mostrar variáveis de ambiente e caminhos internos do seu computador.

---

## 3. Cloudflare rápido (`trycloudflare`)

É a forma mais rápida de obter um link HTTPS temporário: **não exige conta** nem domínio próprio.

### Comando básico

Se o seu projeto roda na porta `8000` (por exemplo FastAPI, Vite ou PHP):

```bash
cloudflared tunnel --url http://localhost:8000
```

Se o seu site passa pelo Nginx local com um domínio `.test` (por exemplo `mi-sitio.test` na porta `80`), informe também o domínio, porque o Nginx escolhe o site de acordo com o cabeçalho `Host`:

```bash
cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test
```

Em poucos segundos você verá uma URL temporária parecida com:

```text
https://ejemplo-aleatorio.trycloudflare.com
```

### Limitações do `trycloudflare`
- O endereço **muda a cada vez** que você fecha e abre o túnel de novo.
- Foi pensado para testes curtos e demonstrações, **não para produção**.
- Não oferece SLA nem painel de inspeção de tráfego local como o ngrok.
- Se você reiniciar o processo, terá que colar a nova URL nos seus webhooks ou enviá-la outra vez ao cliente.

---

## 4. Cloudflare com domínio próprio (túnel com nome)

Se você precisa de um endereço fixo (por exemplo `demo.ejemplo.com`) e tem um domínio gerenciado na Cloudflare, pode criar um túnel com nome.

> Nos exemplos a seguir, substitua `ejemplo.com` pelo seu domínio de teste e `mi-tunel-demo` pelo nome que você escolher.

### Passo 1: Entrar na Cloudflare

```bash
cloudflared tunnel login
```

O navegador será aberto para você escolher o domínio que deseja autorizar, e um certificado será guardado no seu computador.

### Passo 2: Criar o túnel

```bash
cloudflared tunnel create mi-tunel-demo
```

A Cloudflare atribuirá um identificador (UUID) e guardará o arquivo de credenciais local do túnel.

### Passo 3: Associar um subdomínio DNS

```bash
cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com
```

Isso cria um registro CNAME na Cloudflare apontando `demo.ejemplo.com` para o seu túnel.

### Passo 4: Executar o túnel

Você pode iniciá-lo diretamente apontando para a sua porta local:

```bash
cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo
```

Quando não quiser mais publicar o site, pressione `Ctrl+C` no terminal.

### Passo 5: Apagar o túnel quando não precisar mais dele

```bash
cloudflared tunnel cleanup mi-tunel-demo
cloudflared tunnel delete mi-tunel-demo
```

Lembre-se de remover também o registro DNS de teste no painel da Cloudflare se não for reutilizar o subdomínio.

---

## 5. ngrok

O `ngrok` é outra ferramenta muito popular para túneis locais. A grande vantagem dele para desenvolvedores é o **inspetor local**, que permite ver e reenviar cada requisição HTTP (ideal para depurar webhooks).

### Instalação e configuração inicial

1. Baixe e instale o `ngrok` (ou use a versão instalada no seu ambiente).
2. Crie uma conta gratuita no ngrok e copie o seu token de autenticação.
3. Registre o seu token uma única vez (troque `TU_TOKEN` pelo seu token real):

```bash
ngrok config add-authtoken TU_TOKEN
```

### Abrir um túnel para uma porta local

```bash
ngrok http 8000
```

### Abrir um túnel para um site com domínio `.test` (Nginx)

O Nginx escolhe o site de acordo com o cabeçalho `Host`, então o ngrok deve enviá-lo com o seu domínio local. Aponte para a porta HTTP (`80`): o ngrok já entrega o link público com HTTPS.

```bash
ngrok http 80 --host-header=mi-sitio.test
```

> **Nota:** nas versões recentes do ngrok, `--host-header` está marcado como obsoleto. O recomendado é uma *política de tráfego* (um arquivo YAML que reescreve o cabeçalho `Host`) passada com `--traffic-policy-file`. Se a sua versão avisar que a opção está obsoleta, consulte a documentação oficial de *Traffic Policy* do ngrok. O WolfCore Dev já usa a política de tráfego para você.

> **Evite** `ngrok http 443`: assim o ngrok fala em HTTP sem criptografia com uma porta que espera HTTPS, e o site falha. Se você realmente precisa da porta 443, o endereço deve começar com `https://` (`ngrok http https://localhost:443 ...`) e o certificado local deve ser confiável.

### Inspetor local

Enquanto o ngrok estiver rodando, abra no seu navegador:

```text
http://127.0.0.1:4040
```

Ali você verá ao vivo cada requisição que chega pelo túnel (cabeçalhos, JSON, código HTTP) e poderá clicar em **Replay** para disparar um webhook de novo sem precisar repetir a ação no serviço externo.

### Limites do plano gratuito (em termos gerais)
- Exige conta e `authtoken`.
- Na primeira vez que um visitante abre o link em um navegador, o ngrok mostra uma tela de aviso intersticial que o usuário deve aceitar.
- Existem limites na quantidade de túneis simultâneos, no tráfego mensal e nas conexões ativas, que podem mudar conforme as condições vigentes do ngrok.

---

## 6. Problemas comuns e como resolvê-los

### Erro `502 Bad Gateway`
- **Causa:** o túnel está ativo, mas não há nenhum serviço escutando na porta local indicada, ou o PHP (php-cgi no Windows, PHP-FPM no Linux e no macOS) ou o seu servidor de desenvolvimento está desligado.
- **Solução:** verifique primeiro no seu próprio computador que `http://localhost:PUERTO` ou `https://mi-sitio.test` abre bem antes de iniciar o túnel.

### `"Invalid Host header"` (Vite, Webpack, Angular, Django)
- **Causa:** o servidor de desenvolvimento bloqueia requisições cujo cabeçalho `Host` não coincide com `localhost`.
- **Solução:** permita o host do túnel na configuração de desenvolvimento (por exemplo `server.allowedHosts` no Vite ou `ALLOWED_HOSTS` no Django) somente enquanto durar o teste.

### Redirecionamentos inesperados para `http://` ou para `mi-sitio.test`
- **Causa:** a sua aplicação ou o Nginx gera URLs absolutas usando o domínio local ou o esquema `http` porque não confia nos cabeçalhos do proxy (`X-Forwarded-Proto`, `X-Forwarded-Host`).
- **Solução:** configure a aplicação para confiar em proxies (no Laravel, revise o `TrustProxies`; no FastAPI/uvicorn, use `--proxy-headers`).

### `APP_URL` no Laravel
- **Causa:** se `APP_URL=http://mi-sitio.test` no `.env`, os links de e-mails, redirecionamentos ou rotas assinadas apontarão para `mi-sitio.test` (que não existe no celular do cliente).
- **Solução:** durante a demonstração, atualize temporariamente a `APP_URL` para a URL HTTPS do túnel e execute `php artisan config:clear`. Ao terminar, volte a deixar a sua `APP_URL` local.

### Cookies, sessão e erro `419 Page Expired` (CSRF)
- **Causa:** `SESSION_DOMAIN` no `.env` está fixado em `mi-sitio.test` (o navegador descarta o cookie ao visitar o domínio do túnel) ou `SESSION_SECURE_COOKIE` não coincide com HTTPS.
- **Solução:** deixe `SESSION_DOMAIN=null` (vazio) durante o teste por túnel, execute `php artisan config:clear`, apague os cookies do navegador e recarregue o formulário.

### Mixed Content (estilos ou scripts bloqueados)
- **Causa:** o túnel abre em `https://`, mas a página tenta carregar CSS, JS ou imagens de `http://`. O navegador bloqueia esses recursos por segurança.
- **Solução:** use caminhos relativos (`/assets/app.css`) ou force o esquema HTTPS quando a requisição vier por proxy (`URL::forceScheme('https')` no Laravel quando for o caso).

---

## 7. Por que o FTP NÃO se compartilha por túnel

**Nunca compartilhe um servidor FTP clássico (porta 21) por meio de um túnel para a internet:**
- O protocolo FTP padrão envia **o usuário, a senha e os arquivos em texto puro (sem criptografia)**, além de usar várias portas dinâmicas para transferir dados, que costumam falhar em túneis HTTP.
- Expor o FTP à internet abre uma superfície de ataque desnecessária sobre os arquivos do seu computador.
- Por isso o **WolfCore Dev não oferece um túnel TCP do ngrok para FTP**: um túnel TCP público deixaria a senha à vista de qualquer pessoa que consiga observar o tráfego.

### Alternativas recomendadas
- **No mesmo escritório ou casa (rede local):** use o interruptor **Rede local** do seu site, ou o FTP com a rede local ativada, para compartilhar os arquivos dentro da sua rede privada sem sair para a internet.
- **Transferência criptografada:** **SFTP** (sobre SSH) ou **FTPS** (FTP com TLS) com contas dedicadas e senhas fortes. O WolfCore Dev vai incorporá-lo mais adiante. Enquanto isso, você também pode sincronizar o código com o **Git** (GitHub/GitLab/Bitbucket).

---

## 8. Cola de comandos

| Ferramenta | Comando | Para que serve |
|---|---|---|
| `cloudflared` | `cloudflared tunnel --url http://localhost:8000` | Abre um túnel HTTPS rápido e temporário sem conta (`trycloudflare`). |
| `cloudflared` | `cloudflared tunnel --url http://localhost:80 --http-host-header mi-sitio.test` | Abre um túnel rápido enviando o cabeçalho `Host` de um site local no Nginx. |
| `cloudflared` | `cloudflared tunnel login` | Autoriza o seu computador na sua conta da Cloudflare para usar um domínio próprio. |
| `cloudflared` | `cloudflared tunnel create mi-tunel-demo` | Cria um túnel com nome persistente. |
| `cloudflared` | `cloudflared tunnel route dns mi-tunel-demo demo.ejemplo.com` | Conecta um subdomínio do seu domínio na Cloudflare ao túnel. |
| `cloudflared` | `cloudflared tunnel run --url http://localhost:8000 mi-tunel-demo` | Inicia o túnel com nome apontando para a sua porta local. |
| `cloudflared` | `cloudflared tunnel cleanup mi-tunel-demo` | Fecha as conexões que tenham ficado abertas do túnel antes de apagá-lo. |
| `cloudflared` | `cloudflared tunnel delete mi-tunel-demo` | Remove um túnel com nome que você não precisa mais. |
| `ngrok` | `ngrok config add-authtoken TU_TOKEN` | Guarda o token da sua conta na configuração local do ngrok. |
| `ngrok` | `ngrok http 8000` | Expõe a porta local `8000` com uma URL pública HTTPS. |
| `ngrok` | `ngrok http 80 --host-header=mi-sitio.test` | Expõe um site local do Nginx enviando o domínio `.test` dele no cabeçalho `Host`; o link público já sai com HTTPS. |
| `ngrok` | Abrir `http://127.0.0.1:4040` no navegador | Mostra o inspetor local de requisições e permite reenviar webhooks. |
