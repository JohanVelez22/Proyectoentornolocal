/**
 * Textos da interface em português do Brasil (pt-BR). Mesmas chaves e mesmas assinaturas de função
 * que es.ts (um teste confere). Glossário fixo: serviço, instância, site, túnel, backup, aviso;
 * Doctor e WolfCore Dev não se traduzem. Tratamento por "você" (imperativo), sem "tu".
 */
import type { Textos } from './es';

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

export const pt: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: 'PHP e Nginx sem complicação',
    version: 'Versão',
  },
  nav: {
    inicio: 'Início',
    proyectos: 'Projetos',
    agentes: 'Agentes',
    servicios: 'Serviços',
    basesDeDatos: 'Bancos de dados',
    correo: 'E-mail',
    php: 'PHP',
    ia: 'IA',
    tuneles: 'Túneis',
    contenedores: 'Contêineres',
    herramientas: 'Ferramentas',
    doctor: 'Doctor',
    depuracion: 'Depuração',
    registros: 'Registros',
    ajustes: 'Configurações',
    contraer: 'Recolher menu',
    expandir: 'Expandir menu',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, 'serviço ligado', 'serviços ligados'),
    tuneles: (n: number) => plural(n, 'túnel ativo', 'túneis ativos'),
    cargando: 'Conectando ao núcleo…',
    conErrores: 'com erros',
    sinConexion: 'Sem conexão com o núcleo',
  },
  estado: {
    encendido: 'Ligado',
    apagado: 'Desligado',
    iniciando: 'Iniciando…',
    error: 'Erro',
    externo: 'Externo',
    activo: 'Ativo',
    aviso: 'Atenção',
  },
  acciones: {
    encender: 'Ligar',
    apagar: 'Desligar',
    iniciarTodo: 'Iniciar tudo',
    detenerTodo: 'Parar tudo',
    abrir: 'Abrir',
    copiar: 'Copiar',
    copiado: 'Copiado para a área de transferência',
    guardar: 'Salvar',
    cerrar: 'Fechar',
    abrirCarpeta: 'Abrir pasta',
    instalar: 'Instalar',
    reintentar: 'Tentar de novo',
    cancelar: 'Cancelar',
    borrar: 'Apagar',
    editar: 'Editar',
    duplicar: 'Duplicar',
    renovar: 'Renovar',
    masAcciones: 'Mais ações',
    actualizar: 'Atualizar',
    quitar: 'Remover',
    reinstalar: 'Reinstalar',
  },
  errores: {
    titulo: 'Não foi possível concluir a ação',
    arranque: 'Não foi possível ler o estado do ambiente',
    desconocido: 'Ocorreu um erro inesperado.',
    /** Detalhes que o núcleo manda como código dentro de um erro. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': 'aspas sem fechar',
      'sintaxis.tras_comillas': 'falta um espaço ou «;» depois das aspas',
      'sintaxis.punto_y_coma_inesperado': '«;» sem diretiva',
      'sintaxis.llave_inesperada': '«{» sem diretiva',
      'sintaxis.falta_punto_y_coma': 'falta «;» no fim da diretiva',
      'sintaxis.sobra_llave': 'há uma «}» a mais',
      'sintaxis.falta_llave': 'falta uma «}»',
    },
    codigos: {
      'git.cambios_locales':
        'Há alterações não salvas na pasta: salve-as (commit) ou descarte-as antes de trazer mudanças. Nada foi alterado.',
      'git.divergencia':
        'O branch divergiu do remoto (há commits locais e remotos diferentes): resolva manualmente. Nada foi alterado.',
      'git.sin_upstream':
        'O branch atual não acompanha nenhum branch remoto: não há de onde trazer mudanças.',
      'git.sin_rama': 'O repositório está em um commit solto (sem branch): nada foi alterado.',
      'git.no_repositorio': 'A pasta não é um repositório git.',
      'git.destino_no_vacio': 'A pasta de destino não está vazia.',
      'git.destino_es_archivo': 'O destino é um arquivo, não uma pasta.',
      'git.no_encontrado': 'O git não foi encontrado: instale-o primeiro.',
      'git.gh_no_encontrado': 'O GitHub CLI (gh) não foi encontrado: instale-o primeiro.',
      'git.plazo': 'O clone passou do prazo de {minutos} min e foi cancelado.',
      'git.token_invalido': 'O token do GitHub não é válido.',
      'git.url_con_credenciales': 'A URL não deve conter usuário nem senha: use um token separado.',
      'servicios.desconocido': 'Serviço desconhecido: {id}.',
      'servicios.no_instalado': '{nombre} não está instalado. Instale-o em Serviços.',
      'servicios.puerto_invalido': 'A porta deve ser um número entre 1024 e 65535.',
      'servicios.puerto_asignado': 'A porta {puerto} já está atribuída a {otro}.',
      'servicios.puerto_ocupado':
        'A porta {puerto} está sendo usada por {nombre} (PID {pid}). Feche-o ou escolha outra porta.',
      'servicios.confirmacion_borrado': 'Para apagar os dados de {nombre}, digite "{id}".',
      'servicios.ftp_no_disponible': 'O servidor FTP não está disponível.',
      'sistema.sin_cliente_ftp':
        'Não há um cliente FTP associado neste computador. Instale um (por exemplo, o FileZilla) ou copie o endereço.',
      'servicios.mailpit_no_responde': 'O Mailpit não responde. Inicie-o em Serviços.',
      'servicios.iniciar_todo_fallos':
        'Iniciar tudo não conseguiu ligar: {nombres}. Confira Serviços e os registros deles.',
      'servicios.respaldo_fallo':
        '{nombre} não foi atualizado: o backup prévio falhou e nada foi alterado.',
      'servicios.espacio_insuficiente':
        'Não há espaço para copiar os dados: são necessários {necesarios} MB e há {libres} MB livres.',
      'servicios.actualizacion_revertida':
        'A versão {version} não iniciou; {nombre} voltou para {anterior}. O backup foi mantido.',
      'servicios.restauracion_fallo':
        'A nova versão não iniciou e não foi possível devolver os dados de {nombre}. Nada foi ligado: os dados afetados estão em {fallida} e o backup em {respaldo}.',
      'servicios.otra_rama':
        '{nombre} {version} é de uma versão principal diferente: crie-a como uma nova instância.',
      'servicios.misma_version': '{id} já usa a versão {version}.',
      'servicios.instancia_bloqueada':
        '{nombre} está bloqueada: uma atualização não conseguiu devolver os dados dela. Os dados afetados estão em {fallida} e o backup em {respaldo}. Resolva em Serviços → Versões antes de ligá-la.',
      'servicios.datos_apartados':
        '{nombre} não tem dados na pasta, mas há dados separados de uma atualização: nenhuma pasta vazia será criada. Confira Serviços → Versões.',
      'servicios.puerto_reservado':
        'A porta {puerto} está reservada pelo sistema ({desde}–{hasta}): escolha outra.',
      'servicios.borrado_con_bloqueo':
        '{nombre} tem uma instância bloqueada depois de uma atualização: resolva isso antes de apagar os dados.',
      'servicios.config_no_revertida':
        '{nombre} {version} não iniciou e não foi possível voltar para {anterior} na configuração. Escolha {anterior} de novo em Serviços → Versões.',
      'servicios.puerto_revertido_apagada':
        '{nombre} não iniciou na nova porta; voltou para a {anterior}, mas também não iniciou ali: ficou desligada na porta {anterior}.',
      'servicios.puerto_no_revertido':
        '{nombre} não iniciou na porta {nuevo} e não foi possível voltar para a {anterior} na configuração: ficou desligada.',
      'instancias.id_invalido': 'O identificador da instância não é válido.',
      'instancias.no_existe': 'A instância {id} não existe.',
      'instancias.existe': 'A instância {id} já existe.',
      'instancias.una_sola': '{nombre} admite uma única instância.',
      'instancias.ultima': '{id} é a única instância: não é possível removê-la.',
      'instancias.sin_puerto_libre': 'Não foi encontrada uma porta livre para a instância.',
      'instancias.confirmacion': 'Para continuar, digite "{id}".',
      'instancias.sin_datos': '{id} não tem dados na pasta: escolha um backup para restaurar.',
      'instancias.respaldo_no_existe': 'Esse backup de {id} não existe.',
      'instancias.respaldo_en_uso':
        'Essa cópia é necessária para {id}, que está bloqueada: resolva isso antes.',
      'instancias.version_requerida':
        'Não se sabe a qual versão voltar {id}: escolha uma versão instalada da mesma versão principal.',
      'instalador.version_en_uso':
        'Não é possível desinstalar {servicio} {version}: a instância {instancia} a usa.',
      'limpieza.sin_confirmar': 'É preciso confirmar para limpar versões.',
      'limpieza.seleccion_invalida': 'A seleção de versões não é válida.',
      'limpieza.en_curso': 'Já há uma limpeza de versões em andamento.',
      'limpieza.no_existe': '{servicio} {version} já não está instalada.',
      'limpieza.en_uso': '{servicio} {version} passou a estar em uso: não foi removida.',
      'limpieza.ruta_insegura':
        'A pasta de {servicio} {version} não é segura (um link ou um caminho fora de bin): não foi tocada.',
      'limpieza.version_bloqueada':
        '{servicio} {version} tem arquivos em uso ou bloqueados: não foi removida nem deixada pela metade.',
      'limpieza.otro_volumen':
        '{servicio} {version} está em outro disco que a pasta temporária de dados: não deu para movê-la inteira e não foi tocada.',
      'limpieza.contenido_ajeno':
        '{servicio} {version} tem pacotes instalados por você (npm, pip…): é preciso aceitar perdê-los para removê-la.',
      'limpieza.destino_ocupado':
        'Já existe uma pasta de {servicio} {version} em bin: não é sobrescrita. Remova-a antes de recuperar a outra.',
      'bd.encender_servicio': 'Ligue {nombre} para administrar os bancos dele.',
      'bd.sin_credenciales': 'Não há credenciais salvas de {nombre}.',
      'bd.confirmacion_borrado': 'Para apagar o banco {nombre}, digite o nome exato dele.',
      'bd.usuario_privilegiado':
        'O usuário {usuario} é um administrador ou uma função do sistema: escolha um usuário próprio para o projeto.',
      'bd.usuario_en_uso':
        'Outro projeto já usa o usuário {usuario}: a senha dele não é alterada para não deixá-lo sem conexão. Nada foi criado.',
      'bd.rol_sin_login':
        'O usuário {usuario} existe, mas não pode fazer login (função sem LOGIN ou regra de acesso do servidor). Nada foi alterado.',
      'bd.usuario_clave_distinta':
        'O usuário {usuario} já existe com outra senha. Use a senha atual dele: ela não é alterada para não deixar outros projetos sem conexão.',
      'bd.mongosh_faltante': 'Falta o mongosh: instale-o em Serviços para administrar o MongoDB.',
      'tuneles.sitio_no_encontrado': 'O projeto não foi encontrado.',
      'tuneles.confirmacion_requerida':
        'Publicar {dominio} na internet exige confirmação no WolfCore Dev.',
      'tuneles.confirmacion_obsoleta':
        'O túnel de {dominio} mudou depois de confirmado: confirme de novo.',
      'tuneles.cloudflared_no_instalado':
        'O cloudflared não está instalado. Instale-o em Serviços.',
      'tuneles.proveedor_no_disponible': 'O provedor de túnel {proveedor} não está disponível.',
      'tuneles.cloudflare_sin_cuenta':
        'Conecte primeiro a sua conta da Cloudflare nas opções do túnel.',
      'tuneles.cloudflare_sin_credencial':
        'Este túnel não tem credencial salva: crie-o de novo nas opções do túnel.',
      'tuneles.cloudflare_datos_invalidos':
        'O nome do túnel (minúsculas, números e hífens) ou o domínio público não são válidos.',
      'tuneles.cloudflare_conexion_en_curso': 'Já há uma conexão com a Cloudflare em andamento.',
      'tuneles.cloudflare_dominio_distinto':
        'A Cloudflare registrou {registrado} em vez de {dominio}: o domínio não pertence à zona que você autorizou. Apague esse registro no painel da Cloudflare.',
      'tuneles.cloudflare_conexiones_activas':
        'O túnel {nombre} tem conexões ativas (o cloudflared exige -f para apagá-lo). Feche-o em todos os computadores onde esteja aberto e tente de novo, ou use «Esquecer só aqui».',
      'tuneles.nombre_en_uso': 'O túnel {nombre} já é usado por outro site.',
      'tuneles.dominio_en_uso': 'O domínio {dominio} já é usado por outro site.',
      'tuneles.confirmacion_olvidar': 'Esquecer ou recriar o túnel {nombre} exige confirmação.',
      'tuneles.cloudflare_fallo': 'O cloudflared não conseguiu concluir a operação: {detalle}',
      'tuneles.credencial_no_protegida':
        'Não foi possível restringir a credencial ao usuário, por isso não foi usada.',
      'tuneles.sin_cifrado':
        'A criptografia do sistema não está disponível: não é possível salvar credenciais.',
      'tuneles.token_invalido':
        'O token não é válido: apenas letras, números e _ . - (de 8 a 200 caracteres). Guarde-o novamente nas opções do túnel.',
      'tuneles.ngrok_no_instalado':
        'O ngrok não está instalado neste computador. Instale-o em ngrok.com e tente novamente.',
      'tuneles.ngrok_sin_token': 'Falta o token do ngrok: guarde-o nas opções do túnel.',
      'tuneles.expose_sin_token': 'Falta o token do Expose: guarde-o nas opções do túnel.',
      'tuneles.tailscale_no_instalado':
        'O Tailscale não está instalado neste computador. O WolfCore Dev não o instala: obtenha-o em tailscale.com.',
      'tuneles.tailscale_sin_sesion':
        'O Tailscale não tem a sessão iniciada: inicie sessão no Tailscale e tente novamente.',
      'tuneles.tailscale_puerto_ocupado':
        'O Tailscale já publica algo na porta HTTPS {puerto}. O WolfCore Dev não a substitui: retire-o com o Tailscale e tente novamente.',
      'lan.sitio_no_encontrado': 'O site não foi encontrado.',
      'lan.confirmacion_requerida':
        'Compartilhar {dominio} na rede local exige confirmação no WolfCore Dev.',
      'lan.datos_reales':
        '{dominio} tem dados reais: não é compartilhado na rede local, nem com confirmação. Use uma cópia sem dados de clientes.',
      'lan.sin_red':
        'Não há uma rede local conectada (Wi-Fi ou Ethernet). Conecte-se a uma rede e tente novamente.',
      'lan.ip_no_valida':
        'O endereço {ip} já não é um da sua rede local. Abra o diálogo novamente e confirme de novo.',
      'lan.requiere_https': '{dominio} redireciona para HTTPS: compartilhe-o com a opção HTTPS.',
      'lan.sin_puertos':
        'Não há portas livres entre 8100 e 8199 para a rede local (os sites compartilhados e o link da CA usam essa faixa). Pare de compartilhar um site ou feche o diálogo da CA e tente novamente.',
      'tuneles.expose_no_instalado':
        'O Expose não está instalado. No Windows só funciona com o expose.phar: coloque-o em {carpeta}.',
      'tuneles.expose_datos_reales':
        'O Expose não se usa com sites com dados reais: o seu inspetor de pedidos fica visível em toda a rede local. Use outro provedor.',
      'tuneles.confirmacion_requerida_tailnet':
        'Partilhar {dominio} com a sua tailnet exige confirmação no WolfCore Dev.',
      'tuneles.tailscale_estado_ilegible':
        'Não foi possível ler o que o Tailscale já publica neste computador, por isso nada foi aberto para não o substituir. Verifique se o Tailscale está em execução e tente novamente.',
      'tuneles.tailscale_no_habilitado':
        'O Serve ou o Funnel não está ativado na sua tailnet. Ative-o em {enlace} e tente novamente.',
      'tuneles.ngrok_desactualizado':
        'O seu ngrok é uma versão antiga que não suporta o que o WolfCore Dev precisa. Atualize-o (ngrok update) e tente novamente.',
      'hosts.dominio_invalido': 'Há um domínio inválido.',
      'hosts.tiempo_agotado':
        'Não houve resposta à permissão de administrador em {segundos} s; o arquivo hosts ficou como estava.',
      'https.sin_dominio': 'Um certificado precisa de pelo menos um domínio.',
      'https.sin_autoridad':
        'A autoridade certificadora do WolfCore Dev não existe. Instale a CA na seção HTTPS antes de emitir certificados.',
      'herramientas.pid_invalido': 'O PID não é válido.',
      'herramientas.pid_sistema': 'O PID {pid} é do sistema e não pode ser encerrado.',
      'herramientas.proceso_propio':
        'Não é possível encerrar o WolfCore Dev nem o processo que o iniciou.',
      'herramientas.proceso_inexistente': 'O processo {pid} não existe mais.',
      'herramientas.sin_editor':
        'Nenhum editor de código foi encontrado. Instale um (VS Code, Cursor, PhpStorm, Sublime Text…).',
      'herramientas.editor_no_instalado':
        '{nombre} não está instalado. Escolha outro editor em Configurações.',
      'herramientas.editor_invalido': 'Esse editor não é válido.',
      'herramientas.carpeta_sitio_inexistente': 'A pasta do projeto não existe.',
      'herramientas.ruta_no_absoluta': 'O caminho deve ser absoluto.',
      'herramientas.sin_seleccion': 'Escolha pelo menos um item.',
      'herramientas.dominio_invalido': 'Há um domínio ou IP inválido.',
      'herramientas.demasiados_dominios':
        'Um certificado admite no máximo {maximo} domínios ou IPs.',
      'buscar.consulta_invalida': 'Digite o que buscar (até 500 caracteres).',
      'buscar.raiz_invalida': 'A pasta ou o arquivo não existe ou não é válido.',
      'buscar.regex_invalida': 'A expressão regular não é válida.',
      'buscar.regex_lenta':
        'A expressão regular demora demais: simplifique-a ou use texto literal.',
      'buscar.demasiadas': 'Já há {maximo} buscas em andamento: cancele uma ou aguarde.',
      'buscar.ruta_vetada': 'Essa pasta é de dados do WolfCore Dev: não é pesquisada.',
      'buscar.resultado_caducado': 'Esse resultado não está mais disponível: busque de novo.',
      'buscar.resultado_invalido': 'Esse resultado não pode ser aberto.',
      'diff.raiz_invalida': 'Escolha duas pastas que existam e não sejam links.',
      'diff.ruta_vetada': 'Essa pasta é de dados do WolfCore Dev: não é comparada.',
      'diff.cancelado': 'Comparação cancelada.',
      'diff.plazo': 'A comparação levou mais de {segundos} s e foi cancelada.',
      'diff.memoria': 'A comparação precisa de memória demais (mais de {maximo}) e foi cancelada.',
      'diff.ocupado': 'Já há uma comparação em andamento: cancele-a ou aguarde.',
      'diff.caducado': 'Essa comparação não está mais disponível: compare de novo.',
      'diff.archivo_invalido': 'Esse arquivo não pode mais ser comparado: mudou ou desapareceu.',
      'diff.fallo': 'A comparação falhou.',
      'terminal.no_abrio': 'Não foi possível abrir o terminal.',
      'terminal.no_instalada':
        '{nombre} não está instalado. Escolha outro terminal em Configurações.',
      'terminal.invalida': 'Esse terminal não é válido.',
      'terminal.powershell_restringido':
        'O PowerShell está em modo de linguagem restrito neste computador (política da organização ou AppLocker): o WolfCore Dev não consegue abrir o terminal. Abra-o você mesmo na pasta do projeto.',
      'proyectos.no_existe': 'O projeto não existe.',
      'proyectos.no_confiado': 'Marque "Confio neste repositório" para executar a receita.',
      'proyectos.receta_en_curso': 'Já há uma receita em andamento para este projeto.',
      'proyectos.paso_no_omitible': 'A etapa "Criar o site" não pode ser pulada.',
      'workspaces.no_existe': 'Esse workspace não existe.',
      'workspaces.invalido': 'O workspace não é válido: revise o nome e os itens.',
      'workspaces.captadores_exclusivos':
        'Dois captadores de e-mail não podem ficar ligados ao mesmo tempo: só um roda.',
      'workspaces.elemento_fallo':
        'Não foi possível concluir a operação com {elemento}. Veja Serviços e os registros.',
      'workspaces.base_no_responde':
        '{elemento} não foi iniciado porque o banco de dados desse projeto não responde.',
      'reverb.no_laravel': 'O Reverb só está disponível em projetos Laravel.',
      'reverb.no_confiado': 'Marque «Confio neste repositório» no projeto para ligar o Reverb.',
      'reverb.sin_paquete':
        'Falta o pacote laravel/reverb: instale-o com composer require laravel/reverb.',
      'reverb.sin_confirmar': 'Confirme que quer ligar o Reverb.',
      'reverb.sin_activar': 'Ligue o Reverb no projeto primeiro.',
      'tareas.cron_invalida':
        'A expressão cron não é válida. Use 5 campos: minuto, hora, dia do mês, mês e dia da semana (por exemplo, 0 3 * * *).',
      'tareas.comando_invalido':
        'Esse comando não é permitido. Use php, node, npm run ou python com um arquivo do projeto, sem código na linha de comando (-r, -e, -c).',
      'tareas.invalida': 'A tarefa não é válida: revise o nome, o horário e o comando.',
      'tareas.no_existe': 'Essa tarefa já não existe.',
      'tareas.sin_confirmar': 'Confirme o comando da tarefa para poder executá-la.',
      'tareas.sitio_no_confiado':
        'Marque «Confio neste repositório» no projeto para executar as suas tarefas.',
      'tareas.receta_cambio':
        'A receita do projeto mudou desde que você confiou nele: revise-a e marque «Confio neste repositório» de novo.',
      'tareas.aislado':
        'Esta é uma pasta de dados de teste (WOLFCORE_DATOS): permita as tarefas agendadas para executá-las.',
      'tareas.carpeta': 'A pasta do projeto não existe: a tarefa não pode ser executada.',
      'tareas.en_curso': 'A tarefa já está em execução.',
      'tareas.demasiadas': 'Há tarefas demais neste projeto (máximo {maximo}).',
      'cli.no_autorizado':
        'O comando da CLI não está autorizado: execute-o de novo com o app WolfCore Dev aberto.',
      'cli.orden_desconocida': 'O WolfCore Dev não conhece esse comando da CLI.',
      'cli.argumentos_invalidos': 'Os argumentos do comando não são válidos.',
      'cli.solicitud_grande': 'A solicitação é grande demais (máximo de {maximo} bytes).',
      'cli.formato_no_admitido': 'A solicitação não tem o formato que a CLI aceita.',
      'cli.plazo':
        'O comando demorou demais: pode ainda estar em andamento. Veja o estado no WolfCore Dev.',
      'cli.ocupado': 'O WolfCore Dev está atendendo comandos da CLI demais: aguarde um momento.',
      'cli.requiere_confirmacion':
        'Este comando publica ou altera algo e exige confirmação (--si) em {sitio}.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio} tem dados reais: confirme também com a opção de dados reais do comando (o domínio do site).',
      'cli.requiere_confirmacion_global':
        'Alterar o PHP de todos os terminais exige confirmação (--si).',
      'cli.confirmacion_rechazada':
        'A confirmação na janela do WolfCore Dev foi rejeitada ou não estava disponível: nada foi feito.',
      'cli.confirmacion_vencida':
        'Ninguém confirmou a tempo na janela do WolfCore Dev: nada foi feito.',
      'cli.tunel_fallo': 'Não foi possível abrir o túnel. Veja o registro dele no WolfCore Dev.',
      'cli.inicio_fallo':
        'Não foi possível iniciar tudo o que foi pedido. Veja os registros no WolfCore Dev.',
      'cli.parada_fallo':
        'Não foi possível parar tudo o que foi pedido. Veja os registros no WolfCore Dev.',
      'cli.interno': 'Erro interno do servidor da CLI.',
      'cli.proveedor_distinto':
        'O site usa outro provedor de túnel ({proveedor}). Revise e confirme de novo.',
      'cli.sitio_no_encontrado': 'O site {sitio} não existe.',
      'cli.carpeta_invalida':
        'A pasta não existe, é do sistema ou é a pasta de dados do WolfCore Dev.',
      'cli.carpeta_sin_sitio':
        'Essa pasta não pertence a nenhum site do WolfCore Dev: vincule-a primeiro.',
      'cli.ya_vinculada': 'Essa pasta já é o site {sitio}.',
      'cli.tipo_no_soportado':
        'Projetos do tipo {tipo} são criados pela interface do WolfCore Dev.',
      'cli.sitio_sin_php': 'O site {sitio} não usa PHP.',
      'cli.version_no_instalada': '{servicio} {version} não está instalado. Instale-o em Serviços.',
      'cli.fuente_no_existe': 'Esse registro ainda não existe.',
      'cli.token_no_protegido':
        'Não foi possível restringir o arquivo do token ao usuário atual: a CLI não é ativada.',
      'cli.carpeta_ajena':
        'A pasta run/ da pasta de dados pertence a outro usuário: a CLI não é ativada.',
      'cli.ruta_invalida': 'O caminho do WolfCore Dev tem caracteres que o wolf.cmd não aceita.',
      'cli.path_aislado':
        'Com uma pasta de dados de teste (WOLFCORE_DATOS) o PATH do usuário não é alterado.',
      'cli.sin_cliente': 'Esta versão do WolfCore Dev não traz o cliente wolf (falta compilá-lo).',
      'cli.demasiados_dialogos':
        'Confirmações demais no último minuto: aguarde um momento e tente de novo.',
      'cli.error': 'Não foi possível concluir o comando: {detalle}',
      'proyectos.carpeta_no_vacia':
        'A pasta do projeto já tem arquivos: escolha outra ou esvazie-a.',
      'secretos.sin_cifrado':
        'A criptografia do sistema não está disponível: não é possível guardar a senha do usuário próprio. Nada foi alterado.',
      'proyectos.clave_bd_falta':
        'Falta a senha guardada do usuário {usuario}: nada foi gravado. No gerenciador de .env, "Usar usuário próprio" gera uma senha nova.',
      'env.archivo_grande': 'O arquivo de variáveis é grande demais (máximo {maximo}).',
      'env.no_regular': 'O .env não é um arquivo normal: não é lido nem modificado.',
      'env.clave_inexistente': 'A variável {clave} não existe.',
      'env.cambio_invalido': 'Uma alteração do .env não é válida.',
      'env.variable_invalida': 'A alteração da variável {clave} não é válida.',
      'env.solo_lectura': 'A variável {clave} ocupa várias linhas: edite-a à mão no arquivo.',
      'env.usuario_compartido':
        'O banco {base} também é usado pelo projeto {proyecto}: confirme se quer compartilhar o usuário dele.',
      'env.cambio_externo':
        'O .env mudou depois que a pré-visualização foi mostrada: revise-o de novo antes de salvar.',
      'env.meilisearch_no_disponible': 'O Meilisearch não está instalado: instale-o em Serviços.',
      'env.sin_confirmar': 'Confirme que quer salvar as alterações do .env.',
      'env.versionado':
        'O git já acompanha o .env deste projeto: o próximo commit enviaria seus valores. Confirme à parte para continuar.',
      'env.versionado_desconocido':
        'Não foi possível verificar se o git acompanha o .env deste projeto: confirme à parte para continuar.',
      'env.copia_invalida': 'A cópia do .env não é válida ou não existe mais.',
      'env.sin_base': 'O .env deste projeto não tem conexão com um banco de dados.',
      'env.base_no_resuelta':
        'O banco deste projeto não é de um servidor local do WolfCore Dev: nada foi alterado.',
      'env.motor_no_soportado': 'Por enquanto "Usar usuário próprio" funciona com MySQL e MariaDB.',
      'env.ya_usa_usuario_propio': 'Este projeto já usa um usuário próprio.',
      'plantillas.id_invalido': 'O identificador do modelo não é válido.',
      'plantillas.no_existe': 'O modelo não existe.',
      'plantillas.danada':
        'O modelo está danificado ou foi modificado: não será usado. Apague-o e salve-o de novo.',
      'plantillas.demasiado_grande':
        'O projeto tem arquivos demais ou é grande demais para salvar como modelo (até {maximo} arquivos). Exclua pastas grandes.',
      'plantillas.demasiado_pesada':
        'O projeto é pesado demais para salvar como modelo (até {maximo}). Exclua pastas grandes.',
      'plantillas.exclusion_invalida':
        'Uma das exclusões não é válida (use nomes ou caminhos relativos, sem "..").',
      'plantillas.nombre_invalido': 'O nome do modelo não é válido (de 1 a 60 caracteres).',
      'plantillas.esquema_fallo':
        'Não foi possível ler o esquema do banco do projeto: verifique se o serviço está ligado.',
      'plantillas.base_no_resuelta':
        'Não é possível salvar o modelo: o servidor do banco é remoto ou nenhum serviço local usa essa porta.',
      'plantillas.sin_generador_base':
        'Este tipo de projeto não tem um gerador base: o modelo precisa incluir os arquivos do projeto.',
      'plantillas.exclusiones_nuevas':
        'O modelo traz um arquivo que agora é excluído ({archivo}): salve-o de novo a partir do projeto ou apague-o.',
      'plantillas.motor_distinto':
        'O esquema do modelo é do MySQL e o servidor escolhido é o MariaDB (ou o contrário): pode haver diferenças. Confirme que quer continuar.',
      'bd.sql_no_permitido':
        'O esquema traz uma instrução que não é de estrutura e nada foi executado: {sentencia}',
      'bd.extension_no_permitida':
        'O esquema pede a extensão {nombre}, que não está na lista permitida: nada foi restaurado.',
      'bd.esquema_fallo': 'Não foi possível restaurar o esquema completo: nada ficou pela metade.',
      'bd.datos_no_permitidos':
        'O despejo de dados traz algo que não são dados (só se aceitam INSERT, LOCK TABLES e SET): nada foi importado.',
      'bd.datos_fallo':
        'Não foi possível importar os dados: o banco ficou como estava, sem nada pela metade.',
      'perfiles.destino_invalido': 'Escolha onde salvar o perfil (um arquivo .wolfperfil).',
      'perfiles.frase_debil': 'A frase da CA deve ter pelo menos {minimo} caracteres.',
      'perfiles.frase_incorrecta': 'A frase não está correta: nada foi importado.',
      'perfiles.certificados_sin_ca':
        'Os certificados dos sites só viajam junto com a CA cifrada: inclua a CA com uma frase.',
      'perfiles.no_existe': 'O arquivo do perfil não existe.',
      'perfiles.danado': 'O perfil está danificado ou foi modificado: nada foi importado.',
      'perfiles.demasiado_grande': 'O perfil é grande demais (até {maximo}).',
      'perfiles.version_no_soportada':
        'O perfil é de uma versão mais nova do WolfCore Dev (formato {version}): atualize o app para importá-lo.',
      'perfiles.sin_confirmar': 'Confirme que deseja importar o perfil.',
      'perfiles.vista_previa_vieja':
        'A pasta de dados ou o perfil mudaram desde a pré-visualização: revise-a novamente.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS não é uma pasta de dados válida: deve ser absoluta, não do sistema e diferente da pasta real.',
      'perfiles.confirmar_reemplazar_ca':
        'O perfil traz uma CA e este computador já tem a sua: compare a impressão digital e confirme à parte que deseja substituí-la (somente se for a sua própria CA).',
      'herramientas.imagen_tipo':
        'Esse arquivo não é uma imagem compatível (PNG, JPG, WebP, GIF, BMP ou ICO) ou o conteúdo não corresponde ao tipo.',
      'herramientas.imagen_grande': 'A imagem é grande demais (até {maximo}).',
      'herramientas.imagen_dimensiones':
        'A imagem é grande demais ({ancho}×{alto} px; até {maximo} px por lado) e não é aberta por segurança.',
      'herramientas.zip_sin_archivos':
        'Não há arquivos para comprimir (os links não são seguidos).',
      'herramientas.zip_demasiados': 'Há arquivos demais para comprimir (até {maximo}).',
      'herramientas.zip_grande': 'O que você quer comprimir é grande demais (até {maximo}).',
      'herramientas.pdf_invalido': 'O arquivo não é um PDF que possa ser otimizado.',
      'herramientas.pdf_grande': 'O PDF é grande demais (até {maximo}).',
      'herramientas.pdf_cifrado': 'O PDF está protegido por senha e não pode ser otimizado.',
      'herramientas.pdf_plazo': 'O PDF demorou mais de {segundos} s e foi cancelado.',
      'herramientas.salida_ocupada': 'Não foi encontrado um nome livre para o novo arquivo.',
      'captura.atajo_invalido':
        'Esse atalho não é válido: use Ctrl, Alt, Shift ou Super com uma letra, um número ou uma tecla F.',
      'captura.atajo_no_permitido':
        'Esse atalho não é permitido: use Ctrl ou Super com outro modificador (Ctrl+Alt sem Shift é AltGr e tira o @) e evite atalhos comuns como Ctrl+C ou Alt+F4.',
      'captura.atajo_ocupado': 'O atalho {atajo} já é usado por outro programa.',
      'captura.no_disponible': 'A captura de tela não está disponível neste computador.',
      'captura.permiso_denegado': 'Falta a permissão de gravação de tela.',
      'captura.sin_imagen': 'Não há nenhuma imagem para capturar.',
      'captura.imagen_invalida': 'A imagem da captura não é válida.',
      'conversor.formato': 'Essa conversão não está disponível.',
      'disco.sin_confirmar': 'Confirme a limpeza na caixa de diálogo antes de continuar.',
      'disco.categoria_invalida': 'Essa categoria de limpeza não existe.',
      'disco.ruta_vetada':
        'A categoria toca um caminho protegido (dados, backups, projetos ou FlyEnv); nada foi limpo.',
      'disco.sin_analisis': 'Analise de novo antes de limpar: a análise expirou ou não existe.',
      'disco.ocupada': 'Já há uma análise ou limpeza em andamento.',
      'disco.sin_registro': 'Não foi possível criar o registro da limpeza; nada foi apagado.',
      'editor.sin_confirmar': 'Confirme o salvamento antes de continuar.',
      'editor.confirmacion_reforzada':
        'Este arquivo parece guardar segredos ou é de um site com dados reais: confirme com reforço para salvá-lo.',
      'editor.ruta_invalida': 'O caminho do arquivo não é válido.',
      'editor.no_existe': 'O arquivo não existe.',
      'editor.no_regular': 'Só arquivos normais podem ser editados.',
      'editor.ruta_vetada':
        'Esse arquivo está na pasta de dados do WolfCore Dev: não é aberto nem salvo pelo editor.',
      'editor.archivo_env':
        'Os arquivos .env são gerenciados pelas variáveis do projeto, não pelo editor.',
      'editor.demasiado_grande': 'O arquivo é grande demais para o editor (máximo {maximo}).',
      'editor.binario': 'O arquivo não é de texto (é binário): não pode ser editado aqui.',
      'editor.codificacion':
        'O arquivo não está em UTF-8: o editor não o abre para não danificá-lo.',
      'editor.no_abierto':
        'Esse arquivo não foi aberto no editor (ou a versão mudou): abra-o novamente.',
      'editor.eol_mixto': 'O arquivo mistura quebras de linha: confirme normalizá-las para salvar.',
      'editor.contenido_invalido': 'O conteúdo não é um texto válido.',
      'editor.huella_invalida': 'Falta a impressão digital do arquivo aberto: abra-o novamente.',
      'editor.archivo_cambiado':
        'O arquivo mudou fora do editor desde que foi aberto. Recarregue-o ou confirme a sobrescrita.',
      'editor.copia_fallo': 'Não foi possível fazer a cópia prévia ({codigo}); nada foi salvo.',
      'editor.lectura_fallo': 'Não foi possível ler o arquivo ({codigo}).',
      'editor.escritura_fallo':
        'Não foi possível salvar o arquivo ({codigo}). O original não foi alterado.',
      'memoria.sin_confirmar': 'Confirme a ação no diálogo antes de continuar.',
      'memoria.modo_invalido': 'Esse modo de otimização não existe.',
      'memoria.plan_caducado':
        'A lista expirou ou já não é a atual. Veja-a de novo antes de aplicar.',
      'memoria.no_disponible':
        'O otimizador de memória não está disponível aqui ou não conseguiu ler o sistema.',
      'conversor.archivo_invalido':
        'O arquivo está danificado ou não é do tipo indicado pela extensão.',
      'conversor.archivo_grande': 'O arquivo é grande demais (até {maximo}).',
      'conversor.archivo_peligroso':
        'O arquivo parece uma bomba ZIP ou foi manipulado (conteúdo demais, entidades XML ou nomes inválidos) e não é aberto por segurança.',
      'conversor.limite_filas': 'A tabela tem linhas demais (até {maximo}).',
      'conversor.limite_columnas': 'A tabela tem colunas demais (até {maximo}).',
      'conversor.limite_paginas': 'O PDF tem páginas demais (até {maximo}).',
      'conversor.pdf_cifrado': 'O PDF está protegido por senha e não pode ser convertido.',
      'conversor.plazo': 'A conversão levou mais de {segundos} s e foi cancelada.',
      'conversor.ocupado': 'Já há uma conversão em andamento e outra em espera: aguarde o término.',
      'conversor.cancelado': 'Conversão cancelada.',
      'conversor.libreoffice_ausente':
        'Essa conversão precisa do LibreOffice, que não está instalado neste computador (o WolfCore Dev não o instala).',
      'conversor.libreoffice_fallo': 'O LibreOffice não conseguiu converter o documento.',
      'conversor.limite_celdas': 'A tabela tem células demais (até {maximo}).',
      'conversor.memoria':
        'O arquivo precisa de memória demais (mais de {maximo}) e foi cancelado.',
      'conversor.pdf_no_disponible': 'A impressão em PDF não está disponível no momento.',
      'herramientas.imagen_pixeles':
        'A imagem tem pixels demais no total ({ancho}×{alto} px; até {maximo}) e não é aberta por segurança.',
      'herramientas.zip_cambio': 'Um arquivo mudou enquanto era comprimido: tente de novo.',
      'herramientas.pdf_demasiado_complejo':
        'O PDF é complexo demais (inflaria mais memória do que o permitido) e foi cancelado.',
      'herramientas.salida_denegada':
        'Não é possível gravar nesse local: verifique a permissão ou se a pasta existe.',
      'herramientas.fuera_de_la_ca':
        'A CA do WolfCore Dev só assina domínios .test, localhost e endereços locais: {dominio} não pode ser incluído.',
      'perfiles.frase_requerida':
        'Digite a frase do perfil para importar os seus bancos ou a sua CA (ou importe sem os bancos).',
      'perfiles.sin_espacio':
        'Não há espaço livre suficiente para importar o perfil: são necessários {necesarios} e há {libres}.',
      'perfiles.ca_sin_restricciones':
        'Esta CA pode assinar qualquer site: importe-a somente se for sua e compare a impressão digital. Confirme à parte para continuar.',
      'perfiles.ca_restricciones_ajenas':
        'A CA do perfil tem restrições de nome que não são as do WolfCore Dev: não é importada.',
      'perfiles.instantanea_fallo':
        'Não foi possível guardar a cópia prévia do ambiente: nada foi alterado. Verifique o espaço em disco e as permissões da pasta de dados.',
      'perfiles.en_curso': 'Já há uma importação de perfil em andamento: aguarde o término.',
      'importar.origen_apagado':
        'Não foi possível conectar ao servidor de banco de dados do outro programa: ligue-o a partir desse programa e tente de novo. Os sites foram importados mesmo assim.',
      'importar.origen_no_local': 'O servidor de origem deve estar neste computador (127.0.0.1).',
      'importar.origen_rechazado': 'O servidor de origem recusou o usuário ou a senha.',
      'importar.origen_version':
        'A versão do servidor de origem não pode ser importada com o que o WolfCore Dev tem instalado.',
      'importar.volcado_enorme':
        'Os dados do banco pesam mais de {maximo} MB: não são importados de uma vez.',
      'importar.motor_no_soportado': 'Só se importam bancos MySQL e MariaDB de outros programas.',
      'importar.ruta_fuera':
        'Uma pasta ou arquivo que aponta para fora da instalação ou para uma pasta do sistema foi descartado.',
      'importar.carpeta_invalida':
        'Uma pasta que não existe mais ou não é uma pasta foi descartada.',
      'importar.archivo_grande':
        'Um arquivo de configuração pesa mais de {maximo} KB e não foi lido.',
      'importar.archivo_ilegible':
        'Um arquivo de configuração não é de texto ou não pôde ser lido.',
      'importar.demasiados':
        'Há sites ou arquivos de configuração demais: só os primeiros foram lidos.',
      'importar.candidato_desconocido':
        'Esse site não aparece mais no programa de origem: busque de novo.',
      'importar.ya_vinculado': 'Essa pasta já é um site do WolfCore Dev.',
      'importar.dominio_existe':
        'Já existe um site com o domínio {dominio}: altere-o antes de importar.',
      'importar.sin_php':
        'Este site precisa de PHP e nenhuma versão está instalada: instale uma em Serviços.',
      'importar.base_existe':
        'O banco {nombre} já existe no destino e não foi alterado. Confirme a substituição para importá-lo (antes é feita uma cópia).',
      'importar.base_fallo':
        'Não foi possível importar o banco {nombre}: ficou como estava, sem nada pela metade.',
      'importar.sitio_fallo': 'Não foi possível criar o site.',
      'importar.origen_invalido':
        'Os dados do servidor de origem não são válidos (usuário, senha ou porta).',
      'importar.sin_seleccion': 'Escolha pelo menos um site para importar.',
      'importar.en_curso': 'Já há uma importação em andamento: aguarde terminar.',
      'importar.cancelado': 'Importação cancelada: o que estava sendo importado ficou como estava.',
      'importar.origen_estancado':
        'O servidor do outro programa parou de responder durante a exportação: o banco não foi importado.',
      'importar.sin_espacio':
        'Não há espaço livre suficiente para importar o banco: são necessários cerca de {necesarios} MB e há {libres} MB.',
      'importar.origen_fallo': 'Não foi possível exportar o banco do outro programa.',
      'importar.clave_no_ascii':
        'A senha tem acentos ou símbolos que não podem ser passados à exportação: use uma senha só com caracteres ASCII.',
      'plantillas.sin_esquema': 'O modelo não traz o esquema de um banco de dados.',
      'proyectos.carpeta_invalida': 'A pasta do projeto não é válida.',
      'proyectos.nombre_invalido':
        'O nome do projeto só pode ter letras minúsculas, números e hifens (até 40).',
      'proyectos.argumento_invalido': 'Um dado do projeto não é válido (campo: {campo}).',
      'proyectos.base_existe': 'O banco {nombre} já existe: escolha outro nome.',
      'proyectos.dominio_existe': 'Já existe um site com o domínio {dominio}.',
      'proyectos.carpeta_de_otro_sitio':
        'Essa pasta é a do projeto {dominio} ou está dentro dela: escolha outra.',
      'proyectos.sin_python': 'Não há Python instalado: instale-o em Serviços.',
      'proyectos.venv_ajeno':
        'O projeto traz seu próprio .venv e o WolfCore Dev não executa o Python de um repositório alheio: apague-o e crie o ambiente de novo.',
      'proyectos.paso_base_no_omitible':
        'A etapa "Criar o banco de dados" de um projeto novo não pode ser pulada.',
      'proyectos.sin_php': 'Não há PHP instalado: instale-o em Serviços.',
      'proyectos.php_no_instalado': 'O PHP {version} não está instalado: instale-o em Serviços.',
      'proyectos.python_no_instalado':
        'O Python {version} não está instalado: instale-o em Serviços.',
      'mcp.token_invalido': 'O token do servidor MCP não é válido.',
      'mcp.solicitud_cancelada': 'O cliente MCP cancelou a solicitação: a ação não foi executada.',
      'doctor.puerto_ocupado':
        'A porta {puerto} de {servicio} está sendo usada por outro programa ({proceso}).',
      'doctor.puerto_iis': 'O IIS ({programa}) ocupa a porta {puerto} de {servicio}.',
      'doctor.puerto_http_sys':
        'Um serviço do Windows ({programa}) ocupa a porta {puerto} de {servicio}.',
      'doctor.puerto_flyenv':
        '{programa} ocupa a porta {puerto} de {servicio}. Feche-o ou mude a porta do WolfCore Dev.',
      'doctor.puerto_xampp': '{programa} ocupa a porta {puerto} de {servicio}.',
      'doctor.puerto_skype': '{programa} ocupa a porta {puerto} de {servicio}.',
      'doctor.puerto_reservado':
        'A porta {puerto} de {servicio} está em um intervalo reservado pelo Windows ({desde}-{hasta}: Hyper-V, WSL ou Docker).',
      'doctor.ca_por_vencer': 'A autoridade certificadora do WolfCore Dev vence em {dias} dias.',
      'doctor.ca_vencida': 'A autoridade certificadora do WolfCore Dev venceu.',
      'doctor.certificado_por_vencer': 'O certificado de {dominio} vence em {dias} dias.',
      'doctor.certificado_vencido': 'O certificado de {dominio} venceu.',
      'doctor.hosts_ilegible': 'Não foi possível ler o arquivo hosts.',
      'doctor.hosts_utf16':
        'O arquivo hosts está salvo em UTF-16: o Windows pode não ler as entradas dele.',
      'doctor.hosts_bloque_duplicado':
        'O arquivo hosts tem {bloques} blocos do WolfCore Dev; deve haver um.',
      'doctor.hosts_bloque_sin_cierre':
        'Um bloco do WolfCore Dev no arquivo hosts ficou sem a marca de fechamento.',
      'doctor.hosts_dominios_faltantes':
        'Faltam {cantidad} domínios dos seus sites no arquivo hosts.',
      'doctor.hosts_solo_lectura':
        'O arquivo hosts é somente leitura (costuma ser definido por um antivírus). Mesmo assim, o WolfCore Dev pode gravá-lo com permissão de administrador.',
      'doctor.path_duplicados':
        'O PATH do usuário tem {cantidad} entradas repetidas do WolfCore Dev.',
      'doctor.path_ajeno_delante':
        'Outra pasta com {programa} ({origen}) está antes do WolfCore Dev no PATH: nos terminais, essa será a usada.',
      'doctor.vcredist_ausente':
        'Falta o Microsoft Visual C++ 2015-2022 (x64): o PHP e outros serviços não iniciam sem ele.',
      'doctor.enlazador_msvc_ausente':
        'O Rust está instalado, mas faltam as ferramentas C++ do Visual Studio Build Tools (vinculador MSVC): o cargo não conseguirá vincular os programas.',
      'doctor.antivirus_sin_exclusion':
        'O antivírus verifica a pasta de dados do WolfCore Dev: o PHP e os serviços podem iniciar devagar.',
      'doctor.firewall_reglas':
        'O Windows deixa entrar da rede {cantidad} regra(s) de programas do WolfCore Dev (nginx, PHP ou bancos de dados) nos perfis {perfiles}: esses programas ficam abertos à rede.',
      'doctor.firewall_no_comprobado':
        'Não foi possível verificar o firewall do Windows (pode ser preciso ser administrador).',
      'doctor.firewall_reglas_ajenas':
        'Há {cantidad} regra(s) de entrada de outros programas (FlyEnv, Laragon, XAMPP ou outros) para nginx, PHP ou bancos de dados nos perfis {perfiles}. Não são do WolfCore Dev: só são mostradas e nunca removidas daqui.',
      'doctor.firewall_reglas_acotadas':
        'Há {cantidad} regra(s) de programas do WolfCore Dev limitadas à rede local (só perfil privado, sub-rede local e portas específicas), como as que o próprio aplicativo recomenda para compartilhar um site. Só são mostradas: não são removidas daqui.',
      'doctor.firewall_almacen_inseguro':
        'A cópia protegida das regras não é confiável (permissões ou conteúdo diferentes do que foi mostrado): nenhuma regra foi criada nem alterada.',
      'doctor.firewall_quitadas':
        'O WolfCore Dev removeu antes {cantidad} regra(s) do firewall e guardou uma cópia: você pode recriá-las se precisar.',
      'doctor.firewall_parcial':
        'Algumas regras foram removidas, mas outras não: mudaram desde que a lista foi mostrada, não eram do WolfCore Dev ou o Windows não deixou removê-las. Confira a lista.',
      'doctor.firewall_sin_cambios':
        'Nenhuma regra foi alterada: elas já não coincidem com o que foi mostrado ou não puderam ser alteradas.',
      'doctor.firewall_registro_fallido':
        'Não foi possível salvar a cópia das regras em etc/cortafuegos-quitadas.json: nada foi alterado.',
      'doctor.servicio_en_error': '{servicio} está com erro.',
      'doctor.revision_fallida': 'Não foi possível concluir a verificação {revision}.',
      'doctor.confirmacion_requerida': 'Confirme o reparo antes de aplicá-lo.',
      'doctor.hallazgo_desconocido': 'Esse achado não existe mais: verifique de novo.',
      'doctor.solo_informa': 'Este achado não tem reparo automático: siga as instruções.',
      'doctor.reparacion_fallida': 'Não foi possível aplicar o reparo.',
      'doctor.reparacion_cancelada':
        'A permissão de administrador foi cancelada: nada foi alterado.',
      'doctor.reparacion_denegada': 'O Windows ou um antivírus negou o acesso: nada foi alterado.',
      'doctor.ya_resuelto': 'O problema já não existia: não foi preciso alterar nada.',
      'doctor.ca_vieja_sin_quitar':
        'A nova autoridade certificadora já está em uso, mas não foi possível remover a anterior do repositório do Windows. Você pode removê-la na seção HTTPS.',
      'doctor.sin_puerto_libre': 'Não foi encontrada uma porta livre para mover o serviço.',
      'doctor.ca_vuelta_atras_incompleta':
        'Não foi possível aplicar a nova autoridade e a reversão ficou incompleta. Confira a seção HTTPS; há uma cópia com data em etc/respaldos.',
      'doctor.firefox_sin_confianza':
        'O Firefox não confia na autoridade do WolfCore Dev em {cantidad} perfis (ele usa o próprio repositório).',
      'confianza.sin_ca': 'Ainda não há autoridade certificadora: crie uma em HTTPS.',
      'confianza.sin_raices':
        'Não foram encontradas raízes de confiança para o Python (nem certifi nem as do Windows): nada foi alterado.',
      'confianza.node_variable_ajena':
        'Você já tem a sua própria NODE_EXTRA_CA_CERTS: o WolfCore Dev não a substitui.',
      'confianza.variable_fallida': 'Não foi possível alterar a variável do usuário.',
      'firefox.abierto': 'O Firefox está aberto: feche-o e tente de novo.',
      'firefox.error': 'Não foi possível alterar o user.js desse perfil; ele ficou como estava.',
      'firefox.fuera':
        'Há perfis fora da pasta do Firefox: ative-os em Confiança da CA, com a confirmação separada.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS não aponta mais para a autoridade do WolfCore Dev (foi alterada à mão): ela não foi apagada.',
      'ia.clave_invalida': 'O provedor recusou a chave: confira-a ou gere uma nova.',
      'ia.sin_saldo': 'A conta do provedor não tem saldo nem cota disponível.',
      'ia.limite': 'O provedor limitou as requisições: aguarde um momento e tente de novo.',
      'ia.region': 'O provedor não atende a partir do seu país ou região.',
      'ia.sin_red': 'Não foi possível conectar ao provedor: confira a rede ou a URL base.',
      'ia.url_invalida':
        'A URL base não é válida: use https:// (ou http:// somente para 127.0.0.1 ou [::1]), sem usuário nem senha.',
      'ia.plazo': 'O provedor não respondeu em {segundos} s.',
      'ia.respuesta_rara': 'O provedor respondeu algo inesperado.',
      'ia.cancelado': 'A requisição ao provedor foi cancelada.',
      'ia.sin_clave': 'Este provedor precisa de uma chave: salve-a primeiro.',
      'ia.clave_mal_formada':
        'A chave não tem um formato válido (sem espaços nem quebras de linha).',
      'ia.modelo_invalido': 'O nome do modelo não é válido.',
      'ia.modelo_no_disponible': 'O modelo não existe ou a sua conta não tem acesso a ele.',
      'ia.proveedor_invalido': 'A configuração do provedor não é válida.',
      'ia.env_conflicto':
        'O .env já define {claves} com outro valor: confirme se quer substituí-lo.',
      'ia.env_sin_confirmar':
        'Confirme que quer gravar a chave no .env (ela fica em texto simples).',
      'ia.env_versionado':
        'O Git já acompanha o .env deste projeto: o próximo commit enviaria a chave mesmo que ela esteja no .gitignore. Tire-o do índice com git rm --cached .env.',
      'ia.env_versionado_desconocido':
        'Não foi possível verificar se o Git já acompanha o .env deste projeto: confirme à parte que quer gravar a chave.',
      'ia.proveedor_no_existe': 'O provedor de IA não existe mais.',
      'ia.url_cambia_con_clave':
        'O provedor tem uma chave salva: confirme que quer enviá-la para a nova URL.',
      'ia.mensaje_sin_confirmar':
        'Confirme o envio da mensagem de teste (isso gasta tokens da sua conta).',
      'ia.clave_ilegible':
        'Não foi possível ler a chave salva do provedor: apague-a e salve-a de novo.',
      'ia.argumento_invalido': 'Dado inválido ({campo}).',
      'correo.auth': 'O provedor rejeitou o usuário ou a chave.',
      'correo.conexion': 'Não foi possível conectar ao servidor SMTP: confira o host e a porta.',
      'correo.tls':
        'Não foi possível estabelecer uma conexão criptografada e válida com o servidor (certificado, nome ou STARTTLS). Nada foi enviado.',
      'correo.rechazado':
        'O servidor rejeitou a mensagem ou um endereço. Confira o remetente: muitos provedores só aceitam um remetente ou domínio verificado.',
      'correo.plazo': 'O servidor não respondeu a tempo (20 s).',
      'correo.host_invalido':
        'O servidor SMTP deve ser um nome de host ou um IP, sem esquema, porta nem caminho.',
      'correo.host_local':
        'Esse servidor aponta para este computador ou para a rede local: confirme para usá-lo.',
      'correo.destinatario_invalido': 'O endereço de destino não é válido.',
      'correo.proveedor_invalido': 'Os dados do provedor não são válidos.',
      'correo.proveedor_no_existe': 'O provedor de e-mail não existe mais.',
      'correo.sin_clave': 'O provedor não tem uma chave salva.',
      'correo.clave_ilegible':
        'Não foi possível ler a chave salva do provedor: apague-a e salve-a de novo.',
      'correo.cambia_con_clave':
        'O provedor tem uma chave salva: confirme que quer enviá-la ao novo servidor.',
      'correo.env_sin_confirmar': 'Confirme que quer escrever as variáveis de e-mail no .env.',
      'correo.ocupado': 'Já há um teste de envio em andamento.',
      'correo.limite': 'Aguarde {segundos} s antes de outro teste de envio.',
      'correo.clave_mal_formada':
        'A chave não é válida: apenas caracteres imprimíveis, sem quebras de linha e com até 4096 caracteres.',
      'correo.argumento_invalido': 'Dado inválido ({campo}).',
      'agentes.no_existe': 'Esse agente não é suportado.',
      'agentes.sin_confirmar': 'Confirme a ação na janela antes de continuar.',
      'agentes.no_instalable':
        'Este agente não é instalado pelo WolfCore Dev: siga o guia oficial ({guia}).',
      'agentes.sin_node': 'Instale o Node em Serviços para poder instalar o agente.',
      'agentes.node_antiguo':
        '{agente} precisa do Node {requerida} ou superior e o que seria usado é o {actual}. Instale um Node mais novo em Serviços.',
      'agentes.node_version_desconocida':
        'Não foi possível saber a versão do Node e {agente} precisa do Node {requerida} ou superior. Confira o Node em Serviços.',
      'instalador.zip_demasiado_grande':
        'O pacote baixado é grande demais ou tem arquivos demais: não será instalado.',
      'rust.rustup_init_fallo': 'O rustup-init não terminou bem (código {codigo}): {detalle}',
      'rust.toolchain_fallo':
        'Não foi possível instalar o Rust {version} (código {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Não foi possível desinstalar o Rust {version}: {detalle}',
      'rust.descarga_fallo': 'Não foi possível baixar o rustup (HTTP {estado}).',
      'agentes.instalacion_fallo': 'Não foi possível instalar o agente: {detalle}',
      'agentes.no_instalado': '{agente} não está instalado.',
      'agentes.mcp_no_soportado':
        '{agente} não documenta como pegar o token de uma variável de ambiente: o MCP não é registrado nele.',
      'agentes.config_ilegible':
        'Não foi possível interpretar {archivo}; ele não foi modificado. Revise-o à mão.',
      'agentes.config_en_uso':
        '{archivo} mudou enquanto o WolfCore Dev o editava: feche o agente e tente de novo. Ele não foi modificado.',
      'agentes.proveedor_incompatible': '{agente} não pode usar esse provedor de IA.',
      'agentes.sin_cambios_preparados': 'Não há alterações preparadas (git add) para descrever.',
      'agentes.argumento_invalido': 'Dado inválido ({campo}).',
      'git.commit_fallo': 'Não foi possível fazer o commit: {detalle}',
      'git.mensaje_invalido': 'A mensagem do commit está vazia ou não é válida.',
      'php.rama_no_instalada': 'O PHP {rama} não está instalado.',
      'php.argumento_invalido': 'Dado inválido ({campo}).',
      'php.valor_invalido': 'O valor de {clave} não é válido.',
      'php.ini_invalido': 'O PHP não inicia com esse php.ini; nada foi salvo. Saída: {salida}',
      'php.no_arranco':
        'O PHP {rama} não voltou a iniciar com a alteração; o estado anterior foi restaurado e ele responde como antes.',
      'php.caido_tras_restaurar':
        'O PHP {rama} não voltou a iniciar; o estado anterior foi restaurado, mas ele continua sem responder. Confira Serviços e os registros do PHP.',
      'php.respaldo_no_existe': 'Essa cópia do php.ini não existe.',
      'php.extension_no_existe': 'A extensão {nombre} não está na pasta ext desta versão.',
      'php.extension_no_catalogo': 'A extensão {nombre} não está no catálogo para esta versão.',
      'php.variante_desconocida': 'Não foi possível saber como este PHP foi compilado.',
      'php.sin_variante': 'O catálogo não tem {nombre} para a compilação {variante}.',
      'php.huella_distinta': 'O download não confere com o checksum publicado; nada foi instalado.',
      'php.descarga_fallida': 'Não foi possível baixar a extensão: {detalle}',
      'php.extension_en_uso': 'A DLL de {nombre} está em uso. Pare o PHP {rama} e tente de novo.',
      'php.extension_sin_dll':
        'Não foi possível trocar a DLL de {nombre} e a pasta ext do PHP {rama} ficou sem ela. Pare o PHP {rama} e tente de novo: a anterior volta ao lugar ao iniciar.',
      'php.sitio_sin_php': 'Esse site não usa PHP.',
      'php.sitio_no_arranco':
        'O PHP próprio de {sitio} não respondeu com a alteração; o estado anterior foi restaurado.',
      'php.sin_puertos_sitio': 'Não restam portas livres para os PHPs próprios dos sites.',
      'xdebug.launch_invalido':
        'O .vscode/launch.json do projeto não pode ser interpretado; nada foi alterado.',
      'xdebug.launch_no_seguro':
        'A pasta .vscode ou o launch.json dela são um link ou outra coisa: nada é gravado ali.',
      'xdebug.sin_configurar': 'Configure o Xdebug no site antes de gerar o launch.json.',
      'nginx.sitio_no_existe': 'Esse site não existe mais.',
      'nginx.texto_invalido':
        'O texto do vhost é longo demais, está vazio ou tem caracteres de controle.',
      'nginx.sintaxis': 'Linha {linea}: {detalle}. Nada foi alterado.',
      'nginx.directiva_prohibida':
        'Linha {linea}: «{directiva}» não é permitida no vhost de um site (poderia afetar outros sites ou arquivos fora do projeto). Nada foi alterado.',
      'nginx.ruta_fuera':
        'Linha {linea}: «{directiva}» aponta para fora da pasta do projeto ou de seus registros e certificados. Nada foi alterado.',
      'nginx.fuera_de_server':
        'Linha {linea}: o vhost completo só pode ter blocos «server»; «{directiva}» ficou de fora. Nada foi alterado.',
      'nginx.dominio_ajeno':
        'Linha {linea}: «{nombre}» não é um domínio deste site. Adicione-o antes como alias do site.',
      'nginx.puerto_ajeno':
        'Linha {linea}: o site só pode escutar nas portas do Nginx configuradas em Configurações.',
      'nginx.version_no_existe': 'Essa versão do vhost não está mais no histórico.',
      'nginx.argumento_invalido': 'Argumento inválido: {campo}',
      'nginx.destino_interno':
        'Linha {linea}: «{directiva}» aponta para um serviço interno do WolfCore Dev (Adminer, Mailpit, bancos de dados, PHP de outros sites…) e o exporia na rede e nos túneis. Nada foi alterado.',
      'nginx.caido_tras_restaurar':
        'O Nginx não voltou a responder: o vhost anterior foi restaurado, mas ele continua sem responder. Confira Serviços e o registro do Nginx. {salida}',
      'depuracion.puerto_ocupado':
        'A porta {puerto} já está em uso: a captura de dumps não consegue escutar. Feche o programa que a usa (p. ex., um server:dump do Symfony).',
      'depuracion.no_iniciado': 'A captura de dumps está desligada.',
      'depuracion.tipo_no_soportado': 'A captura de dumps é para sites PHP e FastAPI.',
      'depuracion.confirmacion': 'Confirme a captura de dumps na janela.',
      'depuracion.argumento_invalido': 'Argumento inválido: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        'Esse arquivo não está dentro da pasta do site: ele não é aberto no editor.',
      'contenedores.motor_invalido': 'Mecanismo de contêineres desconhecido.',
      'contenedores.id_invalido': 'O id do contêiner não é válido.',
      'contenedores.argumento_invalido': 'Argumento inválido: {campo}',
      'contenedores.sin_motor': '{motor} não está instalado neste computador.',
      'contenedores.no_responde':
        '{motor} não responde. Abra o Docker Desktop ou inicie a máquina do Podman e tente de novo.',
      'contenedores.remoto':
        'A conexão padrão de {motor} aponta para outro computador: o WolfCore Dev só usa mecanismos locais.',
      'contenedores.no_existe': 'O contêiner não existe mais. Atualize a lista.',
      'contenedores.accion_fallo': 'O mecanismo não conseguiu fazer isso: {detalle}',
      'contenedores.demasiados_registros':
        'Só é possível acompanhar no máximo {maximo} registros de contêineres ao mesmo tempo.',
      'contenedores.sin_confirmar': 'Confirme a ação na janela.',
      'catalogo.indice_invalido':
        'O índice de versões de {servicio} não passou na validação; a lista salva é usada.',
      'catalogo.sin_huella':
        '{servicio} {version} não tem checksum publicado: confirme a instalação na janela.',
      'catalogo.huella_debil':
        '{servicio} {version} só tem um checksum fraco (MD5 ou SHA-1): confirme a instalação na janela.',
      'catalogo.huella_no_coincide': 'O download não confere com o checksum publicado.',
      'catalogo.redireccion_ajena': 'O download tentou ir para um site não permitido ({host}).',
      'catalogo.demasiadas_redirecciones':
        'O download fez redirecionamentos demais (mais de {maximo}).',
      'catalogo.respuesta_grande': 'A resposta do servidor é grande demais.',
      'catalogo.version_no_encontrada': 'A versão {version} de {servicio} não está no catálogo.',
      'catalogo.huella_no_disponible':
        'Não foi possível obter o checksum de {servicio} {version} (sem conexão ou a fonte não respondeu). Tente de novo.',
      'catalogo.firma_invalida':
        'A assinatura PGP de {servicio} {version} não é válida ou não foi publicada: nada foi instalado.',
      'catalogo.firma_no_soportada':
        'A assinatura PGP de {servicio} {version} usa um formato que o WolfCore Dev não verifica: nada foi instalado.',
      'catalogo.clave_desconocida':
        'A assinatura de {servicio} {version} é de uma chave que não está entre as chaves fixadas no app: nada foi instalado.',
      'catalogo.firma_vencida':
        'A assinatura de {servicio} {version} ou sua chave expirou: nada foi instalado. Atualize o WolfCore Dev para ter as chaves em dia.',
      'catalogo.reloj_atrasado':
        'A assinatura de {servicio} {version} tem data futura: verifique a data e a hora do computador e tente de novo.',
      'acceso_bd.datos_invalidos': 'Os dados de acesso ao banco não são válidos.',
      'acceso_bd.sin_base': 'O .env deste projeto não aponta para um banco de dados.',
      'acceso_bd.motor_no_soportado':
        'O phpMyAdmin só abre bancos MySQL e MariaDB; use o Adminer para PostgreSQL.',
      'acceso_bd.servidor_no_resuelto':
        'O banco deste projeto não é de um servidor local do WolfCore Dev.',
      'acceso_bd.no_listo': 'A ferramenta não está pronta: instale-a em Serviços e ligue o PHP.',
      'auditoria.tabla_invalida': 'A tabela não existe nessa base.',
      'auditoria.columna_invalida':
        'A coluna não existe nessa tabela (e as colunas do usuário e do hash devem ser diferentes).',
      'auditoria.usuario_no_encontrado': 'Nenhuma conta tem esse usuário.',
      'auditoria.usuario_repetido':
        'Há mais de uma conta com esse usuário: nada foi redefinido, para não tocar na errada.',
      'auditoria.formato_no_soportado':
        'O formato do hash atual não pode ser reproduzido: nada foi redefinido.',
      'auditoria.clave_larga':
        'O bcrypt só usa os primeiros 72 bytes da senha: escolha uma mais curta.',
      'auditoria.clave_invalida': 'A nova senha não é válida.',
      'auditoria.sin_confirmar': 'Confirme que quer redefinir esta senha.',
      'auditoria.respaldo_previo_fallo':
        'Não foi possível guardar uma cópia da base antes de redefinir: nada foi alterado.',
      'auditoria.copia_fallo': 'Não foi possível guardar a cópia da linha: nada foi alterado.',
      'auditoria.motor_no_soportado': 'A auditoria de senhas é para MySQL, MariaDB e PostgreSQL.',
      'auditoria.cancelada': 'Auditoria cancelada.',
      'auditoria.usuario_invalido': 'O usuário deve ter entre 1 e 256 caracteres.',
      'auditoria.en_curso': 'Já há uma auditoria em curso: espere que termine ou cancele-a.',
      'auditoria.base_sistema': 'Uma base do sistema não é auditada: escolha a base de um projeto.',
      'auditoria.esquema_invalido': 'O esquema não existe nessa base.',
      'auditoria.fila_cambio': 'A conta mudou entretanto: nada foi redefinido. Tente de novo.',
      'auditoria.verificacion_fallo':
        'A base não guardou a senha como esperado: a alteração foi desfeita.',
      'auditoria.columna_corta':
        'A coluna do hash admite {largo} caracteres e o novo hash precisa de {necesario}: nada foi alterado. Aumente a coluna.',
      'auditoria.datos_reales_sin_confirmar':
        'Esta base tem dados reais de clientes: redefinir uma senha exige a confirmação reforçada.',
      'instantaneas.id_invalido': 'O instantâneo não é válido.',
      'instantaneas.no_encontrada':
        'O instantâneo não foi encontrado; talvez já tenha sido apagado.',
      'instantaneas.otra_base': 'Este instantâneo é de outra base: não pode ser aplicado a esta.',
      'instantaneas.sin_confirmar': 'Confirme que quer voltar a este instantâneo.',
      'instantaneas.motor_no_soportado': 'Os instantâneos são para MySQL, MariaDB e PostgreSQL.',
      'instantaneas.demasiado_grande':
        'A base pesa mais de {maximo} MB, o máximo que um instantâneo guarda.',
      'instantaneas.sin_espacio':
        'Não há espaço livre suficiente para o instantâneo: são necessários {necesarios} MB e há {libres} MB.',
      'instantaneas.limite':
        'Já existem {maximo} instantâneos desta base: apague algum para tirar outro.',
      'instantaneas.tomar_fallo': 'Não foi possível tirar o instantâneo. A base não foi tocada.',
      'instantaneas.huella_no_coincide':
        'O arquivo do instantâneo mudou ou está danificado: nada foi restaurado.',
      'instantaneas.respaldo_previo_fallo':
        'Não foi possível guardar o estado atual da base: nada foi restaurado.',
      'instantaneas.restauracion_fallo':
        'Não foi possível restaurar o instantâneo. A base voltou a como estava antes. Motivo: {detalle}',
      'instantaneas.restauracion_sin_copia':
        'Não foi possível restaurar o instantâneo e o estado anterior não tinha sido guardado: a base pode ter ficado vazia ou pela metade. Motivo: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        'Não foi possível restaurar o instantâneo nem voltar ao estado anterior. Esse estado está guardado no instantâneo automático {respaldo}: volte a ele em Instantâneos.',
    },
  },
  instantaneas: {
    abrir: 'Instantâneos',
    titulo: (base: string) => `Instantâneos de ${base}`,
    ayuda:
      'Um instantâneo guarda a base exatamente como está agora. Você pode voltar a ele quando quiser: antes de voltar, um instantâneo do estado atual é guardado automaticamente.',
    ubicacion:
      'Ficam na pasta de dados do WolfCore Dev, legíveis só pelo seu usuário. Os serviços e seus dados não são tocados.',
    notaEtiqueta: 'Nota (opcional)',
    notaMarcador: 'Por exemplo: antes de migrar',
    tomar: 'Tirar instantâneo',
    tomada: 'Instantâneo guardado',
    cargando: 'Lendo instantâneos…',
    vacio: 'Esta base ainda não tem instantâneos.',
    automatica: 'Automático',
    sinNota: 'Sem nota',
    detalle: (tablas: number, tamano: string) =>
      `${tablas} ${tablas === 1 ? 'tabela' : 'tabelas'} · ${tamano}`,
    volver: 'Voltar a este instantâneo',
    borrar: 'Apagar',
    borrada: 'Instantâneo movido para a lixeira',
    papelera:
      'Os instantâneos apagados podem ser recuperados por 7 dias na lixeira do WolfCore Dev.',
    cerrar: 'Fechar',
    papeleraTitulo: 'Lixeira',
    papeleraVacia: 'Não há instantâneos na lixeira.',
    recuperar: 'Recuperar',
    recuperada: 'Instantâneo recuperado',
    borradaEl: (fecha: string) => `Apagado em ${fecha}`,
    borrarPregunta: 'Mover este instantâneo para a lixeira?',
    borrarSi: 'Mover para a lixeira',
    notaAutomatica: (fecha: string) =>
      `Estado anterior, guardado antes de voltar ao instantâneo de ${fecha}`,
    notaAutomaticaSinOrigen: 'Estado anterior, guardado antes de voltar a outro instantâneo',
    extensionesAviso: (lista: string) =>
      `Traz extensões do PostgreSQL (${lista}) que só são restauradas com o registro de impressões deste computador.`,
    limites:
      'Nos instantâneos de MySQL e MariaDB também ficam as rotinas, os gatilhos e os eventos. No PostgreSQL é um despejo comprimido de uma única base: não inclui os papéis nem os usuários do servidor. Um instantâneo que não possa ser verificado como feito neste computador é restaurado com um usuário limitado à base, que não admite visões, rotinas nem gatilhos de outros usuários.',
    basesBorradas: 'Instantâneos de bases que já não existem',
    basesBorradasAyuda: 'Escolha uma base para criá-la de novo a partir do seu instantâneo.',
    dialogoVolver: {
      titulo: (base: string) => `Voltar a um instantâneo de ${base}`,
      cargando: 'Preparando a pré-visualização…',
      base: 'Base',
      instantanea: 'Instantâneo',
      ahora: 'Agora',
      tamano: 'Tamanho',
      tablas: 'Tabelas',
      nota: 'Nota',
      aviso: (base: string) =>
        `A base ${base} será substituída por completo por este instantâneo: o que mudou desde então se perde da base. Antes, um instantâneo automático do estado atual é guardado; se algo falhar, a base volta sozinha a esse estado.`,
      pedir: (base: string) => `Para confirmar, digite ${base}`,
      confirmar: 'Voltar a este instantâneo',
      trabajando: (base: string) => `Restaurando ${base}… Não feche o programa até terminar.`,
      hecho: (base: string) => `A base ${base} voltou ao instantâneo`,
      respaldoPrevio: 'O estado anterior ficou guardado no instantâneo automático de',
      advertencias: 'A restauração terminou com avisos:',
      hechoConAvisos: (base: string) => `A base ${base} voltou ao instantâneo, com avisos`,
      baseVacia: 'A base não existe ou está vazia: não há nada para guardar antes de voltar.',
      sinGuardarTitulo: 'Não foi possível guardar o estado atual',
      sinGuardarTexto:
        'O WolfCore Dev não conseguiu guardar o estado atual da base antes de voltar. Se continuar SEM guardá-lo e a restauração falhar, os dados atuais da base se perdem.',
      sinGuardarConfirmar: 'Entendo que os dados atuais da base serão perdidos',
      sinGuardarBoton: 'Voltar sem guardar o estado atual',
    },
  },
  avisoInicio: {
    titulo: 'Aviso do WolfCore Dev',
  },
  tareas: {
    titulo: 'Tarefas agendadas',
    resumen: (n: number) => (n === 0 ? 'Sem tarefas' : n === 1 ? '1 tarefa' : `${n} tarefas`),
    mostrar: 'Ver tarefas',
    ocultar: 'Ocultar',
    cargando: 'A carregar as tarefas',
    errorCargar: 'Não foi possível carregar as tarefas',
    soloAbierta:
      'As tarefas só correm enquanto o WolfCore Dev está aberto. Não usam o Agendador de Tarefas do Windows: com a aplicação fechada ou o computador em repouso não são executadas, e uma execução perdida não é recuperada.',
    repoEjecuta:
      'Num projeto confiável, o que está dentro do repositório é executado tal como está: o arquivo que a tarefa nomeia, `artisan`, os scripts do `package.json`, `.venv`… Se mudarem após um `git pull`, a tarefa executará a versão nova.',
    vacio:
      'Este projeto não tem tarefas agendadas. Crie uma (por exemplo «php artisan schedule:run» a cada minuto num Laravel).',
    nueva: 'Nova tarefa',
    pausada: 'em pausa',
    enCurso: 'A executar…',
    nunca: 'Ainda não foi executada',
    ultima: (f: string) => `Última: ${f}`,
    proxima: (f: string) => `próxima: ${f}`,
    codigo: (n: number) => `código ${n}`,
    resultadoTitulo: (n: string) => `«${n}»`,
    origen: { usuario: 'escrita aqui', 'wolfcore.yml': 'do wolfcore.yml' },
    describir: {
      cadaMinuto: 'A cada minuto',
      cadaN: (n: number) => `A cada ${n} minutos`,
      cadaHora: 'A cada hora, em ponto',
      diaria: (h: string) => `Todos os dias às ${h}`,
      laborables: (h: string) => `De segunda a sexta às ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: 'Correta',
      fallo: 'Falhou',
      tiempo: 'Excedeu o tempo máximo',
      cancelada: 'Cancelada',
      omitida: 'Ignorada',
      bloqueada: 'Não foi executada',
    },
    motivo: {
      aislado:
        'É uma pasta de dados de teste (WOLFCORE_DATOS): não corre até permitir as tarefas nesta sessão.',
      no_confiado:
        'O projeto não está marcado como confiável: marque «Confio neste repositório» para que corra.',
      receta_cambio:
        'A receita do projeto mudou desde que você confiou nele: revise-a e marque «Confio neste repositório» de novo.',
      sin_confirmar: 'Falta confirmar o comando: não é executada até que o reveja e confirme.',
      comando_invalido: 'O comando não é permitido (só php, node, npm run e python).',
      cron_invalida: 'O horário não é uma expressão cron válida.',
      carpeta: 'A pasta do projeto não existe.',
      solapada: 'A anterior ainda estava a correr: esta foi ignorada.',
      retraso: 'Chegou tarde (a aplicação estava suspensa): não é recuperada.',
      error: 'Não foi possível executar o programa.',
    },
    acciones: {
      ejecutar: 'Executar agora',
      editar: 'Editar',
      borrar: 'Apagar',
      verRegistro: 'Ver registro',
      revisarConfirmar: 'Rever e confirmar',
      activar: (n: string) => `Ativar a tarefa ${n}`,
    },
    borrar: {
      titulo: (n: string) => `Apagar «${n}»?`,
      texto:
        'A tarefa e o seu histórico são removidos. O que já executou não é desfeito e os arquivos do projeto não são tocados.',
      confirmar: 'Apagar',
      hecho: (n: string) => `Tarefa «${n}» apagada.`,
    },
    aislado: {
      titulo: 'Pasta de dados de teste.',
      texto:
        'Com WOLFCORE_DATOS nenhuma tarefa corre sozinha. Permita-as só se quiser testá-las nesta sessão.',
      permitir: 'Permitir nesta sessão',
      confirmarTitulo: 'Permitir as tarefas nesta pasta de teste?',
      confirmarTexto:
        'As tarefas ativas dos projetos confiáveis começarão a ser executadas até fechar a aplicação. Os comandos são os de cada projeto e correm na sua pasta real.',
      permitido: 'Tarefas permitidas nesta sessão.',
    },
    yml: {
      titulo: 'Sugestões do wolfcore.yml',
      texto:
        'O arquivo do projeto sugere estas tarefas. Nada corre só por estar escrito ali: reveja o comando e confirme-o para a adotar.',
      estado: { nueva: 'Nova', adoptada: 'Adotada', cambiada: 'Mudou' },
      revisar: 'Rever e adotar',
      cambiada:
        'O comando do wolfcore.yml mudou desde que a adotou. A tarefa do projeto continua com o comando que confirmou; adote a versão nova se a reconhecer.',
      guardarEn: 'Guardar no wolfcore.yml',
      escribirTitulo: 'Escrever a tarefa no wolfcore.yml?',
      escribirTexto:
        'A tarefa é adicionada ou atualizada no arquivo do projeto (sem tocar no resto) para viajar com o repositório. Quem o clonar terá de a confirmar no seu computador.',
      escribir: 'Escrever',
      escrita: 'Tarefa guardada no wolfcore.yml.',
    },
    registro: {
      titulo: (n: string) => `Registro de «${n}»`,
      historial: 'Últimas execuções',
      sinHistorial: 'Ainda não há execuções.',
      salida: 'Saída da última execução',
      sinSalida: 'Sem saída guardada.',
      enmascarado:
        'Os registros escondem palavras-passe e chaves, têm um tamanho máximo e rodam sozinhos.',
      origen: { programada: 'agendada', manual: 'manual' },
    },
    dialogo: {
      tituloNueva: 'Nova tarefa agendada',
      tituloEditar: 'Editar tarefa agendada',
      tituloAdoptar: 'Adotar a tarefa do wolfcore.yml',
      tituloConfirmar: 'Confirmar o comando da tarefa',
      nombre: 'Nome',
      nombrePlaceholder: 'Tarefas do Laravel',
      horario: 'Quando',
      preset: {
        cadaMinuto: 'A cada minuto',
        cadaN: 'A cada alguns minutos',
        cadaHora: 'A cada hora',
        diaria: 'Todos os dias a uma hora',
        laborables: 'De segunda a sexta a uma hora',
        personalizada: 'Expressão cron própria',
      },
      cadaNOpcion: (n: number) => `A cada ${n} minutos`,
      hora: 'Hora',
      horaPlaceholder: '03:00',
      horaInvalida: 'Escreva uma hora válida, por exemplo 03:00.',
      expresion: 'Expressão cron',
      cronEquivale: 'Expressão cron:',
      expresionAyuda:
        '5 campos: minuto, hora, dia do mês, mês e dia da semana (* , - /). No mínimo, uma vez por minuto.',
      proximas: 'Próximas execuções:',
      comando: 'Comando',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        'Só php, node, npm run e python, com um arquivo do projeto. Corre na pasta do projeto, sem shell e sem código na linha (-r, -e, -c).',
      comandoFijo:
        'Este comando tem argumentos com aspas que não se podem escrever como texto: é mantido tal como está e não se edita aqui (apague-o e crie outro se precisar de o mudar).',
      argumentos: 'Será executado com estes argumentos:',
      comillasSinCerrar: 'Falta fechar umas aspas.',
      tiempo: 'Tempo máximo',
      minutos: 'minutos',
      tiempoAyuda: 'Se demorar mais, para sozinha (só esse processo e o que ele lançou).',
      activa: 'Ativa (corre sozinha enquanto a aplicação estiver aberta)',
      advertencia:
        'Ao aceitar autoriza este comando exato: será executado sozinho, na pasta deste projeto, sempre que chegar a hora. Se o mudar, terá de o confirmar de novo.',
      revise: 'Revi este comando e reconheço-o.',
      guardar: 'Guardar e confirmar o comando',
      adoptar: 'Confirmar e adotar',
      confirmar: 'Confirmar o comando',
      guardada: 'Tarefa guardada.',
      adoptada: 'Tarefa adotada.',
      confirmada: 'Comando confirmado.',
    },
  },
  workspaces: {
    titulo: 'Workspaces',
    descripcion:
      'Conjuntos com nome de bancos de dados, serviços e processos que ligam e desligam juntos.',
    nuevo: 'Novo workspace',
    vacio:
      'Ainda não há workspaces. Crie um, por exemplo «Bot FastAPI» com PostgreSQL, Redis, Ollama e o processo do seu projeto.',
    elementos: (n: number) => (n === 1 ? '1 item' : `${n} itens`),
    sinElementos: 'Sem itens',
    estado: { apagado: 'Desligado', parcial: 'Em parte', encendido: 'Ligado' },
    acciones: {
      iniciar: 'Ligar',
      detener: 'Desligar',
      editar: 'Editar',
      borrar: 'Excluir',
      cerrar: 'Fechar',
    },
    borrar: {
      titulo: (n: string) => `Excluir «${n}»?`,
      texto:
        'Excluir o workspace não desliga nem apaga nada: só remove o conjunto. O que está ligado continua ligado.',
      confirmar: 'Excluir',
      hecho: (n: string) => `Workspace «${n}» excluído.`,
    },
    dialogo: {
      tituloNuevo: 'Novo workspace',
      tituloEditar: 'Editar workspace',
      nombre: 'Nome',
      nombrePlaceholder: 'Bot FastAPI',
      nombreVacio: 'Digite um nome.',
      aviso:
        'Um workspace só guarda o que ligar. Não abre túneis, não compartilha na rede local e não liga os processos de um projeto em que você não confia.',
      secciones: {
        instancias: 'Bancos de dados',
        servicios: 'Serviços',
        procesos: 'Processos de projetos',
      },
      sinOpciones: 'Não há nada para escolher aqui.',
      captadorUnico: 'Só um captador de e-mail por vez: escolher outro substitui o anterior.',
      yaNoExisten: (lista: string) => `Não existem mais e serão removidos ao salvar: ${lista}`,
      guardar: 'Salvar',
      guardado: (n: string) => `Workspace «${n}» salvo.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `«${n}»: como ficou ao ligar`,
      tituloDetener: (n: string) => `«${n}»: como ficou ao desligar`,
      encendido: 'Ligado',
      apagado: 'Desligado',
      yaEncendido: 'Já estava ligado',
      yaApagado: 'Já estava desligado',
      noExiste: 'Não existe mais: foi ignorado',
      compartido: 'Continua ligado: outro workspace ligado o usa',
      reemplaza: (otro: string) => `Ligado; desligou ${otro}, do mesmo grupo de e-mail`,
      fallo: 'Não ficou ligado',
      falloApagar: 'Continua ligado',
      ok: (n: string) => `«${n}» pronto.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `«${n}»: ${encendidos} de ${total} ficaram ligados. Veja o que não iniciou.`,
      parcialApagar: (n: string, siguen: number) =>
        `«${n}»: ${siguen} continuam ligados. Veja o que não desligou.`,
    },
  },
  inicio: {
    titulo: 'Início',
    bienvenida: 'O seu ambiente de desenvolvimento, de relance.',
    tiles: {
      servicios: 'Serviços ligados',
      serviciosDe: (total: number) => `de ${total}`,
      sitios: 'Projetos',
      tuneles: 'Túneis ativos',
      hosts: 'Hosts pendentes',
      hostsOk: 'Tudo em ordem',
      hostsFaltan: 'Requer atenção',
    },
    hosts: {
      titulo: 'Há domínios não registrados no arquivo hosts',
      texto:
        'Esses domínios ainda não apontam para o seu computador. Ao corrigir, o Windows vai pedir permissão de administrador.',
      corregir: 'Aplicar hosts pendentes',
      reintentarPermiso: 'Tentar de novo com permissão',
      corregido: 'Arquivo hosts atualizado',
      fallo: 'Não foi possível atualizar o arquivo hosts',
      verInstrucciones: 'Ver instruções',
      duplicados:
        'Esses domínios já estão no hosts fora do bloco do WolfCore Dev (eles são mantidos):',
      motivos: {
        cancelado: 'A permissão de administrador foi cancelada. O arquivo hosts ficou como estava.',
        tiempo:
          'Ninguém respondeu à permissão de administrador a tempo. O site foi salvo; o arquivo hosts ficou como estava. Se ainda vir o aviso do Windows, cancele-o (ele não fará mais nada). Aplique os pendentes quando puder (uma única permissão para todos).',
        denegado:
          'O Windows não permitiu gravar o arquivo hosts. É possível que um antivírus o esteja bloqueando.',
      } as Record<string, string>,
      modalTitulo: 'Corrigir o hosts manualmente',
      modalTexto:
        'Abra o PowerShell como administrador (clique com o botão direito em Iniciar → Terminal (administrador)), cole este comando e pressione Enter.',
    },
    servicios: {
      titulo: 'Serviços',
      ver: 'Ver serviços',
      irA: (nombre: string) => `Ir ao serviço ${nombre}`,
      vacio: 'Ainda não há serviços instalados.',
    },
    tuneles: {
      titulo: 'Túneis ativos',
      vacio: 'Não há túneis abertos. Você pode abrir um em Projetos.',
      sitioDesconocido: 'Site sem nome',
      irA: (nombre: string) => `Ir ao projeto ${nombre}`,
    },
  },
  servicios: {
    titulo: 'Serviços',
    descripcion:
      'Ligue e desligue o servidor web, o PHP, os bancos de dados e as ferramentas. O estado é atualizado sozinho.',
    grupos: {
      web: 'Web',
      php: 'PHP',
      bd: 'Bancos de dados',
      correo: 'E-mail',
      ia: 'IA',
      herramientas: 'Ferramentas',
    },
    gruposAyuda: {
      web: 'Servidor que atende os domínios .test.',
      php: 'Uma instalação por versão (8.3, 8.4…); cada site usa a sua.',
      bd: 'Escutam somente em 127.0.0.1.',
      correo: 'Captura os e-mails que os seus projetos enviam, sem que saiam para a internet.',
      ia: 'Modelos de linguagem no seu computador.',
      herramientas: 'Utilitários para o dia a dia.',
    },
    puerto: 'Porta',
    cambiarPuerto: 'Mudar porta',
    cambiarPuertoDe: (nombre: string) => `Mudar a porta de ${nombre}`,
    versionesDe: (nombre: string) => `Versões de ${nombre}`,
    instancias: (n: number, encendidas: number) => `${n} instâncias, ${encendidas} ligadas`,
    usarPuerto: (p: number) => `Usar a porta ${p}`,
    puertoCambiado: (nombre: string, p: number) => `${nombre} agora usa a porta ${p}`,
    conflicto: 'Porta ocupada',
    autoIniciar: 'Ligar ao iniciar o WolfCore Dev',
    autoIniciarActivado: (nombre: string) => `${nombre} será ligado ao iniciar o WolfCore Dev`,
    autoIniciarDesactivado: (nombre: string) =>
      `${nombre} não será mais ligado ao iniciar o WolfCore Dev`,
    dialogoPuerto: {
      titulo: (nombre: string) => `Porta de ${nombre}`,
      etiqueta: 'Nova porta',
      ayuda:
        'Entre 1024 e 65535 e livre. Se o serviço estiver ligado, ele é reiniciado. Atualize o .env dos seus projetos.',
      rango: 'Use um número entre 1024 e 65535',
      igual: 'É a porta atual',
      guardar: 'Mudar porta',
    },
    borrarDatos: {
      opcion: 'Apagar dados',
      titulo: (nombre: string) => `Apagar os dados de ${nombre}`,
      copias: (n: number, tam: string) =>
        `Também ${n === 1 ? 'será apagada uma cópia' : `serão apagadas ${n} cópias`} das atualizações (${tam}). Se quiser guardá-las, copie-as antes a partir da pasta de dados.`,
      /** O que se perde, conforme o serviço. */
      que: {
        mysql: 'todos os bancos e usuários do MySQL',
        mariadb: 'todos os bancos e usuários do MariaDB',
        postgresql: 'todos os bancos e usuários do PostgreSQL',
        redis: 'todas as chaves e dados guardados no Redis',
        mongodb: 'todos os bancos, coleções e dados do MongoDB',
        mailpit: 'todos os e-mails capturados pelo Mailpit',
        smtp4dev: 'todos os e-mails capturados pelo smtp4dev',
        inbucket: 'todos os e-mails capturados pelo Inbucket',
        papercut: 'todos os e-mails capturados pelo Papercut SMTP',
        ollama: 'todos os modelos baixados do Ollama',
        meilisearch: 'todos os índices do Meilisearch',
      } as Record<string, string>,
      texto: (que: string) =>
        `Serão apagados ${que}. Não é possível desfazer. O programa continua instalado.`,
      generico: (nombre: string) => `todos os dados de ${nombre}`,
      pedir: (id: string) => `Para confirmar, digite ${id}`,
      boton: 'Apagar dados',
      hecho: (nombre: string) => `Dados de ${nombre} apagados`,
    },
    ftp: {
      interruptor: 'Servidor FTP',
      redLocal: 'Permitir conexões da rede local',
      redLocalAyuda:
        'Desligado, só este computador pode se conectar (127.0.0.1). Cada site ativa o próprio acesso em Sites.',
      avisoTitulo: 'Abrir o FTP para a rede local',
      avisoTexto:
        'O FTP envia usuários, senhas e arquivos sem criptografia. Qualquer computador da sua rede poderá tentar se conectar. Use-o somente em uma rede de confiança.',
      avisoConfirmar: 'Permitir',
      redLocalActivada: 'O FTP aceita conexões da rede local',
      redLocalDesactivada: 'O FTP só aceita conexões deste computador',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'Gerenciador de dependências do PHP',
      instalado: 'Instalado',
      noInstalado: 'Não instalado',
      sinVersion: 'não instalado',
      uso: 'Uso',
      usoTexto: 'composer',
      ayuda: 'Use «Terminal» em um projeto ou adicione o WolfCore Dev ao PATH em Configurações.',
      instaladoOk: 'Composer instalado',
      sinPhp: 'Instale o PHP primeiro',
      actualizado: (v: string) => `Composer atualizado: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: 'Administrador web de bancos de dados',
      direccion: 'Endereço',
      disponible: 'Pronto',
      noInstalado: 'Não instalado',
      sinPhp: 'Falta o PHP',
      abrir: 'Abrir o Adminer',
      instaladoOk: 'Adminer instalado',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'Administrador web de MySQL e MariaDB',
      direccion: 'Endereço',
      disponible: 'Pronto',
      noInstalado: 'Não instalado',
      sinPhp: 'Falta o PHP',
      abrirDesdeProyecto: 'Abre-se a partir do cartão de cada projeto, já autenticado.',
      faltaExtension: (ext: string, rama: string) =>
        `O PHP ${rama} não tem a extensão ${ext} ativa. Reinicie o PHP ou ative-a no php.ini dele.`,
      phpFueraDeRango: (rama: string) =>
        `O phpMyAdmin declara suporte até o PHP 8.3 e está sendo usado o PHP ${rama}: pode mostrar erros. Ligue uma versão do PHP de 7.2 a 8.3 se algo falhar.`,
      instalarPrimero: 'Instale o phpMyAdmin para usá-lo.',
      encenderPhp: 'Ligue o PHP para usar o phpMyAdmin.',
      instaladoOk: 'phpMyAdmin instalado',
    },
    puertos: 'Portas',
    pid: 'PID',
    sinVersion: 'sem versão',
    datosConexion: 'Dados de conexão',
    sinPuertos: '—',
    terminado: 'Terminou sem erros',
    externo: 'Administrado fora do WolfCore Dev',
    verDetalle: 'Ver detalhes do erro',
    vacioTitulo: 'Ainda não há serviços',
    vacio:
      'Ainda não há serviços instalados. Comece pelo Nginx e pelo PHP para os seus sites, ou por um banco de dados.',
    irAInstalar: 'Ir para instalar',
  },
  bd: {
    descripcion:
      'Crie, faça backup e restaure os bancos dos seus projetos. Os servidores escutam somente em 127.0.0.1.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: 'Novo banco',
    restaurar: 'Restaurar backup',
    importar: 'Importar de outro servidor',
    soloSql: 'Disponível no MySQL, MariaDB e PostgreSQL',
    enCursoAyuda: 'Aguarde o fim da operação em andamento',
    encenderPrimero: (motor: string) => `Ligue o ${motor} primeiro`,
    cargando: 'Carregando bancos…',
    recargar: 'Recarregar a lista',
    vacioTitulo: 'Não há nenhum servidor de banco de dados instalado',
    vacio:
      'Instale o MySQL, MariaDB, PostgreSQL ou MongoDB em Serviços para administrar os seus bancos.',
    irAServicios: 'Ir para Serviços',
    apagado: {
      titulo: (motor: string) => `${motor} está desligado`,
      texto: (motor: string) => `Ligue o ${motor} para ver e administrar os bancos dele.`,
      iniciando: (motor: string) => `${motor} está ligando…`,
      error: (motor: string) => `${motor} não conseguiu ligar`,
      encender: (motor: string) => `Ligar ${motor}`,
      verServicios: 'Ver em Serviços',
    },
    errorLista: 'Não foi possível ler a lista de bancos',
    sinBases: 'Este servidor ainda não tem bancos próprios.',
    total: (n: number) => plural(n, 'banco', 'bancos'),
    columnas: { nombre: 'Banco', tamano: 'Tamanho', acciones: 'Ações' },
    acciones: {
      respaldar: 'Fazer backup',
      restaurarAqui: 'Restaurar aqui',
      adminer: 'Abrir no Adminer',
      conexion: 'Dados de conexão',
      vector: 'Ativar vector',
      borrar: 'Apagar',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: 'Instale o Adminer e o PHP em Serviços para abri-lo',
    vectorSinInstalar: 'Instale o pgvector mais abaixo para ativá-lo em um banco',
    vectorActivado: (base: string) => `Vector ativado em ${base}`,
    formatos: {
      sql: 'SQL simples',
      pgdump: 'Backup do PostgreSQL (pg_dump, formato personalizado)',
      gz: 'SQL compactado (.gz)',
      zip: 'Arquivo .zip (é descompactado antes de restaurar)',
      rar: 'Arquivo .rar (tenta-se descompactar com o Windows)',
      '7z': 'Arquivo .7z (tenta-se descompactar com o Windows)',
      desconocido: 'Formato não reconhecido',
    } as Record<string, string>,
    formatoDesconocido:
      'O formato não é reconhecido. Se for um arquivo compactado, descompacte-o e escolha o .sql ou .dump que ele contém.',
    formatoIncompatible: 'Este arquivo é um backup do PostgreSQL: restaure-o na aba PostgreSQL.',
    nombre: {
      etiqueta: 'Nome do banco',
      vacio: 'Digite um nome',
      largo: 'O nome é longo demais',
      caracteres: {
        mysql: 'Use somente letras, números e sublinhado',
        mariadb: 'Use somente letras, números e sublinhado',
        postgresql: 'Use minúsculas, números e sublinhado',
        mongodb: 'Use somente letras, números, hífen e sublinhado',
      } as Record<string, string>,
      inicio: 'No PostgreSQL o nome não pode começar com um número',
    },
    reemplazo: {
      titulo: (base: string) => `O banco ${base} já tem tabelas`,
      texto: (base: string) =>
        `Se continuar, o banco ${base} atual será SUBSTITUÍDO por completo. Primeiro é salvo um backup automático; depois o banco é apagado e recriado com o conteúdo novo.`,
      donde: 'O backup é salvo em',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        'Se não quiser substituí-lo, volte e escolha outro nome: será criado um banco novo.',
      pedir: (base: string) => `Para confirmar, digite ${base}`,
      volver: 'Voltar',
      confirmar: 'Substituir o banco',
    },
    resultado: {
      restaurada: (base: string) => `Banco ${base} restaurado`,
      importada: (base: string) => `Banco ${base} importado`,
      respaldada: (base: string) => `Backup de ${base} salvo`,
      archivo: 'Arquivo',
      respaldoPrevio: 'Backup do banco anterior',
      advertencias: (n: number) => plural(n, 'advertência', 'advertências'),
      advertenciasAyuda:
        'A operação terminou. Confira estes avisos; normalmente são funções ou permissões que não existem neste computador.',
      fallo: {
        restaurar: 'Não foi possível restaurar',
        importar: 'Não foi possível importar',
        respaldar: 'Não foi possível fazer o backup',
      } as Record<string, string>,
      trasReemplazo: 'O banco original foi substituído e a restauração não terminou',
      trasReemplazoAyuda:
        'Os seus dados anteriores estão no backup indicado. Você pode restaurá-lo com «Restaurar backup».',
    },
    progreso: {
      titulo: 'Registro',
      corriendo: {
        restaurar: (base: string) => `Restaurando ${base}…`,
        importar: (base: string) => `Importando ${base}…`,
        respaldar: (base: string) => `Fazendo backup de ${base}…`,
      } as Record<string, (base: string) => string>,
      vacio: 'Aguardando a saída da ferramenta…',
      limitado: (n: number) => `São mostradas as últimas ${n} linhas.`,
      noCierre:
        'Não feche o programa até terminar. Você pode sair desta tela e voltar: aqui verá o resultado.',
      otraEnCurso: 'Já há uma operação em andamento; aguarde o fim dela.',
      ver: 'Ver detalhes',
      descartar: 'Descartar',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `Restaurar backup no ${motor}`,
      confianza:
        'Restaure somente backups de confiança: um backup pode executar ações no servidor.',
      archivo: 'Arquivo de backup',
      elegir: 'Escolher arquivo…',
      cambiar: 'Trocar',
      sinArchivo: 'Nenhum arquivo escolhido',
      formato: 'Formato detectado',
      detectando: 'Detectando o formato…',
      destino: 'Banco de destino',
      destinoAyuda:
        'Se não existir, ele é criado. Se existir e estiver vazio, é usado. Se tiver tabelas, será pedida uma confirmação.',
      restaurar: 'Restaurar',
    },
    dialogoImportar: {
      titulo: (motor: string) => `Importar para o ${motor} de outro servidor`,
      soloLectura:
        'Só o servidor de origem é lido: o banco dele é copiado para este computador e a origem não é modificada.',
      detectado: (puerto: number) =>
        `Foi detectado outro servidor na porta ${puerto} (por exemplo, o do FlyEnv).`,
      origen: 'Servidor de origem',
      host: 'Servidor',
      puerto: 'Porta',
      usuario: 'Usuário',
      clave: 'Senha',
      claveAyuda: 'É usada somente para esta cópia e não é salva.',
      baseOrigen: 'Banco de origem',
      destino: 'Banco de destino neste computador',
      destinoAyuda:
        'Se não existir, ele é criado. Se tiver tabelas, será pedida uma confirmação antes de substituí-lo.',
      faltaHost: 'Digite o servidor',
      faltaPuerto: 'Use uma porta entre 1 e 65535',
      faltaUsuario: 'Digite o usuário',
      faltaBase: 'Digite o banco de origem',
      importar: 'Importar',
    },
    dialogoNueva: {
      titulo: (motor: string) => `Novo banco no ${motor}`,
      codificacion: 'Codificação',
      codificacionValor: {
        mysql: 'utf8mb4 (aceita emojis e todos os acentos)',
        mariadb: 'utf8mb4 (aceita emojis e todos os acentos)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: 'Criar um usuário próprio para este banco',
      usuarioPropioAyuda:
        'Opcional. Se não, os seus projetos usam o usuário administrador do servidor.',
      usuario: 'Usuário',
      clave: 'Senha',
      faltaClave: 'Digite uma senha',
      crear: 'Criar banco',
      creada: (base: string) => `Banco ${base} criado`,
      mongo: 'No MongoDB o banco é criado com uma coleção inicial (_pel_init).',
      cambiarClave: 'Alterar a senha',
      cambiarClaveTitulo: (u: string) => `O usuário ${u} já existe com outra senha`,
      cambiarClaveTexto: (u: string) =>
        `Se você alterar a senha de ${u}, os projetos que já a usam deixarão de conectar até você atualizar o .env deles. O normal é usar a senha atual. Alterar mesmo assim?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `Apagar o banco ${base}?`,
      texto: (base: string, motor: string) =>
        `O banco ${base} do ${motor} e todos os dados dele serão apagados. Não é possível desfazer. Se precisar dele, faça backup antes.`,
      pedir: (base: string) => `Para confirmar, digite ${base}`,
      boton: 'Apagar banco',
      hecho: (base: string) => `Banco ${base} apagado`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `Fazer backup de ${base}`,
      destino: 'Será salvo em',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (pasta padrão)',
      porDefectoEn: (carpeta: string) => `${carpeta} (pasta padrão)`,
      cambiar: 'Escolher outra pasta…',
      porDefectoVolver: 'Usar a pasta padrão',
      formato: {
        mysql: 'Arquivo .sql (mysqldump com rotinas e gatilhos)',
        mariadb: 'Arquivo .sql (mysqldump com rotinas e gatilhos)',
        postgresql: 'Arquivo .dump (pg_dump, formato personalizado)',
      } as Record<string, string>,
      boton: 'Fazer backup',
    },
    dialogoConexion: {
      tituloServicio: 'Conexão com o Meilisearch',
      notaMeilisearch:
        'Para usá-la em um projeto: Variáveis (.env) → Adicionar um bloco → Meilisearch. Mostra-se uma prévia com a chave mascarada e pede-se confirmação. A chave é só deste computador.',
      sitio: 'Projeto',
      sitioAyuda:
        'O .env do site é lido para usar as variáveis que ele já tem (por exemplo, CodeIgniter 4). O conteúdo não é exibido nem copiado.',
      generico: 'Genérico (formato Laravel)',
      titulo: (base: string) => `Conexão com ${base}`,
      host: 'Servidor',
      puerto: 'Porta',
      usuario: 'Usuário',
      clave: 'Senha',
      base: 'Banco',
      sinClave: 'Sem senha (escuta somente em 127.0.0.1)',
      mostrar: 'Mostrar senha',
      ocultar: 'Ocultar senha',
      copiarDato: (dato: string) => `Copiar ${dato}`,
      env: 'Bloco para o arquivo .env',
      envAyuda: 'Cole-o no .env do seu projeto. O WolfCore Dev não grava nos seus projetos.',
      copiarEnv: 'Copiar bloco',
      cargando: 'Lendo os dados de conexão…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: 'Já há uma instalação do pgvector em andamento.',
      descripcion:
        'Busca por similaridade (embeddings) dentro do PostgreSQL. É compilado a partir do código oficial.',
      instalado: (v: string | null) => (v ? `Instalado (versão ${v})` : 'Instalado'),
      noInstalado: 'Não instalado',
      herramientas: 'Ferramentas de compilação',
      herramientasSi: 'Prontas',
      herramientasNo: 'Faltam',
      instalar: 'Instalar o pgvector',
      reinstalar: 'Compilar de novo',
      instalarHerramientas: 'Instalar ferramentas de compilação',
      dialogoHerramientasTitulo: 'Instalar ferramentas de compilação',
      dialogoHerramientas:
        'Para compilar o pgvector são necessárias as Build Tools do Visual Studio. Serão baixados ~6 GB e o Windows vai pedir permissão de administrador. Pode demorar bastante; deixe o WolfCore Dev aberto.',
      dialogoCompilarTitulo: 'Compilar e instalar o pgvector',
      dialogoCompilar:
        'O código oficial do pgvector é baixado, compilado e instalado no seu PostgreSQL. O PostgreSQL é parado por alguns segundos enquanto a extensão é copiada e depois volta a ligar.',
      continuar: 'Continuar',
      instalando: 'Instalando as ferramentas de compilação…',
      compilando: 'Compilando o pgvector…',
      herramientasOk: 'Ferramentas de compilação instaladas',
      instaladoOk: (v: string) => `pgvector ${v} instalado`,
      sinWinget:
        'Este computador não tem o winget. Instale as «Build Tools para Visual Studio 2022» em visualstudio.microsoft.com com a carga de trabalho «Desenvolvimento para desktop com C++» e tente de novo.',
      falloHerramientas: 'Não foi possível instalar as ferramentas de compilação',
      activarAyuda: 'Depois, use «Ativar vector» em cada banco que precisar.',
      errorEstado: 'Não foi possível ler o estado do pgvector',
    },
  },
  instalar: {
    titulo: 'Instalar',
    descripcion:
      'Baixe versões oficiais. Cada arquivo é verificado com o checksum SHA-256 antes de ser usado.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: 'Servidor web (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: 'Túneis públicos (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: 'Banco de dados, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: 'Banco de dados, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: 'Banco de dados (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: 'Cache e filas em memória (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: 'Banco de dados de documentos (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'Console do MongoDB (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: 'E-mail de teste (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: 'E-mail de teste (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: 'E-mail de teste (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: 'E-mail de teste (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: 'IA local (ollama.com)' },
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Busca para o Laravel Scout (github.com/meilisearch)',
      },
      composer: { nombre: 'Composer', detalle: 'Dependências do PHP (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: 'Administrador web de bancos de dados' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'Administrador web de MySQL (phpmyadmin.net)' },
    },
    grupos: {
      web: 'Web e PHP',
      bd: 'Bancos de dados',
      otros: 'E-mail, IA e túneis',
    },
    instalados: 'Instalado',
    ninguno: 'Nenhuma versão instalada',
    elegir: 'Escolha uma versão',
    buscando: 'Buscando versões…',
    sinVersiones: 'Nenhuma versão encontrada',
    rama: (rama: string) => rama,
    yaInstalada: 'já instalada',
    fases: {
      descargando: 'Baixando',
      verificando: 'Verificando SHA-256',
      extrayendo: 'Extraindo',
      compilando: 'Compilando',
      listo: 'Instalado',
      error: 'A instalação falhou',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version} instalado`,
  },
  sitios: {
    titulo: 'Sites',
    descripcion: 'Cada site é uma pasta servida pelo Nginx no próprio domínio .test.',
    nuevo: 'Novo site',
    buscar: 'Buscar por nome ou domínio',
    sinResultados: (q: string) => `Nenhum site corresponde a «${q}».`,
    vacioTitulo: 'Ainda não há sites',
    vacio:
      'Escolha a pasta de um projeto e o WolfCore Dev detecta se é Laravel, CodeIgniter ou estático.',
    agregar: 'Adicionar site',
    total: (n: number) => plural(n, 'site', 'sites'),
    abrirSitio: (dominio: string) => `Abrir ${dominio} no navegador`,
    carpeta: 'Pasta',
    abrirCarpeta: 'Abrir a pasta do projeto',
    alias: (n: number) => `+${plural(n, 'alias', 'aliases')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: 'Estático',
      proxy: 'Proxy (porta local)',
      personalizado: 'Personalizado',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (porta local)',
      node: 'Node / Vite (porta local)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: 'Estático',
      proxy: 'Proxy',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: 'Dados reais',
    datosRealesAyuda: 'Contém dados reais de clientes: tenha cuidado ao publicá-lo.',
    faltaHosts: 'Falta no hosts',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios} ainda não aponta para este computador. Corrija o arquivo hosts com o aviso acima.`,
    estado: {
      enLinea: 'Online',
      faltaHosts: 'Falta no hosts',
      iniciando: 'Nginx iniciando…',
      errorNginx: 'Erro no Nginx',
      nginxExterno: 'Nginx externo',
      nginxApagado: 'Nginx desligado',
    },
    borrar: {
      titulo: (nombre: string) => `Apagar o site ${nombre}?`,
      texto: 'A pasta do projeto não é tocada.',
      hecho: (nombre: string) => `Site ${nombre} apagado`,
      nginxFallo: 'O site foi apagado, mas o Nginx não aceitou a nova configuração',
    },
  },
  formSitio: {
    tituloNuevo: 'Novo site',
    tituloEditar: 'Editar site',
    tituloDuplicar: 'Duplicar site',
    paso: 'Comece pela pasta do projeto',
    pasoAyuda:
      'São detectados o tipo de projeto, a versão do PHP e um domínio sugerido. Depois você pode mudar tudo.',
    elegirCarpeta: 'Escolher pasta',
    cambiarCarpeta: 'Trocar',
    detectando: 'Analisando o projeto…',
    detectado: (tipo: string) => `Detectado: ${tipo}`,
    sinDeteccionAlEditar: 'A detecção automática só se aplica ao criar; confira o tipo e o PHP.',
    nombre: 'Nome',
    nombreAyuda: 'Só para reconhecê-lo na lista.',
    nombreCopia: (nombre: string) => `${nombre} (cópia)`,
    duplicarProxy:
      'A cópia aponta para a mesma porta local do original e não copia os processos dele: mude a porta ou adicione um processo próprio.',
    dominio: 'Domínio',
    dominioPlaceholder: 'meu-projeto',
    alias: 'Alias',
    aliasAyuda: 'Outros domínios .test que abrem o mesmo site. Digite e pressione Enter.',
    aliasAgregar: 'Adicionar alias',
    carpeta: 'Pasta do projeto',
    raizLaravel: 'O Nginx vai servir a subpasta public/.',
    tipo: 'Tipo de projeto',
    php: 'Versão do PHP',
    phpElegir: 'Escolha uma versão',
    phpNinguno: 'Não há nenhuma versão do PHP instalada.',
    phpInstalar: 'Instalar o PHP',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `O projeto pede o PHP ${pedida}, que não está instalado. Foi escolhido o PHP ${elegida}.`,
    puertoProxy: 'Porta local',
    puertoProxyAyuda:
      'O Nginx vai encaminhar as requisições para http://127.0.0.1:<porta> (por exemplo, Vite ou Node).',
    urlBaseVar: 'Variável de URL base',
    urlBaseVarAyuda:
      'Ao abrir um túnel, o link público é gravado nesta variável do .env e, ao fechá-lo, ela é restaurada.',
    urlBaseVarNinguna: 'Nenhuma (não mexer no .env)',
    datosReales: 'Tem dados reais de clientes',
    datosRealesAyuda:
      'Fica marcado na lista e uma confirmação é pedida antes de publicá-lo com um túnel.',
    avanzado: 'Avançado',
    reglasExtra: 'Regras extras do Nginx',
    reglasExtraAyuda:
      'São inseridas dentro do bloco server (cabeçalhos de segurança, deny próprios…). São validadas com nginx -t ao salvar.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: 'Nota',
    notaPlaceholder: 'Algo que você queira lembrar deste site',
    guardar: 'Salvar site',
    guardado: (nombre: string) => `Site ${nombre} salvo`,
    errorGuardar: 'Não foi possível salvar o site',
    nginxFallo: 'O site foi salvo, mas o Nginx rejeitou a configuração',
    nginxFalloAyuda:
      'A configuração anterior do Nginx foi restaurada. Revise as regras extras e salve de novo.',
    errores: {
      carpeta: 'Escolha a pasta do projeto',
      sufijo: 'O domínio deve terminar em .test',
      caracteres: 'Use somente letras, números, hífens e pontos',
      aliasIgualDominio: (d: string) => `O alias ${d} é igual ao domínio do site`,
      aliasRepetido: (d: string) => `O alias ${d} está repetido`,
      ocupado: (d: string) => `Já existe um site com o domínio ${d}`,
      puertoFalta: 'Um site proxy precisa de uma porta',
      puertoRango: 'A porta deve estar entre 1 e 65535',
      php: 'Selecione uma versão do PHP para este site',
      urlBaseVar: 'Use letras, números e sublinhado (por exemplo, APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `Túnel público para ${dominio}`,
    etiqueta: 'Túnel',
    apagadoAyuda: 'Compartilhe este site com um link público temporário.',
    abriendo: 'Abrindo túnel…',
    cerrando: 'Fechando túnel…',
    error: 'O túnel falhou',
    sinNginx: 'Ligue o Nginx primeiro',
    sinCloudflared: 'Instale o cloudflared em Serviços',
    abrirUrl: 'Abrir o link público',
    copiarUrl: 'Copiar o link público',
    verQr: 'Mostrar o código QR do link',
    qrTitulo: 'Link público deste site',
    renovar: 'Renovar (novo link)',
    cerrar: 'Fechar túnel',
    confirmarTitulo: 'Publicar um site com dados reais',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio} tem dados reais de clientes e seria publicado na internet com ${destino}: qualquer pessoa com o link poderá vê-lo enquanto continuar aberto. Publicar?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio} será publicado na internet com o Expose: qualquer pessoa com o link poderá entrar enquanto continuar aberto. Além disso, o inspetor de pedidos do Expose fica visível para qualquer dispositivo da sua rede local. Publicar?`,
    compartir: 'Partilhar',
    confirmar: 'Publicar',
    confirmarPublicoTitulo: 'Publicar o site na internet',
    confirmarPublicoTexto: (dominio: string) =>
      `Será aberto um túnel público da Cloudflare para ${dominio}: qualquer pessoa com o link poderá entrar enquanto ele estiver aberto. Publicar?`,
    opciones: 'Opções do túnel',
    opcionesDe: (dominio: string) => `Opções do túnel de ${dominio}`,
    proveedor: 'Provedor',
    proveedorRapido: 'Rápido (sem conta)',
    proveedorRapidoAyuda: 'Um link trycloudflare.com que muda a cada abertura.',
    proveedorNombre: 'Com nome (seu domínio)',
    proveedorNombreAyuda:
      'Um link fixo em um domínio seu na Cloudflare. Precisa de uma conta da Cloudflare.',
    cuentaConectada: 'Conta da Cloudflare conectada.',
    cuentaSinConectar: 'Ainda não há uma conta da Cloudflare conectada.',
    conectar: 'Conectar com a Cloudflare',
    conectando: 'Aguardando a autorização no seu navegador…',
    conectarAyuda:
      'Seu navegador abre para autorizar o WolfCore Dev na sua conta. O certificado fica só na sua pasta de dados.',
    autorizacion: 'Autorização da Cloudflare',
    abrirAutorizacion: 'Abrir a página de autorização',
    copiarAutorizacion: 'Copiar o link de autorização',
    cancelarConexion: 'Cancelar',
    recrear: 'Recriar o túnel',
    olvidar: 'Esquecer o túnel',
    recrearTitulo: 'Recriar o túnel',
    recrearTexto: (n: string) =>
      `O túnel «${n}» será apagado na Cloudflare e um novo será criado com o mesmo nome. Os sites que o usam são fechados.`,
    olvidarTitulo: 'Esquecer o túnel',
    olvidarTexto: (n: string) =>
      `O túnel «${n}» será apagado na Cloudflare, junto com a credencial salva. Os sites que o usam voltam ao túnel rápido.`,
    olvidarAqui: 'Esquecer só aqui',
    olvidarAquiTitulo: 'Esquecer o túnel só neste computador',
    olvidarAquiTexto: (n: string) =>
      `A credencial salva do túnel «${n}» será apagada neste computador; o túnel continuará existindo na Cloudflare. Os sites que o usam voltam ao túnel rápido.`,
    desconectar: 'Desconectar',
    nombreTunel: 'Nome do túnel',
    nombreTunelAyuda: 'Minúsculas, números e hífens.',
    dominioPublico: 'Domínio público',
    dominioPublicoAyuda:
      'Um subdomínio de um domínio seu na Cloudflare, p. ex. demo.meudominio.com.',
    crear: 'Criar e rotear',
    guardadoNombre: 'Túnel com nome pronto. Ao abri-lo será pedida confirmação.',
    guardadoRapido: 'Este site volta a usar o túnel rápido.',
    cambiarCierra: 'Ao trocar de provedor, o túnel aberto deste site é fechado.',
    usarRapido: 'Usar o túnel rápido',
    nombreActual: (nombre: string, dominio: string) => `Túnel «${nombre}» em ${dominio}`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `${dominio} será publicado em ${publico} por um túnel da Cloudflare: qualquer pessoa com o link poderá acessar enquanto estiver aberto. Publicar?`,
    proveedorNgrokAyuda:
      'Com a sua conta do ngrok. Precisa do programa ngrok já instalado neste computador.',
    proveedorExposeAyuda:
      'Com a sua conta do Expose. Precisa do Expose já instalado neste computador; no Windows só funciona com o expose.phar. O seu inspetor fica visível na rede local, por isso não se usa com sites com dados reais.',
    proveedorTailscaleAyuda:
      'Pela sua rede privada do Tailscale. Precisa do Tailscale instalado e com sessão iniciada.',
    tokenGuardado: (f: string) => `Token guardado (termina em ${f}).`,
    tokenSinGuardar: 'Ainda não há um token guardado.',
    tokenNgrok: 'Token do ngrok',
    tokenExpose: 'Token do Expose',
    tokenAyuda:
      'É guardado cifrado neste computador e só é entregue ao programa ao abrir o túnel; nunca é mostrado.',
    tokenPlaceholder: 'Cole aqui o token',
    guardarToken: 'Guardar o token',
    borrarToken: 'Apagar o token',
    usarProveedor: 'Usar este provedor',
    guardadoProveedor: 'Provedor guardado. Ao abrir o túnel será pedida confirmação.',
    ngrokAyudaInstalacion:
      'O ngrok já deve estar instalado neste computador (o WolfCore Dev não o descarrega porque o ngrok não publica um download verificável). A sua configuração global não é tocada.',
    exposeAyudaInstalacion:
      'O Expose já deve estar instalado ou ter o seu expose.phar na pasta bin/expose dos dados do WolfCore Dev (no Windows só funciona com o phar; não há download com checksum). O seu inspetor de pedidos fica visível em toda a rede local, por isso não se usa com sites com dados reais. A sua configuração global não é tocada.',
    tailscaleAlcance: 'Até onde chega',
    tailscaleServe: 'Serve: só a sua tailnet',
    tailscaleServeAyuda: 'Só os dispositivos da sua rede Tailscale. Não chega à internet.',
    tailscaleFunnel: 'Funnel: toda a internet',
    tailscaleFunnelAyuda: 'Qualquer pessoa com o link pode entrar, esteja ou não na sua tailnet.',
    tailscaleFunnelAviso:
      'O Funnel publica este site na internet: qualquer pessoa com o link poderá entrar enquanto estiver aberto.',
    tailscaleAyudaInstalacion:
      'O WolfCore Dev não instala o Tailscale (é um serviço do sistema): deve estar instalado e com sessão iniciada. Nada do que já publica com o Tailscale é alterado; o site usa a porta HTTPS 8443.',
    confirmarTailnetTitulo: 'Partilhar com a sua tailnet',
    confirmarTailnetTexto: (dominio: string) =>
      `${dominio} será partilhado com o Tailscale Serve: só os dispositivos da sua tailnet poderão entrar; não é publicado na internet. Partilhar?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} tem dados reais de clientes. Com o Tailscale Serve só os dispositivos da sua tailnet o poderão ver (não é publicado na internet). Partilhar?`,
    confirmarFunnelTexto: (dominio: string) =>
      `${dominio} será publicado na internet com o Tailscale Funnel: qualquer pessoa com o link poderá entrar enquanto continuar aberto. Publicar?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${dominio} será publicado na internet com ${proveedor}: qualquer pessoa com o link poderá entrar enquanto continuar aberto. Publicar?`,
    tituloError: 'Não foi possível abrir o túnel',
  },
  tuneles: {
    titulo: 'Túneis',
    descripcion: 'Links públicos temporários da Cloudflare para mostrar um site fora da sua rede.',
    explicacion:
      'Os túneis rápidos mudam de endereço a cada vez que são abertos ou renovados e só funcionam enquanto este computador estiver ligado e os processos dele estiverem vivos (se você sair do WolfCore Dev deixando-os ligados, eles continuam ativos).',
    columnas: { sitio: 'Site', estado: 'Estado', url: 'Link', acciones: 'Ações' },
    vacioTitulo: 'Não há túneis abertos',
    vacio: 'Ligue o interruptor de túnel de um site para obter um link público.',
    irASitios: 'Ir para Sites',
    sinNombre: 'Site apagado',
  },
  ajustes: {
    titulo: 'Configurações',
    descripcion: 'Preferências do ambiente.',
    general: 'Geral',
    carpetaDatos: 'Pasta de dados',
    carpetaDatosAyuda: 'Binários, configuração e registros. Pode ser aberta, não alterada.',
    servicios: 'Serviços',
    puertoNginx: 'Porta do Nginx',
    puertoNginxAyuda:
      'Normalmente 80. Se não for 80, as URLs locais levarão a porta. Os túneis abertos continuam na porta anterior: renove-os.',
    trabajadores: 'Workers do PHP',
    trabajadoresAyuda:
      'Processos php-cgi por versão. Mais workers atendem mais requisições ao mesmo tempo.',
    nota: 'Ao salvar, os sites são regenerados com a nova porta. Se o Nginx estiver ligado, ele é reiniciado (ou recarregado se a porta não mudou), e as versões do PHP ligadas são reiniciadas se os workers mudarem.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `Configurações salvas e aplicadas. Reiniciado: ${reiniciados.join(', ')}.`
        : 'Configurações salvas e aplicadas.',
    errorAplicar: 'Configurações salvas, mas não foi possível aplicá-las por completo',
    errorSeccion: (detalle: string) => `Não foi possível ler este dado: ${detalle}`,
    acerca: 'Sobre',
    avisos: {
      titulo: 'Avisos',
      descripcion:
        'Quais avisos são guardados no sino e se o Windows mostra uma notificação quando a janela não está à vista.',
      nativas: 'Notificações do Windows',
      nativasAyuda:
        'Somente quando o WolfCore Dev não está em primeiro plano; no máximo uma por tipo a cada 5 min.',
      tiposTitulo: 'Tipos de aviso',
      versionesTitulo: 'Novas versões por serviço',
      versionesAyuda:
        'Desative um serviço para não receber avisos das novas versões dele (a aba Versões continua marcando as atualizações).',
      versionesDe: (s: string) => `Avisar sobre novas versões de ${s}`,
      tipos: {
        'servicio-caido': 'Um serviço parou com um erro',
        'puerto-ocupado': 'Porta ocupada ao iniciar um serviço',
        'certificado-por-vencer': 'Certificados prestes a vencer',
        'tunel-caido': 'Um túnel caiu',
        'proceso-error': 'Um processo de projeto falhou',
        'proceso-terminado': 'Um processo de projeto terminou',
        'receta-terminada': 'Uma receita de projeto terminou',
        doctor: 'Diagnóstico (Doctor)',
        'contenedor-detenido': 'Um contêiner parou',
        'version-nueva': 'Há uma nova versão de um serviço instalado',
      } as Record<string, string>,
      errorGuardar: 'Não foi possível salvar os avisos',
    },
    versionPrograma: 'Versão do programa',
    https: {
      titulo: 'HTTPS',
      autoridad: 'Autoridade local',
      autoridadAyuda:
        'O WolfCore Dev assina os certificados dos seus sites .test com uma autoridade própria. Ela é instalada no repositório do seu usuário do Windows, sem permissões de administrador.',
      instalada: 'Instalada no Windows',
      noInstalada: 'Não instalada',
      instalar: 'Instalar autoridade',
      reinstalar: 'Reinstalar',
      quitar: 'Remover',
      instaladaOk: 'Autoridade HTTPS instalada',
      quitadaOk: 'Autoridade HTTPS removida',
      cancelado: 'A confirmação do Windows foi cancelada. Nada foi alterado.',
      fallo: 'Não foi possível alterar a autoridade HTTPS',
      quitarTitulo: 'Remover a autoridade HTTPS?',
      quitarTexto:
        'Os navegadores deixarão de confiar nos certificados dos seus sites .test até você instalá-la de novo.',
      puerto: 'Porta HTTPS',
      puertoAyuda:
        'Normalmente 443. Se outro programa a usa, escolha uma entre 1024 e 65535; as URLs levarão a porta.',
      puertoRango: 'Use 443 ou um número entre 1024 e 65535',
      puertoGuardado: (p: number) => `O HTTPS agora usa a porta ${p}`,
      puertoAplicarFallo: 'Porta salva, mas o Nginx não aceitou a nova configuração',
      firefox:
        'O Firefox usa o próprio repositório de certificados. Para que ele confie na autoridade, abra about:config e ative',
    },
    herramientas: {
      titulo: 'Terminal e ferramentas',
      phpPorDefecto: 'PHP padrão',
      phpPorDefectoAyuda:
        'A versão do php e do composer no terminal e nos atalhos do WolfCore Dev. «Terminal» usa o PHP de cada projeto.',
      phpMasReciente: 'A mais recente instalada',
      phpSinInstalar: 'Instale o PHP em Serviços para escolher uma versão',
      phpGuardado: 'PHP padrão atualizado',
      path: 'PATH do usuário',
      pathAyuda:
        'Adiciona o php e o composer do WolfCore Dev ao PATH do seu usuário para usá-los em qualquer terminal.',
      pathActivo: 'Adicionado ao PATH',
      pathInactivo: 'Não está no PATH',
      pathAgregar: 'Adicionar ao PATH do usuário',
      pathQuitar: 'Remover do PATH',
      pathTitulo: 'PATH atualizado',
      pathAviso: 'Abra um terminal novo para ver a mudança: os terminais já abertos não a veem.',
      pathQuitarTitulo: 'Remover o WolfCore Dev do PATH?',
      pathQuitarTexto:
        'O php e o composer do WolfCore Dev deixarão de estar disponíveis nos novos terminais. Os terminais abertos não mudam.',
      adminer: 'Porta do Adminer',
      adminerAyuda: 'O Adminer é servido somente neste computador, neste endereço fixo.',
      terminal: 'Terminal padrão',
      terminalSistema: 'O do sistema (PowerShell)',
      terminalAyuda:
        'O que o «Terminal» abre nos projetos. Se o projeto precisa de variáveis próprias (o PHP dele no PATH, a chave de um agente), com o «Windows Terminal» o PowerShell é aberto dentro do terminal padrão do Windows: um Windows Terminal já aberto não receberia essas variáveis.',
      terminalGuardada: 'Terminal padrão atualizado',
      editor: 'Editor padrão',
      editorPrimero: 'O primeiro detectado',
      editorAyuda:
        'O que o «Editor» abre nos projetos e «Abrir no editor» nas buscas e nos erros. São detectados VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed e Notepad++.',
      editorGuardado: 'Editor padrão atualizado',
      editorNinguno: 'Nenhum editor foi detectado.',
    },
  },
  /* ───────────── HTTPS, terminal e FTP em sites; E-mail; IA local ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS ativo',
    candadoAyuda: 'Este site também responde por HTTPS com um certificado do WolfCore Dev.',
    redirige: 'Redireciona http → https',
    abrirHttp: (dominio: string) => `Abrir http://${dominio} no navegador`,
    abrirHttps: (url: string) => `Abrir ${url} no navegador`,
    pendiente: (motivo: string) => `HTTPS pendente: ${motivo}`,
    pendienteCorto: 'HTTPS pendente',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `a porta ${puerto} está sendo usada por ${nombre} (PID ${pid}).`,
    sinAutoridad: 'falta a autoridade certificadora. Instale-a em Configurações.',
    pendienteAyuda:
      'O site continua funcionando por HTTP. Feche esse programa ou escolha outra porta HTTPS em Configurações.',
    sinConfianza: 'Autoridade não instalada',
    sinConfianzaAyuda:
      'O navegador vai mostrar um aviso de segurança até você instalar a autoridade do WolfCore Dev (Configurações → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'Servir também por HTTPS',
    httpsAyuda:
      'Com um certificado próprio para o domínio e os aliases dele, assinado pelo WolfCore Dev.',
    redirigir: 'Redirecionar para HTTPS',
    redirigirAyuda: 'As visitas por http passam para https. Os túneis públicos não são afetados.',
    redirigirDeshabilitado: 'Ative o HTTPS primeiro',
    sinAutoridadTitulo: 'A autoridade HTTPS não está instalada',
    sinAutoridadTexto:
      'Sem ela, o navegador vai mostrar um aviso de segurança. O Windows vai pedir para confirmar a instalação.',
    instalar: 'Instalar autoridade',
    instalada: 'Autoridade HTTPS instalada',
    cancelado: 'A confirmação do Windows foi cancelada. Nada foi alterado.',
    fallo: 'Não foi possível instalar a autoridade HTTPS',
  },
  terminalSitio: {
    boton: 'Terminal',
    ayuda: 'Abre um terminal na pasta do projeto, com o PHP e o Composer dele no PATH.',
    elegir: 'Escolher terminal',
    predeterminada: 'padrão',
  },
  editorSitio: {
    ayuda: 'Abre a pasta do projeto no editor padrão.',
    elegir: 'Abrir com…',
    predeterminada: 'padrão',
    sustituido: (pred: string, usado: string) =>
      '{pred} não está instalado: aberto com {usado}.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: 'Não foi possível abrir o editor',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `PHP ${rama} compartilhado`,
    propio: (rama: string) => `PHP ${rama} próprio deste site`,
    conXdebug: 'Xdebug ativo',
    mostrar: 'Configurações do PHP',
    ocultar: 'Ocultar configurações do PHP',
    cargando: 'Lendo as configurações do PHP…',
    apagadoRama: (rama: string) =>
      `O PHP ${rama} está desligado: o PHP próprio deste site inicia junto com ele.`,
    ajustesTitulo: 'php.ini próprio',
    ajustesAyuda: (rama: string) =>
      `São somados ao php.ini do PHP ${rama} somente para este site. Com algum (ou com o Xdebug), o site usa o próprio PHP de 1 ou 2 processos; os demais sites não mudam.`,
    clave: 'Diretiva',
    valor: 'Valor',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `Remover ${clave || 'configuração'}`,
    agregar: 'Adicionar configuração',
    guardarAjustes: 'Testar e salvar',
    ajustesGuardados: 'Configurações do PHP do site aplicadas',
    sinAjustes: 'Sem configurações próprias: usa o php.ini compartilhado como está.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `Xdebug para ${dominio}`,
    xdebugAyuda:
      'É carregado somente no PHP deste site, nunca no PHP compartilhado: os demais sites continuam igualmente rápidos.',
    xdebugDescarga:
      'O Xdebug não está instalado nesta versão do PHP: ele será baixado do catálogo (xdebug.org, checksum SHA-256 verificado).',
    modo: 'Modos',
    modos: {
      debug: 'debug (pontos de interrupção)',
      develop: 'develop (erros melhores)',
      coverage: 'coverage (cobertura)',
      profile: 'profile (perfilamento)',
      trace: 'trace (rastreamento)',
    },
    puerto: 'Porta do editor',
    inicio: 'Quando conecta',
    inicioTrigger: 'Somente com XDEBUG_TRIGGER',
    inicioYes: 'A cada requisição',
    inicioAyuda:
      'Com «Somente com XDEBUG_TRIGGER», a depuração começa quando a requisição traz o cookie, o parâmetro GET/POST ou a extensão do navegador (Xdebug Helper).',
    guardarXdebug: 'Salvar Xdebug',
    xdebugPuertoEnUso: (puerto: number) =>
      `A porta ${puerto} já é usada por um PHP ou outro serviço do WolfCore Dev: o seu editor não poderá escutá-la. Escolha outra (9003 é a habitual).`,
    xdebugGuardado: 'Xdebug do site aplicado',
    quitarXdebug: 'Remover o Xdebug',
    quitarXdebugTitulo: 'Remover o Xdebug deste site?',
    quitarXdebugTexto:
      'A configuração dele é apagada. Se o site não tiver outras configurações, volta ao PHP compartilhado. O launch.json do projeto não é tocado.',
    xdebugQuitado: 'Xdebug removido do site',
    ide: 'Editor',
    generarLaunch: 'Gerar launch.json',
    launchTitulo: '.vscode/launch.json do projeto',
    launchNuevo:
      'O .vscode/launch.json será criado com esta configuração (PHP Debug do VS Code, escuta somente em 127.0.0.1).',
    launchFusion:
      'Já existe um launch.json: somente a configuração do WolfCore é adicionada (ou atualizada); as demais e os comentários permanecem. Antes, uma cópia com data é salva na pasta de dados do WolfCore Dev.',
    launchSinCambios: 'O launch.json já tem esta configuração.',
    launchEscribir: 'Gravar launch.json',
    launchCreado: 'launch.json criado em .vscode',
    launchActualizado: (respaldo: string) => `launch.json atualizado. Cópia prévia: ${respaldo}`,
    phpStorm: 'Configuração para o PhpStorm',
    copiarPhpStorm: 'Copiar configuração do PhpStorm',
    errorNginx: (salida: string) =>
      `O Nginx não aceitou a alteração; o estado anterior foi restaurado. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: 'Vhost gerado',
    conReglas: 'com regras próprias',
    manualResumen: 'Vhost escrito à mão (não é regenerado)',
    mostrar: 'Editar vhost',
    ocultar: 'Ocultar vhost',
    cargando: 'Lendo o vhost…',
    reglasTitulo: 'Regras próprias',
    reglasAyuda:
      'Ficam dentro do bloco server deste site. Antes de aplicar, são testadas com nginx -t sobre uma cópia de toda a configuração; se algo falhar, tudo continua como estava.',
    reglasEtiqueta: 'Regras próprias do Nginx',
    reglasPlaceholder: '# Por exemplo: client_max_body_size 256m;',
    snippetsTitulo: 'Trechos',
    insertar: (titulo: string) => `Inserir: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': 'Cache de estáticos',
      'limite-subida': 'Limite de upload',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': 'Cabeçalhos de segurança',
      websocket: 'Proxy WebSocket',
      gzip: 'Compressão gzip',
      ocultos: 'Negar arquivos ocultos',
    },
    aplicar: 'Testar e aplicar',
    descartar: 'Descartar alterações',
    aplicado: 'Vhost aplicado e Nginx recarregado',
    aplicadoApagado: 'Vhost salvo; será usado ao ligar o Nginx',
    fallo: 'O Nginx não aceitou a alteração; o vhost continua como estava',
    salidaTitulo: 'Saída do nginx -t',
    desactivado:
      'O Nginx não aceitou o que você escreveu para este site ao aplicar a configuração, e isso ficou fora do vhost (continua salvo). Corrija e aplique de novo para voltar a usá-lo.',
    avisoDestino: (destino: string, linea: number) =>
      `Linha ${linea}: o tráfego é enviado para outro computador (${destino}). Confira se é isso mesmo que você quer.`,
    generadoTitulo: 'Vhost gerado (somente leitura)',
    avanzadoTitulo: 'Modo avançado',
    avanzadoInterruptor: 'Escrever o vhost completo à mão',
    avanzadoAyuda:
      'Substitui o vhost gerado. O WolfCore Dev deixa de regenerá-lo: se mudar o domínio, o HTTPS, as portas ou a pasta, você terá de ajustá-lo. Só pode usar os domínios e as portas deste site.',
    avanzadoActivarTitulo: 'Escrever o vhost à mão?',
    avanzadoActivarTexto:
      'Parte-se do vhost gerado atual. Enquanto estiver ativo, as mudanças do site (domínio, HTTPS, PHP…) não se refletem no vhost: você terá de fazê-las.',
    avanzadoActivar: 'Escrever à mão',
    manualEtiqueta: 'Vhost completo do site',
    aplicarManual: 'Testar e aplicar o vhost',
    volverGenerado: 'Voltar ao vhost gerado',
    volverGeneradoTitulo: 'Voltar ao vhost gerado?',
    volverGeneradoTexto:
      'O vhost escrito à mão é guardado no histórico e o WolfCore Dev volta a gerar o do site (com as regras próprias dele).',
    historial: 'Histórico',
    historialTitulo: 'Versões anteriores do vhost',
    historialVacio: 'Ainda não há versões anteriores.',
    historialAyuda:
      'As 10 últimas versões são guardadas, antes de cada alteração. Restaurar passa pelo mesmo teste com nginx -t.',
    modoReglas: 'Gerado com regras',
    modoManual: 'Escrito à mão',
    restaurar: 'Restaurar',
    restaurarTitulo: 'Restaurar esta versão?',
    restaurarTexto: (fecha: string) =>
      `O vhost volta a ser como era em ${fecha}. A versão atual fica no histórico.`,
    restaurado: 'Versão restaurada',
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'O processo do Reverb deste projeto não tem o comando do WolfCore Dev (outro host, programa ou porta). Ao ligá-lo, ele é substituído pelo comando padrão, que só escuta em 127.0.0.1.',
    ayuda: 'WebSockets do Laravel, só em 127.0.0.1.',
    puerto: (p: number) => 'Porta {p}'.replace('{p}', String(p)),
    interruptor: (dominio: string) => 'Ligar ou desligar o Reverb de {d}'.replace('{d}', dominio),
    activarTitulo: 'Ligar o Reverb?',
    activarTexto: (dominio: string) =>
      'Será executado «php artisan reverb:start» em {d}, escutando só em 127.0.0.1 numa porta livre. O código do projeto é executado com o seu PHP.'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Desligar o Reverb?',
    desactivarTexto:
      'O processo é parado e removido do projeto. As variáveis REVERB_* do .env não são alteradas.',
    activar: 'Ligar',
    desactivar: 'Desligar',
    proponer: 'Propor variáveis REVERB_*',
    tituloError: 'Reverb',
    estados: {
      apagado: 'Parado',
      iniciando: 'Iniciando',
      encendido: 'Ligado',
      error: 'Com erro',
    },
  },
  lan: {
    etiqueta: 'Rede local',
    interruptor: (dominio: string) => `Compartilhar ${dominio} na rede local`,
    apagadoAyuda: 'Abra este site pelo celular ou por outro dispositivo da mesma rede.',
    sinNginx: 'Ligue o Nginx para compartilhar o site na rede local.',
    sinRed: 'Não há uma rede local conectada (Wi-Fi ou Ethernet).',
    activo: 'Visível na rede local',
    abriendo: 'Compartilhando…',
    cerrando: 'Parando de compartilhar…',
    abrirUrl: 'Abrir neste computador',
    copiarUrl: 'Copiar o endereço',
    verQr: 'Mostrar o QR',
    qrTitulo: (dominio: string) => `${dominio} na rede local`,
    qrAviso: 'Leia o QR com um celular conectado à mesma rede.',
    confirmarTitulo: 'Compartilhar na rede local',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} ficará visível para qualquer dispositivo conectado à mesma rede deste computador (${ip}), sem pedir senha. O compartilhamento termina ao desligar o interruptor, ao fechar o WolfCore Dev e ao iniciá-lo de novo.`,
    ipEtiqueta: 'Rede (IP deste computador)',
    https: 'Usar HTTPS',
    httpsAyuda:
      'Com HTTPS o celular precisa confiar na CA do WolfCore Dev (botão «Instalar a CA no celular»). Sem ele, o site usa HTTP.',
    httpsObligatorio: 'Este site redireciona para HTTPS, então é compartilhado com HTTPS.',
    compartir: 'Compartilhar na rede',
    tituloError: 'Não foi possível compartilhar na rede local',
    caBoton: 'Instalar a CA no celular',
    firewallTitulo: 'Não abre no celular?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} tem dados reais e não é compartilhado na rede local, nem com confirmação.`,
    redPublica:
      'Esta rede está marcada como pública no Windows: o firewall bloqueará a entrada e o comando só abre redes privadas. Marque-a como privada se for a sua rede de confiança.',
    firewallTexto:
      'O WolfCore Dev não altera o firewall. Não aceite o aviso do Windows para o programa inteiro: use o comando desta porta (só a sub-rede local e só redes privadas) no PowerShell como administrador. Em rede pública não abrirá, e uma regra de bloqueio existente tem prioridade sobre a de permitir.',
    copiarComando: 'Copiar o comando',
  },
  caMovil: {
    titulo: 'Instalar a CA no celular',
    intro:
      'Leia o QR com um celular conectado à mesma rede para baixar o certificado da autoridade do WolfCore Dev. Só esse arquivo é entregue e o link se fecha sozinho.',
    abriendo: 'Abrindo o link…',
    expira: (minutos: number) => `O link se fecha sozinho em ${minutos} min.`,
    expirado: 'O link foi fechado.',
    reabrir: 'Abrir de novo',
    android: 'Android',
    ios: 'iPhone ou iPad',
    pasosAndroid: [
      'Leia o QR ou abra o endereço no navegador do celular e baixe o arquivo.',
      'Abra Configurações > Segurança e privacidade > Mais segurança > Criptografia e credenciais > Instalar um certificado > Certificado de CA (os nomes variam conforme a marca).',
      'Antes de confiar, compare a impressão digital SHA-256 que o celular mostra com a deste diálogo: se forem diferentes, não instale.',
      'Escolha o arquivo baixado e aceite o aviso: é normal, o Android avisa para qualquer CA.',
    ],
    pasosIos: [
      'Abra o endereço no Safari e permita baixar o perfil.',
      'Abra Ajustes > Perfil baixado e compare a impressão digital SHA-1 dos detalhes com a deste diálogo: se forem diferentes, não instale. Depois instale-o.',
      'Abra Ajustes > Geral > Sobre > Ajustes de confiança de certificado e ative a confiança total para a CA do WolfCore Dev.',
    ],
    aviso:
      'Uma CA instalada dá confiança a tudo o que ela assinar nesse celular: instale-a só nos seus dispositivos e remova-a ao terminar.',
    firewallAviso: (puerto: number) =>
      'Para o celular chegar ao link é preciso abrir a porta ' +
      puerto +
      ' (só a sub-rede local e redes privadas). Não aceite o aviso do Windows para o programa inteiro: execute este comando no PowerShell como administrador. Em rede pública não abrirá, e uma regra de bloqueio existente tem prioridade.',
    huellas: 'Impressões digitais do certificado',
    tituloError: 'Não foi possível abrir o link da CA',
  },
  dialogoQr: {
    descargar: 'Baixar PNG',
    descargado: 'QR guardado',
    largo: 'O texto é longo demais para um QR.',
    generando: 'Gerando o código QR…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `Acesso FTP para ${dominio}`,
    apagadoAyuda: 'Permita enviar arquivos para a pasta deste site por FTP.',
    activoAyuda: 'Acesso ativo.',
    soloLecturaEtiqueta: 'somente leitura',
    mostrarDatos: 'Mostrar dados do FTP',
    ocultarDatos: 'Ocultar dados do FTP',
    host: 'Servidor',
    puerto: 'Porta',
    usuario: 'Usuário',
    clave: 'Senha',
    mostrarClave: 'Mostrar senha',
    ocultarClave: 'Ocultar senha',
    copiarDato: (dato: string) => `Copiar ${dato}`,
    cargando: 'Lendo os dados do FTP…',
    regenerar: 'Gerar nova senha',
    regenerarTitulo: 'Gerar uma nova senha FTP?',
    regenerarTexto:
      'A senha atual deixa de funcionar e as conexões abertas deste site são encerradas. Você terá de atualizá-la no seu cliente FTP.',
    regenerada: 'Senha FTP gerada de novo',
    soloLectura: 'Somente leitura',
    soloLecturaAyuda: 'É possível baixar, mas não enviar, alterar nem apagar arquivos.',
    soloLecturaActivado: 'O FTP deste site agora é somente leitura',
    soloLecturaDesactivado: 'O FTP deste site agora permite gravar',
    activado: 'Acesso FTP ativado',
    desactivarTitulo: 'Remover o acesso FTP deste site?',
    desactivarTexto:
      'A senha é apagada e as conexões abertas são encerradas. A pasta do site não é tocada.',
    desactivar: 'Remover acesso',
    desactivado: 'Acesso FTP removido',
    redLocalAviso:
      'O FTP aceita conexões da rede local e envia a senha e os arquivos sem criptografia. Use-o somente em uma rede de confiança.',
    redLocalHost: 'ou o IP deste computador na sua rede',
    servidorApagado: 'O servidor FTP está desligado: ninguém poderá se conectar até você ligá-lo.',
    encender: 'Ligar o FTP',
    urlEtiqueta: 'Endereço',
    urlAyuda: 'O endereço não inclui a senha: ela é pedida ao conectar.',
    abrirUrl: 'Abrir num cliente FTP',
    copiarUrl: 'Copiar o endereço FTP',
    verQr: 'Mostrar o código QR do endereço',
    qrTitulo: 'Endereço FTP deste site',
    qrAviso: 'O código leva só o endereço, não a senha.',
  },
  correo: {
    descripcion:
      'Os capturadores guardam os e-mails enviados pelos seus projetos para que você os revise sem que saiam para a internet. Escutam apenas neste computador (127.0.0.1) e só um fica ligado por vez.',
    seccionCaptadores: 'Capturadores locais',
    seccionProveedores: 'Provedores SMTP remotos',
    proveedores: {
      descripcion:
        'Um provedor SMTP real envia o e-mail de verdade: use-o para testar o envio do seu projeto antes de publicá-lo. A chave é guardada criptografada neste computador e nunca é exibida.',
      agregar: 'Adicionar provedor',
      vacio:
        'Você ainda não adicionou nenhum provedor. Escolha Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO ou Gmail, ou digite o seu.',
      errorLista: 'Não foi possível ler a lista de provedores',
      tarjeta: {
        servidor: 'Servidor',
        usuario: 'Usuário',
        clave: 'Chave',
        sinClave: 'Sem chave',
        claveIlegible: 'Salva (não foi possível ler)',
        red: 'Rede',
        redLocal: 'Servidor deste computador ou da rede local (confirmado)',
        editar: 'Editar',
        borrar: 'Apagar',
        borrarTitulo: (n: string) => `Apagar ${n}?`,
        borrarTexto:
          'O provedor e a chave salva são apagados. Os projetos que o usam voltam ao captador local, mas seus .env não são alterados: mantêm as variáveis MAIL_* deste provedor (e a chave, se você a escreveu). Reescreva o bloco de e-mail em cada .env.',
        borrado: (n: string) => `${n} apagado`,
        usar: 'Usar em um projeto',
        destino: 'Endereço de destino do teste',
        destinoPlaceholder: 'seu-endereco@exemplo.com',
        probar: 'Testar envio',
        probando: 'Enviando…',
        probarAyuda:
          'Envia um único e-mail de verdade a esse endereço, com conexão criptografada verificada. No máximo um a cada 15 s.',
        sinClaveParaProbar: 'Salve a chave do provedor para poder testar o envio.',
        hostLocal: 'O nome deste servidor se resolve para este computador ou para a rede local.',
        confirmarRed: 'Confirmar rede local',
        enviado: (para: string) => `E-mail enviado para ${para}. Confira sua caixa de entrada.`,
        fallos: {
          'correo.auth': 'O provedor rejeitou o usuário ou a chave.',
          'correo.conexion': 'Não foi possível conectar: confira o host e a porta.',
          'correo.tls':
            'A conexão criptografada não é válida (certificado, nome ou STARTTLS). Nada foi enviado.',
          'correo.rechazado':
            'O servidor rejeitou a mensagem ou um endereço. Confira o remetente: muitos provedores só aceitam um remetente ou domínio verificado.',
          'correo.plazo': 'O servidor não respondeu a tempo (20 s).',
        },
      },
      dialogo: {
        nuevo: 'Adicionar provedor SMTP',
        editar: (n: string) => `Editar ${n}`,
        preset: 'Provedor',
        presetOtro: 'Outro (digitar os dados)',
        presetAyuda: 'Host e porta vêm da documentação oficial de cada provedor.',
        documentacion: 'Ver documentação',
        region: 'Região',
        nombre: 'Nome',
        nombreObligatorio: 'Digite um nome.',
        host: 'Servidor (host)',
        hostAyuda: 'Apenas o nome ou o IP, sem smtp:// nem porta.',
        hostObligatorio: 'Digite o servidor.',
        puerto: 'Porta',
        seguridad: 'Criptografia',
        seguridadAyuda:
          'Sempre se exige uma conexão criptografada com certificado válido: nunca se volta ao texto simples.',
        tls: 'TLS direto (porta 465)',
        starttls: 'STARTTLS (porta 587)',
        usuario: 'Usuário',
        usuarioObligatorio: 'Digite o usuário.',
        usuarioFijoAyuda: 'Este provedor sempre usa este usuário; a chave é a da sua conta.',
        clave: 'Chave SMTP',
        claveGuardada: (f: string) => `Salva: ••••${f}`,
        claveNueva: 'Digite a chave para salvá-la',
        claveAyuda:
          'É guardada criptografada neste computador e nunca é exibida de novo. Deixe vazio para não alterá-la.',
        remitente: 'Remetente do teste (opcional)',
        remitenteAyuda:
          'Muitos provedores só enviam de um remetente ou domínio verificado. Se deixar vazio, o remetente é o próprio endereço de destino.',
        claveSinEspacios:
          'Cole a chave exatamente como o provedor a dá: os espaços internos são mantidos.',
        borrarClave: 'Apagar a chave',
        borrarClaveTitulo: (n: string) => `Apagar a chave de ${n}?`,
        borrarClaveTexto: 'A chave salva é apagada. O provedor continua na lista.',
        claveBorrada: 'Chave apagada',
        guardar: 'Salvar',
        guardado: (n: string) => `${n} salvo`,
        redLocalTitulo: 'Servidor neste computador ou na rede local',
        redLocalTexto: (h: string) =>
          `${h} aponta para este computador ou para a rede local. O WolfCore Dev só se conecta lá se você confirmar. É um servidor seu?`,
        redLocalConfirmar: 'Sim, é meu',
        cambiaTitulo: 'Enviar a chave a outro servidor',
        cambiaTexto: (h: string) =>
          `O provedor tem uma chave salva e você mudou o servidor ou o usuário. A chave será enviada a ${h}. Continuar?`,
        cambiaConfirmar: 'Sim, continuar',
      },
      env: {
        titulo: (n: string) => `Usar ${n} em um projeto`,
        proyecto: 'Projeto',
        sinProyectos: 'Ainda não há projetos.',
        yaUsaSmtp: 'Este projeto já envia por um provedor SMTP.',
        volverCaptador: 'Voltar ao captador local',
        volvio: (n: string) =>
          `${n} volta a enviar ao captador local, mas seu .env não foi alterado: mantém as variáveis MAIL_* do provedor (e a chave, se você a escreveu). Reescreva o bloco de e-mail.`,
        incluirClave: 'Escrever também a chave no .env',
        incluirClaveAyuda: 'Sem marcar, o bloco não leva MAIL_PASSWORD e você a adiciona à mão.',
        sinClaveGuardada: 'O provedor não tem uma chave salva.',
        vista: 'Alterações no .env (a chave vai mascarada)',
        textoPlano:
          'A chave ficará em texto simples no .env do projeto. Qualquer pessoa com acesso a essa pasta, ou ao repositório se você o enviar, poderá lê-la.',
        claveTitulo: 'Escrever a chave no .env',
        claveTexto:
          'A chave é salva em texto simples no arquivo .env do projeto. Use apenas se o projeto não for enviado a um repositório e a pasta for só sua.',
        claveConfirmar: 'Entendo, incluir a chave',
        agregarGitignore: 'Adicionar .env ao .gitignore',
        gitignoreTitulo: 'Modificar o .gitignore',
        gitignoreTexto:
          'A linha .env é adicionada ao .gitignore do projeto (com uma cópia prévia).',
        gitignoreConfirmar: 'Adicionar',
        versionadoTitulo: 'O Git já acompanha o .env',
        versionadoTexto:
          'O próximo commit enviaria seus valores. Tire-o do índice com git rm --cached .env.',
        desconocidoTitulo: 'Não foi possível verificar o Git',
        desconocidoTexto: 'Não foi possível saber se o Git acompanha o .env deste projeto.',
        aceptarVersionado: 'Escrever mesmo assim',
        aceptarTitulo: 'Escrever em um .env versionado',
        aceptarTexto:
          'Se o Git acompanha o .env, estas variáveis podem ir parar no repositório. Escrever mesmo assim?',
        aceptarConfirmar: 'Escrever mesmo assim',
        confirmarTitulo: 'Escrever no .env',
        confirmarTexto: (ruta: string) =>
          `Será salva uma cópia de ${ruta} e serão adicionadas as variáveis MAIL_* sem a chave.`,
        confirmarTextoClave: (ruta: string) =>
          `Será salva uma cópia de ${ruta} e serão adicionadas as variáveis MAIL_*, com a chave em texto simples.`,
        confirmar: 'Escrever',
        escribir: 'Escrever no .env',
        escrito: (n: string) => `${n} agora envia por este provedor`,
      },
    },
    estado: 'Estado',
    smtp: 'SMTP',
    buzon: 'Caixa web',
    abrirBuzon: 'Abrir caixa',
    noLeidos: 'Não lidos',
    noLeidosValor: (n: number) => plural(n, 'e-mail não lido', 'e-mails não lidos'),
    noLeidosError: 'Não foi possível ler a caixa',
    actualizar: 'Contar os e-mails de novo',
    actualizaSolo: 'Atualiza a cada 15 segundos enquanto esta tela está aberta.',
    env: 'Bloco para o .env do Laravel',
    envAyuda: (captador: string) =>
      `Cole no .env do seu projeto. O e-mail fica no ${captador}, sem criptografia e sem usuário.`,
    copiarEnv: 'Copiar bloco',
    irAServicios: 'Ir para Serviços',
    cargando: 'Lendo os capturadores…',
    errorLista: 'Não foi possível ler a lista de capturadores',
    captador: {
      opcional: 'Opcional',
      elegido: 'Recebe o e-mail dos seus projetos',
      noInstalado: 'Não instalado',
      instalar: 'Instalar',
      usar: 'Usar este',
      apagar: 'Desligar',
      iniciando: 'Iniciando…',
      avisoMantenimiento:
        'Este capturador quase não recebe manutenção. Prefira o Mailpit ou o smtp4dev.',
    },
    notaDescartados:
      'MailHog e MailDev não são oferecidos: o MailHog não publica uma impressão digital para verificar o download e o MailDev só existe no npm. Sem impressão digital verificável, nada é baixado.',
    notaHost:
      'As caixas web só respondem em 127.0.0.1, mas enquanto um capturador está ligado uma página web maliciosa pode tentar ler a sua caixa (DNS rebinding). O smtp4dev e o Papercut rejeitam cabeçalhos Host alheios; o Mailpit serve a caixa sob um caminho secreto próprio deste computador (o WolfCore Dev abre esse endereço por você); o Inbucket não tem nenhuma proteção: desligue-o quando não o usar.',
  },
  ia: {
    descripcion:
      'Provedores de IA na nuvem e modelos locais com o Ollama. As chaves são guardadas criptografadas neste computador e nunca são exibidas.',
    nube: {
      titulo: 'IA na nuvem',
      agregar: 'Adicionar provedor',
      vacio:
        'Você ainda não adicionou nenhum provedor. Adicione OpenAI, Anthropic, Gemini, Hermes (Nous) ou um compatível com a OpenAI.',
      errorLista: 'Não foi possível ler a lista de provedores',
    },
    local: { titulo: 'IA local (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'Compatível com a OpenAI',
    } as Record<string, string>,
    tarjeta: {
      clave: 'Chave',
      sinClave: 'Sem chave',
      claveIlegible: 'Salva (não foi possível ler)',
      url: 'URL base',
      modeloPorDefecto: 'Modelo padrão',
      ninguno: 'Nenhum',
      probarConexion: 'Testar conexão',
      probarConexionAyuda: 'Lista os modelos do provedor. Não gasta tokens.',
      probando: 'Testando…',
      conectado: (ms: number, n: number) => `Conectado · ${ms} ms · ${n} modelos`,
      verModelos: (n: number) => `Ver os ${n} modelos`,
      soloGratuitos: 'Somente gratuitos',
      fallo: 'Não foi possível conectar',
      probarMensaje: 'Testar uma mensagem',
      probarMensajeAyuda:
        'Envia uma mensagem curta fixa para verificar se o modelo responde. Gasta poucos tokens.',
      elegirModelo: 'Modelo para a mensagem',
      sinModelo: 'Teste a conexão ou defina um modelo padrão para escolher um.',
      enviando: 'Enviando…',
      respuesta: (ms: number) => `Resposta em ${ms} ms`,
      tokens: (entrada: number, salida: number) =>
        `${entrada} tokens de entrada, ${salida} de saída`,
      usar: 'Usar em um projeto',
      editar: 'Editar',
      borrar: 'Apagar',
      acciones: (nombre: string) => `Ações de ${nombre}`,
    },
    costo: {
      titulo: 'Testar uma mensagem',
      texto: (modelo: string, proveedor: string) =>
        `Será enviada uma mensagem curta e fixa ao modelo ${modelo} de ${proveedor}. Isso gasta tokens da sua conta: a resposta é cortada em 16 tokens e costuma custar frações de centavo.`,
      enviar: 'Enviar a mensagem',
    },
    dialogo: {
      nuevo: 'Adicionar provedor de IA',
      editar: (nombre: string) => `Editar ${nombre}`,
      tipo: 'Tipo',
      preset: 'Provedor compatível',
      presetAyuda: 'Preenche o nome e a URL; você pode alterá-los.',
      presetOtro: 'Outro',
      documentacion: 'Ver documentação',
      nombre: 'Nome',
      urlBase: 'URL base',
      urlAyuda:
        'Vazia = a oficial. Somente https://, ou http:// para 127.0.0.1 ou [::1] (LM Studio).',
      urlObligatoria: 'Digite a URL base do provedor compatível.',
      modelo: 'Modelo padrão (opcional)',
      modeloAyuda: 'É usado no bloco .env (AI_MODEL) e na mensagem de teste.',
      clave: 'Chave de API',
      claveNueva: 'Cole a chave',
      claveGuardada: (final: string) =>
        `Há uma chave salva (${final}). Digite outra somente se quiser substituí-la.`,
      claveAyuda:
        'É guardada criptografada neste computador e nunca é exibida de novo. Só os 4 últimos caracteres aparecem.',
      claveOpcional: 'Opcional para servidores locais (LM Studio).',
      borrarClave: 'Apagar a chave',
      guardar: 'Salvar',
      guardado: (nombre: string) => `${nombre} salvo`,
      urlCambiaTitulo: 'A chave irá para outra URL',
      urlCambiaTexto: (url: string) =>
        `Este provedor tem uma chave salva. A partir de agora ela será enviada para ${url}. Confirme somente se você confia nesse servidor.`,
      urlCambiaConfirmar: 'Enviar a chave para a nova URL',
    },
    borrar: {
      claveTitulo: (nombre: string) => `Apagar a chave de ${nombre}?`,
      claveTexto:
        'A chave é apagada deste computador. Os .env onde você a gravou não são tocados: troque-a lá também se você a revogar.',
      proveedorTitulo: (nombre: string) => `Apagar ${nombre}?`,
      proveedorTexto:
        'O provedor e a chave salva dele são apagados. Os .env dos seus projetos não são tocados.',
      respaldos: (n: number) =>
        n === 1
          ? 'Apagar também as cópias do .env de 1 projeto que têm esta chave em texto simples'
          : `Apagar também as cópias do .env de ${n} projetos que têm esta chave em texto simples`,
      respaldosAyuda:
        'O WolfCore Dev guarda cópias do .env antes de gravá-lo, fora dos projetos. Não é possível desfazer a exclusão delas.',
      claveBorrada: 'Chave apagada',
      proveedorBorrado: (nombre: string) => `${nombre} apagado`,
      respaldosBorrados: (n: number) => `As cópias do .env de ${n} projeto(s) foram apagadas`,
    },
    env: {
      titulo: (nombre: string) => `Usar ${nombre} em um projeto`,
      proyecto: 'Projeto',
      sinProyectos: 'Não há projetos montados.',
      modelo: 'Modelo (AI_MODEL)',
      modeloAyuda: 'Opcional. Escolha um da lista ou digite.',
      vista: 'Bloco que será gravado no .env (a chave é mostrada mascarada)',
      cargando: 'Preparando a pré-visualização…',
      textoPlano:
        'A chave ficará em texto simples no .env do projeto. Qualquer pessoa com acesso a essa pasta poderá lê-la.',
      copiaPrevia:
        'O .env atual é copiado antes, fora do projeto (na pasta de dados do WolfCore Dev).',
      sinClave: 'Este provedor precisa de uma chave: salve-a antes de usá-lo em um projeto.',
      gitignoreFalta: 'O .gitignore do projeto não ignora o .env.',
      gitignoreNoExiste: 'O projeto não tem .gitignore.',
      gitignoreOk: 'O .gitignore já ignora o .env.',
      agregarGitignore: 'Adicionar .env ao .gitignore',
      gitignoreTitulo: 'Modificar o .gitignore',
      gitignoreTexto:
        'A linha .env será adicionada ao .gitignore do projeto (ou o arquivo será criado), com uma cópia prévia.',
      gitignoreConfirmar: 'Adicionar ao .gitignore',
      versionadoTitulo: 'O Git já acompanha o .env deste projeto',
      versionadoTexto:
        'Mesmo estando no .gitignore, o próximo commit enviaria a chave. Antes de gravá-la, tire-o do índice e faça commit:',
      desconocidoTitulo: 'Não foi possível verificar se o Git acompanha o .env',
      desconocidoTexto:
        'O Git não respondeu (não está instalado ou a pasta não é de confiança). Se o .env já estiver no repositório, o próximo commit enviaria a chave. Confira com:',
      aceptarVersionado: 'Entendo o risco: gravar a chave mesmo assim',
      aceptarTitulo: 'Gravar mesmo que o Git possa enviar a chave',
      aceptarTexto:
        'Se o .env estiver no repositório, a chave ficará no próximo commit e no histórico. Faça isso somente se já executou git rm --cached .env ou se o repositório é só seu.',
      aceptarConfirmar: 'Aceito o risco',
      conflictoTitulo: 'O .env já define estas variáveis com outro valor',
      reemplazar: (claves: string) => `Substituir ${claves}`,
      reemplazarTitulo: 'Substituir variáveis do .env',
      reemplazarTexto: (claves: string) =>
        `As linhas de ${claves} que o .env já tinha serão removidas e ficarão as do bloco do WolfCore Dev. O .env anterior é copiado antes.`,
      reemplazarConfirmar: 'Substituir',
      escribir: 'Gravar no .env',
      confirmarTitulo: 'Gravar a chave em texto simples',
      confirmarTexto: (carpeta: string) =>
        `A chave será gravada sem criptografia em ${carpeta}. Não compartilhe esse arquivo nem o envie a um repositório.`,
      confirmar: 'Gravar a chave',
      escrito: (proyecto: string) => `Bloco de IA gravado no .env de ${proyecto}`,
      copiarComando: 'Copiar comando',
    },
  },
  iaLocal: {
    descripcion:
      'Modelos de linguagem que rodam no seu computador com o Ollama. Use-os nos seus projetos sem enviar dados para a internet.',
    sinInstalarTitulo: 'O Ollama não está instalado',
    sinInstalar: 'Instale-o em Serviços para baixar e usar modelos no seu computador.',
    irAServicios: 'Ir para Serviços',
    apagadoTitulo: 'O Ollama está desligado',
    apagado: 'Ligue-o para ver, baixar e testar modelos.',
    iniciando: 'O Ollama está ligando…',
    errorTitulo: 'O Ollama não conseguiu ligar',
    encender: 'Ligar o Ollama',
    verServicios: 'Ver em Serviços',
    modelos: 'Modelos instalados',
    sinModelos: 'Ainda não há modelos. Baixe um mais abaixo.',
    errorModelos: 'Não foi possível ler a lista de modelos',
    recargar: 'Recarregar a lista',
    total: (n: number) => plural(n, 'modelo', 'modelos'),
    espacio: 'Espaço usado',
    espacioAyuda: 'O que todos os modelos ocupam na pasta de dados.',
    probarDe: (modelo: string) => `Testar ${modelo}`,
    borrarDe: (modelo: string) => `Apagar ${modelo}`,
    borrarTitulo: (modelo: string) => `Apagar o modelo ${modelo}?`,
    borrarTexto: (tamano: string) =>
      `${tamano} de disco serão liberados. Para voltar a usá-lo, você terá de baixá-lo de novo.`,
    borrado: (modelo: string) => `Modelo ${modelo} apagado`,
    descargar: {
      titulo: 'Baixar um modelo',
      campo: 'Nome do modelo',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Digite o nome usado pelo Ollama (ollama.com/library) ou escolha uma sugestão.',
      sugerenciaAyuda: {
        'llama3.2': 'Chat geral, leve',
        'qwen2.5-coder': 'Programação',
        mistral: 'Chat geral',
        'nomic-embed-text': 'Embeddings para buscas (bots)',
      } as Record<string, string>,
      boton: 'Baixar',
      invalido: 'Use letras, números e . _ : / - (por exemplo llama3.2)',
      yaInstalado: 'Esse modelo já está instalado',
      enCurso: 'Esse modelo já está sendo baixado',
      confirmarTitulo: (modelo: string) => `Baixar ${modelo}?`,
      confirmarTexto:
        'Os modelos costumam pesar vários GB (de 1 a mais de 40, conforme o tamanho). O Ollama não informa o tamanho antes de começar: você o verá na barra de progresso e pode cancelar a qualquer momento.',
      confirmar: 'Baixar',
    },
    progreso: {
      fases: {
        preparando: 'Preparando…',
        descargando: 'Baixando',
        verificando: 'Verificando',
        guardando: 'Salvando',
        listo: 'Pronto',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} de ${total}`,
      cancelarDe: (modelo: string) => `Cancelar o download de ${modelo}`,
      cancelando: 'Cancelando…',
      listo: (modelo: string) => `${modelo} baixado`,
      cancelado: (modelo: string) => `Download de ${modelo} cancelado`,
      error: (modelo: string) => `Não foi possível baixar ${modelo}`,
      descartar: 'Descartar',
      descartarDe: (modelo: string) => `Descartar o aviso de ${modelo}`,
    },
    prueba: {
      titulo: 'Testar um modelo',
      modelo: 'Modelo',
      elegir: 'Escolha um modelo',
      prompt: 'Mensagem',
      placeholder: 'Digite uma pergunta curta e pressione Enter',
      enviar: 'Enviar',
      respuesta: 'Resposta',
      pensando: 'O modelo está respondendo… na primeira vez pode demorar enquanto ele é carregado.',
      vacia: '(O modelo não devolveu texto.)',
      sinModelos: 'Baixe um modelo para testá-lo.',
    },
    conexion: {
      titulo: 'Conexão a partir dos seus projetos',
      base: 'URL base do Ollama',
      openai: 'Endpoint compatível com a OpenAI',
      env: 'Bloco para o arquivo .env',
      envAyuda:
        'Serve para o Laravel ou para um bot com FastAPI. O WolfCore Dev não grava nos seus projetos.',
      copiarEnv: 'Copiar bloco',
      copiarDato: (dato: string) => `Copiar ${dato}`,
    },
    etapaB:
      'O Hermes Agent, o Claude Code e o Codex poderão se conectar a estes modelos com um clique na Etapa B.',
  },
  proyectos: {
    titulo: 'Projetos',
    descripcion:
      'Cada projeto é uma pasta com o site .test, a receita de instalação e os processos dele.',
    agregar: 'Adicionar projeto',
    vacioTitulo: 'Ainda não há projetos',
    vacio:
      'Clone um repositório do GitHub ou escolha uma pasta: o WolfCore Dev detecta o tipo de projeto e o prepara passo a passo.',
    pasos: {
      porTipo: {
        'composer-install': 'Instalar dependências do PHP (composer install)',
        'env-crear': 'Criar o arquivo .env',
        'key-generate': 'Gerar a chave da aplicação',
        'bd-crear': 'Criar o banco de dados',
        'bd-restaurar': 'Restaurar um backup',
        migrar: 'Migrar o banco de dados',
        'storage-link': 'Vincular o storage (storage:link)',
        'npm-ci': 'Instalar dependências do Node (npm ci)',
        'npm-build': 'Compilar recursos (npm run build)',
        'python-venv': 'Criar o ambiente virtual (.venv)',
        'pip-install': 'Instalar dependências do Python (pip)',
        'pgvector-activar': 'Ativar o pgvector no banco',
        'sitio-crear': 'Criar o site',
        comando: 'Comando do projeto',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `Criar o site ${dominio}` : 'Criar o site'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `Restaurar o backup ${archivo}` : 'Restaurar um backup',
      migrar: 'Migrar o banco de dados',
      migrarSemilla: 'Migrar o banco de dados e carregar dados de teste (--seed)',
      comando: (linea: string) => (linea ? `Executar: ${linea}` : 'Comando do projeto'),
    },
    estadoPaso: {
      pendiente: 'Pendente',
      corriendo: 'Em andamento',
      listo: 'Pronto',
      error: 'Erro',
      omitido: 'Pulado',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: 'Não preparado',
      corriendo: 'Preparando…',
      lista: 'Preparado',
      error: 'Uma etapa falhou',
      cancelada: 'Preparação cancelada',
      incompleta: 'Preparação incompleta',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: 'Adicionar projeto',
      pestanas: { github: 'GitHub', url: 'URL do Git', carpeta: 'Pasta' },
      destino: 'Pasta de destino',
      destinoAyuda: (base: string) =>
        `É clonado em ${base}. Para outro lugar, use "Escolher pasta…".`,
      nombreCarpeta: 'Nome da pasta',
      nombrePlaceholder: 'meu-projeto',
      elegirDestino: 'Escolher pasta…',
      destinoPorDefecto: 'Usar a pasta de projetos',
      clonar: 'Clonar',
      clonando: 'Clonando…',
      clonado: 'Repositório clonado',
      errorClonar: 'Não foi possível clonar o repositório',
      sinCancelar:
        'O clone não pode ser interrompido daqui: aguarde o fim (pode levar vários minutos).',
      sinGit: 'O Git não está instalado. Instale-o (git-scm.com) e abra esta janela de novo.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `Conectado com o GitHub CLI como ${usuario}` : 'Conectado com o GitHub CLI',
      estadoToken: 'Conectado com um token pessoal',
      estadoNinguna: 'Sem conexão com o GitHub',
      ayudaNinguna:
        'Entre com o GitHub CLI (recomendado) ou use um token pessoal de escopo restrito com permissão de leitura de conteúdo.',
      instalarGh: 'Instalar o GitHub CLI',
      instalandoGh: 'Instalando o GitHub CLI…',
      ghInstalado: 'GitHub CLI instalado. Agora faça login.',
      iniciarSesion: 'Fazer login',
      sesionAbierta:
        'Foi aberta uma janela para fazer login. Quando terminar, pressione "Verificar de novo".',
      comprobar: 'Verificar de novo',
      usarToken: 'Usar um token',
      token: 'Token pessoal do GitHub',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        'É guardado criptografado neste computador e nunca é exibido de novo nem gravado nos projetos.',
      guardarToken: 'Salvar token',
      tokenGuardado: 'Token salvo',
      quitarToken: 'Remover token',
      tokenQuitado: 'Token removido',
      buscar: 'Buscar repositórios',
      cargando: 'Carregando repositórios…',
      sinRepos: 'Nenhum repositório encontrado.',
      cargarMas: 'Carregar mais',
      privado: 'Privado',
      yaClonado: 'Já clonado',
      yaClonadoAyuda: 'Já há um projeto com este repositório ou na pasta de destino dele.',
      actualizado: (fecha: string) => `Atualizado ${fecha}`,
      elegir: 'Escolher',
      errorRepos: 'Não foi possível ler a lista de repositórios',
    },
    url: {
      etiqueta: 'URL do repositório',
      placeholder: 'https://github.com/usuario/projeto.git',
      ayuda:
        'https://…, git@host:caminho ou usuario/projeto (GitHub). Sem usuário nem senha na URL.',
      invalida: 'Use https://…, git@host:caminho ou usuario/projeto',
    },
    carpeta: {
      titulo: 'Projeto que já está no computador',
      texto: 'Escolha a pasta: o tipo de projeto é detectado e a receita dele é proposta.',
      elegir: 'Escolher pasta',
      manual: 'Adicionar sem receita (configuração manual)',
      yaEsProyecto: (nombre: string) => `Essa pasta já é o projeto ${nombre}.`,
      vigilarTitulo: 'Pasta monitorada',
      vigilarTexto:
        'O WolfCore Dev avisa quando aparece uma pasta nova que parece um projeto. É também onde os repositórios são clonados.',
      vigilando: (carpeta: string) => `Monitorando ${carpeta}`,
      sinVigilar: 'Nenhuma pasta está sendo monitorada.',
      vigilar: 'Escolher pasta a monitorar',
      cambiarVigilada: 'Trocar',
      dejarDeVigilar: 'Parar de monitorar',
    },
    asistente: {
      titulo: (nombre: string) => `Preparar ${nombre}`,
      cargando: 'Analisando o projeto…',
      origenYml: 'A receita vem do wolfcore.yml do repositório.',
      origenDefecto: 'Receita proposta conforme o tipo de projeto.',
      deteccion: 'O que foi detectado',
      deteccionAyuda: 'Corrija se algo não coincidir com o projeto.',
      tipo: 'Tipo',
      php: 'PHP',
      phpNinguno: 'Nenhum instalado',
      node: 'Node',
      python: 'Python',
      java: 'Java',
      dotnet: '.NET',
      go: 'Go',
      rust: 'Rust',
      bun: 'Bun',
      deno: 'Deno',
      zig: 'Zig',
      kotlin: 'Kotlin',
      dart: 'Dart',
      versionAuto: 'A que for detectada',
      servicios: 'Serviços',
      serviciosNinguno: 'Nenhum',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `Detectado: ${v}`,
      nodeInstalar: 'Não há Node instalado: instale-o em Serviços.',
      pythonInstalar: 'Não há Python instalado: instale-o em Serviços.',
      lenguajeInstalar: (nombre: string) => `Não há ${nombre} instalado: instale-o em Serviços.`,
      dominio: 'Domínio',
      puertoProxy: 'Porta local',
      puertoPlaceholder: '8000',
      receta: 'Etapas',
      recetaAyuda:
        'São executadas em ordem. Desative as que não quiser; as opcionais podem ser movidas.',
      subir: 'Subir',
      bajar: 'Descer',
      fijo: 'Esta etapa é necessária',
      restaurar: 'Restaurar um backup…',
      cambiarRespaldo: 'Trocar backup',
      quitarRespaldo: 'Remover backup',
      sobrescribir: 'Sobrescrever o banco se ele já tiver tabelas',
      semilla: 'Carregar dados de teste (--seed)',
      sinMotor:
        'Sem banco de dados: escolha um mecanismo em Serviços para criá-lo ou restaurar um backup.',
      confio: 'Confio neste repositório: executar as etapas de instalação dele',
      confioAyuda:
        'As etapas executam programas do projeto (composer, npm, pip, migrações) no seu computador. Marque somente se você conhece o código.',
      montar: 'Montar projeto',
      montando: 'Montando projeto…',
      reintentar: 'Tentar de novo',
      omitir: 'Pular',
      cancelar: 'Cancelar',
      cancelando: 'Cancelando…',
      cerrar: 'Fechar',
      cerrarCorriendo: 'Ocultar (continua em segundo plano)',
      abrirSitio: 'Abrir site',
      verRegistro: 'Ver registro',
      ocultarRegistro: 'Ocultar registro',
      listo: 'O projeto ficou pronto.',
      fallo: (paso: string) =>
        `Falhou: ${paso}. Tente de novo, pule-a ou cancele; nada foi desfeito.`,
      cancelada: 'A preparação foi cancelada. Você pode retomá-la no cartão do projeto.',
      incompleta: 'Restam etapas sem executar.',
      errorCrear: 'Não foi possível criar o projeto',
      errorReceta: 'Não foi possível ler a receita',
      recetaCambio:
        'A receita do projeto (wolfcore.yml) mudou desde que você confiou nele. Tentar de novo usa a receita salva da última vez.',
      recargar: 'Revisar a nova receita',
      seguirGuardada: 'Continuar com a salva',
      soloLectura:
        'O tipo, o PHP, o domínio, as versões e a porta são os do projeto: altere-os com Editar.',
    },
    tarjeta: {
      receta: 'Preparação',
      reinstalar: 'Reinstalar dependências',
      reinstalarTitulo: (nombre: string) => `Executar a receita de ${nombre}?`,
      reinstalarTexto:
        'As etapas da última preparação (as que você revisou no assistente) são repetidas:',
      noRestaura: 'não é restaurado de novo',
      recetaCambio:
        'A receita do projeto (wolfcore.yml) mudou desde que você confiou nele. Reinstalar repete a salva; use "Revisar a receita" para ver a nova.',
      revisarReceta: 'Revisar a receita',
      preparar: 'Preparar…',
      ejecutar: 'Executar',
      verPreparacion: 'Ver preparação',
      sinConfianza:
        'Revise a receita e marque "Confio neste repositório" no assistente para poder executá-la.',
      runtimes: 'Avisos de versões',
      verRegistros: 'Ver registros',
      verEnBases: 'Ver em Bancos de dados',
      abrirAgente: 'Abrir um agente de IA',
      vscode: 'Editor',
      vscodeAyuda: 'Abrir a pasta do projeto no editor padrão',
      vscodeError: 'Não foi possível abrir o editor',
      baseDatos: 'Banco de dados',
      baseDatosAyuda: (base: string) =>
        `Abrir o banco «${base}» já autenticado (Adminer ou phpMyAdmin)`,
      baseDatosSinDetectar: 'Abrir o banco de dados do projeto (Adminer ou phpMyAdmin)',
      sinBase: 'O .env do projeto não declara um banco MySQL, MariaDB ou PostgreSQL.',
      adminerNoListo: 'O Adminer não está pronto',
      entradaAutomatica: 'Abre já autenticado, sem digitar a senha.',
      elegirBd: 'Escolher Adminer ou phpMyAdmin',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (só MySQL e MariaDB)',
      phpMyAdminNoListo: 'O phpMyAdmin não está pronto',
      entroComoAdmin: (usuario: string) =>
        `Entrou como ${usuario}, o administrador do servidor, porque este projeto não usa um usuário próprio. No gerenciador de .env, “Usar usuário próprio” cria um limitado ao seu banco.`,
      entroComoAdminSinClave: (usuario: string) =>
        `Entrou como ${usuario}, o administrador do servidor: a senha do usuário próprio deste projeto não está guardada neste computador. No gerenciador de .env, “Usar usuário próprio” gera uma nova.`,
      abrirSitio: 'Abrir o site no navegador',
      github: 'Repositório',
      abrirRemoto: (url: string) => `Abrir ${url}`,
      confiado: 'Confiado',
      confiadoAyuda: 'As etapas de instalação dele podem ser executadas.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: 'HEAD solto',
      cambios: (n: number) => plural(n, 'alteração não salva', 'alterações não salvas'),
      limpio: 'Sem alterações',
      atras: (n: number) => `${n} para trazer`,
      adelante: (n: number) => `${n} para enviar`,
      traer: 'Trazer mudanças',
      traerAyuda:
        'git pull sem mesclar: se houver alterações locais ou branches divergentes, não mexe em nada.',
      alDia: 'Já estava em dia.',
      actualizado: 'Mudanças trazidas',
      sugeridosTitulo: 'Mudanças trazidas',
      sugeridosTexto: 'Conforme o que mudou, convém executar estas etapas:',
      sugeridosNinguno: 'Não é preciso executar nenhuma etapa.',
      migracionesNuevas: (n: number) => plural(n, 'nova migração', 'novas migrações'),
      ejecutarSugeridos: 'Executar etapas',
      corridaTitulo: 'Etapas depois de trazer mudanças',
      corridaAyuda: 'Não altera a receita salva do projeto.',
      ahoraNo: 'Agora não',
      errorEstado: 'Não foi possível ler o estado do Git',
      commitIa: {
        boton: 'Sugerir commit',
        ayuda:
          'Propõe com IA uma mensagem para o que está preparado (git add) e faz o commit se você aceitar.',
        titulo: 'Commit com mensagem sugerida',
        proveedor: 'Provedor de IA',
        modelo: 'Modelo',
        sinProveedores: 'Configure um provedor de IA na nuvem (tela IA) para sugerir mensagens.',
        privacidad:
          'É enviado ao provedor o diff do que está preparado, sem .env, chaves, certificados, arquivos de credenciais nem binários, e no máximo 20 000 caracteres. Gasta poucos tokens.',
        sugerir: 'Sugerir mensagem',
        mensaje: 'Mensagem (você pode editá-la)',
        commit: 'Fazer commit',
        commitAyuda: 'Somente o que está preparado (git add): não adiciona arquivos nem faz push.',
        hecho: 'Commit feito com o que estava preparado.',
      },
    },
    procesos: {
      titulo: 'Processos',
      /** Mensaje del supervisor de un proceso sin reinicio que salió con código 0. */
      terminado: 'Terminou sem erros',
      ninguno: 'Sem processos. Adicione npm run dev, queue:work, uvicorn…',
      agregar: 'Adicionar processo',
      editar: 'Editar processo',
      nuevo: 'Novo processo',
      interruptor: (nombre: string) => `Ligar ou desligar ${nombre}`,
      proxy: 'Proxy',
      proxyAyuda: 'O Nginx envia o site para este processo.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, 'reinício', 'reinícios'),
      verLog: 'Ver log',
      ocultarLog: 'Ocultar log',
      logVacio: 'Ainda sem saída.',
      abrirCarpetaLog: 'Abrir pasta do log',
      quitar: 'Remover processo',
      quitarTitulo: (nombre: string) => `Remover o processo ${nombre}?`,
      quitarTexto: 'Se estiver em andamento, ele é parado.',
      nombre: 'Nome',
      nombrePlaceholder: 'Vite',
      comando: 'Comando',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: 'Programa e argumentos, sem shell. Use aspas para argumentos com espaços.',
      cwd: 'Pasta',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz ou uma subpasta do projeto (por exemplo, frontend).',
      puertoCampo: 'Porta',
      puertoNinguno: 'Nenhuma',
      puertoAyuda: 'Somente informativa, a menos que o processo seja o destino do proxy.',
      autoIniciar: 'Ligar ao iniciar o WolfCore Dev',
      reiniciar: 'Reiniciar se cair',
      esProxy: 'Destino do proxy do Nginx',
      requiereReinicio:
        'O processo está em andamento: as mudanças de comando, pasta ou porta são aplicadas ao reiniciá-lo.',
      reinicieAhora: 'Salvo. Desligue e ligue o processo para aplicar as mudanças.',
      guardado: 'Processo salvo',
      errores: {
        comando: 'Digite o comando',
        puerto: 'A porta deve estar entre 1 e 65535',
        proxySinPuerto: 'O destino do proxy precisa de uma porta',
        cwd: 'Use raiz ou uma subpasta dentro do projeto',
        repetido: 'Já há um processo com esse nome',
      },
      estados: {
        encendido: 'Ligado',
        apagado: 'Desligado',
        iniciando: 'Iniciando…',
        error: 'Erro',
        externo: 'Externo',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `Registros de ${nombre}`,
      fuente: 'Fonte',
      ninguna: 'Este projeto ainda não tem registros.',
      vacio: 'O registro está vazio.',
      actualizar: 'Atualizar',
      abrirCarpeta: 'Abrir pasta',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? 'Há uma pasta nova que parece um projeto'
          : `Há ${n} pastas novas que parecem projetos`,
      montar: 'Preparar',
      ignorar: 'Ignorar',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: 'E-mails não lidos',
    correoApagado: 'Mailpit desligado',
    correoSinInstalar: 'Mailpit não instalado',
    modelos: 'Modelos de IA',
    iaApagada: 'Ollama desligado',
    iaSinInstalar: 'Ollama não instalado',
    sinLeer: 'Não foi possível ler',
    sinDato: '—',
  },
  /* ───────────── Painel de desempenho, visualizador de registros e MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: 's',
    minutos: 'min',
    horas: 'h',
    dias: 'd',
    /** Worker N de um serviço (p. ex. PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: 'Desempenho',
    ventana: 'Últimos 5 minutos',
    pausado: 'Em pausa enquanto a janela está oculta',
    esperando: 'Aguardando a primeira amostra…',
    errorMuestreo: (detalle: string) =>
      `Não foi possível pedir a amostragem de desempenho: ${detalle}`,
    cpu: 'CPU',
    ram: 'Memória',
    disco: 'Disco de dados',
    red: 'Rede',
    deTotal: (usado: string, total: string) => `${usado} de ${total}`,
    libre: (libre: string) => `${libre} livres`,
    bajada: 'Download',
    subida: 'Upload',
    graficaCpu: (valor: string) => `Gráfico de CPU dos últimos 5 minutos; agora ${valor}`,
    graficaRam: (valor: string) => `Gráfico de memória dos últimos 5 minutos; agora ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `Gráfico de rede dos últimos 5 minutos; download ${bajada}, upload ${subida}`,
    alertas: {
      titulo: 'Alertas',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `A porta ${puerto} de ${servicio} está sendo usada por outro programa: ${programa} (PID ${pid}).`,
      ramAlta: (porcentaje: number) =>
        `A memória do computador está em ${porcentaje} %. Desligue o que não estiver usando para que tudo responda melhor.`,
      huerfano: (pid: number, puertos: number[]) =>
        `Há um php-cgi que não é do WolfCore Dev (PID ${pid}) escutando em ${puertos.join(', ')}: ele sobrou de uma sessão anterior.`,
      finalizar: 'Encerrar processo',
      finalizarTitulo: 'Encerrar este processo?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre} (PID ${pid}) será fechado sem salvar o que estiver aberto. Use somente se você souber que esse programa não é necessário.`,
      finalizado: (nombre: string) => `${nombre} encerrado`,
      verPuertos: 'Ver portas',
      errorPuertos: 'Não foi possível verificar quais programas usam as portas.',
    },
    procesos: {
      titulo: 'Serviços e processos',
      vacio: 'Não há serviços nem processos de projeto em andamento.',
      nombre: 'Nome',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: 'Porta',
      encendido: 'Ligado',
      acciones: 'Ações',
      detener: 'Parar',
      registros: 'Ver registros',
      servicio: 'Serviço',
      proyecto: 'Projeto',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: 'Registros',
    descripcion:
      'Acompanhe ao vivo os registros do Nginx, do PHP, dos serviços, dos sites, dos processos de projeto e dos túneis.',
    fuente: 'Fonte',
    elegirFuente: 'Escolha um registro',
    sinFuentes:
      'Ainda não há registros. Eles aparecem quando um serviço, site ou processo grava o primeiro.',
    buscar: 'Filtrar por texto',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: 'Pausar',
    reanudar: 'Retomar',
    pausadoNuevas: (n: number) =>
      n === 1 ? '1 linha nova em pausa' : `${n} linhas novas em pausa`,
    copiar: 'Copiar o que está visível',
    copiadas: (n: number) => (n === 1 ? '1 linha copiada' : `${n} linhas copiadas`),
    limpiar: 'Limpar',
    abrirCarpeta: 'Abrir pasta',
    alFinal: 'Seguir o final',
    mostrarMas: 'Mostrar mais',
    ocultas: (n: number) =>
      n === 1 ? '1 linha anterior não exibida' : `${n} linhas anteriores não exibidas`,
    vacio: 'Ainda sem linhas. As novas aparecem aqui assim que são gravadas.',
    sinCoincidencias: 'Nenhuma linha corresponde ao filtro.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `${total} linhas` : `${visibles} de ${total} linhas`,
    descartadas: (n: number) => `(são guardadas as últimas 5000; ${n} mais antigas descartadas)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: 'Serviços',
      sitio: 'Sites',
      laravel: 'Laravel',
      proyecto: 'Processos de projeto',
      tunel: 'Túneis',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (acesso)',
      nginxError: 'Nginx (erros)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (acesso)`,
      sitioError: (dominio: string) => `${dominio} (erros)`,
      tunel: (sitio: string) => `Túnel de ${sitio}`,
      tunelSalida: (sitio: string) => `Túnel de ${sitio} (saída)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      'Abra um terminal novo para ver a mudança: os terminais já abertos não a veem.',
    enPathSinCliente: 'No PATH, mas falta o comando',
    reparar: 'Reparar',
    repararTitulo: 'Reparar o comando wolf?',
    repararTexto:
      'O wolf está no PATH, mas seus arquivos estão incompletos. Serão copiados de novo para a pasta de dados e o servidor local será ligado, como ao adicioná-lo.',
    titulo: 'Terminal: comando wolf',
    descripcion:
      'Gerencie o WolfCore Dev pelo PowerShell, cmd ou Git Bash: wolf status, wolf use php@8.4, wolf share, wolf logs. Só funciona com o app aberto.',
    activo: 'Disponível no PATH',
    enPathSinServidor: 'No PATH, servidor desligado',
    inactivo: 'Não está no PATH',
    agregarBoton: 'Adicionar wolf ao PATH',
    quitarBoton: 'Remover wolf do PATH',
    agregarTitulo: 'Adicionar o wolf ao PATH do usuário?',
    agregarTexto:
      'O comando wolf será copiado para a pasta de dados do WolfCore Dev, essa pasta será adicionada ao PATH do seu usuário (uma cópia do PATH original é guardada) e um servidor local será ligado em 127.0.0.1, que só atende o wolf com uma chave que muda a cada início. Publicar um site na internet ou mudar o PHP de todos os terminais é sempre confirmado também na janela do app. Você pode removê-lo quando quiser.',
    agregar: 'Adicionar',
    quitarTitulo: 'Remover o wolf do PATH?',
    quitarTexto:
      'A pasta do wolf será removida do PATH do seu usuário, o servidor local será desligado e o comando copiado será apagado. Os terminais abertos não mudam.',
    quitar: 'Remover',
    listoTitulo: 'Comando wolf atualizado',
    ayuda: 'Abra um terminal novo depois de adicioná-lo. O servidor só escuta em 127.0.0.1.',
    aislado: 'Com uma pasta de dados de teste (WOLFCORE_DATOS) o PATH não é alterado.',
    errorCargar: (detalle: string) => `Não foi possível ler o estado do wolf: ${detalle}`,
  },
  mcp: {
    titulo: 'Servidor MCP',
    descripcion:
      'Permite que o Claude Code e outros assistentes controlem os seus sites, serviços e bancos a partir deste computador. Escuta somente em 127.0.0.1 e exige um token.',
    estado: 'Estado',
    activo: 'Ativo',
    inactivo: 'Parado',
    activar: 'Ativar',
    detener: 'Parar',
    activado: 'Servidor MCP ativo',
    detenido: 'Servidor MCP parado',
    direccion: 'Endereço',
    puerto: 'Porta',
    puertoAyuda: 'Entre 1024 e 65535. Se estiver ativo, é reiniciado na nova porta.',
    puertoRango: 'Use um número entre 1024 e 65535',
    puertoGuardado: (p: number) => `O servidor MCP usará a porta ${p}`,
    copiarConfig: 'Copiar configuração para o Claude Code',
    copiarConfigAyuda:
      'Copia para a área de transferência a configuração com o token. Cole-a no Claude Code; o token não é exibido aqui.',
    configCopiada: 'Configuração copiada para a área de transferência',
    regenerar: 'Gerar novo token',
    regenerarTitulo: 'Gerar um novo token do servidor MCP?',
    regenerarTexto:
      'O token atual deixa de valer na hora: os assistentes conectados terão de usar a nova configuração.',
    regenerado: 'Novo token gerado. Copie a configuração de novo.',
    errorCargar: (detalle: string) => `Não foi possível ler o estado do servidor MCP: ${detalle}`,
    confirmacion: {
      titulo: 'Um assistente pede confirmação',
      herramienta: 'Ferramenta',
      pendientes: (actual: number, total: number) => `${actual} de ${total}`,
      aprobar: 'Aprovar',
      rechazar: 'Recusar',
      aprobada: 'Ação aprovada',
      rechazada: 'Ação recusada',
      vencida: 'A solicitação já não estava pendente.',
      descartadas: (n: number) =>
        n === 1
          ? 'e mais 1 que não coube (vai expirar sozinha)'
          : `e mais ${n} que não couberam (vão expirar sozinhas)`,
      falloRespuesta: (detalle: string) =>
        `Não foi possível enviar a resposta; a solicitação continua pendente. ${detalle}`,
      si: 'Sim',
      no: 'Não',
      campos: {
        motor: 'Mecanismo',
        base: 'Banco de dados',
        archivo: 'Arquivo',
        sobrescribir: 'Sobrescrever',
        pid: 'PID',
        nombre: 'Processo',
        proyecto: 'Projeto',
        pasos: 'Etapas',
        cantidad: 'Dumps',
      } as Record<string, string>,
    },
  },
  captura: {
    barra: 'Ferramentas de desenho',
    herramientas: {
      recuadro: 'Retângulo',
      flecha: 'Seta',
      linea: 'Linha',
      resaltador: 'Marca-texto',
      texto: 'Texto',
      pixelar: 'Pixelar',
      pixelarAyuda: 'Pixelar (não é seguro para dados sensíveis: use Ocultar)',
      ocultar: 'Ocultar',
      ocultarAyuda: 'Ocultar com um preenchimento sólido (recomendado para dados sensíveis)',
    },
    deshacer: 'Desfazer',
    rehacer: 'Refazer',
    copiar: 'Copiar',
    copiarAyuda:
      'Copiar para a área de transferência. A área de transferência do Windows pode guardá-la no histórico ou sincronizá-la com outros dispositivos.',
    guardar: 'Salvar…',
    alConversor: 'Enviar ao conversor de imagens',
    cerrar: 'Cancelar (Esc)',
    nuevaSeleccion: 'Nova seleção',
    color: 'Cor',
    grosor: 'Espessura',
    formato: 'Formato',
    cargando: 'Preparando a captura…',
    guiaRegion: 'Arraste para escolher a área. Esc cancela.',
    guiaVentana: 'Escolha a janela que quer capturar. Esc cancela.',
    sinVentanas: 'Não há janelas que possam ser capturadas.',
    textoPlaceholder: 'Digite e pressione Enter',
    copiada: 'Copiada para a área de transferência',
    guardada: (archivo: string) => `Salva em ${archivo}`,
    errorCargar: 'Não foi possível abrir a captura.',
    errorCopiar: 'Não foi possível copiar a imagem.',
    errorGuardar: 'Não foi possível salvar a imagem.',
    errorConversor: 'Não foi possível enviar a imagem ao conversor.',
    errorVentana: 'Não foi possível capturar essa janela.',
    dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'Tudo acontece neste computador: a captura não é enviada a nenhum serviço e não é salva no disco até que você a salve. As janelas do WolfCore Dev se escondem por um instante para não aparecerem na imagem.',
      region: 'Região',
      regionAyuda: 'Arraste sobre a tela para escolher a área.',
      ventana: 'Janela',
      ventanaAyuda: 'Escolha uma das janelas abertas.',
      pantalla: 'Tela inteira',
      pantallaAyuda: 'A tela onde está o cursor.',
      atajoActivo: (atajo: string) => `Atalho global ativo: ${atajo} (região).`,
      atajoInactivo: 'Não há atalho global. Ative-o em Ajustes.',
      noDisponible: 'A captura de tela não está disponível neste computador.',
      permisoDenegado:
        'Falta a permissão de gravação de tela. Ative-a para o WolfCore Dev nos ajustes do sistema.',
      ocupada: 'Já há uma captura em andamento.',
    },
    ajustes: {
      titulo: 'Captura de tela',
      descripcion:
        'Região, janela ou tela inteira com um editor rápido. É 100 % local: nada é enviado nem salvo até que você decida.',
      activar: 'Atalho global',
      activarAyuda:
        'Desativado por padrão. Ao ativá-lo, ele só é registrado se nenhum outro programa o usar, e é liberado ao fechar o WolfCore Dev.',
      atajo: 'Combinação',
      grabar: 'Alterar',
      grabando: 'Pressione a combinação…',
      grabandoAyuda:
        'Use Ctrl ou Super com outro modificador (por exemplo Ctrl+Alt+Shift) e uma letra, um número ou uma tecla F. Evite atalhos comuns como Ctrl+C.',
      formato: 'Formato ao salvar',
      activado: (atajo: string) => `Atalho ${atajo} ativado.`,
      desactivado: 'Atalho desativado.',
      ocupado: (atajo: string) =>
        `O atalho ${atajo} já é usado por outro programa e nada foi alterado. Tente outra combinação.`,
      ocupadoInicio:
        'O atalho salvo já é usado por outro programa e não foi registrado. Escolha outra combinação.',
      sinPermiso:
        'No macOS é necessária a permissão de gravação de tela; ela será pedida na primeira captura.',
      formatoGuardado: 'Formato salvo.',
    },
  },

  herramientas: {
    descripcion: 'Utilitários para o dia a dia. Funcionam sem conexão e sem serviços externos.',
    buscar: 'Buscar ferramenta…',
    sinResultados: 'Nenhuma ferramenta corresponde à busca.',
    abrir: 'Abrir',
    procesar: 'Processando…',
    copiar: 'Copiar',
    copiado: 'Copiado para a área de transferência',
    limpiar: 'Limpar',
    pendienteApi: 'Pendente: o núcleo ainda não expõe esta informação para a interface.',
    lista: {
      qr: { nombre: 'Gerador de QR', descripcion: 'De um texto ou do link de um túnel; PNG.' },
      json: { nombre: 'JSON', descripcion: 'Formatar, validar e minificar, com árvore.' },
      regex: {
        nombre: 'Expressões regulares',
        descripcion: 'Testador com correspondências, grupos e referência.',
      },
      diff: {
        nombre: 'Comparar textos',
        descripcion: 'Diferenças lado a lado, também de arquivos.',
      },
      tiempo: { nombre: 'Tempo', descripcion: 'Timestamp ↔ data, com fuso horário.' },
      puertos: {
        nombre: 'Portas e processos',
        descripcion: 'O que escuta em cada porta e encerrar o processo.',
      },
      bom: { nombre: 'Limpeza de BOM UTF-8', descripcion: 'Remove o BOM de arquivos ou pastas.' },
      certificados: {
        nombre: 'Certificados',
        descripcion: 'Emitir com a CA do WolfCore Dev para qualquer nome.',
      },
      cripto: {
        nombre: 'Cripto',
        descripcion: 'Hash, base64, URL, UUID, senhas e JWT.',
      },
      markdown: {
        nombre: 'Pré-visualização de Markdown',
        descripcion: 'Escreva e veja o resultado.',
      },
      entorno: { nombre: 'Ambiente do sistema', descripcion: 'PATH, versões e variáveis.' },
      buscar: {
        nombre: 'Buscar',
        descripcion: 'Texto em nomes e conteúdo de um projeto, pasta ou arquivo.',
      },
      infoArchivo: {
        nombre: 'Informações do arquivo',
        descripcion: 'Tamanho, tipo e hashes de um arquivo.',
      },
      websocket: { nombre: 'Cliente WebSocket', descripcion: 'Conectar, enviar e ver mensagens.' },
      contrasenas: {
        nombre: 'Senhas',
        descripcion: 'Medir uma senha e rever as contas fracas das suas bases.',
      },
      qrWifi: {
        nombre: 'QR de Wi-Fi',
        descripcion: 'Código QR para que outros se conectem à sua rede.',
      },
      imagenes: {
        nombre: 'Imagens',
        descripcion: 'Converter para ICO ou PNG e comprimir JPEG ou WebP.',
      },
      comprimir: {
        nombre: 'ZIP e PDF',
        descripcion: 'Comprimir arquivos e pastas em ZIP e otimizar PDF.',
      },
      conversor: {
        nombre: 'Conversor de documentos',
        descripcion: 'Converta Word, Excel, PDF, CSV e Markdown sem sair deste computador.',
      },
      captura: {
        nombre: 'Captura de tela',
        descripcion: 'Região, janela ou tela inteira, com editor rápido.',
      },
      guiaTuneles: {
        nombre: 'Guia de túneis',
        descripcion: 'Cloudflare e ngrok passo a passo, com comandos para copiar.',
      },
      guiaHttp: {
        nombre: 'Guia HTTP',
        descripcion: 'Códigos de status e métodos, com busca e exemplos.',
      },
      limpiezaDisco: {
        nombre: 'Limpeza de disco',
        descripcion:
          'Analisa e apaga temporários e caches regeneráveis, com lista prévia e confirmação.',
      },
      editor: {
        nombre: 'Editor de código',
        descripcion: 'Edite arquivos de texto com realce, cópia prévia e salvamento confirmado.',
      },
      diffCarpetas: {
        nombre: 'Diff de pastas',
        descripcion:
          'Compara duas pastas: só em uma, só na outra e diferentes, com o diff de cada arquivo.',
      },
    },
    errores: {
      jsonVacio: 'Digite ou cole um JSON.',
      jsonInvalido: (linea: number, columna: number) =>
        `JSON inválido: confira a linha ${linea}, coluna ${columna}.`,
      banderas: 'Flags inválidas: use somente d, g, i, m, s, u, v ou y, sem repetir.',
      regex: (detalle: string) => `Expressão inválida (${detalle}).`,
      trabajador: 'Não foi possível executar a operação em segundo plano.',
      diffLento: 'Os textos são diferentes demais para serem comparados a tempo.',
      base64: 'Base64 inválido.',
      utf8: 'O conteúdo decodificado não é texto UTF-8.',
      url: 'Sequência de URL inválida.',
      coste: (max: number) => `O custo do bcrypt deve estar entre 4 e ${max}.`,
      jwtPartes: 'O JWT deve ter três partes separadas por ponto.',
      jwtCabecera: 'Não foi possível ler o cabeçalho do JWT.',
      jwtCarga: 'Não foi possível ler o payload do JWT.',
      longitud: 'O comprimento deve estar entre 4 e 256.',
      sinConjuntos: 'Escolha pelo menos um tipo de caractere.',
      sinDominios: 'Digite pelo menos um nome ou IP.',
      muchosDominios: (max: number) => `No máximo ${max} nomes por certificado.`,
    },
    qr: {
      texto: 'Texto ou URL',
      textoAyuda: 'O QR é gerado no computador; nada sai para a rede.',
      tunel: 'Link de túnel de um projeto',
      sinTuneles: 'Não há túneis ativos',
      descargar: 'Baixar PNG',
      vacio: 'Digite algo para gerar o código.',
      largo: 'O texto é longo demais para um QR.',
      descargado: 'Download iniciado.',
    },
    json: {
      entrada: 'JSON',
      formatear: 'Formatar',
      minificar: 'Minificar',
      validar: 'Validar',
      valido: 'JSON válido.',
      resultado: 'Resultado',
      arbol: 'Árvore',
      mas: (n: number) => `… ${n} mais`,
    },
    regex: {
      patron: 'Padrão',
      banderas: 'Flags',
      texto: 'Texto de teste',
      coincidencias: (n: number, truncado: boolean) =>
        `${n} ${n === 1 ? 'correspondência' : 'correspondências'}${truncado ? ' (são mostradas as primeiras)' : ''}`,
      sinCoincidencias: 'Sem correspondências.',
      tiempo: 'A expressão demorou demais e foi interrompida (possível backtracking catastrófico).',
      grupo: (n: number) => `Grupo ${n}`,
      referencia: 'Referência rápida',
      tabla: [
        ['.', 'Qualquer caractere (exceto quebra de linha sem s)'],
        ['\\d \\w \\s', 'Dígito, letra/número/_ e espaço'],
        ['\\D \\W \\S', 'O contrário dos anteriores'],
        ['[abc] [^abc]', 'Um da lista / nenhum da lista'],
        ['^ $', 'Início e fim (de linha com m)'],
        ['\\b', 'Limite de palavra'],
        ['* + ?', 'Zero ou mais, um ou mais, opcional'],
        ['{n,m}', 'Entre n e m repetições'],
        ['*? +?', 'Versão preguiçosa'],
        ['(…) (?<nombre>…)', 'Grupo de captura e com nome'],
        ['(?:…)', 'Grupo sem captura'],
        ['(?=…) (?!…)', 'Seguido de / não seguido de'],
        ['a|b', 'Alternativa'],
        ['g i m s u y', 'Global, sem maiúsculas, multilinha, ponto total, Unicode, fixo'],
      ] as [string, string][],
    },
    diff: {
      original: 'Original',
      modificado: 'Modificado',
      cargarArchivo: 'Carregar arquivo',
      comparar: 'Comparar',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos} linhas`,
      iguales: 'Os textos são iguais.',
      archivoGrande: 'O arquivo passa de 5 MB; escolha um menor.',
      textoGrande: 'Cada texto pode ter no máximo 5 MB.',
      truncado: (mostradas: number, total: number) =>
        `São mostradas as primeiras ${mostradas} de ${total} linhas.`,
    },
    tiempo: {
      timestamp: 'Timestamp (segundos ou milissegundos)',
      fecha: 'Data (AAAA-MM-DD HH:mm:ss)',
      zona: 'Fuso horário',
      ahora: 'Agora',
      segundos: 'Segundos',
      milisegundos: 'Milissegundos',
      iso: 'ISO 8601 (UTC)',
      enZona: 'No fuso escolhido',
      desplazamiento: 'Deslocamento',
      relativo: 'Relativo',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? 'Lido em segundos' : 'Lido em milissegundos',
      timestampInvalido: 'Digite somente algarismos (pode ter sinal).',
      fechaInvalida: 'Use o formato AAAA-MM-DD HH:mm[:ss] com uma data real.',
      zonaInvalida: 'Fuso horário desconhecido.',
    },
    puertos: {
      filtro: 'Filtrar por porta, PID ou nome',
      actualizar: 'Atualizar',
      columnas: {
        puerto: 'Porta',
        protocolo: 'Protocolo',
        proceso: 'Processo',
        pid: 'PID',
        direcciones: 'Endereços',
        acciones: 'Ações',
      },
      propio: 'WolfCore Dev',
      sistema: 'Sistema',
      finalizar: 'Encerrar',
      noFinalizable: 'Os processos do sistema e os do WolfCore Dev não são encerrados daqui.',
      confirmarTitulo: 'Encerrar processo',
      confirmarTexto: (nombre: string, pid: number) =>
        `"${nombre}" (PID ${pid}) será fechado sem salvar. Para confirmar, digite o nome do processo:`,
      finalizado: (nombre: string) => `${nombre} foi encerrado.`,
      vacio: 'Não há portas em uso ou não foi possível lê-las.',
    },
    bom: {
      explicacion:
        'Primeiro é mostrado quais arquivos têm BOM; ao limpar, é salva uma cópia .bak-bom de cada um. node_modules, vendor, .git e binários são ignorados.',
      elegirArchivos: 'Escolher arquivos',
      elegirCarpeta: 'Escolher pasta',
      seleccion: (n: number) => `${n} ${n === 1 ? 'caminho escolhido' : 'caminhos escolhidos'}`,
      analizar: 'Analisar',
      limpiar: 'Remover BOM',
      confirmar: (n: number) =>
        `O BOM de ${n} ${n === 1 ? 'arquivo' : 'arquivos'} será removido (com cópia). Continuar?`,
      conBom: (n: number) => `${n} ${n === 1 ? 'arquivo com BOM' : 'arquivos com BOM'}`,
      sinBom: 'Nenhum arquivo tem BOM.',
      limpiados: (n: number) => `${n} ${n === 1 ? 'arquivo foi limpo' : 'arquivos foram limpos'}.`,
      copia: 'Cópia',
    },
    certificados: {
      explicacion:
        'Assina um certificado com a CA local do WolfCore Dev. O .crt é salvo onde você escolher e a chave (.key) ao lado dele; a chave nunca passa pela interface.',
      dominios: 'Nomes ou IPs (separados por espaço, vírgula ou linha)',
      ejemplo: 'meuapp.test, *.meuapp.test, 127.0.0.1',
      emitir: 'Emitir e salvar',
      guardado: 'Certificado salvo',
      certificado: 'Certificado',
      clave: 'Chave',
    },
    cripto: {
      texto: 'Texto',
      hash: 'Hash',
      calcular: 'Calcular',
      bcrypt: 'bcrypt',
      bcryptCoste: 'Custo do bcrypt',
      bcryptTrunca: 'O bcrypt só usa os primeiros 72 bytes do texto.',
      bcryptVerificar: 'Hash bcrypt para verificar',
      verificar: 'Verificar',
      coincide: 'O texto confere com o hash.',
      noCoincide: 'O texto não confere com o hash.',
      base64: 'Base64',
      base64Url: 'Variante URL',
      codificar: 'Codificar',
      decodificar: 'Decodificar',
      url: 'Codificar URL',
      decodificarUrl: 'Decodificar URL',
      codificarBase64: 'Codificar base64',
      decodificarBase64: 'Decodificar base64',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID e senhas',
      uuid: 'UUID v4',
      generar: 'Gerar',
      generarDiez: 'Gerar 10',
      contrasena: 'Senha aleatória',
      longitud: 'Comprimento',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: 'Símbolos',
      jwt: 'Decodificar JWT',
      jwtToken: 'Token',
      cabecera: 'Cabeçalho',
      carga: 'Payload',
      firmaNoVerificada:
        'Assinatura não verificada: o conteúdo é mostrado como está e pode ter sido alterado.',
      vencido: 'O token está vencido (exp).',
      vigente: 'O token não venceu (exp).',
      salida: 'Resultado',
    },
    markdown: {
      entrada: 'Markdown',
      vista: 'Pré-visualização',
      ejemplo:
        '# Título\n\nTexto com **negrito**, _itálico_ e um [link](https://example.com).\n\n- Um\n- Dois\n\n```\ncódigo\n```\n',
      seguro:
        'O HTML bruto é mostrado como texto, os links perigosos são descartados e as imagens não são carregadas.',
      imagenOmitida: (alt: string) => `[imagem${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'Versão do WolfCore Dev',
      navegador: 'Motor da interface',
      plataforma: 'Plataforma',
      idioma: 'Idioma',
      zona: 'Fuso horário',
      nucleos: 'Núcleos lógicos',
      actualizar: 'Atualizar',
      path: 'PATH',
      pathVacio: 'O PATH está vazio.',
      herramientas: 'Ferramentas do WolfCore Dev',
      noInstalada: 'Não instalada',
      sinRespuesta: 'Não respondeu a tempo',
      variables: 'Variáveis de ambiente',
      filtro: 'Filtrar variáveis',
      enmascarada: 'Valor oculto: o nome parece o de um segredo.',
    },
    busqueda: {
      explicacion:
        'Busca em nomes e em conteúdo, sem seguir links e sem ler binários. Por padrão ignora node_modules, vendor e .git.',
      origen: 'Onde buscar',
      proyecto: 'Projeto',
      elegirCarpeta: 'Escolher pasta',
      elegirArchivo: 'Escolher arquivo',
      sinOrigen: 'Escolha um projeto, uma pasta ou um arquivo.',
      consulta: 'Texto a buscar',
      modoNombre: 'Nomes',
      modoContenido: 'Conteúdo',
      modoAmbos: 'Ambos',
      regex: 'Expressão regular',
      mayusculas: 'Diferenciar maiúsculas',
      incluir: 'Só arquivos (separe com vírgulas, ex.: *.php)',
      excluir: 'Ignorar também (separe com vírgulas)',
      buscar: 'Buscar',
      cancelar: 'Cancelar',
      buscando: 'Buscando…',
      sinResultados: 'Sem correspondências.',
      truncado: 'Há mais resultados do que os exibidos: refine a busca.',
      cancelada: 'Busca cancelada.',
      abrir: 'Abrir no editor',
      incluirPesadas: 'Incluir pastas pesadas (node_modules, vendor, .git…)',
      contexto: 'Linhas de contexto',
      grupoNombres: (n: number) => `Por nome (${n})`,
      grupoContenido: (n: number) => `Por conteúdo (${n})`,
      carpeta: 'pasta',
      listaAria: 'Resultados da busca',
      atajos: '↑ ↓ para mover, Enter para abrir no editor, Esc para cancelar ou voltar ao texto.',
      sensible: (n: number) =>
        `Arquivo sensível: ocorrência na linha ${n} (o conteúdo não é exibido).`,
      mostrarMas: (n: number) => `Mostrar mais ${n}`,
      linea: (n: number) => `linha ${n}`,
      sinGrupo: 'Sem resultados neste grupo.',
      topeBytes: 'O limite de leitura foi atingido: refine a busca.',
      coincidencias: (n: number) => `${n} ${n === 1 ? 'correspondência' : 'correspondências'}`,
      resumen: (archivos: number, examinados: number) =>
        `em ${archivos} ${archivos === 1 ? 'arquivo' : 'arquivos'} (${examinados} verificados)`,
    },
    diffCarpetas: {
      explicacion:
        'Compara duas pastas sem alterar nada nelas: o que só está em uma, o que só está na outra e o que é diferente. Não segue links e trabalha em um processo separado.',
      carpetaA: 'Pasta A',
      carpetaB: 'Pasta B',
      elegir: 'Escolher pasta',
      sinElegir: 'Não escolhida',
      comparar: 'Comparar',
      comparando: 'Comparando…',
      cancelar: 'Cancelar',
      cancelada: 'Comparação cancelada.',
      iguales: 'As duas pastas são iguais.',
      grupoSoloA: 'Só em A',
      grupoSoloB: 'Só em B',
      grupoDistintos: 'Diferentes',
      grupo: (nombre: string, n: number) => `${nombre} (${n})`,
      vacio: 'Nenhum',
      resumen: (a: number, b: number, iguales: number) =>
        `A: ${a} arquivos · B: ${b} arquivos · ${iguales} iguais`,
      truncado:
        'Um limite foi atingido (arquivos, profundidade ou tamanho): a lista não está completa.',
      recortado: (mostrados: number, total: number) =>
        `Há mais arquivos do que os exibidos (${mostrados} de ${total}).`,
      sinComparar: (n: number) =>
        `${n} arquivos grandes com o mesmo tamanho não foram comparados pelo conteúdo.`,
      omitidos: (n: number) => `${n} links, junções ou itens especiais foram ignorados.`,
      motivoTamano: 'tamanho diferente',
      motivoContenido: 'mesmo tamanho, conteúdo diferente',
      tamano: (a: string, b: string) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'Escolha um arquivo «diferente» da lista para ver a diferença.',
      soloEnUno: (lado: string) => `Este arquivo só existe em ${lado}.`,
      cargando: 'Lendo os arquivos…',
      binario: 'Os arquivos são diferentes, mas não são de texto: o diff não é exibido.',
      sensible:
        'Arquivo sensível (.env, chaves ou dados reais): é diferente, mas o conteúdo não é exibido. Você pode abri-lo no editor, que pede uma confirmação reforçada.',
      tope: (kb: number) =>
        `Os arquivos são diferentes, mas passam de ${kb} KB: o diff de texto não é exibido.`,
      demasiadoDistinto: 'Os arquivos são tão diferentes que o diff linha a linha não é exibido.',
      saltos: {
        lf: 'LF',
        crlf: 'CRLF',
        mixto: 'quebras de linha mistas',
        ninguno: 'sem quebras de linha',
      },
      saltosDistintos: (a: string, b: string) => `Quebras de linha: A usa ${a} e B usa ${b}.`,
      soloSaltos:
        'O texto das linhas é o mesmo: só mudam as quebras de linha (inclusive a do fim do arquivo) ou o BOM.',
      resumenArchivo: (agregadas: number, quitadas: number) =>
        `${agregadas} linhas adicionadas, ${quitadas} removidas`,
      truncadoArchivo: 'Só as primeiras linhas são exibidas.',
      lineasIguales: (n: number) => `… ${n} linhas iguais …`,
      abrirA: 'Abrir A no editor',
      abrirB: 'Abrir B no editor',
      atajos: '↑ ↓ para mover, Enter para ver a diferença, Esc para cancelar.',
      listaAria: (grupo: string) => `Arquivos: ${grupo}`,
      detalleAria: 'Diferenças do arquivo',
    },
    infoArchivo: {
      elegir: 'Escolher arquivo',
      ayuda: 'É lido no computador para calcular os hashes (máximo de 200 MB).',
      nombre: 'Nome',
      tamano: 'Tamanho',
      tipo: 'Tipo',
      modificado: 'Modificado',
      sinTipo: 'Desconhecido',
      grande: 'O arquivo passa de 200 MB: os dados são mostrados sem os hashes.',
      calculando: 'Calculando hashes…',
    },
    websocket: {
      url: 'URL (ws:// ou wss://)',
      conectar: 'Conectar',
      desconectar: 'Desconectar',
      mensaje: 'Mensagem',
      enviar: 'Enviar',
      urlInvalida: 'Digite uma URL que comece com ws:// ou wss://.',
      conectando: 'Conectando…',
      conectado: 'Conectado',
      desconectado: 'Desconectado',
      error: 'Erro de conexão',
      cerrado: (codigo: number, motivo: string) =>
        `Fechado (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: 'Enviado',
      recibido: 'Recebido',
      binario: (n: number) => `[binário, ${n} bytes]`,
      vacio: 'Ainda sem mensagens.',
      tope: 'São guardadas as últimas 500 mensagens; cada uma é mostrada até 10 KB.',
    },
    qrWifi: {
      ssid: 'Nome da rede (SSID)',
      clave: 'Senha',
      seguridad: 'Segurança',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: 'Sem senha',
      oculta: 'Rede oculta',
      mostrar: 'Mostrar',
      ocultar: 'Ocultar',
      aviso:
        'O código QR contém a senha como está: quem o vir ou fotografar pode se conectar à sua rede. Ele é gerado aqui, não é salvo e é apagado ao fechar este painel.',
      avisoPng: 'O PNG baixado também leva a senha dentro do código: guarde-o onde só você o veja.',
      escribala:
        'Você digita a senha: o WolfCore Dev nunca lê as senhas de Wi-Fi guardadas no sistema.',
      errorSsid: 'Digite o nome da rede (até 32 caracteres).',
      errorClave: 'Digite a senha.',
      errorClaveWpa: 'Uma senha WPA tem entre 8 e 63 caracteres.',
      vacio: 'Preencha os dados para ver o código.',
      alt: 'Código QR para conectar à rede Wi-Fi',
      descargar: 'Baixar PNG',
      descargado: 'QR salvo',
      largo: 'Os dados são longos demais para um QR.',
    },
    imagenes: {
      elegir: 'Escolher imagem',
      ayuda:
        'É processada neste computador (até 30 MB e 12000 px por lado). O original não é modificado: o resultado é um arquivo novo.',
      original: 'Original',
      accion: 'O que fazer',
      aIco: 'Converter para ICO',
      aPng: 'Converter para PNG',
      comprimir: 'Comprimir',
      tamanos: 'Tamanhos do ICO',
      formato: 'Formato',
      calidad: 'Qualidade',
      ladoMax: 'Lado máximo em px (vazio = o original)',
      procesar: 'Processar',
      procesando: 'Processando…',
      guardar: 'Salvar como…',
      antes: 'Antes',
      despues: 'Depois',
      sinMejora: 'O resultado não é menor que o original: tente outra qualidade ou formato.',
      errorAbrir: 'Não foi possível abrir a imagem neste computador.',
      errorProcesar: 'Não foi possível processar a imagem.',
      sufijoConvertida: '-convertida',
      sufijoComprimida: '-comprimida',
      nombreCaptura: 'captura-de-tela',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % menor`
          : porcentaje < 0
            ? `${-porcentaje} % maior`
            : 'sem mudança',
      guardado: (archivo: string) => `Salvo em ${archivo}`,
    },
    comprimir: {
      zip: 'Comprimir em ZIP',
      zipAyuda:
        'Escolha arquivos ou pastas. Os links não são seguidos e o ZIP é um arquivo novo: nunca se sobrescreve um existente.',
      agregarArchivos: 'Adicionar arquivos',
      agregarCarpeta: 'Adicionar pasta',
      quitar: 'Remover',
      vacio: 'Nada escolhido ainda.',
      crearZip: 'Criar ZIP…',
      creando: 'Criando…',
      pdf: 'Otimizar PDF',
      pdfAyuda:
        'É salvo de novo com fluxos de objetos, em uma thread separada. O arquivo só é criado se for menor; PDFs protegidos por senha não são abertos. O original não é tocado. Atenção: ao salvar de novo, perdem-se as assinaturas digitais e a conformidade com PDF/A.',
      elegirPdf: 'Escolher PDF',
      optimizar: 'Otimizar…',
      optimizando: 'Otimizando…',
      antes: 'Antes',
      despues: 'Depois',
      sinMejora: 'O PDF não ficaria menor: nenhum arquivo foi criado.',
      sufijoOptimizado: '-otimizado',
      omitidos: (n: number) =>
        `${n} ${n === 1 ? 'link, pasta ilegível ou arquivo especial não foi incluído' : 'links, pastas ilegíveis ou arquivos especiais não foram incluídos'}.`,
      archivos: (n: number) => `${n} ${n === 1 ? 'arquivo' : 'arquivos'}`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje} % menor`
          : porcentaje < 0
            ? `${-porcentaje} % maior`
            : 'sem mudança',
      guardado: (archivo: string) => `Salvo em ${archivo}`,
    },
    conversor: {
      ayuda:
        'A conversão é feita neste computador: o documento não é enviado a lugar nenhum. O original não é modificado; o resultado é um arquivo novo e um existente nunca é sobrescrito.',
      elegir: 'Escolher documento',
      tipoNoSoportado:
        'Não há conversões para esse tipo de arquivo. São aceitos docx, xlsx, csv, md, html e pdf (e odt, pptx e doc com o LibreOffice).',
      convertirA: 'Converter para',
      convertir: 'Converter…',
      convirtiendo: 'Convertendo…',
      avisoLibreOffice:
        'Esta conversão usa o LibreOffice, que já está instalado neste computador. O WolfCore Dev não o instala nem o baixa: ele o abre sem janela e com um perfil temporário.',
      sinLibreOffice:
        'Se instalar o LibreOffice, também poderá converter odt, pptx e doc (o WolfCore Dev não o instala).',
      limites:
        'Há limites de segurança: até 50 MB (10 MB para md e html), 120 s, 200.000 linhas, 1000 colunas e 5 milhões de células; arquivos que parecem uma bomba ZIP ou trazem entidades XML são rejeitados.',
      guardado: (archivo: string) => `Salvo em ${archivo}`,
    },
    contrasenas: {
      pestanaFortaleza: 'Força',
      pestanaAuditar: 'Auditar uma base',
      fortaleza: {
        etiqueta: 'Senha a medir',
        marcador: 'Escreva uma senha',
        privacidad: 'É medida aqui mesmo: nada sai do seu computador nem é guardado.',
        mostrar: 'Mostrar',
        ocultar: 'Ocultar',
        niveles: ['Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'],
        sinAvisos: 'Sem observações.',
        estimacion: 'É uma estimativa, não uma garantia.',
        avisos: {
          straightRow: 'Uma fileira de teclas seguidas é fácil de adivinhar.',
          keyPattern: 'Padrões curtos de teclado são fáceis de adivinhar.',
          simpleRepeat: 'Repetir um caractere ou um grupo quase não ajuda.',
          extendedRepeat: 'Grupos repetidos são fáceis de adivinhar.',
          sequences: 'Sequências como abc ou 6543 são fáceis de adivinhar.',
          recentYears: 'Evite anos recentes e datas ligadas a você.',
          dates: 'Evite datas: são fáceis de adivinhar.',
          topTen: 'Está entre as dez senhas mais usadas.',
          topHundred: 'Está entre as cem senhas mais usadas.',
          common: 'É uma senha muito usada.',
          similarToCommon: 'Parece uma senha muito usada.',
          wordByItself: 'Uma palavra solta é fácil de adivinhar.',
          namesByThemselves: 'Um nome ou sobrenome solto é fácil de adivinhar.',
          commonNames: 'Nomes e sobrenomes comuns são fáceis de adivinhar.',
          userInputs: 'Não use dados que outros conhecem sobre você.',
          l33t: 'Trocar letras por símbolos previsíveis (@ por a) ajuda pouco.',
          reverseWords: 'Escrever as palavras ao contrário ajuda pouco.',
          allUppercase: 'Pôr tudo em maiúsculas ajuda pouco.',
          capitalization: 'Pôr a primeira letra em maiúscula ajuda pouco.',
          associatedYears: 'Evite anos associados a você.',
          repeated: 'Evite palavras e caracteres repetidos.',
          longerKeyboardPattern: 'Use um padrão de teclado mais longo e mude de direção.',
          anotherWord: 'Acrescente uma ou duas palavras; as incomuns ajudam.',
          useWords: 'Várias palavras aleatórias formam uma boa senha.',
          noNeed: 'É possível ser seguro sem símbolos nem números: o que conta é o tamanho.',
        },
      },
      auditar: {
        limite:
          'Isto detecta apenas senhas muito comuns: compara cada hash com uma lista curta de cerca de 200. Não é um ataque nem um teste de força bruta. Uma conta não aparecer marcada não quer dizer que a senha seja boa.',
        privacidad:
          'Nunca se mostra qual senha coincidiu, e a leitura é feita com um usuário temporário somente leitura (no PostgreSQL, com a sessão em somente leitura). Use apenas nas suas próprias bases.',
        motor: 'Motor',
        base: 'Base de dados',
        tabla: 'Tabela',
        columnaUsuario: 'Coluna do usuário',
        columnaHash: 'Coluna do hash',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: 'Ligue o servidor em Bases de dados para rever as suas bases.',
        sinBases: 'Não há bases neste servidor.',
        sinMotores: 'Não há um servidor MySQL, MariaDB ou PostgreSQL próprio.',
        revisar: 'Rever',
        revisando: 'A rever…',
        resumen: (r: number, d: number) =>
          `${r} ${r === 1 ? 'conta revista' : 'contas revistas'} · ${d} ${d === 1 ? 'fraca' : 'fracas'}`,
        sinDebiles: 'Nenhuma conta revista coincide com uma senha muito comum.',
        noRevisables: (n: number) =>
          `${n} ${n === 1 ? 'conta não pôde ser revista' : 'contas não puderam ser revistas'}:`,
        truncado:
          'A revisão parou no limite de 10 000 linhas ou 60 segundos: ficaram contas por rever.',
        usuario: 'Usuário',
        motivo: 'Motivo',
        accion: 'Ação',
        motivos: {
          comun: 'Senha muito comum',
          formato_debil: 'Formato fraco (md5 ou sha1 sem sal)',
        },
        restablecer: 'Redefinir',
        mas: (n: number) => `e mais ${n} (mostram-se as primeiras 200)`,
        esquema: 'Esquema (PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: 'Cancelar',
        cancelando: 'A cancelar…',
        cancelada: 'Auditoria cancelada.',
        progreso: (a: number, b: number) => `Revistas ${a} de ${b}`,
        tiposNoRevisables: {
          vacio: 'hash vazio',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2 (não disponível neste computador ou com parâmetros acima do limite)',
          bcrypt_otro: 'bcrypt com custo fora do intervalo ou variante $2x$',
          pbkdf2_otro: 'PBKDF2 com parâmetros acima do limite',
          ldap: 'formato LDAP ({SHA}…)',
          otro: 'formato desconhecido',
        },
        rlsActiva:
          'A tabela tem segurança por linhas (RLS): a auditoria vê apenas as linhas que a política permite ao papel limitado, por isso pode faltar alguma conta.',
        falsoPositivo:
          'Um valor de 32 ou 40 caracteres hexadecimais é tomado por md5 ou sha1, mas pode ser outra coisa (um token, por exemplo). Se a coluna não guarda senhas, o resultado não serve.',
      },
      restablecer: {
        titulo: (u: string) => `Redefinir a senha de ${u}`,
        ayuda:
          'Uma senha não pode ser recuperada: define-se uma nova. Antes, é tirado um instantâneo da base e guardada uma cópia da linha.',
        cargando: 'A preparar a pré-visualização…',
        sentencia: 'Vai ser executado (os valores vão à parte e não se mostram)',
        formatoActual: (f: string) => `Formato atual: ${f}`,
        cambiaFormato:
          'A conta passará a bcrypt: a aplicação tem de o poder verificar (por exemplo com password_verify); caso contrário, ninguém entrará com essa conta.',
        nueva: 'Nova senha',
        generar: 'Gerar uma',
        mostrar: 'Mostrar',
        ocultar: 'Ocultar',
        anotar: 'Anote-a agora: não volta a ser mostrada nem é guardada.',
        escribaUsuario: (u: string) => `Para confirmar, escreva o usuário: ${u}`,
        confirmar: 'Redefinir senha',
        cancelar: 'Cancelar',
        cerrar: 'Fechar',
        hecho: 'Senha redefinida.',
        copiaFila: 'Cópia da linha (identificação e hash anterior, guardada 30 dias):',
        instantanea: 'Instantâneo da base tirado antes:',
        instantaneaAyuda: 'Pode voltar a ele em Bases de dados › Instantâneos.',
        aBcrypt: 'Passar para bcrypt: só se a aplicação usa password_verify ou equivalente',
        avisoLegado:
          'Este hash é md5 ou sha1 sem sal e mantém esse formato. Se a aplicação guarda o sal à parte (noutra coluna ou numa constante), o hash não pode ser reproduzido e a nova senha não serviria para entrar.',
        datosReales: {
          titulo: 'Base com dados reais',
          texto:
            'Esta base é de um site marcado com dados reais de clientes: redefinir uma senha altera uma conta de verdade.',
          casilla: 'Entendo que são dados reais e quero redefinir esta senha',
        },
        rlsActiva:
          'A tabela tem segurança por linhas (RLS): se a política ocultar esta conta ao papel limitado, não poderá ser redefinida.',
        copiaSinRestringir:
          'Não foi possível limitar essa cópia ao usuário deste computador: verifique as permissões da pasta.',
      },
    },
  },
  doctor: {
    descripcion:
      'Verifica portas, certificados, o arquivo hosts, o PATH, o Visual C++, o antivírus e os serviços, e propõe como repará-los.',
    revisarAhora: 'Verificar agora',
    revisando: 'Verificando…',
    sinRevision: 'Ainda não há uma verificação. Clique em «Verificar agora».',
    sinHallazgos: 'Tudo em ordem: nenhum problema encontrado.',
    gravedades: { error: 'Erros', aviso: 'Avisos', info: 'Informações' },
    evidencia: 'O que foi visto',
    requiereAdmin: 'Pede permissão de administrador',
    comandoManual: 'Comando para um console de administrador (não é executado sozinho):',
    copiar: 'Copiar comando',
    copiado: 'Comando copiado.',
    reparar: 'Reparar',
    ver: 'Ver',
    alternativa: 'Mover a porta do WolfCore Dev',
    soloInforma: 'O WolfCore Dev não muda isto por conta própria: siga as instruções.',
    dialogo: {
      titulo: 'Confirmar o reparo',
      queHara: 'Isto é o que será feito:',
      admin: 'O Windows vai pedir permissão de administrador.',
      reglas: 'Regras afetadas: desmarque as que não quiser tocar.',
      sinSeleccion: 'Marque pelo menos uma regra para continuar.',
      reglasNota:
        'Nada muda sem a sua confirmação e a permissão de administrador. Se uma regra mudou depois de ser mostrada, ela é ignorada.',
      puerto: (p: string | number) => `A nova porta será ${p}.`,
      aplicar: 'Aplicar',
      cancelar: 'Cancelar',
    },
    estados: {
      aplicando: 'Aplicando…',
      hecha: 'Reparo aplicado.',
      fallida: 'Não foi possível reparar.',
    },
    revisiones: {
      puertos: 'Portas',
      'rangos-reservados': 'Intervalos reservados',
      ca: 'Autoridade certificadora',
      certificados: 'Certificados',
      confianza: 'Confiança da CA',
      hosts: 'Arquivo hosts',
      path: 'PATH do usuário',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'Vinculador C++',
      antivirus: 'Antivírus',
      firewall:
        'Remover as regras marcadas, uma por uma e pelo nome exato. Antes é anotada uma cópia em etc/cortafuegos-quitadas.json (só para exibição) e outra, protegida, em uma pasta que só os administradores podem escrever. As regras de outros programas nunca são tocadas.',
      servicios: 'Serviços',
    },
    reparaciones: {
      cambiar_puerto:
        'Mudar a porta do WolfCore Dev para uma livre. O outro programa não é tocado.',
      puerto_manual:
        'Mover a porta do WolfCore Dev para fora do intervalo reservado. Liberar o intervalo é decisão sua, com o comando mostrado.',
      detener_iis:
        'Parar o serviço do IIS (W3SVC) para liberar a porta. Ele não é desabilitado: volta a iniciar ao reiniciar o Windows.',
      regenerar_ca:
        'Criar uma nova autoridade certificadora, confiar nela no Windows (será pedida uma confirmação), emitir de novo os certificados e remover a anterior. Antes é salva uma cópia.',
      regenerar_certificados: 'Emitir de novo os certificados dos sites e recarregar o Nginx.',
      hosts_reescribir:
        'Reescrever o bloco do WolfCore Dev no arquivo hosts em UTF-8, com uma cópia prévia. As linhas de terceiros não são tocadas.',
      hosts_solo_lectura: 'Remover o atributo de somente leitura do arquivo hosts.',
      path_duplicados:
        'Remover as entradas repetidas do WolfCore Dev do PATH do usuário, com cópia do valor anterior. As de terceiros não são tocadas.',
      path_ajeno:
        'Outra ferramenta está antes no PATH. O WolfCore Dev não a remove: mude-a de lugar se precisar.',
      instalar_vcredist:
        'Instalar o Visual C++ 2015+ x64 com o winget. O instalador da Microsoft pede a própria permissão.',
      instalar_build_tools:
        'Instale o Visual Studio Build Tools (com as ferramentas C++) com o comando mostrado: ocupa vários GB e pede permissão de administrador, então a decisão é sua.',
      antivirus:
        'Adicionar a pasta de dados às exclusões do antivírus é decisão sua, com o comando mostrado.',
      firewall:
        'Remover essas regras de entrada do firewall, uma por uma e pelo nome exato. Antes é guardada uma cópia em etc/cortafuegos-quitadas.json para poder recriá-las. As regras de outros programas nunca são tocadas.',
      firewall_restaurar:
        'Recriar as regras marcadas, com o mesmo programa, perfil, protocolo, portas e endereços que são mostrados, a partir da cópia protegida (não do arquivo em etc/). Esses programas voltarão a poder receber conexões da rede.',
      reintentar_servicio: 'Iniciar o serviço de novo.',
      firefox_confianza:
        'Adicionar no user.js de cada perfil do Firefox a preferência que confia na autoridade do Windows, com uma cópia prévia. O prefs.js não é tocado e os perfis abertos são pulados.',
    },
    confianza: {
      titulo: 'Confiança da CA',
      texto:
        'O Windows já confia na autoridade do WolfCore Dev; Node, Python e Firefox usam o próprio repositório.',
      sinCa: 'Ainda não há autoridade certificadora. Crie-a em HTTPS para usar esta seção.',
      node: {
        titulo: 'Node',
        proyectos:
          'Os processos de projeto e o Terminal recebem NODE_EXTRA_CA_CERTS com a autoridade.',
        ajena: 'Você já tem a sua própria NODE_EXTRA_CA_CERTS: o WolfCore Dev não a substitui.',
        global: 'Também como variável do usuário (para outros terminais e programas)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS será definida como variável do seu usuário. Afeta os programas que você abrir depois; é removida ao desativar esta opção.',
        confirmarDesactivar:
          'A variável NODE_EXTRA_CA_CERTS que o WolfCore Dev definiu será removida.',
      },
      python: {
        titulo: 'Python',
        texto:
          'Os projetos com .venv recebem REQUESTS_CA_BUNDLE e SSL_CERT_FILE com as raízes do certifi (ou as do Windows) mais a autoridade. Nunca somente a autoridade.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Nenhum perfil do Firefox foi encontrado.',
        activo: 'Confia',
        inactivo: 'Não confia',
        abierto: 'Aberto',
        fuera: 'Fora da pasta do Firefox',
        avisoFuera: (lista: string) =>
          `Estes perfis estão fora da pasta do Firefox e não são tocados, a menos que você marque: ${lista}.`,
        incluirFuera: 'Alterar também os perfis fora da pasta do Firefox',
        resultadoFuera: (n: number) =>
          `${plural(n, 'perfil fora da pasta do Firefox não foi tocado', 'perfis fora da pasta do Firefox não foram tocados')}.`,
        activar: 'Ativar no Firefox',
        quitar: 'Remover do Firefox',
        confirmarActivar:
          'security.enterprise_roots.enabled será adicionada ao user.js de cada perfil, entre marcas do WolfCore Dev e com uma cópia prévia em etc/respaldos. O prefs.js não é tocado. Os perfis com o Firefox aberto são pulados: feche-o antes.',
        confirmarQuitar:
          'O bloco do WolfCore Dev será removido do user.js de cada perfil (com cópia prévia). As suas outras preferências ficam iguais.',
        resultadoOk: (n: number) => `Pronto em ${plural(n, 'perfil', 'perfis')}.`,
        resultadoAbiertos: (n: number) =>
          `${plural(n, 'perfil foi pulado', 'perfis foram pulados')} porque o Firefox está aberto. Feche-o e tente de novo.`,
        resultadoError: (n: number) =>
          `${plural(n, 'perfil não pôde ser alterado', 'perfis não puderam ser alterados')}.`,
      },
      confirmar: 'Confirmar',
      cancelar: 'Cancelar',
    },
  },
  php: {
    descripcion:
      'php.ini e extensões de cada versão do PHP instalada. Antes de salvar, o diff é mostrado, o resultado é testado com php -v e é guardada uma cópia com data; se o PHP não voltar a iniciar, o anterior é restaurado.',
    rama: 'Versão do PHP',
    sinPhp: 'Não há PHP instalado. Instale-o em Serviços.',
    irServicios: 'Ir para Serviços',
    pestanas: { ini: 'php.ini', extensiones: 'Extensões' },
    rapidosTitulo: 'Valores rápidos',
    rapidosAyuda: 'São aplicados ao texto abaixo; nada é salvo até confirmar o diff.',
    aplicarRapidos: 'Aplicar ao texto',
    sinValor: 'não definido',
    rapidos: {
      memory_limit: 'Memória por script (memory_limit)',
      upload_max_filesize: 'Tamanho máximo de upload (upload_max_filesize)',
      post_max_size: 'Tamanho máximo de POST (post_max_size)',
      max_execution_time: 'Tempo máximo em segundos (max_execution_time)',
      display_errors: 'Mostrar erros (display_errors)',
      error_reporting: 'Nível de erros (error_reporting)',
      'date.timezone': 'Fuso horário (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: 'As linhas que começam com ; são comentários.',
    sinCambios: 'Não há alterações em relação ao que está salvo.',
    descartar: 'Descartar alterações',
    revisar: 'Revisar e salvar',
    diffTitulo: (rama: string) => `Alterações no php.ini do PHP ${rama}`,
    diffAyuda:
      'Será guardada uma cópia com data, o resultado será testado com php -v e, se o PHP estiver ligado, ele será reiniciado.',
    guardar: 'Salvar e aplicar',
    cancelar: 'Cancelar',
    guardado: (respaldo: string) => `php.ini salvo. Cópia prévia: ${respaldo}`,
    respaldosTitulo: 'Cópias com data',
    sinRespaldos: 'Ainda não há cópias.',
    restaurar: 'Restaurar',
    confirmarRestaurar: (nombre: string) =>
      `Restaurar ${nombre}? O php.ini atual é guardado antes como outra cópia.`,
    restaurado: 'Cópia restaurada.',
    recargar: 'Ler de novo',
    extensiones: {
      ayuda:
        'Somente as extensões que esta compilação traz em ext/ podem ser ativadas. As de terceiros são instaladas do catálogo (variante desta compilação e checksum SHA-256 verificado).',
      activa: 'Ativa',
      inactiva: 'Inativa',
      falta: 'Falta o arquivo',
      catalogo: 'Catálogo',
      instalar: 'Instalar',
      instalada: (nombre: string) => `${nombre} instalada e ativada.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} ativada.` : `${nombre} desativada.`,
      buscar: 'Buscar extensão',
      vacio: 'Não há extensões correspondentes.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI e Antigravity CLI: detecte-os ou instale-os e abra-os em um projeto. Os que permitem se conectam ao MCP do WolfCore Dev. Nenhum abre sozinho.',
    recargar: 'Detectar de novo',
    notaMcp:
      'O MCP registrado só autentica quando o agente é aberto pelo WolfCore Dev ("Abrir em um projeto"): o token vai na variável WOLFCORE_MCP_TOKEN desse terminal e nunca fica gravado na configuração do agente. Aberto por fora, o agente vê a entrada «wolfcore», mas não consegue se conectar.',
    sitioElegido: (nombre: string) => `Escolha um agente para abri-lo em ${nombre}.`,
    instalado: 'Instalado',
    noInstalado: 'Não instalado',
    version: (v: string) => `v${v}`,
    versionDesconocida: 'Versão desconhecida',
    verVersion: 'Ver versão',
    verVersionAyuda: 'Executa o programa com --version (não é feito sozinho ao abrir a tela).',
    origen: {
      propio: 'Instalado pelo WolfCore Dev',
      'npm-usuario': 'npm global do usuário',
      ejecutable: 'Programa do sistema',
    },
    mcpRegistrado: 'MCP registrado',
    mcpSinRegistrar: 'MCP não registrado',
    tokenEscrito:
      'O arquivo do agente trazia o token do MCP gravado: ele já não o tem e a cópia prévia o guarda mascarado (***). Considere gerar um novo token do servidor MCP.',
    mcpNoSoportado:
      'A documentação dele não permite pegar o token de uma variável de ambiente: o WolfCore Dev não registra o MCP nele (o token nunca é gravado em arquivos).',
    instalar: 'Instalar',
    instalando: 'Instalando…',
    guia: 'Guia de instalação',
    soloGuia:
      'O WolfCore Dev não o instala (o instalador dele não tem checksum fixo): siga o guia oficial.',
    registrar: 'Registrar MCP',
    quitar: 'Remover MCP',
    abrir: 'Abrir em um projeto',
    confirmarInstalar: {
      titulo: (nombre: string) => `Instalar ${nombre}?`,
      texto: (paquete: string) =>
        `A última versão publicada de ${paquete} é instalada a partir do registry.npmjs.org, com o Node do WolfCore Dev e na sua pasta de dados.`,
      aislado:
        'Não usa a sua configuração do npm nem toca no seu npm global. Pode levar vários minutos.',
      aceptar: 'Instalar',
      hecho: (nombre: string) => `${nombre} foi instalado.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `Registrar o MCP em ${nombre}?`,
      texto:
        'Somente a entrada «wolfcore» deste arquivo é adicionada (ou atualizada); o resto fica igual:',
      aceptar: 'Registrar',
      hecho: (nombre: string) => `MCP registrado em ${nombre}.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `Remover o MCP de ${nombre}?`,
      texto: 'Somente a entrada «wolfcore» deste arquivo é removida; o resto fica igual:',
      aceptar: 'Remover',
      hecho: (nombre: string) => `MCP removido de ${nombre}.`,
    },
    copiaPrevia:
      'Antes de tocá-lo, é guardada uma cópia com data ao lado do arquivo (<arquivo>.wolfcore-AAAAMMDD-HHmmss.bak); as 5 mais novas são mantidas. Se o agente estiver aberto, feche-o antes.',
    copiaHecha: (ruta: string) => `Cópia prévia: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `Abrir ${nombre}`,
      proyecto: 'Projeto',
      sinProyectos: 'Ainda não há projetos.',
      proveedor: 'Provedor de IA',
      proveedorPropio: 'O que o agente tiver configurado',
      proveedorAyuda:
        'Com um provedor, a chave dele vai somente no ambiente desse terminal: não é gravada em arquivos nem na linha de comando.',
      aceptar: 'Abrir terminal',
      hecho: (nombre: string) => `${nombre} foi aberto em um novo terminal.`,
    },
    costo: {
      titulo: 'Antes de abrir um agente',
      texto:
        'Um agente de IA trabalha com a sua conta do provedor: cada pedido consome tokens e pode custar dinheiro. Ele também pode ler e alterar os arquivos do projeto e executar comandos.',
      nunca:
        'O WolfCore Dev nunca abre um agente por conta própria: é sempre você que pede. Este aviso é mostrado uma única vez.',
      aceptar: 'Entendi, abrir',
    },
  },
  depuracion: {
    descripcion:
      'Veja aqui os dump(), dd() e wd() dos seus sites PHP e os wolfdump dos seus processos Python, com arquivo e linha. A página continua respondendo igual.',
    receptor: 'Captura de dumps',
    escuchando: (direccion: string, puerto: number) => `Escutando em ${direccion}:${puerto}`,
    apagado: 'Desligada',
    memoria:
      'Os dumps ficam somente na memória (os últimos 500) e se perdem ao fechar. Podem conter dados sensíveis: ao copiar, as chaves conhecidas são mascaradas.',
    sitios: 'Sites',
    sinSitios: 'Não há sites PHP nem FastAPI.',
    sinPhp: 'Escolha antes uma versão do PHP no site.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'Reinicie os processos do site para que usem o wolfdump.',
    confirmarTitulo: (sitio: string) => `Ativar a captura em ${sitio}`,
    confirmarPhp:
      'O PHP deste site vai carregar, antes de cada requisição, um arquivo do WolfCore Dev (auto_prepend_file, somente neste site) que define dump(), dd() e wd() se o projeto não os definir. Se os seus arquivos declararem a própria função dump() ou dd() sem verificar function_exists, o PHP vai mostrar um erro: nesse caso, desative a captura. O site passa a usar o próprio PHP.',
    usoPhp:
      'Laravel e Symfony: dump($x) e dd($x) como sempre. CodeIgniter 3 e outros: wd($x) envia sem mostrar nada na página.',
    confirmarPython:
      'Os processos deste site terão o módulo wolfdump no PYTHONPATH (nada é gravado no projeto). Vale a partir da próxima inicialização dos processos.',
    usoPython: 'from wolfdump import dump  →  dump(valor)',
    activar: 'Ativar captura',
    cancelar: 'Cancelar',
    filtroSitio: 'Todos os sites',
    filtroOrigen: 'Toda origem',
    buscar: 'Buscar no texto, arquivo ou URL',
    limpiar: 'Limpar',
    confirmarLimpiar: 'Apagar todos os dumps da memória?',
    vacio: 'Ainda não chegou nenhum dump.',
    vacioApagado: 'Ative a captura e ligue um site para começar.',
    elegir: 'Escolha um dump da lista.',
    copiar: 'Copiar',
    copiado: 'Copiado (com as chaves mascaradas)',
    sinSitio: 'sem site',
    total: (n: number) => `${n} na memória`,
    archivo: 'Arquivo',
    url: 'URL',
    pestanaVolcados: 'Dumps',
    pestanaErrores: 'Erros',
    erroresDescripcion:
      'Erros dos registros do PHP, Nginx, laravel.log, CodeIgniter 3 e Python, agrupados: o mesmo erro repetido aparece uma vez com o contador.',
    erroresVacio: 'Sem erros nos registros. Eles aparecem aqui assim que são gravados.',
    erroresElegir: 'Escolha um erro da lista.',
    actualizar: 'Atualizar',
    abrirEditor: 'Abrir no editor',
    abrirEditorSinSitio: 'Somente arquivos da pasta de um site são abertos.',
    veces: (n: number) => (n === 1 ? '1 vez' : `${n} vezes`),
    primera: 'Primeira vez',
    ultima: 'Última vez',
    fuente: 'Registro',
    traza: 'Stack trace (última vez)',
    sinTraza: 'Sem stack trace.',
  },
  contenedores: {
    descripcion:
      'Veja e controle os contêineres do Docker ou do Podman deste computador. O WolfCore Dev não cria, apaga nem baixa contêineres, imagens ou volumes.',
    motor: 'Mecanismo',
    refrescar: 'Atualizar',
    detectando: 'Procurando Docker e Podman…',
    sinMotorTitulo: 'Não há Docker nem Podman',
    sinMotor:
      'Docker e Podman não foram encontrados neste computador. O WolfCore Dev não os instala: se precisar, instale um pela página oficial e clique em Atualizar.',
    instalarDocker: 'Instalar o Docker',
    instalarPodman: 'Instalar o Podman',
    apagadoTitulo: (m: string) => `${m} não responde`,
    apagado: (m: string) =>
      `${m} está instalado, mas o mecanismo dele não responde. Abra o Docker Desktop (ou inicie a máquina do Podman com «podman machine start») e clique em Atualizar.`,
    remoto:
      'Uma conexão remota foi ignorada (DOCKER_HOST, CONTAINER_HOST, um contexto ou uma conexão padrão): o WolfCore Dev só usa o mecanismo deste computador.',
    desdePath: 'Encontrado no PATH, não na pasta de instalação habitual.',
    version: (v: string) => `Versão ${v}`,
    vacio: 'Não há contêineres.',
    columnas: {
      nombre: 'Nome',
      imagen: 'Imagem',
      estado: 'Estado',
      puertos: 'Portas',
      compose: 'Compose',
      acciones: 'Ações',
    },
    estados: {
      corriendo: 'Em execução',
      detenido: 'Parado',
      pausado: 'Em pausa',
      otro: 'Outro',
    },
    codigoSalida: (n: number) => `código ${n}`,
    iniciar: 'Iniciar',
    detener: 'Parar',
    reiniciar: 'Reiniciar',
    registros: 'Registros',
    confirmarDetenerTitulo: 'Parar o contêiner?',
    confirmarDetener: (n: string) =>
      `«${n}» será parado. O que roda dentro dele é interrompido (o mecanismo espera alguns segundos para terminar). Nada é apagado.`,
    confirmarReiniciarTitulo: 'Reiniciar o contêiner?',
    confirmarReiniciar: (n: string) =>
      `«${n}» será reiniciado. O que roda dentro dele é interrompido e volta a iniciar. Nada é apagado.`,
    confirmar: 'Confirmar',
    cancelar: 'Cancelar',
    hecho: {
      iniciar: (n: string) => `«${n}» iniciado.`,
      detener: (n: string) => `«${n}» parado.`,
      reiniciar: (n: string) => `«${n}» reiniciado.`,
    },
    registroTitulo: (n: string) => `Registros de «${n}»`,
    registroEsperando: 'Aguardando linhas…',
    registroFin: 'O registro terminou (o contêiner parou ou o mecanismo interrompeu).',
    cerrar: 'Fechar',
  },
  versiones: {
    pestana: 'Versões',
    avisoMeilisearch:
      'Cada versão menor do Meilisearch tem seus próprios dados. Se mudar para outra versão menor (por exemplo, de 1.58 para 1.59), seus índices e a MEILISEARCH_KEY serão novos: será preciso reindexar e atualizar o .env dos seus projetos.',
    pestanaServicios: 'Serviços',
    elegirServicio: 'Serviço',
    servicios: {
      php: 'PHP',
      nginx: 'Nginx',
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      redis: 'Redis',
      mongodb: 'MongoDB',
      node: 'Node.js',
      python: 'Python',
      composer: 'Composer',
      mailpit: 'Mailpit',
      smtp4dev: 'smtp4dev',
      inbucket: 'Inbucket',
      papercut: 'Papercut SMTP',
      ollama: 'Ollama',
      meilisearch: 'Meilisearch',
      cloudflared: 'cloudflared',
      java: 'Java',
      dotnet: '.NET',
      go: 'Go',
      rust: 'Rust',
      bun: 'Bun',
      deno: 'Deno',
      zig: 'Zig',
      kotlin: 'Kotlin',
      dart: 'Dart',
    },
    ayuda: {
      instancias:
        'Cada versão principal (8.4, 17…) tem a sua instância, com a própria pasta de dados e porta: você pode ligar várias ao mesmo tempo. A estrela marca a que os novos projetos usam.',
      pool: 'Cada versão do PHP ligada tem o próprio PHP; a estrela marca a dos novos projetos.',
      unica: 'Você pode instalar várias versões, mas só uma fica ligada: ligar outra muda a ativa.',
      ninguno: 'Não há nada para ligar: os projetos usam a versão que pedem ou a padrão (estrela).',
    },
    filtroRama: 'Versão',
    todasRamas: 'Todas as versões',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: 'Mostrar todas',
    origen: {
      vivo: 'Online',
      cache: (h: number) => (h < 1 ? 'Cache de menos de 1 h atrás' : `Cache de ${h} h atrás`),
      fija: 'Lista offline',
    },
    actualizarLista: 'Atualizar lista',
    errorCarga: 'Não foi possível ler a lista de versões',
    vacio: 'Não há versões para mostrar.',
    soporte: { lts: 'LTS', actual: 'Atual', fin: 'Sem suporte', preview: 'Preview' },
    finSoporte: (f: string) => `Suporte até ${f}`,
    finSoportePasado: (f: string) => `Sem suporte desde ${f}`,
    marcas: {
      instalada: 'Instalada',
      encendida: 'Ligada',
      actualizacion: (v: string) => `Atualização: ${v}`,
      bloqueada: 'Bloqueada',
      sinHuella: 'Sem checksum publicado',
      huellaDebil: 'Somente checksum MD5',
      firmada: 'Com assinatura PGP',
    },
    ayudaFirmada:
      'A fonte oficial assina este download com PGP: o WolfCore Dev verifica a assinatura com as chaves fixadas no app antes de instalar.',
    ayudaSinHuella:
      'A fonte oficial não publica um checksum forte (SHA-256 ou SHA-512): o download não pode ser verificado.',
    instalar: 'Instalar',
    desinstalar: 'Desinstalar',
    encender: 'Ligar',
    apagar: 'Desligar',
    actualizar: 'Atualizar',
    usarEsta: 'Usar esta versão',
    usarEstaAyuda: (id: string) =>
      `${id} usa outra versão deste serviço: ela é trocada com backup prévio dos dados dela.`,
    predeterminada: 'Padrão para novos projetos',
    hacerPredeterminada: 'Usar para novos projetos',
    predeterminadaHecha: (v: string) => `${v} agora é a padrão.`,
    puerto: 'Porta',
    puertoDe: (id: string) => `Porta de ${id}`,
    cambiarPuerto: 'Mudar',
    puertoCambiado: (p: number) => `Porta alterada para ${p}.`,
    puertoProyectosTitulo: 'Projetos com a porta anterior',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `Estes projetos ainda usam a porta ${viejo} no .env deles (não foram alterados): ${lista}. Mude para ${nuevo}.`,
    resolver: 'Resolver',
    instalada: (v: string) => `${v} instalado.`,
    selector: { etiqueta: 'Instância', predeterminada: 'padrão', apagada: 'desligada' },
    dialogoSinHuella: {
      titulo: (v: string) => `Instalar ${v} sem checksum`,
      riesgo:
        'Esta versão não tem checksum publicado pela fonte oficial: o WolfCore Dev não consegue verificar se o arquivo baixado é o original.',
      explicacion:
        'O download continua sendo por HTTPS a partir do site oficial, mas, se esse site ou a conexão estivessem comprometidos, isso não seria percebido. Instale somente se precisar.',
      alternativa: (v: string) => `Há uma versão verificada do mesmo serviço: ${v}.`,
      casilla: 'Entendo o risco e quero instalar sem verificar',
      instalarVerificada: (v: string) => `Instalar ${v} (verificada)`,
      instalarIgual: 'Instalar sem verificar',
    },
    dialogoActualizar: {
      titulo: (n: string) => `Atualizar ${n}`,
      tituloRama: (v: string) => `Nova versão: ${v}`,
      ninguna: 'nenhuma',
      instancia: (id: string) => `A instância ${id} é atualizada. Antes de mudar qualquer coisa:`,
      pasoInstalar: (v: string) => `${v} é instalada ao lado da versão atual (que não é apagada);`,
      pasoVolcados: 'cada banco de dados é exportado (dump) com a versão atual;',
      pasoCopia: 'a pasta de dados completa é parada e copiada (cópia a frio);',
      pasoArrancar: 'ela é iniciada com a nova versão e verifica-se se responde;',
      pasoVuelta:
        'se não iniciar, volta à versão anterior com os dados dela e a cópia fica guardada.',
      datos: 'Dados:',
      respaldo: 'Cópia em:',
      espacio: 'Espaço:',
      espacioLibre: (libres: string, necesarios: string) =>
        `${libres} livres; são necessários ${necesarios}`,
      datosQuedan:
        'Os dados anteriores nunca são apagados: a cópia e os dumps ficam em Respaldos das atualizações até você apagá-los.',
      sinEspacio: 'Não há espaço suficiente para a cópia: libere espaço e tente de novo.',
      alLado: (v: string) =>
        `${v} é instalada. As demais versões instaladas não são tocadas; os projetos que fixam outra versão continuam usando-a.`,
      ramaExplicacion:
        'Uma nova versão principal não substitui a anterior: é criada uma nova instância com a própria pasta de dados e porta. A instância atual continua igual.',
      copiarDesdeTitulo: 'Dados da nova instância',
      copiarDesde: (id: string) =>
        `Copiar dados de ${id} (são exportados e restaurados; o original não é tocado)`,
      vacia: 'Começar vazia',
      ramaNota:
        'Os usuários do banco de dados não são copiados; os projetos devem apontar para a porta da nova instância.',
      crearInstancia: 'Criar nova instância',
      confirmar: 'Atualizar com backup',
      hecho: (v: string) => `${v} atualizado.`,
      fallo: 'Não foi possível atualizar',
      ramaCreada: (id: string) => `Instância ${id} criada.`,
      copiadas: (l: string) => `Copiados: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} não foi copiado: ${m}`,
    },
    limpieza: {
      boton: 'Limpar versões sem uso…',
      titulo: 'Limpar versões sem uso',
      intro:
        'Só são removidos os programas de versões que nada usa (a pasta bin). Os dados dos bancos, as instâncias e os seus projetos nunca são tocados.',
      cargando: 'Procurando versões…',
      vacia: 'Não há versões instaladas.',
      sinLibres: 'Todas as versões instaladas estão em uso: não há nada para limpar.',
      fallo: 'Não foi possível limpar',
      fallaLista: 'Não foi possível ler a lista de versões',
      bloqueada: 'Não pode ser marcada',
      marcadas: (n: number, tam: string) => `${n} ${n === 1 ? 'versão' : 'versões'} · ${tam}`,
      destinoTitulo: 'O que fazer com elas',
      papelera: 'Mover para a lixeira: ficam 7 dias e continuam ocupando disco até lá',
      definitivo: 'Apagar definitivamente: libera o espaço agora e não dá para desfazer',
      avisoDefinitivo:
        'Exclusão definitiva: para ter estas versões de novo será preciso baixá-las outra vez.',
      instantanea:
        'Com a exclusão definitiva, antes é guardada uma cópia da configuração do ambiente; na lixeira dá para recuperar.',
      entiendo: 'Entendo que não dá para desfazer',
      confirmar: (n: number) => `Remover ${n} ${n === 1 ? 'versão' : 'versões'}`,
      motivos: {
        predeterminada: 'É a predefinida',
        encendida: 'Está ligada ou em execução',
        sitio: 'Um projeto a usa',
        instancia: 'Uma instância a usa (mesmo desligada)',
        plantilla: 'Um modelo a usa',
        workspace: 'Um workspace a usa',
        runtime: 'Um projeto a usa',
        tarea: 'Um projeto com tarefas agendadas a usa',
        duda: 'Não deu para verificar: não é tocada',
        datos: 'Tem dados que só esta versão pode abrir',
        herramienta: 'O phpMyAdmin ou o Adminer a usa',
      },
      resultadoTitulo: 'Resultado',
      liberadas: (tam: string) => `${tam} liberados.`,
      enPapelera: (tam: string) => `${tam} estão na lixeira (apagados após 7 dias).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `${n} ${n === 1 ? 'versão já saiu de bin mas ficaram restos' : 'versões já saíram de bin mas ficaram restos'} que serão tentados de novo ao abrir o aplicativo.`,
      instantaneaGuardada: 'Cópia do ambiente guardada antes de apagar.',
      ajeno: (lista: string) =>
        `Traz o que foi instalado dentro dela: ${lista}. Ao removê-la, isso se perde.`,
      incluirAjeno: 'Remover mesmo perdendo isso',
      sinCatalogo: 'Já não está no catálogo: se removê-la, não poderá baixá-la de novo.',
      papeleraTitulo: 'Na lixeira',
      recuperar: 'Recuperar',
      recuperada: (v: string) => `${v} recuperada.`,
      borradaEl: (f: string) => `Apagada em ${f}`,
      fallaRecuperar: 'Não foi possível recuperar',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `Desinstalar ${v}`,
      binario: 'Somente os programas desta versão são removidos.',
      instancia: (id: string) =>
        `A instância ${id} a usa: ela é parada e removida da lista de instâncias.`,
      datosQuedan:
        'Os dados dela ficam no disco: se você instalar esta versão de novo, a instância os abre outra vez.',
      borrarDatos: 'Apagar também os dados',
      borrarAviso: (id: string) =>
        `A pasta de dados de ${id} será apagada com todos os bancos. Não é possível desfazer. Digite "${id}" para confirmar.`,
      escriba: (id: string) => `Digite ${id} para confirmar`,
      desinstalar: 'Desinstalar',
      desinstalarYBorrar: 'Desinstalar e apagar dados',
      unica:
        'É a versão ativa: se for a única instalada, pode ser removida com o serviço desligado (fica não instalada); se houver outras, escolha antes outra como ativa (estrela).',
      predeterminada: (id: string) =>
        `${id} é a instância padrão: Bancos de dados, o bloco .env e as ferramentas que usam o mecanismo passarão a outra instância (com outra porta).`,
      hecho: (v: string) => `${v} desinstalado.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `Resolver ${id}`,
      explicacion:
        'Uma atualização falhou e não foi possível devolver os dados desta instância, então ela não liga até você escolher o que fazer. Nada é apagado.',
      fallida: 'Dados afetados:',
      respaldo: 'Backup:',
      opciones: 'O que fazer',
      devolver: (sello: string, tam: string) =>
        `Devolver o backup ${sello} (${tam}); a pasta atual é separada, não apagada`,
      usarActual: 'Usar a pasta de dados atual como está',
      notaActual:
        'Somente se a pasta atual tiver dados completos; se não tiver, escolha um backup.',
      notaDevolver: 'O backup é copiado, verificado e só então colocado no lugar.',
      escriba: (id: string) => `Digite ${id} para confirmar`,
      elegirVersion:
        'A marca de bloqueio não pôde ser lida: escolha com qual versão os dados serão abertos (a de antes da atualização).',
      version: 'Versão',
      confirmar: 'Resolver',
      hecho: (id: string) => `${id} desbloqueada. Já pode ligá-la.`,
    },
    respaldos: {
      titulo: 'Respaldos das atualizações',
      descripcion:
        'Cópias deixadas pelas atualizações e pelas novas versões. A pasta de dados que cada instância usa nunca aparece aqui.',
      vacio: 'Não há cópias.',
      tipos: {
        respaldo: 'Cópia a frio',
        volcados: 'Dumps dos bancos',
        fallida: 'Dados de uma versão que falhou',
        restaurando: 'Devolução incompleta',
        copia: 'Dumps para uma nova versão',
      },
      archivos: (n: number) => (n === 1 ? '1 arquivo' : `${n} arquivos`),
      borrar: 'Apagar',
      borrarDe: (n: string) => `Apagar ${n}`,
      confirmarTitulo: 'Apagar cópia',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam}) será apagado. Não é possível desfazer. Os dados que as instâncias usam não são tocados.`,
      borrado: 'Cópia apagada.',
    },
  },
  navGrupos: {
    trabajo: 'Trabalho',
    entorno: 'Ambiente',
    utilidades: 'Utilitários',
  },
  avisos: {
    campana: 'Avisos',
    campanaConNuevos: (n: number) => `Avisos: ${n} não lidos`,
    titulo: 'Central de avisos',
    vacio:
      'Não há avisos. Aqui aparecerão as quedas de serviços, as portas ocupadas e os certificados prestes a vencer.',
    marcarTodos: 'Marcar tudo como lido',
    limpiar: 'Limpar histórico',
    ver: 'Ver',
    actualizar: 'Atualizar',
    verVersiones: 'Ver versões',
    cerrar: 'Fechar',
    niveles: { info: 'Informação', aviso: 'Aviso', error: 'Erro' },
    sinLeer: 'Não lido',
  },
  memoria: {
    boton: 'Memória',
    tituloBoton: 'Otimizar a memória',
    titulo: 'Otimizador de memória',
    intro:
      'Escolha um modo e revise a lista. Nada é fechado nem parado até você confirmar, e nunca roda sozinho.',
    modo: 'Modo',
    modos: { liviano: 'Leve', moderado: 'Moderado', profundo: 'Profundo' },
    descripciones: {
      liviano:
        'Só limpa o cache da sessão do aplicativo: libera disco, não RAM. Não para nem fecha nada.',
      moderado:
        'Também oferece deixar um único trabalhador do PHP e parar serviços do WolfCore Dev sem atividade nem conexões. Os serviços começam desmarcados.',
      profundo:
        'Também lista seus programas que mais usam memória para pedir que fechem a janela. Começam desmarcados.',
    },
    ver: 'Ver a lista',
    revisando: 'Verificando…',
    vacio: 'Não há nada para liberar neste modo.',
    tipos: {
      'cache-app': 'Limpar cache',
      'reducir-pool': 'Deixar um único trabalhador',
      'detener-inactivo': 'Parar (sem atividade)',
      'cerrar-programa': 'Pedir que feche a janela',
    },
    caches: {
      sesion: 'Cache HTTP da sessão do aplicativo',
    },
    estimado: (cantidad: string) => `Seriam liberados cerca de ${cantidad} de RAM`,
    estimadoDisco: (cantidad: string) => `E cerca de ${cantidad} de disco (o cache não é RAM)`,
    marcadas: (n: number, total: number) => `${n} de ${total} marcadas`,
    sinDatos:
      'Ainda não há dados de atividade suficientes para propor parar serviços ou reduzir o PHP. Deixe o Início aberto por alguns minutos e olhe de novo.',
    listadoFallido:
      'Não foi possível ler a lista de programas abertos: esta lista pode estar incompleta. Tente de novo.',
    avisoDetener:
      'Os serviços sem atividade começam desmarcados: parar um corta o que o usa. Só aparecem os que não têm conexões agora.',
    avisoCerrar:
      'Aos programas só se pede que fechem a janela, como ao clicar no X: eles podem perguntar se você quer salvar. Nunca se força nem se encerra um programa.',
    protegidos:
      'Nunca aparecem programas do sistema, serviços do Windows, programas elevados, de outros usuários, FlyEnv, PhpWebStudy nem WolfCore Dev (nem o que eles iniciam).',
    aplicar: 'Aplicar o marcado',
    confirmarTitulo: 'Aplicar estas ações?',
    confirmarTexto: (n: number) =>
      n === 1 ? 'Será feita 1 ação da lista.' : `Serão feitas ${n} ações da lista.`,
    confirmarCerrar: (nombres: string) => `Será pedido que fechem a janela: ${nombres}.`,
    confirmarDetener: (nombres: string) => `Estes serviços serão parados: ${nombres}.`,
    confirmar: 'Sim, aplicar',
    cancelar: 'Cancelar',
    resultadoTitulo: 'Resultado',
    liberado: (cantidad: string) => `Estimado: cerca de ${cantidad} de RAM liberados`,
    liberadoDisco: (cantidad: string) => `Além disso, cerca de ${cantidad} de disco`,
    notaPedido:
      'Aguardando o usuário: foi pedido que a janela fechasse e o programa continua aberto (talvez pergunte se você quer salvar). Não conta como liberado.',
    estados: {
      hecho: 'Feito',
      pedido: 'Aguardando o usuário',
      saltado: 'Ignorado',
      error: 'Falhou',
    },
    motivos: {
      no_en_plan: 'Não estava na lista',
      protegido: 'É um programa protegido',
      cambio: 'Mudou desde que a lista foi mostrada',
      sin_ventana: 'Já não tem uma janela para fechar',
      ya_apagado: 'Já não havia nada para reduzir',
      ocupado: 'Estava ocupado (tem conexões)',
      no_se_pudo: 'Não foi possível pedir o fechamento (o programa tem permissões elevadas)',
    },
    otraVez: 'Recomeçar',
  },
  guias: {
    tuneles: { titulo: 'Guia de túneis', copiar: 'Copiar o comando' },
    http: {
      buscar: 'Buscar por número, nome ou texto',
      familia: 'Família',
      todas: 'Todas',
      verMetodos: 'Métodos',
      verCodigos: 'Códigos de status',
      resultados: (n: number) => `${n} ${n === 1 ? 'resultado' : 'resultados'}`,
      vacio: 'Nada corresponde à busca.',
      seguro: 'Seguro',
      noSeguro: 'Não seguro',
      idempotente: 'Idempotente',
      noIdempotente: 'Não idempotente',
      noEstandar: 'Não padrão',
      broma: 'Código de brincadeira (RFC 2324)',
      causas: 'Causas comuns',
      solucion: 'Como resolver',
      ejemplo: 'Exemplo',
      copiarEjemplo: 'Copiar o exemplo',
      sinTraduccion: 'Sem tradução para este idioma: exibido em inglês.',
      familias: {
        '1xx': '1xx Informativos',
        '2xx': '2xx Sucesso',
        '3xx': '3xx Redirecionamento',
        '4xx': '4xx Erro do cliente',
        '5xx': '5xx Erro do servidor',
      },
    },
  },
  editorCodigo: {
    intro: (mb: number) =>
      `Editor leve com realce para arquivos de texto de até ${mb} MB. Escolha o arquivo no diálogo do sistema; salvar sempre pede confirmação e antes deixa uma cópia na pasta de dados do WolfCore Dev.`,
    abrir: 'Abrir arquivo…',
    abriendo: 'Abrindo…',
    guardar: 'Salvar',
    guardando: 'Salvando…',
    recargar: 'Recarregar do disco',
    vacio: 'Abra um arquivo para começar a editar.',
    sinCambios: 'Sem alterações',
    conCambios: 'Alterações não salvas',
    posicion: (linea: number, columna: number) => `Linha ${linea}, coluna ${columna}`,
    areaTexto: (nombre: string) => `Editor de código: ${nombre}`,
    salirTeclado: 'Para sair do editor pelo teclado, pressione Esc e depois Tab.',
    guardado: 'Arquivo salvo.',
    copiaPrevia: (ruta: string) => `Cópia prévia: ${ruta}`,
    cancelar: 'Cancelar',
    enlaceDuro:
      'Este arquivo tem mais de um nome no disco (link físico). Salvá-lo quebra esse link: os outros nomes ficam com o conteúdo anterior.',
    saltosMixtos: {
      aviso: 'Este arquivo mistura quebras de linha. Ao salvar, todas são normalizadas para LF.',
      aceptar: 'Aceito normalizar as quebras de linha',
    },
    envGestor: {
      aviso:
        'Os arquivos .env são editados nas variáveis do projeto, com o fluxo de segredos. O botão abre o .env da raiz do projeto, que pode não ser o arquivo que você tentou abrir.',
      boton: 'Abrir o .env da raiz do projeto',
    },
    huellaPerdida:
      'Salvo, mas não foi possível ler a nova impressão digital: o arquivo foi recarregado.',
    confirmarGuardar: {
      titulo: 'Salvar alterações',
      texto: (nombre: string) =>
        `${nombre} vai ser gravado. Antes, uma cópia do conteúdo atual do disco é guardada na pasta de dados do WolfCore Dev.`,
      boton: 'Salvar com cópia prévia',
    },
    refuerzo: {
      abrirTitulo: 'Arquivo sensível',
      guardarTitulo: 'Salvar um arquivo sensível',
      secreto:
        'Este arquivo parece conter segredos (chaves privadas, tokens ou credenciais). O conteúdo será exibido na tela.',
      datosReales:
        'Este arquivo é de um site marcado com dados reais. Uma alteração errada pode afetar informações de verdade.',
      instruccion: (nombre: string) => `Para continuar, digite o nome do arquivo: ${nombre}`,
      etiqueta: 'Nome do arquivo',
      abrirBoton: 'Abrir mesmo assim',
      guardarBoton: 'Salvar mesmo assim',
    },
    cambioExterno: {
      titulo: 'O arquivo mudou fora do editor',
      texto:
        'Outro programa o modificou depois que você o abriu, então nada foi salvo. Você pode recarregá-lo (suas alterações se perdem) ou sobrescrevê-lo com o que tem aqui.',
      recargar: 'Recarregar e descartar minhas alterações',
      sobrescribir: 'Sobrescrever…',
      sobrescribirTitulo: 'Sobrescrever o arquivo',
      sobrescribirTexto:
        'As alterações feitas pelo outro programa serão perdidas. O conteúdo atual dele ficará na cópia prévia.',
      sobrescribirBoton: 'Sim, sobrescrever',
      volver: 'Voltar',
    },
    descartar: {
      titulo: 'Alterações não salvas',
      texto: 'Há alterações não salvas no editor. Se continuar, elas se perdem.',
      confirmar: 'Descartar alterações',
      seguir: 'Continuar editando',
    },
    cm: {
      'Control character': 'Caractere de controle',
      'Selection deleted': 'Seleção removida',
      'Go to line': 'Ir para a linha',
      go: 'ir',
      Find: 'Localizar',
      Replace: 'Substituir',
      next: 'próxima',
      previous: 'anterior',
      all: 'todas',
      'match case': 'diferenciar maiúsculas',
      regexp: 'expressão regular',
      'by word': 'palavra inteira',
      replace: 'substituir',
      'replace all': 'substituir tudo',
      close: 'fechar',
      'current match': 'ocorrência atual',
      'on line': 'na linha',
      'replaced match on line $': 'ocorrência substituída na linha $',
      'replaced $ matches': '$ ocorrências substituídas',
      'folded code': 'código recolhido',
      unfold: 'expandir',
      to: 'a',
    },
  },
  limpiezaDisco: {
    intro:
      'Primeiro se analisa e se vê quanto ocupa cada item. Nada é apagado até você confirmar, e nunca roda sozinho nem em segundo plano.',
    analizar: 'Analisar',
    analizando: 'Analisando…',
    cancelarAnalisis: 'Cancelar',
    vacio: 'Não há nada para limpar.',
    categorias: {
      temp: {
        nombre: 'Arquivos temporários',
        ayuda:
          'Os da sua pasta TEMP com mais de 24 horas. São apagados definitivamente; se regeneram sozinhos.',
      },
      'cache-chrome': {
        nombre: 'Cache do Google Chrome',
        ayuda: 'Somente as pastas de cache de cada perfil; nunca cookies, senhas nem histórico.',
      },
      'cache-edge': {
        nombre: 'Cache do Microsoft Edge',
        ayuda: 'Somente as pastas de cache de cada perfil; nunca cookies, senhas nem histórico.',
      },
      'cache-brave': {
        nombre: 'Cache do Brave',
        ayuda: 'Somente as pastas de cache de cada perfil; nunca cookies, senhas nem histórico.',
      },
      'cache-firefox': {
        nombre: 'Cache do Firefox',
        ayuda: 'Somente a pasta cache2 de cada perfil; nunca cookies, senhas nem histórico.',
      },
      'wolfcore-descargas': {
        nombre: 'Downloads em cache do WolfCore Dev',
        ayuda: 'Pacotes compactados soltos que não são mais usados. Vão para a lixeira.',
      },
      'wolfcore-registros': {
        nombre: 'Registros do WolfCore Dev',
        ayuda: 'Registros com mais de 30 dias. Vão para a lixeira.',
      },
      prefetch: {
        nombre: 'Prefetch do Windows',
        ayuda:
          'Opcional. O Windows o regenera, mas exige executar o WolfCore Dev como administrador.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'Navegador aberto ou em segundo plano: feche-o por completo para limpar o cache (no Edge, desative também a inicialização rápida e as extensões em segundo plano)',
      'requiere-admin': 'Exige executar o WolfCore Dev como administrador',
      'ruta-vetada': 'Caminho protegido: não é limpo',
      'temp-no-seguro':
        'A variável TEMP aponta para uma pasta que não é a temporária do usuário (Documentos, uma unidade inteira, um caminho de rede…): não é limpa',
    },
    borradoDefinitivo: 'Apagados definitivamente (se regeneram sozinhos)',
    borradoPapelera: 'Vão para a lixeira do sistema',
    archivos: (n: number) => (n === 1 ? '1 arquivo' : `${n} arquivos`),
    carpetas: 'Por pasta',
    truncado: 'A análise parou no limite de arquivos: há mais do que o mostrado.',
    marcadas: (n: number, t: number) => `${n} de ${t} categorias marcadas`,
    total: (b: string) => `Seriam liberados cerca de ${b}`,
    limpiar: 'Limpar o marcado',
    confirmarTitulo: 'Limpar estas categorias?',
    confirmarTexto: (n: number) => `${n} categorias serão limpas.`,
    confirmarDefinitivo: 'TEMP e caches são apagados definitivamente (se regeneram sozinhos).',
    confirmarPapelera: 'Registros e downloads do WolfCore Dev vão para a lixeira.',
    confirmarPrefetch:
      'Prefetch: o Windows o regenera, mas as primeiras aberturas de programas podem ficar um pouco mais lentas.',
    confirmar: 'Sim, limpar',
    cancelar: 'Cancelar',
    detener: 'Parar a limpeza',
    resultadoTitulo: 'Resultado',
    liberado: (b: string) => `Liberado: ${b}`,
    enPapelera: (b: string) => `Disso, ${b} estão na lixeira (o espaço volta ao esvaziá-la).`,
    saltados: (n: number) => `${n} arquivos foram ignorados`,
    cancelado: 'Limpeza cancelada: o que já foi apagado continua apagado.',
    topeEjecucion:
      'Chegou-se ao limite de arquivos por execução: analise e limpe de novo para continuar.',
    registroFallido:
      'Não foi possível continuar escrevendo o registro da limpeza, então ela parou: o que foi apagado está anotado até esse ponto.',
    motivos: {
      'en-uso': 'Em uso',
      enlace: 'Link ou ponto de reanálise (não é seguido)',
      protegido: 'Protegido (.env, FlyEnv ou similar)',
      cambio: 'Mudou desde a análise',
      'sin-papelera': 'Não há lixeira disponível',
      ilegible: 'Não foi possível ler',
      error: 'Erro ao apagar',
    },
    verRegistros: 'Ver os registros',
    registroEn: (r: string) => `Registro desta limpeza: ${r}`,
    otraVez: 'Recomeçar',
    protegidas:
      'Nunca se toca: dados, backups, projetos, bancos nem arquivos .env. Links não são seguidos e nada fora dos caminhos desta lista é tocado.',
  },
  barra: {
    paleta: 'Buscar ou executar um comando',
    atajoPaleta: 'Ctrl+K',
    tema: 'Mudar tema',
    idioma: 'Mudar idioma',
  },
  preferencias: {
    titulo: 'Aparência e idioma',
    descripcion: 'As mudanças são aplicadas na hora e salvas neste computador.',
    tema: 'Tema',
    temas: { sistema: 'Sistema', claro: 'Claro', oscuro: 'Escuro' },
    idioma: 'Idioma',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français' },
    acento: 'Cor de destaque',
    acentos: {
      indigo: 'Índigo',
      azul: 'Azul',
      verde: 'Verde',
      violeta: 'Violeta',
      naranja: 'Laranja',
      rosa: 'Rosa',
    },
    acentoPropio: (color: string) => `Personalizada (${color})`,
    errorGuardar: 'Não foi possível salvar a preferência',
    asistente: 'Assistente de primeiro uso',
    asistenteAyuda:
      'Percorra de novo os passos iniciais: pasta de projetos, o básico, a CA, o GitHub e a pasta monitorada.',
    asistenteAbrir: 'Abrir o assistente',
  },
  paleta: {
    titulo: 'Paleta de comandos',
    placeholder: 'Busque uma tela, um serviço, um projeto ou uma ferramenta…',
    sinResultados: 'Nenhum comando corresponde à busca.',
    ayuda: '↑ ↓ para mover · Enter para executar · Esc para fechar',
    grupos: {
      navegacion: 'Ir para',
      servicios: 'Serviços',
      proyectos: 'Projetos',
      herramientas: 'Ferramentas',
      github: 'GitHub',
      general: 'Geral',
    },
    irA: (pantalla: string) => `Ir para ${pantalla}`,
    encender: (servicio: string) => `Ligar ${servicio}`,
    apagar: (servicio: string) => `Desligar ${servicio}`,
    iniciarTodo: 'Iniciar todos os serviços',
    detenerTodo: 'Parar todos os serviços',
    iniciarWorkspace: (n: string) => `Ligar o workspace ${n}`,
    detenerWorkspace: (n: string) => `Desligar o workspace ${n}`,
    abrirSitio: (nombre: string) => `Abrir ${nombre} no navegador`,
    traerCambios: (nombre: string) => `Trazer mudanças em ${nombre}`,
    irAServicio: (nombre: string) => `Ir ao serviço ${nombre}`,
    irAProyecto: (nombre: string) => `Ir ao projeto ${nombre}`,
    versionesDe: (nombre: string) => `Versões de ${nombre}`,
    abrirHerramienta: (nombre: string) => `Abrir ${nombre}`,
    clonar: 'Clonar um repositório do GitHub',
    agregarProyecto: 'Adicionar um projeto',
    nuevoProyecto: 'Criar um projeto novo',
    tema: (tema: string) => `Tema: ${tema}`,
    idioma: (idioma: string) => `Idioma: ${idioma}`,
    asistente: 'Abrir o assistente de primeiro uso',
  },
  nuevoProyecto: {
    titulo: 'Novo projeto',
    boton: 'Novo projeto',
    descripcion:
      'Crie um projeto do zero: a pasta, o site com HTTPS, o banco de dados e a conexão.',
    pasos: { tipo: 'Tipo', datos: 'Dados', resumen: 'Resumo', crear: 'Criando' },
    tipos: {
      laravel: { nombre: 'Laravel', descripcion: 'Com Composer; chave do app, banco e migrações.' },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: 'Appstarter oficial com seu .env.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'Framework clássico com database.php configurado.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: 'Esqueleto oficial (ou webapp) com seu .env.local.',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: 'Ambiente virtual, requirements.txt e processo uvicorn.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'Download oficial com wp-config.php pronto.' },
      estatico: {
        nombre: 'Site estático',
        descripcion: 'HTML e CSS servidos pelo Nginx, sem banco de dados.',
      },
    },
    campos: {
      nombre: 'Nome do projeto',
      nombrePlaceholder: 'mi-tienda',
      nombreAyuda: (dominio: string) => `Será ${dominio}: minúsculas, números e hifens.`,
      carpeta: 'Pasta pai',
      elegirCarpeta: 'Escolher pasta…',
      cambiarCarpeta: 'Trocar pasta…',
      carpetaAyuda:
        'O projeto é criado em uma pasta nova com o nome dele dentro desta. Deve estar vazia ou não existir.',
      php: 'Versão do PHP',
      python: 'Versão do Python',
      sinInstalada: 'Nenhuma instalada: instale em Serviços.',
      conBase: 'Criar um banco de dados para o projeto',
      sinBase: 'Sem banco de dados',
      instancia: 'Servidor do banco',
      apagada: 'desligada',
      apagadaAyuda: 'Esse servidor está desligado: ligue-o em Serviços antes de criar o projeto.',
      sinMotores: 'Nenhum servidor de banco de dados está instalado para este tipo de projeto.',
      nombreBase: 'Nome do banco',
      starterKit: 'Starter kit',
      starterKits: { ninguno: 'Nenhum', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: 'Incluir os pacotes web (webapp)',
      pgvector: 'Ativar pgvector (busca por vetores)',
    },
    huella: {
      titulo: 'O WordPress só publica uma impressão digital fraca',
      riesgo:
        'A impressão digital publicada é SHA-1, um algoritmo que já não é considerado seguro, e vem do mesmo site do arquivo.',
      explicacion:
        'Se esse site ou a conexão estivessem comprometidos, um download alterado passaria na verificação. O download continua sendo por HTTPS a partir de wordpress.org. Continue só se confiar nessa fonte.',
      leyendo: 'Lendo a impressão digital publicada…',
      noDisponible:
        'Não foi possível ler a impressão digital agora (sem conexão ou a fonte não respondeu); ela será lida de novo ao criar.',
      fuente: 'Origem: wordpress.org',
      casilla: 'Entendo que a impressão digital é fraca e quero criar o projeto mesmo assim',
    },
    resumen: {
      titulo: 'Isto será criado',
      intro: 'Revise antes de começar.',
      tipo: 'Tipo',
      carpeta: 'Pasta',
      sitio: 'Site',
      dominio: 'Domínio',
      https: 'Endereço com HTTPS',
      php: 'PHP',
      python: 'Python',
      base: 'Banco de dados',
      env: 'Conexão gravada em',
      nota: 'Se um passo falhar, nada é apagado: você verá o que foi criado e poderá tentar de novo.',
    },
    errores: {
      nombreVacio: 'Digite um nome para o projeto.',
      nombreInvalido:
        'O nome só pode ter minúsculas, números e hifens (até 40), sem começar nem terminar com hífen.',
      sinCarpeta: 'Escolha a pasta pai do projeto.',
      sinPhp: 'Escolha uma versão do PHP (instale uma em Serviços se não houver).',
      sinPython: 'Escolha uma versão do Python (instale uma em Serviços se não houver).',
      sinInstancia: 'Escolha o servidor onde criar o banco, ou desmarque o banco.',
      baseInvalida: 'O nome do banco não é válido para este motor.',
      motorNoVale: 'O WordPress precisa de MySQL ou MariaDB.',
      pgvectorMotor: 'O pgvector precisa de PostgreSQL.',
      huellaDebil: 'Confirme que entende que a impressão digital do WordPress é fraca.',
    },
    acciones: {
      cambiarCarpeta: 'Escolher outra pasta',
      cambiarBase: 'Trocar o nome do banco',
      cambiarNombre: 'Trocar o nome',
      reintentarPaso: 'Tentar o passo de novo',
      servicios: 'Ir para Serviços',
      confirmarHuella: 'Revisar a confirmação',
    },
    botones: {
      siguiente: 'Avançar',
      atras: 'Voltar',
      crear: 'Criar projeto',
      creando: 'Criando…',
      cerrar: 'Fechar',
      abrirEditor: 'Abrir no editor',
      verSitio: 'Ver o site',
      verProyecto: 'Ver em Projetos',
    },
    progreso: {
      titulo: 'Criando o projeto',
      listo: 'Projeto criado.',
      fallo: (paso: string) =>
        `O passo “${paso}” falhou. Nada foi apagado: tente o passo de novo ou corrija o problema e tente outra vez.`,
      quedo: (partes: string) => `Isto foi criado: ${partes}.`,
      quedoCarpeta: 'a pasta',
      quedoBase: (nombre: string) => `o banco ${nombre}`,
      quedoSitio: 'o site',
      avisos: 'Avisos',
      sinUsuarioPropio:
        'A criptografia do sistema não está disponível: o projeto usa a conexão do administrador do banco. Quando estiver, use "Usar usuário próprio" no gerenciador de .env.',
      editorFallo: 'Não foi possível abrir o editor.',
    },
  },
  importar: {
    boton: 'Importar…',
    titulo: 'Importar do Laragon, XAMPP ou Herd',
    intro:
      'Os sites são vinculados onde estão: nenhuma pasta é movida, copiada ou modificada. Se quiser, seus bancos de dados também são copiados. O WolfCore Dev só lê as instalações dos outros programas.',
    buscando: 'Procurando instalações…',
    nada: 'Laragon, XAMPP e Herd não foram encontrados nas pastas habituais.',
    errorVista: 'Não foi possível procurar o que pode ser importado',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: 'Sites',
      todos: 'Escolher todos',
      ninguno: 'Remover todos',
      dominio: (d: string) => `Domínio ${d}`,
      dominioPropuesto: (d: string) => `Domínio ${d} (sugerido)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP não determinado',
      base: (nombre: string, motor: string) => `Banco ${nombre} (${motor})`,
      yaVinculado: 'Já é um site do WolfCore Dev',
      dominioEnUso: 'Outro site já usa esse domínio',
    },
    avisos: {
      sin_dominio: 'Não tem domínio no outro programa: um é sugerido.',
      dominio_invalido: 'O domínio não é válido: um é sugerido.',
      sin_vhost: 'Não tem um host virtual próprio: um domínio é sugerido.',
      php_desconocido: 'Não se sabe qual versão do PHP usa: uma instalada é escolhida.',
      base_no_local: 'O banco está em outro servidor: não é importado.',
      base_nombre_invalido: 'O nome do banco não é válido: não é importado.',
      motor_no_soportado: 'O banco não é MySQL nem MariaDB: não é importado.',
    },
    problemas: {
      titulo: (n: number) =>
        `${n} ${n === 1 ? 'item foi descartado ou não pôde' : 'itens foram descartados ou não puderam'} ser lido${n === 1 ? '' : 's'}`,
    },
    bases: {
      titulo: 'Bancos de dados',
      importarBases: 'Importar também os bancos de dados',
      ayuda:
        'Ligue o servidor de bancos de dados do outro programa antes de continuar: o WolfCore Dev não liga nem desliga programas alheios. A senha é usada só nesta importação e não é salva.',
      destino: 'Servidor de destino',
      apagada: 'desligado',
      sinMotores:
        'MySQL e MariaDB não estão instalados: instale-os em Serviços para importar bancos.',
      puerto: 'Porta do servidor de origem',
      usuario: 'Usuário',
      clave: 'Senha',
      claveAyuda: 'Deixe em branco se o usuário não tem senha (como o root no Laragon ou XAMPP).',
      existe: 'já existe no destino',
      reemplazar: 'Substituir (antes é feita uma cópia)',
      noSeToca: 'Não é alterado se você não marcar.',
    },
    pasos: { elegir: 'Escolher', confirmar: 'Confirmar' },
    continuar: 'Continuar',
    volver: 'Voltar',
    cancelar: 'Cancelar',
    importar: 'Importar',
    cerrar: 'Fechar',
    sinSeleccion: 'Escolha pelo menos um site.',
    origenIncompleto: 'Informe a porta e o usuário do servidor de origem.',
    confirmar: {
      titulo: 'Confirme a importação',
      sitios: (n: number) =>
        `${n} ${n === 1 ? 'site será vinculado' : 'sites serão vinculados'} na pasta atual. Nenhum arquivo é movido, copiado ou modificado.`,
      sinConfianza:
        'Nenhum site importado executa receitas até que você marque “Confio neste repositório”.',
      hosts:
        'O Nginx e o arquivo hosts serão atualizados (o Windows pode pedir permissão de administrador).',
      basesNuevas: (nombres: string) => `Estes bancos serão copiados: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `Estes bancos já existem e serão substituídos: ${nombres}. Antes é salva uma cópia de cada um.`,
      basesSinTocar: (nombres: string) =>
        `Estes bancos já existem e não serão alterados: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `Serão exportados do servidor do outro programa (127.0.0.1:${puerto}, usuário ${usuario}). Ele só é lido, nunca modificado.`,
      sinBases: 'Nenhum banco de dados será importado.',
      proteccion:
        'A estrutura de cada banco é verificada antes e os dados entram com um usuário limitado: se algo falhar, o banco fica como estava.',
    },
    resultado: {
      titulo: 'Resultado da importação',
      importando: 'Importando…',
      cancelar: 'Cancelar importação',
      restaurada:
        'O banco original foi recolocado automaticamente a partir da cópia: ficou como estava.',
      sitioOk: 'Importado',
      sitioFallo: 'Não importado',
      baseOk: (n: string) => `Banco ${n} importado`,
      baseFallo: (n: string) => `Banco ${n} não importado`,
      copiaPrevia: (ruta: string) => `Cópia do banco anterior: ${ruta}`,
      phpDistinto: (v: string) => `Foi usado o PHP ${v} (a versão original não está instalada).`,
      sinAplicar:
        'O Nginx ou o arquivo hosts não ficaram atualizados: veja o aviso em Projetos e tente de novo.',
      resumen: (s: number, b: number) =>
        `${s} ${s === 1 ? 'site importado' : 'sites importados'}, ${b} ${b === 1 ? 'banco importado' : 'bancos importados'}.`,
      errorImportar: 'Não foi possível importar',
    },
  },
  plantillas: {
    guardarComo: 'Salvar como modelo…',
    dialogo: {
      titulo: (nombre: string) => `Salvar “${nombre}” como modelo`,
      intro:
        'O modelo guarda a receita, os ajustes de PHP e Nginx, as extensões e o esquema do banco (só a estrutura, sem nenhuma linha). Nunca guarda senhas, chaves nem dados do banco.',
      nombre: 'Nome do modelo',
      nombrePlaceholder: 'Meu projeto base',
      conArchivos: 'Incluir também os arquivos do projeto',
      conArchivosAyuda: 'Sem isso, só a receita, os ajustes e o esquema são salvos.',
      siempre: 'Sempre ficam de fora',
      siempreLista:
        '.env e .env.*, vendor, node_modules, .git, .venv, logs, dumps e bancos em arquivo (*.sql, *.dump, *.sqlite), chaves e certificados (*.pem, *.key, *.crt…), wp-config.php e wolfcore.yml. Um arquivo que contenha uma chave ou uma senha também fica de fora.',
      extra: 'Excluir também (uma por linha)',
      extraAyuda: 'Nomes ou caminhos relativos ao projeto, por exemplo uploads ou public/build.',
      vista: 'O que será salvo',
      calculando: 'Calculando…',
      resumen: (archivos: number, tamano: string) => `${archivos} arquivos · ${tamano}`,
      fuera: (n: number) => `${n} deixados de fora`,
      sinArchivos: 'Só a receita, os ajustes e o esquema serão salvos; nenhum arquivo.',
      baseVolcado: (nombre: string, servidor: string) =>
        `Só a estrutura do banco ${nombre} (servidor ${servidor}) será salva, sem nenhuma linha.`,
      sinBase: 'O projeto não declara um banco de dados: nenhum esquema será salvo.',
      avisoMongodb: 'Este projeto usa MongoDB: o esquema (coleções e índices) não é salvo.',
      incluirDeTodosModos: 'Incluir mesmo assim',
      avisoIncluir: 'Se esse arquivo tiver uma chave de verdade, ela ficará dentro do modelo.',
      guardar: 'Salvar modelo',
      guardada: (nombre: string) => `Modelo “${nombre}” salvo.`,
      errorGuardar: 'Não foi possível salvar o modelo',
      errorVista: 'Não foi possível calcular a visualização',
      cancelar: 'Cancelar',
    },
    lista: {
      titulo: 'Meus modelos',
      ayuda:
        'Comece um projeto novo com a receita, os ajustes e o esquema (sem dados) de um que você já tem.',
      vacia: 'Ainda não há modelos. Salve um projeto como modelo pelo menu do cartão dele.',
      conArchivosEtiqueta: 'com arquivos',
      soloEsquema: 'receita e esquema',
      conBase: (motor: string) => `banco ${motor} sem dados`,
      borrarEtiqueta: (nombre: string) => `Apagar o modelo ${nombre}`,
      borrarTitulo: (nombre: string) => `Apagar o modelo ${nombre}?`,
      borrarTexto:
        'Só o modelo é apagado. Os projetos criados com ele e o projeto original não são tocados.',
      borrada: 'Modelo apagado.',
      errorBorrar: 'Não foi possível apagar o modelo',
      errorLista: 'Não foi possível ler os modelos',
      desde: (nombre: string) => `Modelo: ${nombre}`,
      avisoSinBase: 'Este modelo não tem banco de dados.',
      importadaEtiqueta: 'importado',
      avisoImportada:
        'O modelo vem de terceiros: o projeto é criado sem confiança e sem iniciar seus processos, e abrir o site executa o código dele. Revise os arquivos antes.',
      generadoresTitulo: 'Projetos do zero',
    },
  },
  env: {
    accion: 'Variáveis .env…',
    titulo: (nombre: string) => `.env de ${nombre}`,
    intro:
      'Os valores secretos aparecem mascarados. Um valor completo só aparece se você clicar em “Mostrar” nessa variável e volta a ficar oculto após 30 segundos. Antes de salvar, é feita uma cópia datada do .env atual.',
    noExiste: 'Este projeto ainda não tem um arquivo .env: ele será criado ao salvar.',
    tablaEtiqueta: 'Variáveis do .env',
    sinVariables: 'O .env não tem variáveis.',
    secretaEtiqueta: 'secreta',
    duplicadaEtiqueta: 'repetida',
    duplicadaAyuda:
      'Esta variável aparece mais de uma vez no .env: a última é mostrada e alterada.',
    soloLecturaEtiqueta: 'várias linhas',
    soloLecturaAyuda: 'Ocupa várias linhas: edite-a à mão no arquivo.',
    seQuitara: 'Será removida ao salvar',
    valorNuevo: 'Novo valor',
    valorNuevoDe: (clave: string) => `Novo valor de ${clave}`,
    valorDe: (clave: string) => `Valor de ${clave}`,
    vacio: '(vazio)',
    mostrar: 'Mostrar',
    ocultar: 'Ocultar',
    mostrarEtiqueta: (clave: string) => `Mostrar o valor de ${clave}`,
    ocultarEtiqueta: (clave: string) => `Ocultar o valor de ${clave}`,
    cambiar: 'Alterar',
    deshacer: 'Desfazer',
    deshacerEtiqueta: (clave: string) => `Desfazer a alteração de ${clave}`,
    quitar: 'Remover',
    quitarEtiqueta: (clave: string) => `Remover a variável ${clave}`,
    errorRevelar: 'Não foi possível mostrar o valor',
    agregarTitulo: 'Adicionar uma variável',
    agregarNombre: 'NOME',
    agregarValor: 'valor',
    agregar: 'Adicionar',
    nombreInvalido:
      'Use letras, números, sublinhado e ponto, sem começar por número, e que ainda não exista.',
    comparar: {
      titulo: 'Comparar com o arquivo de exemplo',
      sinEjemplo: 'O projeto não tem .env.example para comparar.',
      alDia: 'O .env tem as mesmas variáveis que o exemplo.',
      faltan: (n: number) => `Faltam ${n}:`,
      sobran: (n: number) => `Sobram ${n} (não estão no exemplo):`,
      distintas: (n: number) => `${n} com valor diferente do exemplo:`,
      agregarFaltantes: 'Adicionar as que faltam',
    },
    bloques: {
      titulo: 'Adicionar um bloco de variáveis',
      ayuda:
        'Adiciona só as variáveis desse tema que faltam no .env (as que já existem não são alteradas), sem senhas nem chaves; preencha-as depois na tabela.',
      bd: 'Banco de dados',
      correo: 'E-mail',
      ia: 'IA',
      redis: 'Redis',
      meilisearch: 'Meilisearch (com a chave)',
    },
    usuarioPropio: {
      titulo: 'Usar usuário próprio',
      ayuda:
        'Cria um usuário do banco só para este projeto (com permissões apenas sobre o seu banco, nunca de administrador) e o grava no .env. Hoje funciona com o MySQL e o MariaDB do WolfCore Dev.',
      confirmarTitulo: 'Usar um usuário próprio para o banco?',
      confirmarTexto:
        'É criado um usuário novo com uma senha aleatória, com permissões só sobre o banco deste projeto, e o usuário e a senha da conexão no .env são alterados. Antes é salva uma cópia do .env atual; a senha nova fica no .env do projeto e criptografada no WolfCore Dev.',
      confirmar: 'Criar e usar',
      hecho: (usuario: string) => `O projeto agora usa o usuário ${usuario}.`,
      compartirTitulo: 'Compartilhar o usuário de outro projeto?',
      compartirTexto: (base: string, proyecto: string) =>
        `O banco ${base} também é usado por ${proyecto}. Compartilhar o usuário dele? Este projeto usará o mesmo usuário e a mesma senha; a senha não muda, então ${proyecto} continua conectado.`,
      compartir: 'Compartilhar o usuário',
      error: 'Não foi possível alterar o usuário do banco',
    },
    copias: {
      titulo: 'Voltar a uma cópia',
      ninguna: 'Ainda não há cópias deste .env.',
      volver: 'Voltar a esta cópia',
      confirmarTitulo: 'Voltar a uma cópia do .env?',
      confirmarTexto: (fecha: string) =>
        `O .env atual é substituído pela cópia de ${fecha}. Antes é salva outra cópia do atual, então isso também pode ser desfeito.`,
      hecho: 'Voltou à cópia.',
      error: 'Não foi possível voltar à cópia',
    },
    cambiosPendientes: (n: number) => `${n} alterações não salvas`,
    descartar: 'Descartar alterações',
    guardar: 'Revisar e salvar…',
    cerrar: 'Fechar',
    cerrarTitulo: 'Fechar sem salvar?',
    cerrarTexto: (n: number) => `Há ${n} alterações não salvas. Se fechar, elas se perdem.`,
    cerrarDescartar: 'Fechar e descartar',
    seguirEditando: 'Continuar editando',
    confirmar: {
      titulo: 'Salvar as alterações do .env',
      texto:
        'Isto é o que vai mudar. Os valores secretos aparecem mascarados. É salva uma cópia datada do .env atual e o arquivo é escrito de uma só vez.',
      sinCambios: 'Não há alterações para salvar.',
      agregarGitignore: 'Adicionar .env ao .gitignore do projeto',
      aceptarVersionado: 'Entendo o risco e quero salvar mesmo assim',
      guardar: 'Salvar alterações',
      versionado:
        'O git já acompanha o .env deste projeto: o próximo commit enviaria seus valores mesmo estando no .gitignore. Tire-o do índice com git rm --cached .env.',
      versionadoDesconocido:
        'Não foi possível verificar se o git acompanha o .env deste projeto; confirme à parte para salvar.',
    },
    errorVistaPrevia: 'Não foi possível preparar a pré-visualização',
    errorGuardar: 'Não foi possível salvar o .env',
    guardado: 'O .env foi salvo.',
    guardadoConCopia: 'O .env foi salvo; a versão anterior ficou como cópia.',
  },
  asistenteInicio: {
    titulo: 'Bem-vindo ao WolfCore Dev',
    subtitulo:
      'Cinco passos para deixar o ambiente pronto. Nada é instalado nem alterado até você clicar no botão de cada passo.',
    paso: (n: number, total: number) => `Passo ${n} de ${total}`,
    anterior: 'Anterior',
    siguiente: 'Próximo',
    omitirTodo: 'Pular o assistente',
    terminar: 'Concluir',
    hecho: 'Feito',
    reabrir: 'Você pode abri-lo de novo em Configurações.',
    pasos: {
      carpeta: {
        titulo: 'Pasta de projetos',
        texto:
          'Onde você guarda os seus projetos. É lá que os novos repositórios são clonados e é a pasta monitorada no último passo.',
        elegir: 'Escolher pasta',
        actual: (ruta: string) => `Pasta escolhida: ${ruta}`,
        guardada: (ruta: string) => `Pasta atual: ${ruta}`,
        ninguna: 'Sem escolher: usa-se C:\\Proyectos se existir.',
      },
      basicos: {
        titulo: 'Instalar o básico',
        texto:
          'Nginx, PHP 8.4, Composer e Node LTS a partir das fontes oficiais, com o checksum verificado. Cada um é instalado somente ao clicar no botão dele.',
        instalado: 'Instalado',
        instalar: (version: string) => `Instalar ${version}`,
        sinVersion: 'Sem versão no catálogo',
        cargando: 'Buscando versões…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: 'Confiar na autoridade local',
        texto:
          'Para que os sites .test abram por HTTPS sem avisos, o Windows deve confiar na autoridade do WolfCore Dev. O Windows vai pedir confirmação.',
        confiar: 'Confiar na CA',
        confiada: 'O Windows já confia na autoridade local.',
      },
      github: {
        titulo: 'Conectar o GitHub',
        texto:
          'Para ver os seus repositórios e cloná-los com um clique. Use a sessão do GitHub CLI ou um token pessoal, que é guardado criptografado neste computador.',
      },
      vigilar: {
        titulo: 'Monitorar a pasta',
        texto:
          'O WolfCore Dev vai sugerir montar cada pasta nova que aparecer na pasta de projetos. Nada é montado sem a sua confirmação.',
        activar: 'Monitorar esta pasta',
        activa: (ruta: string) => `Monitorando ${ruta}`,
        sinCarpeta: 'Escolha primeiro a pasta de projetos (passo 1).',
      },
    },
  },
  /** Resultado de importar o exportar un perfil (D26). */
  perfiles: {
    pantalla: {
      titulo: 'Backup e perfis',
      descripcion:
        'Um perfil leva o seu ambiente para outro computador: sites, versões, instâncias, modelos e ajustes. Nunca leva chaves, tokens nem senhas.',
      aislado: {
        titulo: 'Pasta de teste',
        texto: (ruta: string) =>
          `O WolfCore Dev está usando uma pasta de dados de teste (${ruta}). O que você fizer aqui não toca na sua pasta real nem no seu computador: o arquivo hosts não é gravado e nenhum certificado é instalado.`,
      },
      exportar: {
        titulo: 'Exportar o ambiente',
        texto:
          'Salva um arquivo .wolfperfil com seus sites, versões, instâncias, modelos e ajustes.',
        bases: 'Incluir os bancos de dados',
        basesAyuda:
          'Os dumps completos (com os dados dos seus clientes) viajam criptografados com a frase.',
        ca: 'Incluir a autoridade certificadora (CA)',
        caAyuda: 'Vai criptografada com a frase. Importe-a só em um computador seu.',
        certificados: 'Incluir os certificados dos sites',
        certificadosAyuda: 'Só viajam junto com a CA e criptografados com ela.',
        frase: 'Frase',
        fraseRepetir: 'Repetir a frase',
        fraseAyuda: (minimo: number) =>
          `Pelo menos ${minimo} caracteres. Sem ela não é possível recuperar os bancos nem a CA, e ela não é guardada em lugar nenhum.`,
        problemas: {
          frase_corta: (minimo: number) => `A frase deve ter pelo menos ${minimo} caracteres.`,
          frase_distinta: 'As duas frases não coincidem.',
          certificados_sin_ca: 'Os certificados só viajam junto com a CA.',
        },
        exportar: 'Exportar perfil…',
        nota: 'O perfil nunca leva chaves, tokens nem senhas, nem os instantâneos, a lixeira, os backups ou a pasta data.',
        listo: 'Perfil exportado',
        guardado: (archivo: string, tamano: string) => `Salvo em ${archivo} (${tamano}).`,
      },
      importar: {
        titulo: 'Importar um perfil',
        texto:
          'Escolha um arquivo .wolfperfil. Antes de mudar qualquer coisa você verá tudo o que é substituído, removido ou fica pendente, e é guardada uma cópia do que é substituído.',
        boton: 'Importar perfil…',
      },
      instantaneas: {
        titulo: 'Instantâneos do ambiente',
        texto:
          'Antes de atualizar o PHP ou o Nginx e antes de importar um perfil, o WolfCore Dev guarda uma cópia da sua configuração, do Nginx e dos php.ini, sem chaves nem dados e só para você. Os 10 últimos são mantidos.',
        compartidas:
          'Os 10 são compartilhados entre todos os motivos: ao tirar um novo, o mais antigo é substituído, inclusive se foi manual.',
        tomar: 'Tirar um agora',
        tomada: 'Instantâneo salvo.',
        sinNada: 'Ainda não há nada para copiar.',
        vacia: 'Ainda não há instantâneos.',
        motivos: {
          actualizar: 'Antes de atualizar',
          'importar-perfil': 'Antes de importar um perfil',
          'limpiar-versiones': 'Antes de limpar versões',
          manual: 'Manual',
        },
      },
    },
    reasignar: {
      titulo: 'Pastas dos sites',
      texto:
        'Estas pastas vêm do outro computador. Procure onde elas estão neste ou importe o site como pendente: ele fica sem pasta até você escolher uma.',
      sitio: 'Site',
      origen: 'Pasta no perfil',
      destino: 'Pasta neste computador',
      existe: 'Existe',
      noExiste: 'Não existe neste computador',
      buscar: 'Procurar pasta…',
      cambiar: 'Mudar',
      comoPendiente: 'Importar mesmo assim como pendente',
      prefijo: (viejo: string, nuevo: string) =>
        `Usar a mesma mudança para os demais (${viejo} → ${nuevo})`,
      omitido: 'Não será importado',
    },
    asistente: {
      titulo: 'Importar um perfil',
      pasos: {
        archivo: 'Arquivo',
        revisar: 'Revisar',
        confirmar: 'Confirmar',
        resultado: 'Resultado',
      },
      archivo: {
        texto:
          'Escolha o arquivo .wolfperfil. Ainda nada muda: primeiro você verá o que será substituído, removido ou deixado pendente.',
        elegir: 'Escolher arquivo…',
        cambiar: 'Escolher outro',
        ninguno: 'Nenhum arquivo escolhido',
        leyendo: 'Lendo o perfil…',
        error: 'Não foi possível ler o perfil',
      },
      origen: (fecha: string, sistema: string) => `Criado em ${fecha} em ${sistema}.`,
      ignoradas: (n: number) => `${n} entradas do arquivo não são de um perfil e são ignoradas.`,
      reemplaza: {
        titulo: 'O que é substituído',
        ninguno: 'Não há dados nesta pasta: a importação é feita sobre uma instalação limpa.',
        copia:
          'Antes de substituir, é copiado para respaldos/pre-perfil-… e é tirado um instantâneo do ambiente; cada banco substituído tem seu próprio instantâneo. A pasta data nunca é apagada.',
        config: 'A configuração (config.json)',
        sitio: (id: string) => `O site ${id}`,
        base: (instancia: string, base: string) => `O banco ${base} (${instancia})`,
        plantilla: (id: string) => `O modelo ${id}`,
        ca: 'A autoridade certificadora (CA) deste computador',
      },
      versiones: {
        titulo: 'Versões',
        ninguna: 'O perfil não traz versões.',
        instalada: 'Já instalada',
        descargar: 'Será baixada com a impressão digital verificada',
        pendienteDebil: 'Pendente: sem impressão digital forte, instale-a manualmente',
        pendienteFuera: 'Pendente: não está mais no catálogo',
        huellas: {
          fuerte: 'Impressão digital SHA-256 ou SHA-512',
          firmada: 'Assinada',
          debil: 'Impressão digital fraca',
          ninguna: 'Sem impressão digital',
        },
        descargas: (n: number) =>
          `${n} versões serão baixadas de sites oficiais, cada uma com sua impressão digital ou assinatura verificada.`,
      },
      instancias: {
        titulo: 'Instâncias de bancos de dados',
        existente: 'Já existe: é mantida com sua porta e sua versão',
        nueva: (puerto: number) => `É criada com credenciais novas na porta ${puerto}`,
        reasignada: (de: number, a: number) => `A porta ${de} está ocupada: usará a ${a}`,
      },
      bases: {
        titulo: 'Bancos de dados',
        ninguna: 'O perfil não traz bancos.',
        texto:
          'São restaurados com um usuário limitado a cada banco e só com instruções permitidas. Os que já existem recebem backup antes.',
        omitir: 'Importar sem os bancos',
      },
      plantillas: {
        titulo: 'Modelos',
        existe: 'Já existe: é substituído',
        nueva: 'Novo',
      },
      workspaces: {
        titulo: 'Workspaces',
        texto:
          'Levam só referências a bancos de dados e serviços (os processos de projetos não viajam). São validados contra o que existe aqui e nunca iniciam sozinhos.',
        existe: 'Você já tem um com esse id: o seu é mantido',
        nuevo: 'Novo',
        elementos: (n: number) => (n === 1 ? '1 item' : `${n} itens`),
        invalidos: (n: number) => `${n} do perfil não são válidos e não serão importados.`,
      },
      quitado: {
        titulo: 'O que não é tomado da configuração',
        texto:
          'Esta pasta de dados está limpa: do perfil não é tomado o que aponta para fora deste computador.',
      },
      puertos: {
        titulo: 'Portas ocupadas',
        texto: (lista: string) =>
          `Estas portas do perfil já são usadas por outro programa neste computador: ${lista}. Mude-as em Serviços depois de importar.`,
      },
      ca: {
        titulo: 'Autoridade certificadora (CA)',
        texto:
          'O perfil traz uma CA criptografada. Importe-a só se for sua: este computador aceitaria os certificados que ela assinar.',
        huella: 'Impressão digital SHA-256 da CA do perfil',
        comparar: 'Compare-a com a do seu computador de origem antes de aceitá-la.',
        importar: 'Importar a CA do perfil',
        noImportar: 'Sem importá-la, este computador usa a CA atual ou cria uma nova.',
        ajena:
          'Esta CA tem restrições de nome que não são as do WolfCore Dev: não pode ser importada.',
        sinRestricciones:
          'Esta CA não tem restrições de nome: pode assinar certificados de qualquer site, inclusive de bancos e e-mail. Importe-a só se for sua e a impressão digital coincidir.',
        aceptarSin: 'Entendo o risco: é a minha CA e a impressão digital coincide',
        reemplazaLocal:
          'Este computador já tem uma CA. Importar a do perfil a substitui (fica uma cópia no backup anterior).',
        reemplazar: 'Substituir a CA deste computador',
        noSeInstala: 'A CA não é instalada sozinha no repositório de certificados do sistema.',
      },
      frase: {
        titulo: 'Frase do perfil',
        texto:
          'O perfil traz bancos ou a CA criptografados. Digite a frase que você escolheu ao exportá-lo.',
        campo: 'Frase',
        omitirBases: 'Importar sem os bancos',
        nota: 'A frase só é usada nesta janela: não é guardada e é apagada ao terminar ou ao fechar.',
      },
      env: {
        titulo: 'Conexão dos projetos',
        texto:
          'Marque os projetos cujo .env deve apontar para um novo usuário próprio do seu banco (com cópia prévia do .env). Os demais não são tocados e ficam informados.',
      },
      confirmar: {
        titulo: 'Confirmar a importação',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `Serão importados ${sitios} sites, ${versiones} versões e ${bases} bancos.`,
        importar: 'Importar',
        revisar: 'Revisar',
        volver: 'Voltar',
        bloqueos: {
          sitios_sin_carpeta:
            'Escolha a pasta de cada site ou marque-o para ser importado como pendente.',
          frase_requerida: 'Digite a frase do perfil ou importe sem os bancos.',
          ca_ajena: 'A CA do perfil não pode ser importada.',
          ca_sin_restricciones: 'Confirme à parte que quer importar uma CA sem restrições.',
          reemplazar_ca: 'Confirme à parte que quer substituir a CA deste computador.',
        },
      },
      progreso: 'Importando o perfil… Não feche a janela: com bancos ou downloads pode demorar.',
      fases: {
        copia: 'Copiando o que é substituído',
        versiones: 'Instalando versões',
        configuracion: 'Salvando a configuração e os sites',
        plantillas: 'Copiando modelos',
        ca: 'Preparando a CA e os certificados',
        bases: 'Restaurando bancos de dados',
        env: 'Reescrevendo os .env',
      },
      avance: (paso: number, de: number) => `Passo ${paso} de ${de}`,
      resultado: {
        titulo: 'Resultado da importação',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `${importados} importados, ${pendientes} pendentes, ${omitidos} omitidos e ${errores} com erro.`,
        respaldo: (ruta: string) => `Cópia do que foi substituído: ${ruta}`,
        pendientes: 'O que ficou pendente pode ser concluído manualmente.',
        error: 'Não foi possível importar o perfil',
        secciones: {
          sitios: 'Sites',
          versiones: 'Versões',
          instancias: 'Instâncias',
          bases: 'Bancos',
          plantillas: 'Modelos',
          workspaces: 'Workspaces',
          env: 'Arquivos .env',
          ca: 'CA',
        },
        estados: {
          importado: 'Importado',
          pendiente: 'Pendente',
          omitido: 'Omitido',
          error: 'Erro',
          instalada: 'Instalada',
          ya_instalada: 'Já estava',
          creada: 'Criada',
          existente: 'Já existia',
          puerto_reasignado: 'Porta reatribuída',
          reescrito: 'Reescrito',
          sin_marcar: 'Sem marcar',
        },
        ca: {
          importada: 'CA importada',
          nueva: 'Nova CA gerada',
          sin_cambios: 'A CA não mudou',
        },
        quitarCa: {
          boton: 'Remover a CA anterior…',
          titulo: 'Remover a CA anterior da confiança',
          texto:
            'A CA que este computador tinha antes será removida do repositório de certificados do sistema. O Windows pode pedir confirmação. A CA nova não é instalada sozinha.',
          si: 'Remover',
          hecho: 'CA anterior removida da confiança.',
        },
        descartadosWorkspace: (lista: string) => `Não existe aqui e foi removido: ${lista}`,
        workspacesInvalidos: (n: number) => `${n} workspaces inválidos não foram importados.`,
        puerto: (de: number, a: number) => `Porta ${de} → ${a}`,
        copiaEnv: (ruta: string) => `Cópia do .env: ${ruta}`,
      },
    },
    /** Aviso fuerte de la vista previa: la CA del perfil no tiene restricciones de nombre. */
    caSinRestricciones:
      'Esta CA pode assinar qualquer site; importe-a somente se for sua, compare a impressão digital.',
    motivos: {
      procesos_quitados: 'Os seus processos (comandos de outro computador) não foram importados.',
      tareas_quitadas:
        'As suas tarefas agendadas (comandos de outro computador) não foram importadas. Crie-as de novo ou adote-as a partir do wolfcore.yml.',
      tunel_con_nombre: 'O seu túnel com nome não viaja: volta ao túnel rápido.',
      php_ini: 'Alguns ajustes do php.ini não foram importados.',
      xdebug: 'O seu ajuste do Xdebug não era válido e foi removido.',
      nginx_desactivado:
        'As suas regras do Nginx ficam salvas mas sem aplicar: revise-as no editor.',
      carpeta_no_existe: 'A sua pasta não existe neste computador: procure-a.',
      correo_sin_proveedor: 'O seu provedor SMTP não foi importado: usa o capturador de e-mail.',
      sitio_invalido: 'O site não é válido.',
      dominio_invalido: 'O seu domínio não é válido (deve terminar em .test).',
      ruta_protegida: 'A sua pasta é do sistema ou do WolfCore Dev: não é importada.',
      dominio_en_uso: 'Outro site deste computador já usa esse domínio.',
      sitio_repetido: 'O site está repetido no perfil.',
      no_disponible: 'Essa versão já não está no catálogo.',
      huella_debil: 'Essa versão não tem uma impressão forte: instale-a à mão em Versões.',
      tope_descargas:
        'Não foi baixada para não fazer downloads demais de uma vez: instale-a em Versões.',
      instancia_pendiente: 'A sua instância ficou pendente.',
      motor_no_soportado: 'Esse motor não é importado de um perfil.',
      version_pendiente: 'A versão do motor ficou pendente.',
      danada: 'Os seus arquivos no perfil estão danificados.',
      bases_omitidas: 'Importado sem os bancos.',
      instancia_apagada: 'Não foi possível ligar a sua instância.',
      sin_copia_previa: 'Não foi possível tirar o instantâneo prévio: o banco não foi substituído.',
      sin_base: 'O seu .env não aponta para um banco local.',
      base_no_resuelta: 'Não se soube de qual instância é o seu banco.',
      error_inesperado: 'Algo falhou.',
    },
    avisos: {
      ca_reemplazada:
        'A CA anterior deste computador continua no repositório de confiança do sistema e já não é usada. Você pode removê-la daqui.',
      base_no_incluida: 'O banco {base} ({instancia}) não foi incluído.',
      sin_ca: 'Não há uma CA neste computador: o perfil vai sem ela.',
      ca_no_importada: 'A CA do perfil não foi importada: usa-se a deste computador ou uma nova.',
      certificados: 'Não foi possível preparar os certificados: {detalle}',
      aplicar:
        'Os sites importados não ficaram aplicados por completo (Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'Provedor de IA {id}: usa uma URL própria.',
      smtp: 'Provedor SMTP {id}: o host não é de um provedor conhecido ou falta o usuário.',
      puerto: 'Porta de {id}: fora do intervalo, volta à padrão.',
      carpeta_vigilada: 'A pasta vigiada é de outro computador.',
    },
  },
};
