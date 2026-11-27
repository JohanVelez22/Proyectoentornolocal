/**
 * 한국어 UI 텍스트 (ko-KR). es.ts와 동일한 키와 함수 시그니처를 유지합니다.
 * 고정 용어집: 서비스, 인스턴스, 사이트, 터널, 백업, 알림; Doctor 및 WolfCore Dev는
 * 번역하지 않습니다. 격식체(합니다체) 사용; Git 외에는 '브랜치' 대신 '버전'을 사용합니다.
 */
import type { Textos } from './es';

const plural = (n: number, texto: string): string => `${n}${texto}`;

export const ko: Textos = {
  app: {
    nombre: 'WolfCore Dev',
    lema: '간편한 PHP 및 Nginx 개발 환경',
    version: '버전',
  },
  nav: {
    inicio: '홈',
    proyectos: '프로젝트',
    agentes: '에이전트',
    servicios: '서비스',
    basesDeDatos: '데이터베이스',
    correo: '메일',
    php: 'PHP',
    ia: 'AI',
    tuneles: '터널',
    contenedores: '컨테이너',
    herramientas: '도구',
    doctor: 'Doctor',
    depuracion: '디버깅',
    registros: '로그',
    ajustes: '설정',
    contraer: '메뉴 접기',
    expandir: '메뉴 펼치기',
  },
  resumenGlobal: {
    servicios: (n: number) => plural(n, '개 서비스 실행 중'),
    tuneles: (n: number) => plural(n, '개 터널 활성'),
    cargando: '코어에 연결 중…',
    conErrores: '오류 있음',
    sinConexion: '코어와 연결되지 않음',
  },
  estado: {
    encendido: '실행 중',
    apagado: '중지됨',
    iniciando: '시작 중…',
    error: '오류',
    externo: '외부',
    activo: '활성',
    aviso: '알림',
  },
  acciones: {
    encender: '시작',
    apagar: '중지',
    iniciarTodo: '모두 시작',
    detenerTodo: '모두 중지',
    abrir: '열기',
    copiar: '복사',
    copiado: '클립보드에 복사되었습니다',
    guardar: '저장',
    cerrar: '닫기',
    abrirCarpeta: '폴더 열기',
    instalar: '설치',
    reintentar: '다시 시도',
    cancelar: '취소',
    borrar: '삭제',
    editar: '편집',
    duplicar: '복제',
    renovar: '갱신',
    masAcciones: '추가 작업',
    actualizar: '업데이트',
    quitar: '제거',
    reinstalar: '재설치',
  },
  errores: {
    titulo: '작업을 완료할 수 없습니다',
    arranque: '환경 상태를 읽을 수 없습니다',
    desconocido: '예기치 않은 오류가 발생했습니다.',
    /** 코어가 오류 내부에 코드로 전달하는 세부 정보입니다. */
    detalles: {
      'sintaxis.comillas_sin_cerrar': '닫히지 않은 따옴표가 있습니다',
      'sintaxis.tras_comillas': '따옴표 뒤에 공백 또는 ";"이 필요합니다',
      'sintaxis.punto_y_coma_inesperado': '지시문 없이 ";"이 사용되었습니다',
      'sintaxis.llave_inesperada': '지시문 없이 "{"가 사용되었습니다',
      'sintaxis.falta_punto_y_coma': '지시문 끝에 ";"이 누락되었습니다',
      'sintaxis.sobra_llave': '불필요한 "}"가 있습니다',
      'sintaxis.falta_llave': '"}"가 누락되었습니다',
    },
    codigos: {
      'git.cambios_locales':
        '폴더에 저장되지 않은 변경 사항이 있습니다. 변경 사항을 가져오기 전에 커밋하거나 취소하십시오. 아무것도 변경되지 않았습니다.',
      'git.divergencia':
        '브랜치가 원격 브랜치와 분기되었습니다(로컬 커밋과 원격 커밋이 서로 다릅니다). 직접 해결하십시오. 아무것도 변경되지 않았습니다.',
      'git.sin_upstream':
        '현재 브랜치가 원격 브랜치를 추적하고 있지 않아 변경 사항을 가져올 수 없습니다.',
      'git.sin_rama': '저장소가 분리된 커밋 상태(브랜치 없음)입니다. 아무것도 변경되지 않았습니다.',
      'git.no_repositorio': '해당 폴더는 git 저장소가 아닙니다.',
      'git.destino_no_vacio': '대상 폴더가 비어 있지 않습니다.',
      'git.destino_es_archivo': '대상이 폴더가 아니라 파일입니다.',
      'git.no_encontrado': 'git을 찾을 수 없습니다. 먼저 설치하십시오.',
      'git.gh_no_encontrado': 'GitHub CLI(gh)를 찾을 수 없습니다. 먼저 설치하십시오.',
      'git.plazo': '복제 작업이 제한 시간({minutos}분)을 초과하여 취소되었습니다.',
      'git.token_invalido': 'GitHub 토큰이 올바르지 않습니다.',
      'git.url_con_credenciales':
        'URL에 사용자 이름이나 비밀번호를 포함하지 마십시오. 토큰을 별도로 사용하십시오.',
      'servicios.desconocido': '알 수 없는 서비스입니다: {id}.',
      'servicios.no_instalado': '{nombre} 서비스가 설치되어 있지 않습니다. 서비스 메뉴에서 설치하십시오.',
      'servicios.puerto_invalido': '포트는 1024에서 65535 사이의 숫자여야 합니다.',
      'servicios.puerto_asignado': '포트 {puerto}은(는) 이미 {otro}에 할당되어 있습니다.',
      'servicios.puerto_ocupado':
        '포트 {puerto}을(를) {nombre}(PID {pid})이(가) 사용 중입니다. 해당 프로세스를 종료하거나 다른 포트를 선택하십시오.',
      'servicios.confirmacion_borrado': '{nombre}의 데이터를 삭제하려면 "{id}"을(를) 입력하십시오.',
      'servicios.ftp_no_disponible': 'FTP 서버를 사용할 수 없습니다.',
      'sistema.sin_cliente_ftp':
        '이 컴퓨터에 연결된 FTP 클라이언트가 없습니다. 클라이언트(예: FileZilla)를 설치하거나 주소를 복사하십시오.',
      'servicios.mailpit_no_responde': 'Mailpit이 응답하지 않습니다. 서비스 메뉴에서 시작하십시오.',
      'servicios.iniciar_todo_fallos':
        '모두 시작 중 다음 서비스를 시작하지 못했습니다: {nombres}. 서비스 메뉴와 로그를 확인하십시오.',
      'servicios.respaldo_fallo':
        '{nombre}을(를) 업데이트하지 못했습니다. 사전 백업에 실패하여 아무것도 변경되지 않았습니다.',
      'servicios.espacio_insuficiente':
        '데이터를 복사할 디스크 공간이 부족합니다. {necesarios} MB가 필요하지만 여유 공간이 {libres} MB뿐입니다.',
      'servicios.actualizacion_revertida':
        '{version} 버전이 시작되지 않아 {nombre}을(를) {anterior} 버전으로 되돌렸습니다. 백업은 그대로 유지됩니다.',
      'servicios.restauracion_fallo':
        '새 버전이 시작되지 않았으며 {nombre}의 데이터를 복원할 수 없었습니다. 아무 서비스도 시작되지 않았으며, 변경된 데이터는 {fallida}에, 백업은 {respaldo}에 있습니다.',
      'servicios.otra_rama':
        '{nombre} {version}은(는) 다른 주 버전입니다. 새 인스턴스로 생성하십시오.',
      'servicios.misma_version': '{id}은(는) 이미 {version} 버전을 사용 중입니다.',
      'servicios.instancia_bloqueada':
        '{nombre}이(가) 잠겨 있습니다. 업데이트 중 데이터를 복원하지 못했습니다. 변경된 데이터는 {fallida}에, 백업은 {respaldo}에 있습니다. 시작하기 전에 서비스 → 버전에서 문제를 해결하십시오.',
      'servicios.datos_apartados':
        '{nombre} 폴더에 데이터가 없지만 업데이트 과정에서 분리된 데이터가 있습니다. 빈 폴더를 생성하지 않았습니다. 서비스 → 버전을 확인하십시오.',
      'servicios.puerto_reservado':
        '포트 {puerto}은(는) 시스템에 예약되어 있습니다({desde}–{hasta}). 다른 포트를 선택하십시오.',
      'servicios.borrado_con_bloqueo':
        '{nombre}에 업데이트 후 잠긴 인스턴스가 있습니다. 데이터를 삭제하기 전에 먼저 해결하십시오.',
      'servicios.config_no_revertida':
        '{nombre} {version}이(가) 시작되지 않았으며 설정을 {anterior}(으)로 되돌릴 수 없었습니다. 서비스 → 버전에서 {anterior}을(를) 다시 선택하십시오.',
      'servicios.puerto_revertido_apagada':
        '{nombre}이(가) 새 포트에서 시작되지 않아 기존 포트 {anterior}(으)로 되돌렸으나 거기서도 시작되지 않았습니다. 포트 {anterior}에서 중지된 상태로 유지됩니다.',
      'servicios.puerto_no_revertido':
        '{nombre}이(가) 포트 {nuevo}에서 시작되지 않았으며 설정을 포트 {anterior}(으)로 되돌릴 수 없었습니다. 서비스는 중지된 상태로 유지됩니다.',
      'instancias.id_invalido': '인스턴스 식별자가 올바르지 않습니다.',
      'instancias.no_existe': '인스턴스 {id}이(가) 존재하지 않습니다.',
      'instancias.existe': '인스턴스 {id}이(가) 이미 존재합니다.',
      'instancias.una_sola': '{nombre}은(는) 단일 인스턴스만 지원합니다.',
      'instancias.ultima': '{id}은(는) 유일한 인스턴스이므로 제거할 수 없습니다.',
      'instancias.sin_puerto_libre': '인스턴스에 할당할 사용 가능한 포트를 찾을 수 없습니다.',
      'instancias.confirmacion': '계속하려면 "{id}"을(를) 입력하십시오.',
      'instancias.sin_datos': '{id} 폴더에 데이터가 없습니다. 복원할 백업을 선택하십시오.',
      'instancias.respaldo_no_existe': '{id}의 해당 백업이 존재하지 않습니다.',
      'instancias.respaldo_en_uso':
        '해당 백업은 잠겨 있는 {id}에 필요합니다. 먼저 잠금을 해결하십시오.',
      'instancias.version_requerida':
        '{id}을(를) 어떤 버전으로 되돌릴지 알 수 없습니다. 동일한 주 버전의 설치된 버전을 선택하십시오.',
      'instalador.version_en_uso':
        '{servicio} {version}을(를) 제거할 수 없습니다. 인스턴스 {instancia}에서 사용 중입니다.',
      'limpieza.sin_confirmar': '버전 정리를 위한 확인이 필요합니다.',
      'limpieza.seleccion_invalida': '선택한 버전이 올바르지 않습니다.',
      'limpieza.en_curso': '이미 버전 정리가 진행 중입니다.',
      'limpieza.no_existe': '{servicio} {version}은(는) 더 이상 설치되어 있지 않습니다.',
      'limpieza.en_uso': '{servicio} {version}이(가) 사용 중 상태로 변경되어 제거되지 않았습니다.',
      'limpieza.ruta_insegura':
        '{servicio} {version} 폴더 경로가 안전하지 않아(링크이거나 bin 외부 경로) 변경하지 않았습니다.',
      'limpieza.version_bloqueada':
        '{servicio} {version}에 사용 중이거나 잠긴 파일이 있어 제거하지 않았으며 부분 삭제도 수행하지 않았습니다.',
      'limpieza.otro_volumen':
        '{servicio} {version}이(가) 임시 데이터 폴더와 다른 디스크에 있어 전체를 이동할 수 없었습니다. 아무것도 변경하지 않았습니다.',
      'limpieza.contenido_ajeno':
        '{servicio} {version}에 사용자가 직접 설치한 패키지(npm, pip 등)가 있습니다. 제거하려면 해당 패키지의 손실을 승인해야 합니다.',
      'limpieza.destino_ocupado':
        'bin 폴더에 이미 {servicio} {version} 폴더가 있어 덮어쓰지 않았습니다. 다른 폴더를 복구하기 전에 먼저 제거하십시오.',
      'bd.encender_servicio': '데이터베이스를 관리하려면 {nombre}을(를) 시작하십시오.',
      'bd.sin_credenciales': '{nombre}에 저장된 자격 증명이 없습니다.',
      'bd.confirmacion_borrado': '데이터베이스 {nombre}을(를) 삭제하려면 정확한 이름을 입력하십시오.',
      'bd.usuario_privilegiado':
        '사용자 {usuario}은(는) 관리자 또는 시스템 역할입니다. 프로젝트 전용 사용자를 선택하십시오.',
      'bd.usuario_en_uso':
        '다른 프로젝트에서 이미 사용자 {usuario}을(를) 사용 중입니다. 연결이 끊어지지 않도록 비밀번호를 변경하지 않았으며 아무것도 생성되지 않았습니다.',
      'bd.rol_sin_login':
        '사용자 {usuario}이(가) 존재하지만 로그인할 수 없습니다(LOGIN 권한이 없는 역할이거나 서버 접근 규칙 제한). 아무것도 변경되지 않았습니다.',
      'bd.usuario_clave_distinta':
        '사용자 {usuario}이(가) 다른 비밀번호로 이미 존재합니다. 다른 프로젝트의 연결이 끊어지지 않도록 비밀번호를 변경하지 않으므로 현재 비밀번호를 사용하십시오.',
      'bd.mongosh_faltante': 'mongosh가 설치되어 있지 않습니다. MongoDB를 관리하려면 서비스 메뉴에서 설치하십시오.',
      'tuneles.sitio_no_encontrado': '프로젝트를 찾을 수 없습니다.',
      'tuneles.confirmacion_requerida':
        '{dominio}을(를) 인터넷에 공개하려면 WolfCore Dev에서 확인해야 합니다.',
      'tuneles.confirmacion_obsoleta':
        '확인 이후 {dominio}의 터널 설정이 변경되었습니다. 다시 확인하십시오.',
      'tuneles.cloudflared_no_instalado':
        'cloudflared가 설치되어 있지 않습니다. 서비스 메뉴에서 설치하십시오.',
      'tuneles.proveedor_no_disponible': '터널 공급자 {proveedor}을(를) 사용할 수 없습니다.',
      'tuneles.cloudflare_sin_cuenta':
        '먼저 터널 옵션에서 Cloudflare 계정을 연결하십시오.',
      'tuneles.cloudflare_sin_credencial':
        '이 터널에 저장된 자격 증명이 없습니다. 터널 옵션에서 다시 생성하십시오.',
      'tuneles.cloudflare_datos_invalidos':
        '터널 이름(소문자, 숫자, 하이픈만 허용) 또는 공개 도메인이 올바르지 않습니다.',
      'tuneles.cloudflare_conexion_en_curso': '이미 Cloudflare 연결이 진행 중입니다.',
      'tuneles.cloudflare_dominio_distinto':
        'Cloudflare에 {dominio} 대신 {registrado}이(가) 등록되었습니다. 해당 도메인이 승인된 영역에 속하지 않습니다. Cloudflare 패널에서 해당 레코드를 삭제하십시오.',
      'tuneles.cloudflare_conexiones_activas':
        '터널 {nombre}에 활성 연결이 있습니다(삭제하려면 cloudflared에 -f 옵션이 필요합니다). 터널이 열린 모든 컴퓨터에서 연결을 닫고 다시 시도하거나 "여기서만 잊기"를 사용하십시오.',
      'tuneles.nombre_en_uso': '터널 {nombre}은(는) 이미 다른 사이트에서 사용 중입니다.',
      'tuneles.dominio_en_uso': '도메인 {dominio}은(는) 이미 다른 사이트에서 사용 중입니다.',
      'tuneles.confirmacion_olvidar': '터널 {nombre}을(를) 잊거나 다시 생성하려면 확인이 필요합니다.',
      'tuneles.cloudflare_fallo': 'cloudflared가 작업을 완료하지 못했습니다: {detalle}',
      'tuneles.credencial_no_protegida':
        '자격 증명의 접근 권한을 현재 사용자로 제한할 수 없어 사용하지 않았습니다.',
      'tuneles.sin_cifrado':
        '시스템 암호화를 사용할 수 없어 자격 증명을 저장할 수 없습니다.',
      'tuneles.token_invalido':
        '토큰이 올바르지 않습니다. 영문자, 숫자 및 _ . - 기호만 사용할 수 있습니다(8~200자). 터널 옵션에서 다시 저장하십시오.',
      'tuneles.ngrok_no_instalado':
        '이 컴퓨터에 ngrok이 설치되어 있지 않습니다. ngrok.com에서 설치한 후 다시 시도하십시오.',
      'tuneles.ngrok_sin_token': 'ngrok 토큰이 없습니다. 터널 옵션에서 저장하십시오.',
      'tuneles.expose_sin_token': 'Expose 토큰이 없습니다. 터널 옵션에서 저장하십시오.',
      'tuneles.tailscale_no_instalado':
        '이 컴퓨터에 Tailscale이 설치되어 있지 않습니다. WolfCore Dev는 이를 직접 설치하지 않으므로 tailscale.com에서 설치하십시오.',
      'tuneles.tailscale_sin_sesion':
        'Tailscale에 로그인되어 있지 않습니다. Tailscale에 로그인한 후 다시 시도하십시오.',
      'tuneles.tailscale_puerto_ocupado':
        'Tailscale이 이미 HTTPS 포트 {puerto}에 다른 항목을 게시 중입니다. WolfCore Dev는 이를 덮어쓰지 않으므로 Tailscale에서 해제한 후 다시 시도하십시오.',
      'lan.sitio_no_encontrado': '사이트를 찾을 수 없습니다.',
      'lan.confirmacion_requerida':
        '{dominio}을(를) 로컬 네트워크에 공유하려면 WolfCore Dev에서 확인해야 합니다.',
      'lan.datos_reales':
        '{dominio}에 실제 데이터가 포함되어 있습니다. 확인 절차를 거쳐도 로컬 네트워크에 공유할 수 없습니다. 고객 데이터가 없는 사본을 사용하십시오.',
      'lan.sin_red':
        '연결된 로컬 네트워크(Wi-Fi 또는 Ethernet)가 없습니다. 네트워크에 연결한 후 다시 시도하십시오.',
      'lan.ip_no_valida':
        '주소 {ip}은(는) 더 이상 로컬 네트워크의 주소가 아닙니다. 대화 상자를 다시 열고 새로 확인하십시오.',
      'lan.requiere_https': '{dominio}은(는) HTTPS로 리디렉션됩니다. HTTPS 옵션으로 공유하십시오.',
      'lan.sin_puertos':
        '로컬 네트워크용으로 8100에서 8199 사이의 사용 가능한 포트가 없습니다(공유된 사이트와 CA 링크가 이 범위를 사용합니다). 사이트 공유를 중지하거나 CA 대화 상자를 닫은 후 다시 시도하십시오.',
      'tuneles.expose_no_instalado':
        'Expose가 설치되어 있지 않습니다. Windows에서는 expose.phar로만 작동하므로 {carpeta}에 배치하십시오.',
      'tuneles.expose_datos_reales':
        '실제 데이터가 있는 사이트에는 Expose를 사용할 수 없습니다. 요청 검사기가 로컬 네트워크 전체에 노출되므로 다른 공급자를 사용하십시오.',
      'tuneles.confirmacion_requerida_tailnet':
        '{dominio}을(를) tailnet과 공유하려면 WolfCore Dev에서 확인해야 합니다.',
      'tuneles.tailscale_estado_ilegible':
        'Tailscale이 이 컴퓨터에 이미 게시 중인 항목을 읽을 수 없어 덮어쓰기를 방지하기 위해 아무것도 열지 않았습니다. Tailscale이 실행 중인지 확인하고 다시 시도하십시오.',
      'tuneles.tailscale_no_habilitado':
        'tailnet에서 Serve 또는 Funnel이 활성화되어 있지 않습니다. {enlace}에서 활성화한 후 다시 시도하십시오.',
      'tuneles.ngrok_desactualizado':
        '설치된 ngrok 버전이 오래되어 WolfCore Dev에 필요한 기능을 지원하지 않습니다. 업데이트(ngrok update)한 후 다시 시도하십시오.',
      'hosts.dominio_invalido': '올바르지 않은 도메인이 있습니다.',
      'hosts.tiempo_agotado':
        '{segundos}초 동안 관리자 권한 응답이 없어 hosts 파일이 변경되지 않았습니다.',
      'https.sin_dominio': '인증서에는 최소 하나 이상의 도메인이 필요합니다.',
      'https.sin_autoridad':
        'WolfCore Dev 인증 기관(CA)이 존재하지 않습니다. 인증서를 발급하기 전에 HTTPS 섹션에서 CA를 설치하십시오.',
      'herramientas.pid_invalido': 'PID가 올바르지 않습니다.',
      'herramientas.pid_sistema': 'PID {pid}은(는) 시스템 프로세스이므로 종료할 수 없습니다.',
      'herramientas.proceso_propio':
        'WolfCore Dev 또는 이를 시작한 프로세스는 종료할 수 없습니다.',
      'herramientas.proceso_inexistente': '프로세스 {pid}이(가) 더 이상 존재하지 않습니다.',
      'herramientas.sin_editor':
        '코드 편집기를 찾을 수 없습니다. 편집기(VS Code, Cursor, PhpStorm, Sublime Text 등)를 설치하십시오.',
      'herramientas.editor_no_instalado':
        '{nombre}이(가) 설치되어 있지 않습니다. 설정에서 다른 편집기를 선택하십시오.',
      'herramientas.editor_invalido': '해당 편집기는 올바르지 않습니다.',
      'herramientas.carpeta_sitio_inexistente': '프로젝트 폴더가 존재하지 않습니다.',
      'herramientas.ruta_no_absoluta': '경로는 절대 경로여야 합니다.',
      'herramientas.sin_seleccion': '하나 이상의 항목을 선택하십시오.',
      'herramientas.dominio_invalido': '올바르지 않은 도메인 또는 IP가 있습니다.',
      'herramientas.demasiados_dominios':
        '인증서에는 최대 {maximo}개의 도메인 또는 IP만 포함할 수 있습니다.',
      'buscar.consulta_invalida': '검색어를 입력하십시오(최대 500자).',
      'buscar.raiz_invalida': '폴더 또는 파일이 존재하지 않거나 올바르지 않습니다.',
      'buscar.regex_invalida': '정규 표현식이 올바르지 않습니다.',
      'buscar.regex_lenta':
        '정규 표현식 처리에 시간이 너무 오래 걸립니다. 식을 단순화하거나 일반 텍스트를 사용하십시오.',
      'buscar.demasiadas': '이미 {maximo}개의 검색이 진행 중입니다. 하나를 취소하거나 잠시 기다리십시오.',
      'terminal.no_abrio': '터미널을 열 수 없습니다.',
      'terminal.no_instalada': '{nombre}이(가) 설치되어 있지 않습니다. 설정에서 다른 터미널을 선택하십시오.',
      'terminal.invalida': '해당 터미널은 올바르지 않습니다.',
      'terminal.powershell_restringido':
        '이 컴퓨터에서 PowerShell이 제한된 언어 모드(조직 정책 또는 AppLocker)로 설정되어 있어 WolfCore Dev가 터미널을 열 수 없습니다. 프로젝트 폴더에서 직접 터미널을 여십시오.',
      'proyectos.no_existe': '프로젝트가 존재하지 않습니다.',
      'proyectos.no_confiado': '레시피를 실행하려면 "이 저장소를 신뢰합니다"를 선택하십시오.',
      'proyectos.receta_en_curso': '이 프로젝트에 대해 이미 실행 중인 레시피가 있습니다.',
      'proyectos.paso_no_omitible': '"사이트 생성" 단계는 건너뛸 수 없습니다.',
      'workspaces.no_existe': '해당 워크스페이스가 존재하지 않습니다.',
      'workspaces.invalido': '워크스페이스가 올바르지 않습니다. 이름과 구성 요소를 확인하십시오.',
      'workspaces.captadores_exclusivos':
        '두 개의 메일 수집기를 동시에 실행할 수 없습니다. 하나만 실행할 수 있습니다.',
      'workspaces.elemento_fallo':
        '{elemento}에 대한 작업을 완료할 수 없습니다. 서비스 메뉴와 로그를 확인하십시오.',
      'workspaces.base_no_responde':
        '해당 프로젝트의 데이터베이스가 응답하지 않아 {elemento}을(를) 시작하지 못했습니다.',
      'tareas.cron_invalida':
        'cron 표현식이 올바르지 않습니다. 분, 시, 일, 월, 요일의 5개 필드를 사용하십시오(예: 0 3 * * *).',
      'tareas.comando_invalido':
        '허용되지 않는 명령입니다. 인라인 코드 옵션(-r, -e, -c) 없이 프로젝트 파일과 함께 php, node, npm run 또는 python을 사용하십시오.',
      'tareas.invalida': '작업이 올바르지 않습니다. 이름, 일정 및 명령을 확인하십시오.',
      'tareas.no_existe': '해당 작업은 더 이상 존재하지 않습니다.',
      'tareas.sin_confirmar': '작업을 실행하려면 작업 명령을 확인하십시오.',
      'tareas.sitio_no_confiado':
        '작업을 실행하려면 프로젝트에서 "이 저장소를 신뢰합니다"를 선택하십시오.',
      'tareas.receta_cambio':
        '신뢰 표시 이후 프로젝트 레시피가 변경되었습니다. 내용을 검토한 후 "이 저장소를 신뢰합니다"를 다시 선택하십시오.',
      'tareas.aislado':
        '테스트 데이터 폴더(WOLFCORE_DATOS)입니다. 예약 작업을 실행하려면 예약 작업을 허용하십시오.',
      'tareas.carpeta': '프로젝트 폴더가 존재하지 않아 작업을 실행할 수 없습니다.',
      'tareas.en_curso': '작업이 이미 실행 중입니다.',
      'tareas.demasiadas': '이 프로젝트에 작업이 너무 많습니다(최대 {maximo}개).',
      'cli.no_autorizado':
        'CLI 명령이 승인되지 않았습니다. WolfCore Dev 앱을 연 상태에서 다시 실행하십시오.',
      'cli.orden_desconocida': 'WolfCore Dev가 인식하지 못하는 CLI 명령입니다.',
      'cli.argumentos_invalidos': '명령의 인수가 올바르지 않습니다.',
      'cli.solicitud_grande': '요청이 너무 큽니다(최대 {maximo}바이트).',
      'cli.formato_no_admitido': 'CLI에서 허용하지 않는 요청 형식입니다.',
      'cli.plazo':
        '명령 실행 시간이 너무 오래 걸려 여전히 진행 중일 수 있습니다. WolfCore Dev에서 상태를 확인하십시오.',
      'cli.ocupado':
        'WolfCore Dev가 너무 많은 CLI 명령을 처리 중입니다. 잠시 기다리십시오.',
      'cli.requiere_confirmacion':
        '이 명령은 항목을 게시하거나 변경하므로 {sitio}에서 확인(--si)이 필요합니다.',
      'cli.requiere_confirmacion_datos_reales':
        '{sitio}에 실제 데이터가 포함되어 있습니다. 명령의 실제 데이터 옵션(사이트 도메인)으로도 확인하십시오.',
      'cli.requiere_confirmacion_global':
        '모든 터미널의 PHP 버전을 변경하려면 확인(--si)이 필요합니다.',
      'cli.confirmacion_rechazada':
        'WolfCore Dev 창에서 확인이 거부되었거나 사용할 수 없어 아무 작업도 수행되지 않았습니다.',
      'cli.confirmacion_vencida':
        '제한 시간 내에 WolfCore Dev 창에서 확인이 이루어지지 않아 아무 작업도 수행되지 않았습니다.',
      'cli.tunel_fallo': '터널을 열 수 없습니다. WolfCore Dev에서 로그를 확인하십시오.',
      'cli.inicio_fallo':
        '요청한 항목을 모두 시작하지 못했습니다. WolfCore Dev에서 로그를 확인하십시오.',
      'cli.parada_fallo':
        '요청한 항목을 모두 중지하지 못했습니다. WolfCore Dev에서 로그를 확인하십시오.',
      'cli.interno': 'CLI 서버 내부 오류가 발생했습니다.',
      'cli.proveedor_distinto':
        '이 사이트는 다른 터널 공급자({proveedor})를 사용 중입니다. 확인 후 다시 승인하십시오.',
      'cli.sitio_no_encontrado': '사이트 {sitio}이(가) 존재하지 않습니다.',
      'cli.carpeta_invalida':
        '폴더가 존재하지 않거나 시스템 폴더 또는 WolfCore Dev 데이터 폴더입니다.',
      'cli.carpeta_sin_sitio':
        '해당 폴더는 어떤 WolfCore Dev 사이트에도 속하지 않습니다. 먼저 연결하십시오.',
      'cli.ya_vinculada': '해당 폴더는 이미 {sitio} 사이트로 연결되어 있습니다.',
      'cli.tipo_no_soportado':
        '{tipo} 유형의 프로젝트는 WolfCore Dev 인터페이스에서 생성하십시오.',
      'cli.sitio_sin_php': '사이트 {sitio}은(는) PHP를 사용하지 않습니다.',
      'cli.version_no_instalada':
        '{servicio} {version}이(가) 설치되어 있지 않습니다. 서비스 메뉴에서 설치하십시오.',
      'cli.fuente_no_existe': '해당 로그가 아직 존재하지 않습니다.',
      'cli.token_no_protegido':
        '토큰 파일의 접근 권한을 현재 사용자로 제한할 수 없어 CLI가 활성화되지 않습니다.',
      'cli.carpeta_ajena':
        '데이터 폴더의 run/ 폴더가 다른 사용자 소유이므로 CLI가 활성화되지 않습니다.',
      'cli.ruta_invalida': 'WolfCore Dev 경로에 wolf.cmd가 지원하지 않는 문자가 포함되어 있습니다.',
      'cli.path_aislado':
        '테스트 데이터 폴더(WOLFCORE_DATOS)를 사용할 때는 사용자의 PATH를 변경하지 않습니다.',
      'cli.sin_cliente': '이 WolfCore Dev 버전에는 wolf 클라이언트가 포함되어 있지 않습니다(컴파일 필요).',
      'cli.demasiados_dialogos':
        '최근 1분 동안 확인 요청이 너무 많았습니다. 잠시 기다린 후 다시 시도하십시오.',
      'cli.error': '명령을 완료할 수 없습니다: {detalle}',
      'proyectos.carpeta_no_vacia':
        '프로젝트 폴더에 이미 파일이 있습니다. 다른 폴더를 선택하거나 폴더를 비우십시오.',
      'secretos.sin_cifrado':
        '시스템 암호화를 사용할 수 없어 전용 사용자의 비밀번호를 저장할 수 없습니다. 아무것도 변경되지 않았습니다.',
      'proyectos.clave_bd_falta':
        '사용자 {usuario}의 저장된 비밀번호가 없어 아무것도 기록되지 않았습니다. .env 관리자에서 "전용 사용자 사용"을 선택하면 새 비밀번호가 생성됩니다.',
      'env.archivo_grande': '환경 변수 파일이 너무 큽니다(최대 {maximo}).',
      'env.no_regular': '.env 파일이 일반 파일이 아니므로 읽거나 수정하지 않습니다.',
      'env.clave_inexistente': '변수 {clave}이(가) 존재하지 않습니다.',
      'env.cambio_invalido': '.env 변경 사항이 올바르지 않습니다.',
      'env.variable_invalida': '변수 {clave}의 변경 사항이 올바르지 않습니다.',
      'env.solo_lectura': '변수 {clave}은(는) 여러 줄로 구성되어 있습니다. 파일에서 직접 편집하십시오.',
      'env.usuario_compartido':
        '데이터베이스 {base}은(는) 프로젝트 {proyecto}에서도 사용 중입니다. 사용자를 공유할지 확인하십시오.',
      'env.cambio_externo':
        '미리 보기를 표시한 이후 .env 파일이 변경되었습니다. 저장하기 전에 다시 확인하십시오.',
      'env.sin_confirmar': '.env 변경 사항을 저장할지 확인하십시오.',
      'env.versionado':
        'Git이 이미 이 프로젝트의 .env 파일을 추적 중입니다. 다음 커밋 시 해당 값이 업로드됩니다. 계속하려면 별도로 확인하십시오.',
      'env.versionado_desconocido':
        'git이 이 프로젝트의 .env 파일을 추적 중인지 확인할 수 없습니다. 계속하려면 별도로 확인하십시오.',
      'env.copia_invalida': '.env 사본이 올바르지 않거나 더 이상 존재하지 않습니다.',
      'env.sin_base': '이 프로젝트의 .env 파일에 데이터베이스 연결 설정이 없습니다.',
      'env.base_no_resuelta':
        '이 프로젝트의 데이터베이스가 WolfCore Dev의 로컬 서버에 속하지 않아 아무것도 변경되지 않았습니다.',
      'env.motor_no_soportado': '현재 "전용 사용자 사용" 기능은 MySQL 및 MariaDB에서만 지원됩니다.',
      'env.ya_usa_usuario_propio': '이 프로젝트는 이미 전용 사용자를 사용 중입니다.',
      'plantillas.id_invalido': '템플릿 식별자가 올바르지 않습니다.',
      'plantillas.no_existe': '템플릿이 존재하지 않습니다.',
      'plantillas.danada':
        '템플릿이 손상되었거나 수정되어 사용할 수 없습니다. 삭제한 후 다시 저장하십시오.',
      'plantillas.demasiado_grande':
        '프로젝트의 파일 수가 너무 많거나 용량이 커서 템플릿으로 저장할 수 없습니다(최대 {maximo}개 파일). 용량이 큰 폴더를 제외하십시오.',
      'plantillas.demasiado_pesada':
        '프로젝트 용량이 너무 커서 템플릿으로 저장할 수 없습니다(최대 {maximo}). 용량이 큰 폴더를 제외하십시오.',
      'plantillas.exclusion_invalida':
        '제외 항목 중 하나가 올바르지 않습니다(".." 없이 이름 또는 상대 경로를 사용하십시오).',
      'plantillas.nombre_invalido': '템플릿 이름이 올바르지 않습니다(1~60자).',
      'plantillas.esquema_fallo':
        '프로젝트 데이터베이스의 스키마를 읽을 수 없습니다. 해당 서비스가 실행 중인지 확인하십시오.',
      'plantillas.base_no_resuelta':
        '템플릿을 저장할 수 없습니다. 데이터베이스 서버가 원격이거나 해당 포트를 사용하는 로컬 서비스가 없습니다.',
      'plantillas.sin_generador_base':
        '이 프로젝트 유형에는 기본 생성기가 없으므로 템플릿에 프로젝트 파일이 포함되어야 합니다.',
      'plantillas.exclusiones_nuevas':
        '템플릿에 현재 제외 대상인 파일({archivo})이 포함되어 있습니다. 프로젝트에서 다시 저장하거나 삭제하십시오.',
      'plantillas.motor_distinto':
        '템플릿 스키마는 MySQL용이지만 선택한 서버는 MariaDB(또는 그 반대)이므로 차이가 발생할 수 있습니다. 계속할지 확인하십시오.',
      'bd.sql_no_permitido':
        '스키마에 구조 정의 외의 구문이 포함되어 있어 아무것도 실행되지 않았습니다: {sentencia}',
      'bd.extension_no_permitida':
        '스키마가 허용 목록에 없는 확장({nombre})을 요구하여 아무것도 복원되지 않았습니다.',
      'bd.esquema_fallo': '전체 스키마를 복원할 수 없어 부분 복원을 남기지 않고 중단했습니다.',
      'bd.datos_no_permitidos':
        '데이터 덤프에 데이터가 아닌 항목이 포함되어 있습니다(INSERT, LOCK TABLES, SET만 허용됨). 아무것도 가져오지 않았습니다.',
      'bd.datos_fallo':
        '데이터를 가져오지 못했습니다. 데이터베이스는 부분 적용 없이 기존 상태 그대로 유지되었습니다.',
      'perfiles.destino_invalido': '프로필을 저장할 위치(.wolfperfil 파일)를 선택하십시오.',
      'perfiles.frase_debil': 'CA 암호 문구는 최소 {minimo}자 이상이어야 합니다.',
      'perfiles.frase_incorrecta': '암호 문구가 올바르지 않습니다. 아무것도 가져오지 않았습니다.',
      'perfiles.certificados_sin_ca':
        '사이트 인증서는 암호화된 CA와 함께만 이전할 수 있습니다. 암호 문구와 함께 CA를 포함하십시오.',
      'perfiles.no_existe': '프로필 파일이 존재하지 않습니다.',
      'perfiles.danado': '프로필이 손상되었거나 변조되었습니다. 아무것도 가져오지 않았습니다.',
      'perfiles.demasiado_grande': '프로필 크기가 너무 큽니다(최대 {maximo}).',
      'perfiles.version_no_soportada':
        '이 프로필은 더 최신 버전의 WolfCore Dev(형식 {version})에서 생성되었습니다. 가져오려면 앱을 업데이트하십시오.',
      'perfiles.sin_confirmar': '프로필을 가져오려면 먼저 확인하십시오.',
      'perfiles.vista_previa_vieja':
        '미리 보기 이후 데이터 폴더 또는 프로필이 변경되었습니다. 다시 검토하십시오.',
      'perfiles.carpeta_datos_invalida':
        'WOLFCORE_DATOS가 유효한 데이터 폴더가 아닙니다. 절대 경로여야 하며, 시스템 폴더가 아니고 실제 폴더와 달라야 합니다.',
      'perfiles.confirmar_reemplazar_ca':
        '프로필에 CA가 포함되어 있으며 이 컴퓨터에는 이미 자체 CA가 있습니다. 지문을 비교한 뒤 교체 여부를 별도로 확인하십시오(본인의 CA인 경우에만 교체하십시오).',
      'herramientas.imagen_tipo':
        '지원되지 않는 이미지 파일(PNG, JPG, WebP, GIF, BMP, ICO)이거나 파일 내용이 형식과 일치하지 않습니다.',
      'herramientas.imagen_grande': '이미지 용량이 너무 큽니다(최대 {maximo}).',
      'herramientas.imagen_dimensiones':
        '이미지 크기가 너무 큽니다({ancho}×{alto} px, 한 변 최대 {maximo} px). 보안을 위해 열지 않습니다.',
      'herramientas.zip_sin_archivos': '압축할 파일이 없습니다(링크는 따라가지 않습니다).',
      'herramientas.zip_demasiados': '압축할 파일이 너무 많습니다(최대 {maximo}).',
      'herramientas.zip_grande': '압축할 대상의 용량이 너무 큽니다(최대 {maximo}).',
      'herramientas.pdf_invalido': '최적화할 수 있는 유효한 PDF 파일이 아닙니다.',
      'herramientas.pdf_grande': 'PDF 용량이 너무 큽니다(최대 {maximo}).',
      'herramientas.pdf_cifrado': 'PDF가 비밀번호로 보호되어 있어 최적화할 수 없습니다.',
      'herramientas.pdf_plazo': 'PDF 처리가 {segundos}초를 초과하여 취소되었습니다.',
      'herramientas.salida_ocupada': '새 파일에 사용할 수 있는 빈 파일 이름을 찾지 못했습니다.',
      'conversor.formato': '해당 변환은 사용할 수 없습니다.',
      'conversor.archivo_invalido':
        '파일이 손상되었거나 확장자가 나타내는 형식이 아닙니다.',
      'conversor.archivo_grande': '파일 용량이 너무 큽니다(최대 {maximo}).',
      'conversor.archivo_peligroso':
        '파일이 ZIP 폭탄으로 의심되거나 조작되었습니다(과도한 콘텐츠, XML 엔티티 또는 잘못된 이름). 보안을 위해 열지 않습니다.',
      'conversor.limite_filas': '표의 행이 너무 많습니다(최대 {maximo}).',
      'conversor.limite_columnas': '표의 열이 너무 많습니다(최대 {maximo}).',
      'conversor.limite_paginas': 'PDF의 페이지가 너무 많습니다(최대 {maximo}).',
      'conversor.pdf_cifrado': 'PDF가 비밀번호로 보호되어 있어 변환할 수 없습니다.',
      'conversor.plazo': '변환이 {segundos}초를 초과하여 취소되었습니다.',
      'conversor.cancelado': '변환이 취소되었습니다.',
      'conversor.libreoffice_ausente':
        '이 변환에는 LibreOffice가 필요하지만 이 컴퓨터에 설치되어 있지 않습니다(WolfCore Dev는 LibreOffice를 설치하지 않습니다).',
      'conversor.libreoffice_fallo': 'LibreOffice에서 문서를 변환하지 못했습니다.',
      'conversor.limite_celdas': '표의 셀이 너무 많습니다(최대 {maximo}).',
      'conversor.memoria': '파일이 너무 많은 메모리를 필요로 하여({maximo} 초과) 취소되었습니다.',
      'conversor.pdf_no_disponible': '현재 PDF 인쇄를 사용할 수 없습니다.',
      'herramientas.imagen_pixeles':
        '이미지의 총 픽셀 수가 너무 많습니다({ancho}×{alto} px, 최대 {maximo}). 보안을 위해 열지 않습니다.',
      'herramientas.zip_cambio': '압축하는 동안 파일이 변경되었습니다. 다시 시도하십시오.',
      'herramientas.pdf_demasiado_complejo':
        'PDF가 너무 복잡하여(허용된 것보다 많은 메모리를 점유함) 취소되었습니다.',
      'herramientas.salida_denegada':
        '해당 위치에 쓸 수 없습니다. 권한을 확인하거나 폴더가 존재하는지 확인하십시오.',
      'herramientas.fuera_de_la_ca':
        'WolfCore Dev의 CA는 .test 도메인, localhost 및 로컬 주소만 서명합니다. {dominio} 도메인은 포함할 수 없습니다.',
      'perfiles.frase_requerida':
        '데이터베이스 또는 CA를 가져오려면 프로필의 암호 문구를 입력하십시오(또는 데이터베이스를 제외하고 가져오십시오).',
      'perfiles.sin_espacio':
        '프로필을 가져올 여유 공간이 부족합니다. {necesarios} 필요하며 현재 {libres} 사용 가능합니다.',
      'perfiles.ca_sin_restricciones':
        '이 CA는 모든 웹사이트에 서명할 수 있습니다. 본인의 CA인 경우에만 지문을 비교한 뒤 가져오십시오. 계속하려면 별도로 확인하십시오.',
      'perfiles.ca_restricciones_ajenas':
        '프로필의 CA에 WolfCore Dev의 것이 아닌 이름 제한이 포함되어 있어 가져오지 않습니다.',
      'perfiles.instantanea_fallo':
        '환경의 사전 백업을 저장하지 못해 아무것도 변경되지 않았습니다. 디스크 여유 공간과 데이터 폴더의 권한을 확인하십시오.',
      'perfiles.en_curso': '이미 프로필 가져오기가 진행 중입니다. 완료될 때까지 기다려 주십시오.',
      'importar.origen_apagado':
        '다른 프로그램의 데이터베이스 서버에 연결하지 못했습니다. 해당 프로그램에서 서버를 시작한 뒤 다시 시도하십시오. 사이트는 정상적으로 가져왔습니다.',
      'importar.origen_no_local': '원본 서버는 이 컴퓨터(127.0.0.1)에 있어야 합니다.',
      'importar.origen_rechazado': '원본 서버에서 사용자 이름 또는 비밀번호를 거부했습니다.',
      'importar.origen_version':
        '원본 서버의 버전은 WolfCore Dev에 설치된 항목으로 가져올 수 없습니다.',
      'importar.volcado_enorme':
        '데이터베이스 데이터가 {maximo} MB를 초과하여 한 번에 가져올 수 없습니다.',
      'importar.motor_no_soportado':
        '다른 프로그램에서는 MySQL 및 MariaDB 데이터베이스만 가져올 수 있습니다.',
      'importar.ruta_fuera':
        '설치 경로 외부나 시스템 폴더를 가리키는 폴더 또는 파일을 제외했습니다.',
      'importar.carpeta_invalida': '더 이상 존재하지 않거나 폴더가 아닌 경로를 제외했습니다.',
      'importar.archivo_grande':
        '설정 파일 용량이 {maximo} KB를 초과하여 읽지 않았습니다.',
      'importar.archivo_ilegible': '설정 파일이 텍스트 형식이 아니거나 읽을 수 없습니다.',
      'importar.demasiados':
        '사이트 또는 설정 파일이 너무 많아 처음 항목들만 읽었습니다.',
      'importar.candidato_desconocido':
        '해당 사이트가 더 이상 원본 프로그램에 표시되지 않습니다. 다시 검색하십시오.',
      'importar.ya_vinculado': '해당 폴더는 이미 WolfCore Dev의 사이트입니다.',
      'importar.dominio_existe':
        '{dominio} 도메인을 사용하는 사이트가 이미 존재합니다. 가져오기 전에 도메인을 변경하십시오.',
      'importar.sin_php':
        '이 사이트에는 PHP가 필요하지만 설치된 버전이 없습니다. 서비스에서 설치하십시오.',
      'importar.base_existe':
        '{nombre} 데이터베이스가 대상에 이미 존재하여 건드리지 않았습니다. 가져오려면 교체를 확인하십시오(교체 전 백업이 생성됩니다).',
      'importar.base_fallo':
        '{nombre} 데이터베이스를 가져오지 못했습니다. 부분 적용 없이 기존 상태 그대로 유지되었습니다.',
      'importar.sitio_fallo': '사이트를 생성하지 못했습니다.',
      'importar.origen_invalido':
        '원본 서버 정보(사용자, 비밀번호 또는 포트)가 올바르지 않습니다.',
      'importar.sin_seleccion': '가져올 사이트를 하나 이상 선택하십시오.',
      'importar.en_curso': '이미 가져오기가 진행 중입니다. 완료될 때까지 기다려 주십시오.',
      'importar.cancelado': '가져오기가 취소되었습니다. 가져오던 항목은 기존 상태 그대로 유지되었습니다.',
      'importar.origen_estancado':
        '덤프 중 다른 프로그램의 서버가 응답을 중지하여 데이터베이스를 가져오지 못했습니다.',
      'importar.sin_espacio':
        '데이터베이스를 가져올 여유 공간이 부족합니다. 약 {necesarios} MB가 필요하며 현재 {libres} MB 사용 가능합니다.',
      'importar.origen_fallo': '다른 프로그램의 데이터베이스를 덤프하지 못했습니다.',
      'importar.clave_no_ascii':
        '비밀번호에 덤프로 전달할 수 없는 악센트 또는 기호가 포함되어 있습니다. ASCII 문자만 포함된 비밀번호를 사용하십시오.',
      'plantillas.sin_esquema': '템플릿에 데이터베이스 스키마가 포함되어 있지 않습니다.',
      'proyectos.carpeta_invalida': '프로젝트 폴더가 올바르지 않습니다.',
      'proyectos.nombre_invalido':
        '프로젝트 이름에는 소문자, 숫자, 하이픈만 사용할 수 있습니다(최대 40자).',
      'proyectos.argumento_invalido': '프로젝트 정보가 올바르지 않습니다(필드: {campo}).',
      'proyectos.base_existe': '{nombre} 데이터베이스가 이미 존재합니다. 다른 이름을 선택하십시오.',
      'proyectos.dominio_existe': '{dominio} 도메인을 사용하는 사이트가 이미 존재합니다.',
      'proyectos.carpeta_de_otro_sitio':
        '해당 폴더는 {dominio} 프로젝트의 폴더이거나 그 하위 폴더입니다. 다른 폴더를 선택하십시오.',
      'proyectos.sin_python': 'Python이 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'proyectos.venv_ajeno':
        '프로젝트에 자체 .venv가 포함되어 있으며 WolfCore Dev는 외부 저장소의 Python을 실행하지 않습니다. 해당 폴더를 삭제하고 환경을 다시 생성하십시오.',
      'proyectos.paso_base_no_omitible':
        '새 프로젝트의 "데이터베이스 생성" 단계는 건너뛸 수 없습니다.',
      'proyectos.sin_php': 'PHP가 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'proyectos.php_no_instalado': 'PHP {version} 버전이 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'proyectos.python_no_instalado':
        'Python {version} 버전이 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'mcp.token_invalido': 'MCP 서버 토큰이 올바르지 않습니다.',
      'mcp.solicitud_cancelada': 'MCP 클라이언트가 요청을 취소하여 작업이 실행되지 않았습니다.',
      'doctor.puerto_ocupado': '{servicio}의 {puerto} 포트를 다른 프로그램({proceso})이 사용 중입니다.',
      'doctor.puerto_iis': 'IIS({programa})가 {servicio}의 {puerto} 포트를 사용 중입니다.',
      'doctor.puerto_http_sys':
        'Windows 서비스({programa})가 {servicio}의 {puerto} 포트를 사용 중입니다.',
      'doctor.puerto_flyenv':
        '{programa} 프로그램이 {servicio}의 {puerto} 포트를 사용 중입니다. 종료하거나 WolfCore Dev의 포트를 변경하십시오.',
      'doctor.puerto_xampp': '{programa} 프로그램이 {servicio}의 {puerto} 포트를 사용 중입니다.',
      'doctor.puerto_skype': '{programa} 프로그램이 {servicio}의 {puerto} 포트를 사용 중입니다.',
      'doctor.puerto_reservado':
        '{servicio}의 {puerto} 포트가 Windows 예약 범위({desde}-{hasta}: Hyper-V, WSL 또는 Docker)에 속해 있습니다.',
      'doctor.ca_por_vencer': 'WolfCore Dev 인증 기관(CA)이 {dias}일 후 만료됩니다.',
      'doctor.ca_vencida': 'WolfCore Dev 인증 기관(CA)이 만료되었습니다.',
      'doctor.certificado_por_vencer': '{dominio}의 인증서가 {dias}일 후 만료됩니다.',
      'doctor.certificado_vencido': '{dominio}의 인증서가 만료되었습니다.',
      'doctor.hosts_ilegible': 'hosts 파일을 읽지 못했습니다.',
      'doctor.hosts_utf16':
        'hosts 파일이 UTF-16으로 저장되어 있어 Windows가 항목을 읽지 못할 수 있습니다.',
      'doctor.hosts_bloque_duplicado':
        'hosts 파일에 WolfCore Dev 블록이 {bloques}개 있습니다. 하나만 있어야 합니다.',
      'doctor.hosts_bloque_sin_cierre':
        'hosts 파일의 WolfCore Dev 블록에 종료 표시가 누락되었습니다.',
      'doctor.hosts_dominios_faltantes':
        'hosts 파일에 사이트 도메인 {cantidad}개가 누락되어 있습니다.',
      'doctor.hosts_solo_lectura':
        'hosts 파일이 읽기 전용입니다(보통 백신 프로그램이 설정합니다). WolfCore Dev는 관리자 권한으로 여전히 쓸 수 있습니다.',
      'doctor.path_duplicados':
        '사용자 PATH에 WolfCore Dev 항목이 {cantidad}개 중복되어 있습니다.',
      'doctor.path_ajeno_delante':
        '{programa}({origen})이(가) 포함된 다른 폴더가 PATH에서 WolfCore Dev보다 앞에 있어 터미널에서 해당 경로가 사용됩니다.',
      'doctor.vcredist_ausente':
        'Microsoft Visual C++ 2015-2022 (x64)가 설치되어 있지 않아 PHP 및 기타 서비스가 시작되지 않습니다.',
      'doctor.enlazador_msvc_ausente':
        'Rust는 설치되어 있지만 Visual Studio Build Tools의 C++ 도구(MSVC 링커)가 없습니다. cargo에서 프로그램을 링크할 수 없습니다.',
      'doctor.antivirus_sin_exclusion':
        '백신 프로그램이 WolfCore Dev 데이터 폴더를 검사하고 있어 PHP 및 서비스 시작이 느려질 수 있습니다.',
      'doctor.firewall_reglas':
        'Windows가 {perfiles} 프로필에서 WolfCore Dev 프로그램(nginx, PHP 또는 데이터베이스)의 인바운드 규칙 {cantidad}개를 네트워크로부터 허용하고 있습니다. 해당 프로그램이 네트워크에 노출된 상태입니다.',
      'doctor.firewall_no_comprobado':
        'Windows 방화벽을 확인하지 못했습니다(관리자 권한이 필요할 수 있습니다).',
      'doctor.firewall_reglas_ajenas':
        '{perfiles} 프로필에 nginx, PHP 또는 데이터베이스를 사용하는 다른 프로그램(FlyEnv, Laragon, XAMPP 등)의 인바운드 규칙이 {cantidad}개 있습니다. WolfCore Dev의 규칙이 아니므로 표시만 되며 여기에서 제거되지 않습니다.',
      'doctor.servicio_en_error': '{servicio} 서비스가 오류 상태입니다.',
      'doctor.revision_fallida': '{revision} 점검을 완료하지 못했습니다.',
      'doctor.confirmacion_requerida': '복구를 적용하기 전에 먼저 확인하십시오.',
      'doctor.hallazgo_desconocido': '해당 항목이 더 이상 존재하지 않습니다. 다시 점검하십시오.',
      'doctor.solo_informa':
        '이 항목은 자동 복구를 지원하지 않습니다. 안내를 따라 주십시오.',
      'doctor.reparacion_fallida': '복구를 적용하지 못했습니다.',
      'doctor.reparacion_cancelada': '관리자 권한 요청이 취소되어 아무것도 변경되지 않았습니다.',
      'doctor.reparacion_denegada': 'Windows 또는 백신 프로그램이 액세스를 거부하여 아무것도 변경되지 않았습니다.',
      'doctor.ya_resuelto': '문제가 이미 해결되어 변경할 내용이 없었습니다.',
      'doctor.ca_vieja_sin_quitar':
        '새 인증 기관(CA)이 이미 사용 중이지만 Windows 저장소에서 이전 인증 기관을 제거하지 못했습니다. HTTPS 섹션에서 제거할 수 있습니다.',
      'doctor.sin_puerto_libre': '서비스를 이동할 빈 포트를 찾지 못했습니다.',
      'doctor.ca_vuelta_atras_incompleta':
        '새 인증 기관(CA)을 적용하지 못했으며 롤백도 완전히 완료되지 않았습니다. HTTPS 섹션을 확인하십시오. etc/respaldos에 날짜가 포함된 백업이 있습니다.',
      'doctor.firefox_sin_confianza':
        'Firefox가 {cantidad}개 프로필에서 WolfCore Dev 인증 기관을 신뢰하지 않습니다(자체 저장소 사용).',
      'confianza.sin_ca': '아직 인증 기관(CA)이 없습니다. HTTPS에서 생성하십시오.',
      'confianza.sin_raices':
        'Python용 신뢰 루트(certifi 및 Windows 루트)를 찾지 못해 아무것도 변경되지 않았습니다.',
      'confianza.node_variable_ajena':
        '이미 별도의 NODE_EXTRA_CA_CERTS가 설정되어 있으므로 WolfCore Dev가 교체하지 않습니다.',
      'confianza.variable_fallida': '사용자 환경 변수를 변경하지 못했습니다.',
      'firefox.abierto': 'Firefox가 실행 중입니다. 종료한 뒤 다시 시도하십시오.',
      'firefox.error': '해당 프로필의 user.js를 변경하지 못해 기존 상태 그대로 유지되었습니다.',
      'firefox.fuera':
        'Firefox 폴더 외부에 프로필이 있습니다. CA 신뢰 설정에서 별도 확인 후 활성화하십시오.',
      'confianza.node_variable_cambiada':
        'NODE_EXTRA_CA_CERTS가 더 이상 WolfCore Dev 인증 기관을 가리키지 않으므로(수동 변경됨) 삭제하지 않았습니다.',
      'ia.clave_invalida': '공급자가 키를 거부했습니다. 키를 확인하거나 새 키를 생성하십시오.',
      'ia.sin_saldo': '공급자 계정에 잔액 또는 사용 가능한 할당량이 없습니다.',
      'ia.limite': '공급자가 요청을 제한했습니다. 잠시 후 다시 시도하십시오.',
      'ia.region': '공급자가 현재 국가 또는 지역에서 서비스를 제공하지 않습니다.',
      'ia.sin_red': '공급자에 연결하지 못했습니다. 네트워크 또는 기본 URL을 확인하십시오.',
      'ia.url_invalida':
        '기본 URL이 올바르지 않습니다. 사용자 이름과 비밀번호 없이 https://(또는 127.0.0.1 및 [::1]에 한해 http://)를 사용하십시오.',
      'ia.plazo': '공급자가 {segundos}초 내에 응답하지 않았습니다.',
      'ia.respuesta_rara': '공급자가 예기치 않은 응답을 반환했습니다.',
      'ia.cancelado': '공급자에 대한 요청이 취소되었습니다.',
      'ia.sin_clave': '이 공급자에는 키가 필요합니다. 먼저 키를 저장하십시오.',
      'ia.clave_mal_formada':
        '키 형식이 올바르지 않습니다(공백이나 줄 바꿈이 없어야 합니다).',
      'ia.modelo_invalido': '모델 이름이 올바르지 않습니다.',
      'ia.modelo_no_disponible': '모델이 존재하지 않거나 계정에 액세스 권한이 없습니다.',
      'ia.proveedor_invalido': '공급자 설정이 올바르지 않습니다.',
      'ia.env_conflicto':
        '.env에 {claves} 항목이 이미 다른 값으로 정의되어 있습니다. 교체할지 확인하십시오.',
      'ia.env_sin_confirmar':
        '.env에 키를 기록할지 확인하십시오(평문으로 저장됩니다).',
      'ia.env_versionado':
        'Git이 이미 이 프로젝트의 .env를 추적하고 있습니다. .gitignore에 있더라도 다음 커밋 시 키가 업로드됩니다. git rm --cached .env 명령으로 인덱스에서 제거하십시오.',
      'ia.env_versionado_desconocido':
        'Git이 이 프로젝트의 .env를 이미 추적하고 있는지 확인하지 못했습니다. 키를 기록할지 별도로 확인하십시오.',
      'ia.proveedor_no_existe': 'AI 공급자가 더 이상 존재하지 않습니다.',
      'ia.url_cambia_con_clave':
        '공급자에 저장된 키가 있습니다. 새 URL로 이 키를 전송할지 확인하십시오.',
      'ia.mensaje_sin_confirmar':
        '테스트 메시지 전송을 확인하십시오(계정의 토큰이 소비됩니다).',
      'ia.clave_ilegible':
        '저장된 공급자 키를 읽지 못했습니다. 삭제한 뒤 다시 저장하십시오.',
      'ia.argumento_invalido': '올바르지 않은 데이터입니다({campo}).',
      'correo.auth': '공급자가 사용자 이름 또는 비밀번호를 거부했습니다.',
      'correo.conexion': 'SMTP 서버에 연결하지 못했습니다. 호스트와 포트를 확인하십시오.',
      'correo.tls':
        '서버와 유효한 암호화 연결을 설정하지 못했습니다(인증서, 호스트 이름 또는 STARTTLS). 아무것도 전송되지 않았습니다.',
      'correo.rechazado':
        '서버가 메시지 또는 주소를 거부했습니다. 발신자를 확인하십시오. 많은 공급자가 인증된 발신자 또는 도메인만 허용합니다.',
      'correo.plazo': '서버가 제한 시간(20초) 내에 응답하지 않았습니다.',
      'correo.host_invalido':
        'SMTP 서버는 스키마, 포트, 경로 없이 호스트 이름 또는 IP만 입력해야 합니다.',
      'correo.host_local':
        '해당 서버는 이 컴퓨터 또는 로컬 네트워크를 가리킵니다. 사용하려면 확인하십시오.',
      'correo.destinatario_invalido': '수신자 주소가 올바르지 않습니다.',
      'correo.proveedor_invalido': '공급자 정보가 올바르지 않습니다.',
      'correo.proveedor_no_existe': '메일 공급자가 더 이상 존재하지 않습니다.',
      'correo.sin_clave': '공급자에 저장된 비밀번호가 없습니다.',
      'correo.clave_ilegible':
        '저장된 공급자 비밀번호를 읽지 못했습니다. 삭제한 뒤 다시 저장하십시오.',
      'correo.cambia_con_clave':
        '공급자에 저장된 비밀번호가 있습니다. 새 서버로 이 비밀번호를 전송할지 확인하십시오.',
      'correo.env_sin_confirmar':
        '.env에 메일 환경 변수를 기록할지 확인하십시오.',
      'correo.ocupado': '이미 발송 테스트가 진행 중입니다.',
      'correo.limite': '다음 발송 테스트까지 {segundos}초 기다려 주십시오.',
      'correo.clave_mal_formada':
        '비밀번호 형식이 올바르지 않습니다. 줄 바꿈 없는 출력 가능한 문자만 허용되며 최대 4096자입니다.',
      'correo.argumento_invalido': '올바르지 않은 데이터입니다({campo}).',
      'agentes.no_existe': '지원되지 않는 에이전트입니다.',
      'agentes.sin_confirmar': '계속하기 전에 대화 상자에서 작업을 확인하십시오.',
      'agentes.no_instalable':
        '이 에이전트는 WolfCore Dev에서 설치할 수 없습니다. 공식 가이드({guia})를 따라 주십시오.',
      'agentes.sin_node': '에이전트를 설치하려면 서비스에서 Node를 먼저 설치하십시오.',
      'agentes.node_antiguo':
        '{agente}에는 Node {requerida} 이상이 필요하지만 현재 사용될 버전은 {actual}입니다. 서비스에서 더 최신 버전의 Node를 설치하십시오.',
      'agentes.node_version_desconocida':
        'Node 버전을 확인할 수 없으며 {agente}에는 Node {requerida} 이상이 필요합니다. 서비스의 Node를 확인하십시오.',
      'instalador.zip_demasiado_grande':
        '다운로드한 패키지가 너무 크거나 파일이 너무 많아 설치하지 않습니다.',
      'rust.rustup_init_fallo': 'rustup-init가 정상적으로 종료되지 않았습니다(코드 {codigo}): {detalle}',
      'rust.toolchain_fallo': 'Rust {version} 버전을 설치하지 못했습니다(코드 {codigo}): {detalle}',
      'rust.desinstalar_fallo': 'Rust {version} 버전을 제거하지 못했습니다: {detalle}',
      'rust.descarga_fallo': 'rustup을 다운로드하지 못했습니다(HTTP {estado}).',
      'agentes.instalacion_fallo': '에이전트를 설치하지 못했습니다: {detalle}',
      'agentes.no_instalado': '{agente}이(가) 설치되어 있지 않습니다.',
      'agentes.mcp_no_soportado':
        '{agente}은(는) 환경 변수에서 토큰을 읽는 방법을 문서화하지 않아 MCP를 등록하지 않습니다.',
      'agentes.config_ilegible':
        '{archivo} 파일을 해석하지 못해 수정하지 않았습니다. 직접 확인하십시오.',
      'agentes.config_en_uso':
        'WolfCore Dev가 편집하는 동안 {archivo} 파일이 변경되었습니다. 에이전트를 종료한 뒤 다시 시도하십시오. 파일은 수정되지 않았습니다.',
      'agentes.proveedor_incompatible': '{agente}은(는) 해당 AI 공급자를 사용할 수 없습니다.',
      'agentes.sin_cambios_preparados': '설명할 스테이징된 변경 사항(git add)이 없습니다.',
      'agentes.argumento_invalido': '올바르지 않은 데이터입니다({campo}).',
      'git.commit_fallo': '커밋하지 못했습니다: {detalle}',
      'git.mensaje_invalido': '커밋 메시지가 비어 있거나 올바르지 않습니다.',
      'php.rama_no_instalada': 'PHP {rama} 버전이 설치되어 있지 않습니다.',
      'php.argumento_invalido': '올바르지 않은 데이터입니다({campo}).',
      'php.valor_invalido': '{clave} 값이 올바르지 않습니다.',
      'php.ini_invalido': '해당 php.ini로 PHP가 시작되지 않아 아무것도 저장되지 않았습니다. 출력: {salida}',
      'php.no_arranco':
        '변경 후 PHP {rama} 버전이 다시 시작되지 않아 이전 설정으로 복원했으며 이전과 같이 응답합니다.',
      'php.caido_tras_restaurar':
        'PHP {rama} 버전이 다시 시작되지 않아 이전 설정으로 복원했으나 여전히 응답하지 않습니다. 서비스와 PHP 로그를 확인하십시오.',
      'php.respaldo_no_existe': '해당 php.ini 백업이 존재하지 않습니다.',
      'php.extension_no_existe': '{nombre} 확장이 이 버전의 ext 폴더에 없습니다.',
      'php.extension_no_catalogo':
        '{nombre} 확장이 이 버전의 카탈로그에 없습니다.',
      'php.variante_desconocida': '이 PHP의 빌드 구성을 확인할 수 없습니다.',
      'php.sin_variante': '카탈로그에 {variante} 빌드용 {nombre} 확장이 없습니다.',
      'php.huella_distinta': '다운로드한 파일이 게시된 해시(지문)와 일치하지 않아 아무것도 설치하지 않았습니다.',
      'php.descarga_fallida': '확장을 다운로드하지 못했습니다: {detalle}',
      'php.extension_en_uso':
        '{nombre}의 DLL이 사용 중입니다. PHP {rama} 버전을 중지한 뒤 다시 시도하십시오.',
      'php.extension_sin_dll':
        '{nombre}의 DLL을 교체하지 못해 PHP {rama} 버전의 ext 폴더에 해당 파일이 없는 상태입니다. PHP {rama} 버전을 중지한 뒤 다시 시도하십시오. 시작 시 이전 파일이 원래 위치로 복원됩니다.',
      'php.sitio_sin_php': '해당 사이트는 PHP를 사용하지 않습니다.',
      'php.sitio_no_arranco':
        '변경 후 {sitio} 사이트 전용 PHP가 응답하지 않아 이전 상태로 되돌렸습니다.',
      'php.sin_puertos_sitio': '사이트 전용 PHP에 사용할 수 있는 빈 포트가 남아 있지 않습니다.',
      'xdebug.launch_invalido':
        '프로젝트의 .vscode/launch.json을 해석하지 못해 아무것도 변경되지 않았습니다.',
      'xdebug.launch_no_seguro':
        '.vscode 폴더 또는 launch.json이 링크이거나 다른 항목이므로 여기에 쓰지 않습니다.',
      'xdebug.sin_configurar': 'launch.json을 생성하기 전에 사이트에서 Xdebug를 먼저 구성하십시오.',
      'nginx.sitio_no_existe': '해당 사이트가 더 이상 존재하지 않습니다.',
      'nginx.texto_invalido':
        'vhost 텍스트가 너무 길거나 비어 있거나 제어 문자가 포함되어 있습니다.',
      'nginx.sintaxis': '{linea}번 줄: {detalle}. 아무것도 변경되지 않았습니다.',
      'nginx.directiva_prohibida':
        '{linea}번 줄: "{directiva}" 지시어는 사이트의 vhost에서 허용되지 않습니다(다른 사이트나 프로젝트 외부 파일에 영향을 줄 수 있습니다). 아무것도 변경되지 않았습니다.',
      'nginx.ruta_fuera':
        '{linea}번 줄: "{directiva}" 지시어가 프로젝트 폴더나 해당 로그 및 인증서 외부를 가리킵니다. 아무것도 변경되지 않았습니다.',
      'nginx.fuera_de_server':
        '{linea}번 줄: 전체 vhost에는 "server" 블록만 포함할 수 있으며 "{directiva}" 지시어가 블록 밖에 있습니다. 아무것도 변경되지 않았습니다.',
      'nginx.dominio_ajeno':
        '{linea}번 줄: "{nombre}" 도메인은 이 사이트의 도메인이 아닙니다. 먼저 사이트 별칭으로 추가하십시오.',
      'nginx.puerto_ajeno':
        '{linea}번 줄: 사이트는 설정에 구성된 Nginx 포트에서만 수신 대기할 수 있습니다.',
      'nginx.version_no_existe': '해당 vhost 버전이 기록에 더 이상 존재하지 않습니다.',
      'nginx.argumento_invalido': '올바르지 않은 인수입니다: {campo}',
      'nginx.destino_interno':
        '{linea}번 줄: "{directiva}" 지시어가 WolfCore Dev 내부 서비스(Adminer, Mailpit, 데이터베이스, 다른 사이트의 PHP 등)를 가리키고 있어 네트워크 및 터널에 노출될 위험이 있습니다. 아무것도 변경되지 않았습니다.',
      'nginx.caido_tras_restaurar':
        'Nginx가 다시 응답하지 않아 이전 vhost로 복원했으나 여전히 응답하지 않습니다. 서비스와 Nginx 로그를 확인하십시오. {salida}',
      'depuracion.puerto_ocupado':
        '{puerto} 포트가 이미 사용 중이어서 덤프 캡처가 수신 대기할 수 없습니다. 해당 포트를 사용하는 프로그램(예: Symfony의 server:dump)을 종료하십시오.',
      'depuracion.no_iniciado': '덤프 캡처가 꺼져 있습니다.',
      'depuracion.tipo_no_soportado': '덤프 캡처는 PHP 및 FastAPI 사이트에서 지원됩니다.',
      'depuracion.confirmacion': '대화 상자에서 덤프 캡처를 확인하십시오.',
      'depuracion.argumento_invalido': '유효하지 않은 인수입니다: {campo}',
      'depuracion.archivo_fuera_del_sitio':
        '해당 파일은 사이트 폴더 밖에 있으므로 편집기에서 열 수 없습니다.',
      'contenedores.motor_invalido': '알 수 없는 컨테이너 엔진입니다.',
      'contenedores.id_invalido': '컨테이너 ID가 유효하지 않습니다.',
      'contenedores.argumento_invalido': '유효하지 않은 인수입니다: {campo}',
      'contenedores.sin_motor': '이 컴퓨터에 {motor}이(가) 설치되어 있지 않습니다.',
      'contenedores.no_responde':
        '{motor}이(가) 응답하지 않습니다. Docker Desktop을 열거나 Podman 머신을 시작한 후 다시 시도하십시오.',
      'contenedores.remoto':
        '{motor}의 기본 연결이 다른 컴퓨터를 가리키고 있습니다. WolfCore Dev는 로컬 엔진만 사용합니다.',
      'contenedores.no_existe': '컨테이너가 더 이상 존재하지 않습니다. 목록을 새로 고치십시오.',
      'contenedores.accion_fallo': '엔진에서 작업을 완료하지 못했습니다: {detalle}',
      'contenedores.demasiados_registros':
        '동시에 추적할 수 있는 컨테이너 로그는 최대 {maximo}개입니다.',
      'contenedores.sin_confirmar': '대화 상자에서 작업을 확인하십시오.',
      'catalogo.indice_invalido':
        '{servicio} 버전 인덱스가 검증을 통과하지 못했습니다. 저장된 목록을 사용합니다.',
      'catalogo.sin_huella':
        '{servicio} {version}에는 게시된 체크섬이 없습니다. 대화 상자에서 설치를 확인하십시오.',
      'catalogo.huella_debil':
        '{servicio} {version}에는 취약한 체크섬(MD5 또는 SHA-1)만 있습니다. 대화 상자에서 설치를 확인하십시오.',
      'catalogo.huella_no_coincide': '다운로드한 파일이 게시된 체크섬과 일치하지 않습니다.',
      'catalogo.redireccion_ajena': '다운로드가 허용되지 않은 사이트({host})로 이동하려 했습니다.',
      'catalogo.demasiadas_redirecciones':
        '다운로드 중 리디렉션이 너무 많이 발생했습니다({maximo}회 초과).',
      'catalogo.respuesta_grande': '서버 응답이 너무 큽니다.',
      'catalogo.version_no_encontrada':
        '{servicio}의 {version} 버전이 카탈로그에 없습니다.',
      'catalogo.huella_no_disponible':
        '{servicio} {version}의 체크섬을 가져오지 못했습니다(오프라인 상태이거나 원본 서버가 응답하지 않음). 다시 시도하십시오.',
      'catalogo.firma_invalida':
        '{servicio} {version}의 PGP 서명이 유효하지 않거나 게시되어 있지 않습니다. 아무것도 설치되지 않았습니다.',
      'catalogo.firma_no_soportada':
        '{servicio} {version}의 PGP 서명이 WolfCore Dev에서 검증하지 않는 형식을 사용합니다. 아무것도 설치되지 않았습니다.',
      'catalogo.clave_desconocida':
        '{servicio} {version}의 서명이 앱에 고정된 키 목록에 없는 키로 생성되었습니다. 아무것도 설치되지 않았습니다.',
      'catalogo.firma_vencida':
        '{servicio} {version}의 서명 또는 키가 만료되었습니다. 아무것도 설치되지 않았습니다. 최신 키를 사용하려면 WolfCore Dev를 업데이트하십시오.',
      'catalogo.reloj_atrasado':
        '{servicio} {version}의 서명 날짜가 미래로 되어 있습니다. 컴퓨터의 날짜와 시간을 확인한 후 다시 시도하십시오.',
      'acceso_bd.datos_invalidos': '데이터베이스 접속 정보가 유효하지 않습니다.',
      'acceso_bd.sin_base': '이 프로젝트의 .env 파일이 데이터베이스를 가리키고 있지 않습니다.',
      'acceso_bd.motor_no_soportado':
        'phpMyAdmin은 MySQL 및 MariaDB 데이터베이스만 열 수 있습니다. PostgreSQL에는 Adminer를 사용하십시오.',
      'acceso_bd.servidor_no_resuelto':
        '이 프로젝트의 데이터베이스는 WolfCore Dev 로컬 서버에 속하지 않습니다.',
      'acceso_bd.no_listo':
        '도구가 준비되지 않았습니다. 서비스에서 설치하고 PHP를 켜십시오.',
      'auditoria.tabla_invalida': '해당 데이터베이스에 테이블이 존재하지 않습니다.',
      'auditoria.columna_invalida':
        '해당 테이블에 열이 존재하지 않습니다(사용자 열과 해시 열은 서로 달라야 합니다).',
      'auditoria.usuario_no_encontrado': '해당 사용자를 가진 계정이 없습니다.',
      'auditoria.usuario_repetido':
        '해당 사용자를 가진 계정이 둘 이상입니다. 잘못된 계정을 변경하지 않도록 재설정을 중단했습니다.',
      'auditoria.formato_no_soportado':
        '현재 해시 형식을 재현할 수 없어 재설정하지 않습니다.',
      'auditoria.clave_larga':
        'bcrypt는 비밀번호의 처음 72바이트만 사용합니다. 더 짧은 비밀번호를 선택하십시오.',
      'auditoria.clave_invalida': '새 비밀번호가 유효하지 않습니다.',
      'auditoria.sin_confirmar': '이 비밀번호를 재설정할지 확인하십시오.',
      'auditoria.respaldo_previo_fallo':
        '재설정 전에 데이터베이스 백업을 저장하지 못했습니다. 아무것도 변경되지 않았습니다.',
      'auditoria.copia_fallo': '행 사본을 저장하지 못했습니다. 아무것도 변경되지 않았습니다.',
      'auditoria.motor_no_soportado':
        '비밀번호 감사는 MySQL, MariaDB 및 PostgreSQL에서 지원됩니다.',
      'auditoria.cancelada': '감사가 취소되었습니다.',
      'auditoria.usuario_invalido': '사용자는 1자에서 256자 사이여야 합니다.',
      'auditoria.en_curso': '이미 진행 중인 감사가 있습니다. 완료될 때까지 기다리거나 취소하십시오.',
      'auditoria.base_sistema': '시스템 데이터베이스는 감사할 수 없습니다. 프로젝트 데이터베이스를 선택하십시오.',
      'auditoria.esquema_invalido': '해당 데이터베이스에 스키마가 존재하지 않습니다.',
      'auditoria.fila_cambio':
        '그사이에 계정이 변경되어 재설정하지 않았습니다. 다시 시도하십시오.',
      'auditoria.verificacion_fallo':
        '데이터베이스에 비밀번호가 예상대로 저장되지 않아 변경 사항을 되돌렸습니다.',
      'auditoria.columna_corta':
        '해시 열은 최대 {largo}자를 허용하지만 새 해시에는 {necesario}자가 필요합니다. 아무것도 변경되지 않았습니다. 열 길이를 늘리십시오.',
      'auditoria.datos_reales_sin_confirmar':
        '이 데이터베이스에는 실제 고객 데이터가 들어 있습니다. 비밀번호를 재설정하려면 강화된 확인 절차가 필요합니다.',
      'instantaneas.id_invalido': '스냅샷이 유효하지 않습니다.',
      'instantaneas.no_encontrada': '스냅샷을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.',
      'instantaneas.otra_base': '이 스냅샷은 다른 데이터베이스의 것이므로 여기에 적용할 수 없습니다.',
      'instantaneas.sin_confirmar': '이 스냅샷으로 복원할지 확인하십시오.',
      'instantaneas.motor_no_soportado': '스냅샷은 MySQL, MariaDB 및 PostgreSQL에서 지원됩니다.',
      'instantaneas.demasiado_grande':
        '데이터베이스 크기가 스냅샷 최대 허용 크기인 {maximo} MB를 초과합니다.',
      'instantaneas.sin_espacio':
        '스냅샷을 생성할 여유 공간이 부족합니다. {necesarios} MB가 필요하지만 {libres} MB만 남아 있습니다.',
      'instantaneas.limite':
        '이 데이터베이스의 스냅샷이 이미 {maximo}개 있습니다. 새 스냅샷을 만들려면 기존 스냅샷을 삭제하십시오.',
      'instantaneas.tomar_fallo': '스냅샷을 생성하지 못했습니다. 데이터베이스는 변경되지 않았습니다.',
      'instantaneas.huella_no_coincide':
        '스냅샷 파일이 변경되었거나 손상되었습니다. 아무것도 복원되지 않았습니다.',
      'instantaneas.respaldo_previo_fallo':
        '데이터베이스의 현재 상태를 저장하지 못했습니다. 아무것도 복원되지 않았습니다.',
      'instantaneas.restauracion_fallo':
        '스냅샷을 복원하지 못했습니다. 데이터베이스가 이전 상태로 되돌아갔습니다. 원인: {detalle}',
      'instantaneas.restauracion_sin_copia':
        '스냅샷을 복원하지 못했으며 이전 상태도 백업되지 않았습니다. 데이터베이스가 비어 있거나 일부만 남아 있을 수 있습니다. 원인: {detalle}',
      'instantaneas.restauracion_sin_revertir':
        '스냅샷을 복원하지 못했으며 이전 상태로 되돌리지도 못했습니다. 이전 상태는 자동 스냅샷 {respaldo}에 저장되어 있습니다. 스냅샷 메뉴에서 복원하십시오.',
    },
  },
  instantaneas: {
    abrir: '스냅샷',
    titulo: (base: string) => `${base} 스냅샷`,
    ayuda:
      '스냅샷은 데이터베이스의 현재 상태를 그대로 저장합니다. 원할 때 언제든 복원할 수 있으며, 복원하기 전에 현재 상태의 스냅샷이 자동으로 저장됩니다.',
    ubicacion:
      '스냅샷은 WolfCore Dev 데이터 폴더에 저장되며 현재 사용자만 읽을 수 있습니다. 서비스와 해당 데이터에는 영향을 주지 않습니다.',
    notaEtiqueta: '메모(선택 사항)',
    notaMarcador: '예: 마이그레이션 전',
    tomar: '스냅샷 생성',
    tomada: '스냅샷이 저장되었습니다',
    cargando: '스냅샷을 불러오는 중…',
    vacio: '이 데이터베이스의 스냅샷이 아직 없습니다.',
    automatica: '자동',
    sinNota: '메모 없음',
    detalle: (tablas: number, tamano: string) =>
      `테이블 ${tablas}개 · ${tamano}`,
    volver: '이 스냅샷으로 복원',
    borrar: '삭제',
    borrada: '스냅샷이 휴지통으로 이동되었습니다',
    papelera:
      '삭제된 스냅샷은 WolfCore Dev 휴지통에서 7일 동안 복구할 수 있습니다.',
    cerrar: '닫기',
    papeleraTitulo: '휴지통',
    papeleraVacia: '휴지통에 스냅샷이 없습니다.',
    recuperar: '복구',
    recuperada: '스냅샷이 복구되었습니다',
    borradaEl: (fecha: string) => `${fecha}에 삭제됨`,
    borrarPregunta: '이 스냅샷을 휴지통으로 이동하시겠습니까?',
    borrarSi: '휴지통으로 이동',
    notaAutomatica: (fecha: string) =>
      `${fecha} 스냅샷으로 복원하기 전에 저장된 이전 상태`,
    notaAutomaticaSinOrigen: '다른 스냅샷으로 복원하기 전에 저장된 이전 상태',
    extensionesAviso: (lista: string) =>
      `PostgreSQL 확장(${lista})이 포함되어 있으며, 이 컴퓨터의 체크섬 기록이 있어야만 복원됩니다.`,
    limites:
      'MySQL과 MariaDB에서는 루틴, 트리거 및 이벤트도 함께 저장됩니다. PostgreSQL에서는 단일 데이터베이스의 압축 덤프로 저장되며 서버 역할이나 사용자는 포함되지 않습니다. 이 컴퓨터에서 생성된 것으로 확인되지 않는 스냅샷은 해당 데이터베이스로 제한된 사용자로 복원되며, 다른 사용자의 뷰, 루틴 및 트리거는 지원되지 않습니다.',
    basesBorradas: '더 이상 존재하지 않는 데이터베이스의 스냅샷',
    basesBorradasAyuda: '스냅샷에서 다시 생성할 데이터베이스를 선택하십시오.',
    dialogoVolver: {
      titulo: (base: string) => `${base} 스냅샷으로 복원`,
      cargando: '미리 보기를 준비하는 중…',
      base: '데이터베이스',
      instantanea: '스냅샷',
      ahora: '현재',
      tamano: '크기',
      tablas: '테이블',
      nota: '메모',
      aviso: (base: string) =>
        `${base} 데이터베이스가 이 스냅샷으로 완전히 교체됩니다. 그 이후 변경된 내용은 데이터베이스에서 삭제됩니다. 복원 전에 현재 상태의 자동 스냅샷이 저장되며, 문제가 발생하면 데이터베이스가 해당 상태로 자동 복구됩니다.`,
      pedir: (base: string) => `확인하려면 ${base}을(를) 입력하십시오`,
      confirmar: '이 스냅샷으로 복원',
      trabajando: (base: string) => `${base} 복원 중… 완료될 때까지 프로그램을 닫지 마십시오.`,
      hecho: (base: string) => `${base} 데이터베이스가 스냅샷으로 복원되었습니다`,
      respaldoPrevio: '이전 상태가 다음 자동 스냅샷에 저장되었습니다:',
      advertencias: '복원이 완료되었으나 알림이 있습니다:',
      hechoConAvisos: (base: string) => `${base} 데이터베이스가 스냅샷으로 복원되었습니다(알림 있음)`,
      baseVacia: '데이터베이스가 존재하지 않거나 비어 있어 복원 전에 저장할 내용이 없습니다.',
      sinGuardarTitulo: '현재 상태를 저장하지 못했습니다',
      sinGuardarTexto:
        'WolfCore Dev가 복원 전에 데이터베이스의 현재 상태를 저장하지 못했습니다. 저장하지 않은 채 계속 진행하여 복원에 실패하면 현재 데이터베이스 데이터가 손실됩니다.',
      sinGuardarConfirmar: '현재 데이터베이스 데이터가 손실된다는 점을 이해합니다',
      sinGuardarBoton: '현재 상태를 저장하지 않고 복원',
    },
  },
  avisoInicio: {
    titulo: 'WolfCore Dev 알림',
  },
  tareas: {
    titulo: '예약 작업',
    resumen: (n: number) => (n === 0 ? '작업 없음' : `작업 ${n}개`),
    mostrar: '작업 보기',
    ocultar: '숨기기',
    cargando: '작업을 불러오는 중',
    errorCargar: '작업을 불러오지 못했습니다',
    soloAbierta:
      '작업은 WolfCore Dev가 열려 있는 동안에만 실행됩니다. Windows 작업 스케줄러를 사용하지 않으므로 앱이 닫혀 있거나 컴퓨터가 절전 모드일 때는 실행되지 않으며, 놓친 실행은 다시 실행되지 않습니다.',
    repoEjecuta:
      '신뢰하는 프로젝트에서는 저장소 내부의 항목이 그대로 실행됩니다(작업에 지정된 파일, `artisan`, `package.json` 스크립트, `.venv` 등). `git pull` 시 파일이 변경되면 작업은 새 버전을 실행합니다.',
    vacio:
      '이 프로젝트에는 예약 작업이 없습니다. 새 작업을 만들어 보십시오(예: Laravel에서 매분 "php artisan schedule:run" 실행).',
    nueva: '새 작업',
    pausada: '일시 중지됨',
    enCurso: '실행 중…',
    nunca: '아직 실행되지 않음',
    ultima: (f: string) => `최근: ${f}`,
    proxima: (f: string) => `다음: ${f}`,
    codigo: (n: number) => `코드 ${n}`,
    resultadoTitulo: (n: string) => `"${n}"`,
    origen: { usuario: '직접 작성', 'wolfcore.yml': 'wolfcore.yml 출처' },
    describir: {
      cadaMinuto: '매분',
      cadaN: (n: number) => `${n}분마다`,
      cadaHora: '매시 정각',
      diaria: (h: string) => `매일 ${h}`,
      laborables: (h: string) => `월요일~금요일 ${h}`,
      personalizada: (e: string) => `Cron ${e}`,
    },
    estado: {
      ok: '성공',
      fallo: '실패',
      tiempo: '제한 시간 초과',
      cancelada: '취소됨',
      omitida: '건너뜀',
      bloqueada: '실행되지 않음',
    },
    motivo: {
      aislado:
        '테스트 데이터 폴더(WOLFCORE_DATOS)입니다. 이 세션에서 작업을 허용해야 실행됩니다.',
      no_confiado:
        '프로젝트가 신뢰됨으로 표시되지 않았습니다. 실행하려면 "이 저장소를 신뢰합니다"를 선택하십시오.',
      receta_cambio:
        '프로젝트를 신뢰한 이후 레시피가 변경되었습니다. 내용을 검토한 후 "이 저장소를 신뢰합니다"를 다시 선택하십시오.',
      sin_confirmar: '명령 확인이 필요합니다. 검토하고 확인해야 실행됩니다.',
      comando_invalido: '허용되지 않는 명령입니다(php, node, npm run, python만 허용됩니다).',
      cron_invalida: '일정이 유효한 cron 표현식이 아닙니다.',
      carpeta: '프로젝트 폴더가 존재하지 않습니다.',
      solapada: '이전 작업이 아직 실행 중이어서 이번 실행을 건너뛰었습니다.',
      retraso: '예정 시각이 지났습니다(앱이 일시 중단된 상태였음). 다시 실행되지 않습니다.',
      error: '프로그램을 실행하지 못했습니다.',
    },
    acciones: {
      ejecutar: '지금 실행',
      editar: '편집',
      borrar: '삭제',
      verRegistro: '로그 보기',
      revisarConfirmar: '검토 및 확인',
      activar: (n: string) => `${n} 작업 활성화`,
    },
    borrar: {
      titulo: (n: string) => `"${n}" 작업을 삭제하시겠습니까?`,
      texto:
        '작업과 실행 기록이 삭제됩니다. 이미 실행된 내용은 되돌려지지 않으며 프로젝트 파일에는 영향을 주지 않습니다.',
      confirmar: '삭제',
      hecho: (n: string) => `"${n}" 작업이 삭제되었습니다.`,
    },
    aislado: {
      titulo: '테스트 데이터 폴더입니다.',
      texto:
        'WOLFCORE_DATOS 환경에서는 어떤 작업도 자동으로 실행되지 않습니다. 이 세션에서 테스트하려는 경우에만 허용하십시오.',
      permitir: '이 세션에서 허용',
      confirmarTitulo: '이 테스트 폴더에서 작업을 허용하시겠습니까?',
      confirmarTexto:
        '앱을 닫을 때까지 신뢰하는 프로젝트의 활성 작업들이 실행되기 시작합니다. 각 프로젝트의 명령은 실제 프로젝트 폴더에서 실행됩니다.',
      permitido: '이 세션에서 작업이 허용되었습니다.',
    },
    yml: {
      titulo: 'wolfcore.yml 제안 작업',
      texto:
        '프로젝트 파일에서 다음 작업을 제안합니다. 파일에 적혀 있다고 해서 자동으로 실행되지는 않습니다. 명령을 검토하고 확인하여 채택하십시오.',
      estado: { nueva: '신규', adoptada: '채택됨', cambiada: '변경됨' },
      revisar: '검토 및 채택',
      cambiada:
        '채택한 이후 wolfcore.yml의 명령이 변경되었습니다. 프로젝트 작업은 기존에 확인한 명령으로 유지되며, 새 버전을 신뢰하는 경우 채택하십시오.',
      guardarEn: 'wolfcore.yml에 저장',
      escribirTitulo: 'wolfcore.yml에 작업을 기록하시겠습니까?',
      escribirTexto:
        '저장소와 함께 공유되도록 프로젝트 파일에 작업을 추가하거나 업데이트합니다(나머지 내용은 건드리지 않음). 저장소를 복제하는 사용자는 자신의 컴퓨터에서 이를 확인해야 합니다.',
      escribir: '기록',
      escrita: '작업이 wolfcore.yml에 저장되었습니다.',
    },
    registro: {
      titulo: (n: string) => `"${n}" 로그`,
      historial: '최근 실행 기록',
      sinHistorial: '아직 실행 기록이 없습니다.',
      salida: '마지막 실행 출력',
      sinSalida: '저장된 출력이 없습니다.',
      enmascarado:
        '로그에서는 비밀번호와 키가 마스킹되며, 최대 크기가 제한되어 자동으로 순환됩니다.',
      origen: { programada: '예약됨', manual: '수동' },
    },
    dialogo: {
      tituloNueva: '새 예약 작업',
      tituloEditar: '예약 작업 편집',
      tituloAdoptar: 'wolfcore.yml 작업 채택',
      tituloConfirmar: '작업 명령 확인',
      nombre: '이름',
      nombrePlaceholder: 'Laravel 작업',
      horario: '실행 시기',
      preset: {
        cadaMinuto: '매분',
        cadaN: '몇 분마다',
        cadaHora: '매시간',
        diaria: '매일 지정 시각',
        laborables: '월요일~금요일 지정 시각',
        personalizada: '사용자 지정 cron 표현식',
      },
      cadaNOpcion: (n: number) => `${n}분마다`,
      hora: '시각',
      horaPlaceholder: '03:00',
      horaInvalida: '유효한 시각을 입력하십시오(예: 03:00).',
      expresion: 'Cron 표현식',
      cronEquivale: 'Cron 표현식:',
      expresionAyuda:
        '5개 필드: 분, 시, 일, 월, 요일(* , - /). 최소 주기는 1분마다입니다.',
      proximas: '다음 실행 예정:',
      comando: '명령',
      comandoPlaceholder: 'php artisan schedule:run',
      comandoAyuda:
        '프로젝트 파일과 함께 php, node, npm run, python만 사용할 수 있습니다. 셸 없이 그리고 인라인 코드(-r, -e, -c) 없이 프로젝트 폴더에서 실행됩니다.',
      comandoFijo:
        '이 명령에는 텍스트로 입력할 수 없는 따옴표 포함 인수가 있어 그대로 유지되며 여기에서 편집할 수 없습니다(변경하려면 삭제 후 새로 만드십시오).',
      argumentos: '다음 인수로 실행됩니다:',
      comillasSinCerrar: '닫히지 않은 따옴표가 있습니다.',
      tiempo: '제한 시간',
      minutos: '분',
      tiempoAyuda: '제한 시간을 초과하면 자동으로 중지됩니다(해당 프로세스와 하위 프로세스만 해당).',
      activa: '활성화(앱이 열려 있는 동안 자동 실행)',
      advertencia:
        '승인하면 이 정확한 명령의 실행을 허용하게 됩니다. 지정된 시점마다 이 프로젝트 폴더에서 자동으로 실행됩니다. 명령을 변경하면 다시 확인해야 합니다.',
      revise: '이 명령을 검토했으며 내용을 확인했습니다.',
      guardar: '저장 및 명령 확인',
      adoptar: '확인 및 채택',
      confirmar: '명령 확인',
      guardada: '작업이 저장되었습니다.',
      adoptada: '작업이 채택되었습니다.',
      confirmada: '명령이 확인되었습니다.',
    },
  },
  workspaces: {
    titulo: '워크스페이스',
    descripcion:
      '함께 켜고 끌 수 있는 데이터베이스, 서비스 및 프로세스의 이름 지정 묶음입니다.',
    nuevo: '새 워크스페이스',
    vacio:
      '아직 워크스페이스가 없습니다. 예를 들어 PostgreSQL, Redis, Ollama 및 프로젝트 프로세스를 묶은 "FastAPI 봇" 워크스페이스를 만들어 보십시오.',
    elementos: (n: number) => `항목 ${n}개`,
    sinElementos: '항목 없음',
    estado: { apagado: '꺼짐', parcial: '일부 켜짐', encendido: '켜짐' },
    acciones: {
      iniciar: '켜기',
      detener: '끄기',
      editar: '편집',
      borrar: '삭제',
      cerrar: '닫기',
    },
    borrar: {
      titulo: (n: string) => `"${n}" 워크스페이스를 삭제하시겠습니까?`,
      texto:
        '워크스페이스를 삭제해도 항목이 꺼지거나 삭제되지 않으며 묶음만 제거됩니다. 켜져 있는 항목은 그대로 유지됩니다.',
      confirmar: '삭제',
      hecho: (n: string) => `"${n}" 워크스페이스가 삭제되었습니다.`,
    },
    dialogo: {
      tituloNuevo: '새 워크스페이스',
      tituloEditar: '워크스페이스 편집',
      nombre: '이름',
      nombrePlaceholder: 'FastAPI 봇',
      nombreVacio: '이름을 입력하십시오.',
      aviso:
        '워크스페이스는 어떤 항목을 켤지만 저장합니다. 터널을 열거나 로컬 네트워크에 공유하지 않으며, 신뢰하지 않는 프로젝트의 프로세스는 시작하지 않습니다.',
      secciones: {
        instancias: '데이터베이스',
        servicios: '서비스',
        procesos: '프로젝트 프로세스',
      },
      sinOpciones: '여기에서 선택할 수 있는 항목이 없습니다.',
      captadorUnico: '메일 캡처 도구는 한 번에 하나만 사용할 수 있습니다. 다른 항목을 선택하면 이전 항목을 대체합니다.',
      yaNoExisten: (lista: string) => `더 이상 존재하지 않으며 저장 시 제거됩니다: ${lista}`,
      guardar: '저장',
      guardado: (n: string) => `"${n}" 워크스페이스가 저장되었습니다.`,
    },
    resultado: {
      tituloIniciar: (n: string) => `"${n}": 시작 결과`,
      tituloDetener: (n: string) => `"${n}": 중지 결과`,
      encendido: '켜짐',
      apagado: '꺼짐',
      yaEncendido: '이미 켜져 있었음',
      yaApagado: '이미 꺼져 있었음',
      noExiste: '더 이상 존재하지 않아 무시됨',
      compartido: '켜진 상태 유지: 실행 중인 다른 워크스페이스에서 사용 중',
      reemplaza: (otro: string) => `켜짐(동일 메일 그룹의 ${otro}을(를) 끔)`,
      fallo: '켜지지 않았음',
      falloApagar: '여전히 켜져 있음',
      ok: (n: string) => `"${n}" 준비 완료.`,
      parcial: (n: string, encendidos: number, total: number) =>
        `"${n}": ${total}개 중 ${encendidos}개가 켜졌습니다. 시작되지 않은 항목을 확인하십시오.`,
      parcialApagar: (n: string, siguen: number) =>
        `"${n}": ${siguen}개 항목이 여전히 켜져 있습니다. 꺼지지 않은 항목을 확인하십시오.`,
    },
  },
  inicio: {
    titulo: '홈',
    bienvenida: '개발 환경을 한눈에 확인하십시오.',
    tiles: {
      servicios: '실행 중인 서비스',
      serviciosDe: (total: number) => `전체 ${total}개 중`,
      sitios: '프로젝트',
      tuneles: '활성 터널',
      hosts: '대기 중인 hosts',
      hostsOk: '모두 정상',
      hostsFaltan: '확인 필요',
    },
    hosts: {
      titulo: 'hosts 파일에 등록되지 않은 도메인이 있습니다',
      texto:
        '이 도메인들은 아직 이 컴퓨터를 가리키고 있지 않습니다. 수정할 때 Windows에서 관리자 권한을 요청합니다.',
      corregir: '대기 중인 hosts 적용',
      reintentarPermiso: '권한으로 다시 시도',
      corregido: 'hosts 파일이 업데이트되었습니다',
      fallo: 'hosts 파일을 업데이트하지 못했습니다',
      verInstrucciones: '안내 보기',
      duplicados:
        '다음 도메인은 WolfCore Dev 블록 외부의 hosts에 이미 등록되어 있습니다(그대로 유지됨):',
      motivos: {
        cancelado: '관리자 권한 요청이 취소되었습니다. hosts 파일은 변경되지 않았습니다.',
        tiempo:
          '관리자 권한 요청에 제때 응답하지 않았습니다. 사이트는 저장되었으나 hosts 파일은 변경되지 않았습니다. Windows 알림이 아직 표시되어 있다면 취소하십시오(더 이상 적용되지 않음). 가능할 때 대기 중인 항목을 적용하십시오(한 번의 권한 승인으로 모두 적용됩니다).',
        denegado:
          'Windows에서 hosts 파일 쓰기를 허용하지 않았습니다. 백신 프로그램이 차단하고 있을 수 있습니다.',
      } as Record<string, string>,
      modalTitulo: 'hosts 수동 수정',
      modalTexto:
        '관리자 권한으로 PowerShell을 열고(시작 마우스 오른쪽 클릭 → 터미널(관리자)), 다음 명령을 붙여넣은 후 Enter 키를 누르십시오.',
    },
    servicios: {
      titulo: '서비스',
      ver: '서비스 보기',
      vacio: '아직 설치된 서비스가 없습니다.',
    },
    tuneles: {
      titulo: '활성 터널',
      vacio: '열려 있는 터널이 없습니다. 프로젝트에서 터널을 열 수 있습니다.',
      sitioDesconocido: '이름 없는 사이트',
    },
  },
  servicios: {
    titulo: '서비스',
    descripcion:
      '웹 서버, PHP, 데이터베이스 및 도구를 켜고 끄십시오. 상태는 자동으로 업데이트됩니다.',
    grupos: {
      web: '웹',
      php: 'PHP',
      bd: '데이터베이스',
      correo: '메일',
      ia: 'AI',
      herramientas: '도구',
    },
    gruposAyuda: {
      web: '.test 도메인을 처리하는 서버입니다.',
      php: '버전별로 하나씩 설치하며(8.3, 8.4…), 각 사이트가 자신의 버전을 사용합니다.',
      bd: '127.0.0.1에서만 수신 대기합니다.',
      correo: '프로젝트가 보내는 메일을 외부 인터넷으로 발송하지 않고 가로챕니다.',
      ia: '이 컴퓨터에서 실행하는 언어 모델입니다.',
      herramientas: '일상 개발용 유틸리티입니다.',
    },
    puerto: '포트',
    cambiarPuerto: '포트 변경',
    cambiarPuertoDe: (nombre: string) => `${nombre} 포트 변경`,
    versionesDe: (nombre: string) => `${nombre} 버전`,
    instancias: (n: number, encendidas: number) => `인스턴스 ${n}개, ${encendidas}개 켜짐`,
    usarPuerto: (p: number) => `포트 ${p} 사용`,
    puertoCambiado: (nombre: string, p: number) => `${nombre}이(가) 이제 포트 ${p}을(를) 사용합니다`,
    conflicto: '포트 사용 중',
    autoIniciar: 'WolfCore Dev 시작 시 자동으로 켜기',
    autoIniciarActivado: (nombre: string) => `WolfCore Dev 시작 시 ${nombre}이(가) 자동으로 켜집니다`,
    autoIniciarDesactivado: (nombre: string) =>
      `WolfCore Dev 시작 시 ${nombre}이(가) 더 이상 자동으로 켜지지 않습니다`,
    dialogoPuerto: {
      titulo: (nombre: string) => `${nombre} 포트`,
      etiqueta: '새 포트',
      ayuda:
        '1024에서 65535 사이의 사용 가능한 포트입니다. 서비스가 켜져 있으면 다시 시작됩니다. 프로젝트의 .env를 업데이트하십시오.',
      rango: '1024에서 65535 사이의 숫자를 사용하십시오',
      igual: '현재 포트와 동일합니다',
      guardar: '포트 변경',
    },
    borrarDatos: {
      opcion: '데이터 삭제',
      titulo: (nombre: string) => `${nombre} 데이터 삭제`,
      copias: (n: number, tam: string) =>
        `업데이트 백업 ${n}개(${tam})도 함께 삭제됩니다. 보관하려면 먼저 데이터 폴더에서 복사하십시오.`,
      /** 서비스별로 삭제되는 데이터입니다. */
      que: {
        mysql: 'MySQL의 모든 데이터베이스와 사용자',
        mariadb: 'MariaDB의 모든 데이터베이스와 사용자',
        postgresql: 'PostgreSQL의 모든 데이터베이스와 사용자',
        redis: 'Redis에 저장된 모든 키와 데이터',
        mongodb: 'MongoDB의 모든 데이터베이스, 컬렉션 및 데이터',
        mailpit: 'Mailpit이 가로챈 모든 메일',
        smtp4dev: 'smtp4dev가 가로챈 모든 메일',
        inbucket: 'Inbucket이 가로챈 모든 메일',
        papercut: 'Papercut SMTP가 가로챈 모든 메일',
        ollama: 'Ollama에서 다운로드한 모든 모델',
      } as Record<string, string>,
      texto: (que: string) =>
        `${que}이(가) 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 프로그램은 설치된 상태로 유지됩니다.`,
      generico: (nombre: string) => `${nombre}의 모든 데이터`,
      pedir: (id: string) => `확인하려면 ${id}을(를) 입력하십시오`,
      boton: '데이터 삭제',
      hecho: (nombre: string) => `${nombre} 데이터가 삭제되었습니다`,
    },
    ftp: {
      interruptor: 'FTP 서버',
      redLocal: '로컬 네트워크 연결 허용',
      redLocalAyuda:
        '꺼져 있으면 이 컴퓨터에서만 연결할 수 있습니다(127.0.0.1). 각 사이트의 접근 권한은 사이트에서 활성화합니다.',
      avisoTitulo: '로컬 네트워크에 FTP 열기',
      avisoTexto:
        'FTP는 사용자 이름, 비밀번호 및 파일을 암호화하지 않고 전송합니다. 네트워크의 모든 컴퓨터가 연결을 시도할 수 있습니다. 신뢰할 수 있는 네트워크에서만 사용하십시오.',
      avisoConfirmar: '허용',
      redLocalActivada: 'FTP가 로컬 네트워크 연결을 허용합니다',
      redLocalDesactivada: 'FTP가 이 컴퓨터의 연결만 허용합니다',
    },
    composer: {
      nombre: 'Composer',
      detalle: 'PHP 의존성 관리자',
      instalado: '설치됨',
      noInstalado: '미설치',
      sinVersion: '미설치',
      uso: '사용법',
      usoTexto: 'composer',
      ayuda: '프로젝트에서 "터미널"을 사용하거나 설정에서 WolfCore Dev를 PATH에 추가하십시오.',
      instaladoOk: 'Composer가 설치되었습니다',
      sinPhp: '먼저 PHP를 설치하십시오',
      actualizado: (v: string) => `Composer 업데이트됨: ${v}`,
    },
    adminer: {
      nombre: 'Adminer',
      detalle: '웹 데이터베이스 관리자',
      direccion: '주소',
      disponible: '준비됨',
      noInstalado: '미설치',
      sinPhp: 'PHP 필요',
      abrir: 'Adminer 열기',
      instaladoOk: 'Adminer가 설치되었습니다',
    },
    phpmyadmin: {
      nombre: 'phpMyAdmin',
      detalle: 'MySQL 및 MariaDB 웹 관리자',
      direccion: '주소',
      disponible: '준비됨',
      noInstalado: '미설치',
      sinPhp: 'PHP 필요',
      abrirDesdeProyecto: '각 프로젝트 카드에서 인증된 상태로 바로 열립니다.',
      faltaExtension: (ext: string, rama: string) =>
        `PHP ${rama} 버전에 ${ext} 확장 기능이 활성화되어 있지 않습니다. PHP를 재시작하거나 php.ini에서 활성화하십시오.`,
      phpFueraDeRango: (rama: string) =>
        `phpMyAdmin은 PHP 8.3까지 지원을 명시하고 있으며 현재 PHP ${rama} 버전이 사용 중이므로 오류가 표시될 수 있습니다. 문제가 발생하면 PHP 7.2~8.3 버전을 실행하십시오.`,
      instalarPrimero: '사용하려면 먼저 phpMyAdmin을 설치하십시오.',
      encenderPhp: 'phpMyAdmin을 사용하려면 PHP를 실행하십시오.',
      instaladoOk: 'phpMyAdmin이 설치되었습니다',
    },
    puertos: '포트',
    pid: 'PID',
    sinVersion: '버전 없음',
    sinPuertos: '—',
    terminado: '오류 없이 완료되었습니다',
    externo: 'WolfCore Dev 외부에서 관리됨',
    verDetalle: '오류 세부 정보 보기',
    vacioTitulo: '아직 서비스가 없습니다',
    vacio:
      '아직 설치된 서비스가 없습니다. 사이트용 Nginx와 PHP 또는 데이터베이스부터 시작하십시오.',
    irAInstalar: '설치로 이동',
  },
  bd: {
    descripcion:
      '프로젝트의 데이터베이스를 생성, 백업 및 복원합니다. 서버는 127.0.0.1에서만 수신 대기합니다.',
    motores: {
      mysql: 'MySQL',
      mariadb: 'MariaDB',
      postgresql: 'PostgreSQL',
      mongodb: 'MongoDB',
    } as Record<string, string>,
    nueva: '새 데이터베이스',
    restaurar: '백업 복원',
    importar: '다른 서버에서 가져오기',
    soloSql: 'MySQL, MariaDB 및 PostgreSQL에서 사용 가능합니다',
    enCursoAyuda: '진행 중인 작업이 끝날 때까지 기다려 주십시오',
    encenderPrimero: (motor: string) => `먼저 ${motor}을(를) 실행하십시오`,
    cargando: '데이터베이스를 불러오는 중…',
    recargar: '목록 새로고침',
    vacioTitulo: '설치된 데이터베이스 서버가 없습니다',
    vacio:
      '데이터베이스를 관리하려면 서비스에서 MySQL, MariaDB, PostgreSQL 또는 MongoDB를 설치하십시오.',
    irAServicios: '서비스로 이동',
    apagado: {
      titulo: (motor: string) => `${motor}이(가) 중지되어 있습니다`,
      texto: (motor: string) => `데이터베이스를 보고 관리하려면 ${motor}을(를) 실행하십시오.`,
      iniciando: (motor: string) => `${motor} 시작 중…`,
      error: (motor: string) => `${motor}을(를) 시작할 수 없습니다`,
      encender: (motor: string) => `${motor} 실행`,
      verServicios: '서비스에서 보기',
    },
    errorLista: '데이터베이스 목록을 읽을 수 없습니다',
    sinBases: '이 서버에는 아직 생성된 데이터베이스가 없습니다.',
    total: (n: number) => plural(n, '데이터베이스'),
    columnas: { nombre: '데이터베이스', tamano: '크기', acciones: '작업' },
    acciones: {
      respaldar: '백업',
      restaurarAqui: '여기에 복원',
      adminer: 'Adminer에서 열기',
      conexion: '연결 정보',
      vector: '벡터 활성화',
      borrar: '삭제',
      de: (accion: string, base: string) => `${accion}: ${base}`,
    },
    adminerNoDisponible: '열려면 서비스에서 Adminer와 PHP를 설치하십시오',
    vectorSinInstalar: '데이터베이스에서 활성화하려면 아래에서 pgvector를 설치하십시오',
    vectorActivado: (base: string) => `${base}에 벡터가 활성화되었습니다`,
    formatos: {
      sql: '일반 SQL',
      pgdump: 'PostgreSQL 백업(pg_dump, 사용자 지정 형식)',
      gz: '압축된 SQL(.gz)',
      zip: '.zip 파일(복원 전 압축 해제됨)',
      rar: '.rar 파일(Windows로 압축 해제 시도)',
      '7z': '.7z 파일(Windows로 압축 해제 시도)',
      desconocido: '인식할 수 없는 형식',
    } as Record<string, string>,
    formatoDesconocido:
      '형식을 인식할 수 없습니다. 압축 파일인 경우 압축을 풀고 내부의 .sql 또는 .dump 파일을 선택하십시오.',
    formatoIncompatible:
      '이 파일은 PostgreSQL 백업입니다. PostgreSQL 탭에서 복원하십시오.',
    nombre: {
      etiqueta: '데이터베이스 이름',
      vacio: '이름을 입력하십시오',
      largo: '이름이 너무 깁니다',
      caracteres: {
        mysql: '영문자, 숫자 및 밑줄(_)만 사용하십시오',
        mariadb: '영문자, 숫자 및 밑줄(_)만 사용하십시오',
        postgresql: '소문자, 숫자 및 밑줄(_)만 사용하십시오',
        mongodb: '영문자, 숫자, 하이픈(-) 및 밑줄(_)만 사용하십시오',
      } as Record<string, string>,
      inicio: 'PostgreSQL에서는 이름이 숫자로 시작할 수 없습니다',
    },
    reemplazo: {
      titulo: (base: string) => `${base} 데이터베이스에 이미 테이블이 있습니다`,
      texto: (base: string) =>
        `계속하면 현재 ${base} 데이터베이스가 완전히 덮어쓰기됩니다. 먼저 자동 백업이 저장된 후 데이터베이스가 삭제되고 새 내용으로 다시 생성됩니다.`,
      donde: '백업 저장 위치',
      carpetaPorDefecto: 'Documentos\\WolfCore Dev\\Respaldos',
      otraBase:
        '덮어쓰기를 원하지 않으면 뒤로 돌아가 다른 이름을 선택하십시오. 새 데이터베이스가 생성됩니다.',
      pedir: (base: string) => `확인하려면 ${base}을(를) 입력하십시오`,
      volver: '뒤로',
      confirmar: '데이터베이스 덮어쓰기',
    },
    resultado: {
      restaurada: (base: string) => `${base} 데이터베이스가 복원되었습니다`,
      importada: (base: string) => `${base} 데이터베이스를 가져왔습니다`,
      respaldada: (base: string) => `${base} 백업이 저장되었습니다`,
      archivo: '파일',
      respaldoPrevio: '이전 데이터베이스 백업',
      advertencias: (n: number) => plural(n, '경고'),
      advertenciasAyuda:
        '작업이 완료되었습니다. 이 알림을 확인하십시오. 대부분 이 컴퓨터에 존재하지 않는 역할이나 권한 관련 내용입니다.',
      fallo: {
        restaurar: '복원할 수 없습니다',
        importar: '가져올 수 없습니다',
        respaldar: '백업할 수 없습니다',
      } as Record<string, string>,
      trasReemplazo: '원본 데이터베이스가 덮어쓰기되었으며 복원이 완료되지 않았습니다',
      trasReemplazoAyuda:
        '이전 데이터는 표시된 백업에 보관되어 있습니다. "백업 복원"을 사용하여 복원할 수 있습니다.',
    },
    progreso: {
      titulo: '로그',
      corriendo: {
        restaurar: (base: string) => `${base} 복원 중…`,
        importar: (base: string) => `${base} 가져오는 중…`,
        respaldar: (base: string) => `${base} 백업 중…`,
      } as Record<string, (base: string) => string>,
      vacio: '도구 출력을 기다리는 중…',
      limitado: (n: number) => `최근 ${n}줄이 표시됩니다.`,
      noCierre:
        '작업이 끝날 때까지 프로그램을 닫지 마십시오. 이 화면을 나갔다가 다시 돌아와도 결과를 확인할 수 있습니다.',
      otraEnCurso: '이미 진행 중인 작업이 있습니다. 끝날 때까지 기다려 주십시오.',
      ver: '세부 정보 보기',
      descartar: '닫기',
    },
    dialogoRestaurar: {
      titulo: (motor: string) => `${motor}에 백업 복원`,
      confianza:
        '신뢰할 수 있는 백업만 복원하십시오. 백업 파일이 서버에서 작업을 실행할 수 있습니다.',
      archivo: '백업 파일',
      elegir: '파일 선택…',
      cambiar: '변경',
      sinArchivo: '선택된 파일 없음',
      formato: '감지된 형식',
      detectando: '형식 감지 중…',
      destino: '대상 데이터베이스',
      destinoAyuda:
        '존재하지 않으면 새로 생성됩니다. 존재하지만 비어 있으면 그대로 사용합니다. 테이블이 있으면 확인을 요청합니다.',
      restaurar: '복원',
    },
    dialogoImportar: {
      titulo: (motor: string) => `다른 서버에서 ${motor}(으)로 가져오기`,
      soloLectura:
        '원본 서버는 읽기 전용으로만 접근합니다. 데이터베이스가 이 컴퓨터로 복사되며 원본은 수정되지 않습니다.',
      detectado: (puerto: number) =>
        `포트 ${puerto}에서 다른 서버가 감지되었습니다(예: FlyEnv).`,
      origen: '원본 서버',
      host: '서버',
      puerto: '포트',
      usuario: '사용자',
      clave: '비밀번호',
      claveAyuda: '이 복사 작업에만 사용되며 저장되지 않습니다.',
      baseOrigen: '원본 데이터베이스',
      destino: '이 컴퓨터의 대상 데이터베이스',
      destinoAyuda:
        '존재하지 않으면 새로 생성됩니다. 테이블이 있으면 덮어쓰기 전에 확인을 요청합니다.',
      faltaHost: '서버를 입력하십시오',
      faltaPuerto: '1에서 65535 사이의 포트를 사용하십시오',
      faltaUsuario: '사용자를 입력하십시오',
      faltaBase: '원본 데이터베이스를 입력하십시오',
      importar: '가져오기',
    },
    dialogoNueva: {
      titulo: (motor: string) => `${motor}의 새 데이터베이스`,
      codificacion: '인코딩',
      codificacionValor: {
        mysql: 'utf8mb4 (이모지 및 모든 다국어 문자 지원)',
        mariadb: 'utf8mb4 (이모지 및 모든 다국어 문자 지원)',
        postgresql: 'UTF8',
        mongodb: 'UTF-8',
      } as Record<string, string>,
      usuarioPropio: '이 데이터베이스용 전용 사용자 생성',
      usuarioPropioAyuda:
        '선택 사항입니다. 생성하지 않으면 프로젝트에서 서버 관리자 계정을 사용합니다.',
      usuario: '사용자',
      clave: '비밀번호',
      faltaClave: '비밀번호를 입력하십시오',
      crear: '데이터베이스 생성',
      creada: (base: string) => `${base} 데이터베이스가 생성되었습니다`,
      mongo: 'MongoDB에서는 초기 컬렉션(_pel_init)과 함께 데이터베이스가 생성됩니다.',
      cambiarClave: '비밀번호 변경',
      cambiarClaveTitulo: (u: string) => `사용자 ${u}이(가) 이미 다른 비밀번호로 존재합니다`,
      cambiarClaveTexto: (u: string) =>
        `${u}의 비밀번호를 변경하면 해당 계정을 이미 사용 중인 프로젝트는 .env를 업데이트할 때까지 연결이 끊깁니다. 일반적으로 현재 비밀번호를 그대로 사용합니다. 그래도 변경하시겠습니까?`,
    },
    dialogoBorrar: {
      titulo: (base: string) => `${base} 데이터베이스를 삭제하시겠습니까?`,
      texto: (base: string, motor: string) =>
        `${motor}의 ${base} 데이터베이스와 모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 필요하면 먼저 백업하십시오.`,
      pedir: (base: string) => `확인하려면 ${base}을(를) 입력하십시오`,
      boton: '데이터베이스 삭제',
      hecho: (base: string) => `${base} 데이터베이스가 삭제되었습니다`,
    },
    dialogoRespaldar: {
      titulo: (base: string) => `${base} 백업`,
      destino: '저장 위치',
      porDefecto: 'Documentos\\WolfCore Dev\\Respaldos (기본 폴더)',
      porDefectoEn: (carpeta: string) => `${carpeta} (기본 폴더)`,
      cambiar: '다른 폴더 선택…',
      porDefectoVolver: '기본 폴더 사용',
      formato: {
        mysql: '.sql 파일(루틴 및 트리거 포함 mysqldump)',
        mariadb: '.sql 파일(루틴 및 트리거 포함 mysqldump)',
        postgresql: '.dump 파일(pg_dump, 사용자 지정 형식)',
      } as Record<string, string>,
      boton: '백업',
    },
    dialogoConexion: {
      sitio: '프로젝트',
      sitioAyuda:
        '기존에 설정된 변수를 사용하기 위해 사이트의 .env 파일을 읽습니다(예: CodeIgniter 4). 해당 내용은 표시되거나 복사되지 않습니다.',
      generico: '일반 (Laravel 형식)',
      titulo: (base: string) => `${base} 연결`,
      host: '서버',
      puerto: '포트',
      usuario: '사용자',
      clave: '비밀번호',
      base: '데이터베이스',
      sinClave: '비밀번호 없음(127.0.0.1에서만 수신 대기)',
      mostrar: '비밀번호 표시',
      ocultar: '비밀번호 숨기기',
      copiarDato: (dato: string) => `${dato} 복사`,
      env: '.env 파일용 블록',
      envAyuda: '프로젝트의 .env에 붙여넣으십시오. WolfCore Dev는 프로젝트 파일을 직접 수정하지 않습니다.',
      copiarEnv: '블록 복사',
      cargando: '연결 정보를 읽는 중…',
    },
    pgvector: {
      titulo: 'pgvector',
      enCurso: '이미 pgvector 설치가 진행 중입니다.',
      descripcion:
        'PostgreSQL 내부의 유사도 검색(임베딩) 확장 기능입니다. 공식 소스 코드에서 컴파일됩니다.',
      instalado: (v: string | null) => (v ? `설치됨 (버전 ${v})` : '설치됨'),
      noInstalado: '미설치',
      herramientas: '빌드 도구',
      herramientasSi: '준비됨',
      herramientasNo: '누락됨',
      instalar: 'pgvector 설치',
      reinstalar: '다시 컴파일',
      instalarHerramientas: '빌드 도구 설치',
      dialogoHerramientasTitulo: '빌드 도구 설치',
      dialogoHerramientas:
        'pgvector를 컴파일하려면 Visual Studio용 Build Tools가 필요합니다. 약 6 GB가 다운로드되며 Windows에서 관리자 권한을 요청합니다. 시간이 꽤 걸릴 수 있으니 WolfCore Dev를 열어 두십시오.',
      dialogoCompilarTitulo: 'pgvector 컴파일 및 설치',
      dialogoCompilar:
        'pgvector 공식 소스 코드를 다운로드하여 컴파일한 뒤 PostgreSQL에 설치합니다. 확장 기능을 복사하는 동안 PostgreSQL이 몇 초간 중지되었다가 다시 시작됩니다.',
      continuar: '계속',
      instalando: '빌드 도구를 설치하는 중…',
      compilando: 'pgvector를 컴파일하는 중…',
      herramientasOk: '빌드 도구가 설치되었습니다',
      instaladoOk: (v: string) => `pgvector ${v}이(가) 설치되었습니다`,
      sinWinget:
        '이 컴퓨터에 winget이 없습니다. visualstudio.microsoft.com에서 "Visual Studio 2022용 Build Tools"를 "C++를 사용한 데스크톱 개발" 워크로드와 함께 설치한 후 다시 시도하십시오.',
      falloHerramientas: '빌드 도구를 설치할 수 없습니다',
      activarAyuda: '설치 후 필요한 각 데이터베이스에서 "벡터 활성화"를 사용하십시오.',
      errorEstado: 'pgvector 상태를 읽을 수 없습니다',
    },
  },
  instalar: {
    titulo: '설치',
    descripcion:
      '공식 버전을 다운로드합니다. 모든 파일은 사용 전 SHA-256 해시로 검증됩니다.',
    servicios: {
      nginx: { nombre: 'Nginx', detalle: '웹 서버 (nginx.org)' },
      php: { nombre: 'PHP', detalle: 'NTS x64 (windows.php.net)' },
      cloudflared: { nombre: 'cloudflared', detalle: '공개 터널 (Cloudflare)' },
      mysql: { nombre: 'MySQL', detalle: '데이터베이스, 8.4 LTS (dev.mysql.com)' },
      mariadb: { nombre: 'MariaDB', detalle: '데이터베이스, 11.4 LTS (mariadb.org)' },
      postgresql: { nombre: 'PostgreSQL', detalle: '데이터베이스 (enterprisedb.com)' },
      redis: { nombre: 'Redis', detalle: '인메모리 캐시 및 큐 (redis-windows)' },
      mongodb: { nombre: 'MongoDB', detalle: '문서형 데이터베이스 (mongodb.com)' },
      mongosh: { nombre: 'mongosh', detalle: 'MongoDB 콘솔 (mongodb.com)' },
      mailpit: { nombre: 'Mailpit', detalle: '테스트 메일 (github.com/axllent)' },
      smtp4dev: { nombre: 'smtp4dev', detalle: '테스트 메일 (github.com/rnwood)' },
      inbucket: { nombre: 'Inbucket', detalle: '테스트 메일 (github.com/inbucket)' },
      papercut: {
        nombre: 'Papercut SMTP',
        detalle: '테스트 메일 (github.com/ChangemakerStudios)',
      },
      ollama: { nombre: 'Ollama', detalle: '로컬 AI (ollama.com)' },
      composer: { nombre: 'Composer', detalle: 'PHP 의존성 (getcomposer.org)' },
      adminer: { nombre: 'Adminer', detalle: '웹 데이터베이스 관리자' },
      phpmyadmin: { nombre: 'phpMyAdmin', detalle: 'MySQL 웹 관리자 (phpmyadmin.net)' },
    },
    grupos: {
      web: '웹 및 PHP',
      bd: '데이터베이스',
      otros: '메일, AI 및 터널',
    },
    instalados: '설치됨',
    ninguno: '설치된 버전 없음',
    elegir: '버전 선택',
    buscando: '버전을 검색하는 중…',
    sinVersiones: '버전을 찾을 수 없습니다',
    rama: (rama: string) => rama,
    yaInstalada: '이미 설치됨',
    fases: {
      descargando: '다운로드 중',
      verificando: 'SHA-256 검증 중',
      extrayendo: '압축 해제 중',
      compilando: '컴파일 중',
      listo: '설치됨',
      error: '설치 실패',
    },
    exito: (nombre: string, version: string) => `${nombre} ${version}이(가) 설치되었습니다`,
  },
  sitios: {
    titulo: '사이트',
    descripcion: '각 사이트는 고유한 .test 도메인으로 Nginx에서 제공되는 폴더입니다.',
    nuevo: '새 사이트',
    buscar: '이름 또는 도메인으로 검색',
    sinResultados: (q: string) => `"${q}"와(과) 일치하는 사이트가 없습니다.`,
    vacioTitulo: '아직 사이트가 없습니다',
    vacio:
      '프로젝트 폴더를 선택하면 WolfCore Dev가 Laravel, CodeIgniter 또는 정적 사이트 여부를 자동으로 감지합니다.',
    agregar: '사이트 추가',
    total: (n: number) => plural(n, '사이트'),
    abrirSitio: (dominio: string) => `브라우저에서 ${dominio} 열기`,
    carpeta: '폴더',
    abrirCarpeta: '프로젝트 폴더 열기',
    alias: (n: number) => `+${plural(n, '별칭')}`,
    tipos: {
      laravel: 'Laravel',
      codeigniter3: 'CodeIgniter 3',
      estatico: '정적',
      proxy: '프록시 (로컬 포트)',
      personalizado: '사용자 지정',
      codeigniter4: 'CodeIgniter 4',
      wordpress: 'WordPress',
      fastapi: 'FastAPI (로컬 포트)',
      node: 'Node / Vite (로컬 포트)',
    } as Record<string, string>,
    tiposCortos: {
      laravel: 'Laravel',
      codeigniter3: 'CI3',
      estatico: '정적',
      proxy: '프록시',
      personalizado: 'PHP',
      codeigniter4: 'CI4',
      wordpress: 'WP',
      fastapi: 'FastAPI',
      node: 'Node',
    } as Record<string, string>,
    php: (v: string) => `PHP ${v}`,
    puerto: (p: number) => `→ :${p}`,
    datosReales: '실제 데이터',
    datosRealesAyuda: '실제 고객 데이터가 포함되어 있습니다. 게시할 때 주의하십시오.',
    faltaHosts: 'hosts 누락',
    faltaHostsAyuda: (dominios: string) =>
      `${dominios}이(가) 아직 이 컴퓨터를 가리키지 않습니다. 위의 알림을 통해 hosts 파일을 수정하십시오.`,
    estado: {
      enLinea: '온라인',
      faltaHosts: 'hosts 누락',
      iniciando: 'Nginx 시작 중…',
      errorNginx: 'Nginx 오류',
      nginxExterno: '외부 Nginx',
      nginxApagado: 'Nginx 중지됨',
    },
    borrar: {
      titulo: (nombre: string) => `${nombre} 사이트를 삭제하시겠습니까?`,
      texto: '프로젝트 폴더는 건드리지 않습니다.',
      hecho: (nombre: string) => `${nombre} 사이트가 삭제되었습니다`,
      nginxFallo: '사이트는 삭제되었지만 Nginx가 새 구성을 수락하지 않았습니다',
    },
  },
  formSitio: {
    tituloNuevo: '새 사이트',
    tituloEditar: '사이트 편집',
    tituloDuplicar: '사이트 복제',
    paso: '프로젝트 폴더 선택부터 시작하십시오',
    pasoAyuda:
      '프로젝트 유형, PHP 버전 및 권장 도메인이 자동으로 감지됩니다. 나중에 모두 변경할 수 있습니다.',
    elegirCarpeta: '폴더 선택',
    cambiarCarpeta: '변경',
    detectando: '프로젝트를 분석하는 중…',
    detectado: (tipo: string) => `감지됨: ${tipo}`,
    sinDeteccionAlEditar: '자동 감지는 생성 시에만 적용됩니다. 유형과 PHP를 직접 확인하십시오.',
    nombre: '이름',
    nombreAyuda: '목록에서 구분하기 위한 용도입니다.',
    nombreCopia: (nombre: string) => `${nombre} (복사본)`,
    duplicarProxy:
      '복사본은 원본과 동일한 로컬 포트를 가리키며 프로세스는 복제되지 않습니다. 포트를 변경하거나 별도의 프로세스를 추가하십시오.',
    dominio: '도메인',
    dominioPlaceholder: 'my-project',
    alias: '별칭',
    aliasAyuda: '동일한 사이트를 여는 추가 .test 도메인입니다. 입력 후 Enter 키를 누르십시오.',
    aliasAgregar: '별칭 추가',
    carpeta: '프로젝트 폴더',
    raizLaravel: 'Nginx가 public/ 하위 폴더를 제공합니다.',
    tipo: '프로젝트 유형',
    php: 'PHP 버전',
    phpElegir: '버전 선택',
    phpNinguno: '설치된 PHP 버전이 없습니다.',
    phpInstalar: 'PHP 설치',
    phpNoInstalada: (pedida: string, elegida: string) =>
      `프로젝트에서 요구하는 PHP ${pedida} 버전이 설치되어 있지 않습니다. PHP ${elegida} 버전이 선택되었습니다.`,
    puertoProxy: '로컬 포트',
    puertoProxyAyuda:
      'Nginx가 요청을 http://127.0.0.1:<포트>로 전달합니다(예: Vite 또는 Node).',
    urlBaseVar: '기본 URL 변수',
    urlBaseVarAyuda:
      '터널을 열면 이 .env 변수에 공개 링크가 기록되고, 터널을 닫으면 원래대로 복원됩니다.',
    urlBaseVarNinguna: '없음 (.env 수정 안 함)',
    datosReales: '실제 고객 데이터 포함',
    datosRealesAyuda:
      '목록에 표시되며 터널로 게시하기 전에 확인을 요청합니다.',
    avanzado: '고급',
    reglasExtra: '추가 Nginx 규칙',
    reglasExtraAyuda:
      'server 블록 내부에 삽입됩니다(보안 헤더, 사용자 지정 deny 등). 저장 시 nginx -t로 검증됩니다.',
    reglasExtraEjemplo: 'add_header X-Frame-Options "SAMEORIGIN";',
    nota: '메모',
    notaPlaceholder: '이 사이트에 대해 기억해 둘 내용',
    guardar: '사이트 저장',
    guardado: (nombre: string) => `${nombre} 사이트가 저장되었습니다`,
    errorGuardar: '사이트를 저장할 수 없습니다',
    nginxFallo: '사이트는 저장되었지만 Nginx가 구성을 거부했습니다',
    nginxFalloAyuda:
      '이전 Nginx 구성이 복원되었습니다. 추가 규칙을 확인한 후 다시 저장하십시오.',
    errores: {
      carpeta: '프로젝트 폴더를 선택하십시오',
      sufijo: '도메인은 .test로 끝나야 합니다',
      caracteres: '영문자, 숫자, 하이픈 및 점만 사용하십시오',
      aliasIgualDominio: (d: string) => `별칭 ${d}은(는) 사이트 도메인과 동일합니다`,
      aliasRepetido: (d: string) => `별칭 ${d}이(가) 중복되었습니다`,
      ocupado: (d: string) => `도메인 ${d}을(를) 사용하는 사이트가 이미 존재합니다`,
      puertoFalta: '프록시 사이트에는 포트가 필요합니다',
      puertoRango: '포트는 1에서 65535 사이여야 합니다',
      php: '이 사이트의 PHP 버전을 선택하십시오',
      urlBaseVar: '영문자, 숫자 및 밑줄(_)만 사용하십시오(예: APP_URL)',
    },
  },
  tunel: {
    interruptor: (dominio: string) => `${dominio}용 공개 터널`,
    etiqueta: '터널',
    apagadoAyuda: '임시 공개 링크로 이 사이트를 공유합니다.',
    abriendo: '터널 여는 중…',
    cerrando: '터널 닫는 중…',
    error: '터널 오류 발생',
    sinNginx: '먼저 Nginx를 실행하십시오',
    sinCloudflared: '서비스에서 cloudflared를 설치하십시오',
    abrirUrl: '공개 링크 열기',
    copiarUrl: '공개 링크 복사',
    verQr: '링크의 QR 코드 표시',
    qrTitulo: '이 사이트의 공개 링크',
    renovar: '갱신 (새 링크)',
    cerrar: '터널 닫기',
    confirmarTitulo: '실제 데이터가 포함된 사이트 게시',
    confirmarRealesTexto: (dominio: string, destino: string) =>
      `${dominio}에는 실제 고객 데이터가 포함되어 있으며 ${destino}을(를) 통해 인터넷에 공개됩니다. 터널이 열려 있는 동안 링크가 있는 누구나 볼 수 있습니다. 게시하시겠습니까?`,
    confirmarExposeTexto: (dominio: string) =>
      `${dominio}이(가) Expose를 통해 인터넷에 공개됩니다. 터널이 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다. 또한 Expose 요청 검사기가 로컬 네트워크의 모든 컴퓨터에 노출됩니다. 게시하시겠습니까?`,
    compartir: '공유',
    confirmar: '게시',
    confirmarPublicoTitulo: '인터넷에 사이트 게시',
    confirmarPublicoTexto: (dominio: string) =>
      `${dominio}용 공개 Cloudflare 터널이 열립니다. 터널이 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다. 게시하시겠습니까?`,
    opciones: '터널 옵션',
    opcionesDe: (dominio: string) => `${dominio} 터널 옵션`,
    proveedor: '공급자',
    proveedorRapido: '빠른 터널 (계정 불필요)',
    proveedorRapidoAyuda: '열 때마다 변경되는 trycloudflare.com 링크입니다.',
    proveedorNombre: '지정 터널 (사용자 도메인)',
    proveedorNombreAyuda:
      '보유한 Cloudflare 도메인의 고정 링크입니다. Cloudflare 계정이 필요합니다.',
    cuentaConectada: 'Cloudflare 계정이 연결되었습니다.',
    cuentaSinConectar: '아직 연결된 Cloudflare 계정이 없습니다.',
    conectar: 'Cloudflare에 연결',
    conectando: '브라우저에서 승인을 기다리는 중…',
    conectarAyuda:
      '계정에서 WolfCore Dev를 승인하기 위해 브라우저가 열립니다. 인증서는 데이터 폴더에만 저장됩니다.',
    autorizacion: 'Cloudflare 승인',
    abrirAutorizacion: '승인 페이지 열기',
    copiarAutorizacion: '승인 링크 복사',
    cancelarConexion: '취소',
    recrear: '터널 다시 만들기',
    olvidar: '터널 연결 해제',
    recrearTitulo: '터널 다시 만들기',
    recrearTexto: (n: string) =>
      `Cloudflare에서 "${n}" 터널이 삭제되고 동일한 이름으로 새 터널이 생성됩니다. 이 터널을 사용하는 사이트는 닫힙니다.`,
    olvidarTitulo: '터널 연결 해제',
    olvidarTexto: (n: string) =>
      `Cloudflare에서 "${n}" 터널과 저장된 자격 증명이 삭제됩니다. 이 터널을 사용하는 사이트는 빠른 터널로 전환됩니다.`,
    olvidarAqui: '이 컴퓨터에서만 지우기',
    olvidarAquiTitulo: '이 컴퓨터에서만 터널 지우기',
    olvidarAquiTexto: (n: string) =>
      `이 컴퓨터에 저장된 «${n}» 터널 자격 증명이 삭제됩니다. 터널 자체는 Cloudflare에 그대로 유지됩니다. 이 터널을 사용하는 사이트는 빠른 터널로 되돌아갑니다.`,
    desconectar: '연결 해제',
    nombreTunel: '터널 이름',
    nombreTunelAyuda: '소문자, 숫자 및 하이픈을 사용할 수 있습니다.',
    dominioPublico: '공개 도메인',
    dominioPublicoAyuda:
      'Cloudflare에 보유한 도메인의 하위 도메인입니다(예: demo.example.com).',
    crear: '생성 및 라우팅',
    guardadoNombre: '지정 터널이 준비되었습니다. 열 때 확인을 요청합니다.',
    guardadoRapido: '이 사이트는 다시 빠른 터널을 사용합니다.',
    cambiarCierra: '공급자를 변경하면 이 사이트의 열려 있는 터널이 닫힙니다.',
    usarRapido: '빠른 터널 사용',
    nombreActual: (nombre: string, dominio: string) => `${dominio}의 «${nombre}» 터널`,
    confirmarPublicoNombreTexto: (dominio: string, publico: string) =>
      `Cloudflare 터널을 통해 ${dominio} 사이트가 ${publico} 주소로 공개됩니다. 터널이 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다. 공개하시겠습니까?`,
    proveedorNgrokAyuda:
      'ngrok 계정을 사용합니다. 이 컴퓨터에 ngrok 프로그램이 미리 설치되어 있어야 합니다.',
    proveedorExposeAyuda:
      'Expose 계정을 사용합니다. 이 컴퓨터에 Expose가 미리 설치되어 있어야 하며, Windows에서는 expose.phar로만 작동합니다. 요청 검사기가 로컬 네트워크 전체에 노출되므로 실제 데이터가 포함된 사이트에는 사용할 수 없습니다.',
    proveedorTailscaleAyuda:
      'Tailscale 개인 네트워크를 통해 연결합니다. Tailscale이 설치되어 있고 로그인되어 있어야 합니다.',
    tokenGuardado: (f: string) => `토큰이 저장되었습니다(끝자리: ${f}).`,
    tokenSinGuardar: '아직 저장된 토큰이 없습니다.',
    tokenNgrok: 'ngrok 토큰',
    tokenExpose: 'Expose 토큰',
    tokenAyuda:
      '이 컴퓨터에 암호화되어 저장되며 터널을 열 때만 프로그램에 전달됩니다. 화면에는 절대 표시되지 않습니다.',
    tokenPlaceholder: '여기에 토큰을 붙여넣으십시오',
    guardarToken: '토큰 저장',
    borrarToken: '토큰 삭제',
    usarProveedor: '이 공급자 사용',
    guardadoProveedor: '공급자가 저장되었습니다. 터널을 열 때 확인을 요청합니다.',
    ngrokAyudaInstalacion:
      'ngrok이 이 컴퓨터에 미리 설치되어 있어야 합니다(ngrok은 검증 가능한 다운로드를 제공하지 않으므로 WolfCore Dev가 직접 다운로드하지 않습니다). 전역 설정은 변경되지 않습니다.',
    exposeAyudaInstalacion:
      'Expose가 미리 설치되어 있거나 WolfCore Dev 데이터 폴더의 bin/expose에 expose.phar 파일이 있어야 합니다(Windows에서는 phar로만 작동하며, 체크섬이 제공되는 다운로드가 없습니다). 요청 검사기가 로컬 네트워크 전체에 노출되므로 실제 데이터가 포함된 사이트에는 사용할 수 없습니다. 전역 설정은 변경되지 않습니다.',
    tailscaleAlcance: '공개 범위',
    tailscaleServe: 'Serve: 내 tailnet 전용',
    tailscaleServeAyuda: '내 Tailscale 네트워크의 기기만 접속할 수 있으며 인터넷에는 공개되지 않습니다.',
    tailscaleFunnel: 'Funnel: 인터넷 전체 공개',
    tailscaleFunnelAyuda: 'tailnet 소속 여부와 관계없이 링크가 있는 누구나 접속할 수 있습니다.',
    tailscaleFunnelAviso:
      'Funnel은 이 사이트를 인터넷에 공개합니다. 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다.',
    tailscaleAyudaInstalacion:
      'WolfCore Dev는 Tailscale을 설치하지 않습니다(시스템 서비스입니다). 미리 설치하고 로그인해 두어야 합니다. 기존에 Tailscale로 공개 중인 항목은 변경되지 않으며, 이 사이트는 HTTPS 8443 포트를 사용합니다.',
    confirmarTailnetTitulo: 'tailnet에 공유',
    confirmarTailnetTexto: (dominio: string) =>
      `Tailscale Serve로 ${dominio} 사이트를 공유합니다. 내 tailnet의 기기만 접속할 수 있으며 인터넷에는 공개되지 않습니다. 공유하시겠습니까?`,
    confirmarTailnetRealesTexto: (dominio: string) =>
      `${dominio} 사이트에는 실제 고객 데이터가 포함되어 있습니다. Tailscale Serve를 사용하면 내 tailnet의 기기에서만 볼 수 있으며 인터넷에는 공개되지 않습니다. 공유하시겠습니까?`,
    confirmarFunnelTexto: (dominio: string) =>
      `Tailscale Funnel을 통해 ${dominio} 사이트가 인터넷에 공개됩니다. 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다. 공개하시겠습니까?`,
    confirmarProveedorTexto: (dominio: string, proveedor: string) =>
      `${proveedor}을(를) 통해 ${dominio} 사이트가 인터넷에 공개됩니다. 열려 있는 동안 링크가 있는 누구나 접속할 수 있습니다. 공개하시겠습니까?`,
    tituloError: '터널을 열지 못했습니다',
  },
  tuneles: {
    titulo: '터널',
    descripcion: '네트워크 외부에서 사이트를 보여주기 위한 임시 Cloudflare 공개 링크입니다.',
    explicacion:
      '빠른 터널은 열거나 갱신할 때마다 주소가 바뀌며, 이 컴퓨터가 켜져 있고 프로세스가 실행 중인 동안에만 작동합니다(터널을 켠 상태로 WolfCore Dev를 종료해도 계속 활성 상태로 유지됩니다).',
    columnas: { sitio: '사이트', estado: '상태', url: '링크', acciones: '작업' },
    vacioTitulo: '열린 터널이 없습니다',
    vacio: '사이트의 터널 스위치를 켜면 공개 링크를 받을 수 있습니다.',
    irASitios: '사이트로 이동',
    sinNombre: '삭제된 사이트',
  },
  ajustes: {
    titulo: '설정',
    descripcion: '환경 기본 설정입니다.',
    general: '일반',
    carpetaDatos: '데이터 폴더',
    carpetaDatosAyuda: '바이너리, 설정 및 로그가 저장됩니다. 열기만 가능하며 변경할 수 없습니다.',
    servicios: '서비스',
    puertoNginx: 'Nginx 포트',
    puertoNginxAyuda:
      '기본값은 80입니다. 80이 아닌 경우 로컬 URL에 포트 번호가 포함됩니다. 이미 열려 있는 터널은 이전 포트를 유지하므로 갱신하십시오.',
    trabajadores: 'PHP 워커 수',
    trabajadoresAyuda:
      '버전별 php-cgi 프로세스 수입니다. 워커가 많을수록 더 많은 요청을 동시에 처리할 수 있습니다.',
    nota: '저장 시 새 포트로 사이트 설정이 재생성됩니다. Nginx가 실행 중이면 재시작되며(포트가 변경되지 않았으면 다시 로드), 워커 수가 변경되면 실행 중인 PHP 버전도 재시작됩니다.',
    guardado: (reiniciados: string[]) =>
      reiniciados.length
        ? `설정이 저장 및 적용되었습니다. 재시작됨: ${reiniciados.join(', ')}.`
        : '설정이 저장 및 적용되었습니다.',
    errorAplicar: '설정은 저장되었으나 일부를 적용하지 못했습니다',
    errorSeccion: (detalle: string) => `이 정보를 읽지 못했습니다: ${detalle}`,
    acerca: '정보',
    avisos: {
      titulo: '알림',
      descripcion:
        '알림 종 아이콘에 기록할 항목과 창이 보이지 않을 때 Windows 알림을 표시할지 여부를 설정합니다.',
      nativas: 'Windows 알림',
      nativasAyuda:
        'WolfCore Dev가 포그라운드에 없을 때만 표시되며 유형별 5분에 최대 1회 표시됩니다.',
      tiposTitulo: '알림 유형',
      versionesTitulo: '서비스별 새 버전 알림',
      versionesAyuda:
        '새 버전 알림을 받지 않으려면 해당 서비스를 끄십시오(버전 탭에는 업데이트가 계속 표시됩니다).',
      versionesDe: (s: string) => `${s} 새 버전 알림 받기`,
      tipos: {
        'servicio-caido': '서비스가 오류로 중지됨',
        'puerto-ocupado': '서비스 시작 시 포트가 이미 사용 중임',
        'certificado-por-vencer': '인증서 만료 임박',
        'tunel-caido': '터널 연결이 끊어짐',
        'proceso-error': '프로젝트 프로세스 실패',
        'proceso-terminado': '프로젝트 프로세스 종료',
        'receta-terminada': '프로젝트 레시피 완료',
        doctor: '진단 (Doctor)',
        'contenedor-detenido': '컨테이너가 중지됨',
        'version-nueva': '설치된 서비스의 새 버전이 있음',
      } as Record<string, string>,
      errorGuardar: '알림 설정을 저장하지 못했습니다',
    },
    versionPrograma: '프로그램 버전',
    https: {
      titulo: 'HTTPS',
      autoridad: '로컬 인증 기관',
      autoridadAyuda:
        'WolfCore Dev는 자체 인증 기관으로 .test 사이트 인증서에 서명합니다. 관리자 권한 없이 Windows 사용자 저장소에 설치됩니다.',
      instalada: 'Windows에 설치됨',
      noInstalada: '설치되지 않음',
      instalar: '인증 기관 설치',
      reinstalar: '재설치',
      quitar: '제거',
      instaladaOk: 'HTTPS 인증 기관이 설치되었습니다',
      quitadaOk: 'HTTPS 인증 기관이 제거되었습니다',
      cancelado: 'Windows 확인이 취소되었습니다. 변경된 사항이 없습니다.',
      fallo: 'HTTPS 인증 기관을 변경하지 못했습니다',
      quitarTitulo: 'HTTPS 인증 기관을 제거하시겠습니까?',
      quitarTexto:
        '다시 설치할 때까지 브라우저가 .test 사이트의 인증서를 신뢰하지 않게 됩니다.',
      puerto: 'HTTPS 포트',
      puertoAyuda:
        '기본값은 443입니다. 다른 프로그램이 사용 중이면 1024에서 65535 사이의 포트를 선택하십시오. URL에 포트가 포함됩니다.',
      puertoRango: '443 또는 1024에서 65535 사이의 숫자를 사용하십시오',
      puertoGuardado: (p: number) => `이제 HTTPS가 포트 ${p}을(를) 사용합니다`,
      puertoAplicarFallo: '포트는 저장되었으나 Nginx가 새 설정을 수락하지 않았습니다',
      firefox:
        'Firefox는 자체 인증서 저장소를 사용합니다. 인증 기관을 신뢰하도록 하려면 about:config를 열고 다음 항목을 활성화하십시오:',
    },
    herramientas: {
      titulo: '터미널 및 도구',
      phpPorDefecto: '기본 PHP',
      phpPorDefectoAyuda:
        '터미널 및 WolfCore Dev 단축키에서 사용할 php 및 composer 버전입니다. «터미널»은 각 프로젝트의 PHP를 사용합니다.',
      phpMasReciente: '설치된 최신 버전',
      phpSinInstalar: '버전을 선택하려면 서비스에서 PHP를 설치하십시오',
      phpGuardado: '기본 PHP가 업데이트되었습니다',
      path: '사용자 PATH',
      pathAyuda:
        '어느 터미널에서나 사용할 수 있도록 WolfCore Dev의 php 및 composer를 사용자 PATH에 추가합니다.',
      pathActivo: 'PATH에 추가됨',
      pathInactivo: 'PATH에 없음',
      pathAgregar: '사용자 PATH에 추가',
      pathQuitar: 'PATH에서 제거',
      pathTitulo: 'PATH가 업데이트되었습니다',
      pathAviso: '변경 사항을 적용하려면 새 터미널을 여십시오. 이미 열려 있는 터미널에는 반영되지 않습니다.',
      pathQuitarTitulo: 'PATH에서 WolfCore Dev를 제거하시겠습니까?',
      pathQuitarTexto:
        '새 터미널에서 WolfCore Dev의 php 및 composer를 더 이상 사용할 수 없게 됩니다. 이미 열려 있는 터미널은 변경되지 않습니다.',
      adminer: 'Adminer 포트',
      adminerAyuda: 'Adminer는 이 고정 주소로 현재 컴퓨터에서만 제공됩니다.',
      terminal: '기본 터미널',
      terminalSistema: '시스템 기본값 (PowerShell)',
      terminalAyuda:
        '프로젝트에서 «터미널»을 클릭할 때 열리는 터미널입니다. 프로젝트에 고유 환경 변수(PATH의 전용 PHP, 에이전트 키 등)가 필요한 경우 «Windows Terminal»을 선택하면 Windows 기본 터미널 안에서 PowerShell이 열립니다. 이미 열려 있는 Windows Terminal에는 해당 변수가 전달되지 않습니다.',
      terminalGuardada: '기본 터미널이 업데이트되었습니다',
      editor: '기본 편집기',
      editorPrimero: '처음 감지된 편집기',
      editorAyuda:
        '프로젝트의 «편집기» 및 검색과 오류의 «편집기에서 열기»에서 사용됩니다. VS Code, Cursor, Windsurf, PhpStorm, Sublime Text, Zed, Notepad++을 감지합니다.',
      editorGuardado: '기본 편집기가 업데이트되었습니다',
      editorNinguno: '감지된 편집기가 없습니다.',
    },
  },
  /* ───────────── 사이트 HTTPS, 터미널 및 FTP; 메일; 로컬 AI ───────────── */
  sitioHttps: {
    etiqueta: 'HTTPS',
    candado: 'HTTPS 활성',
    candadoAyuda: '이 사이트는 WolfCore Dev 인증서를 사용하여 HTTPS로도 응답합니다.',
    redirige: 'http → https 리디렉션',
    abrirHttp: (dominio: string) => `브라우저에서 http://${dominio} 열기`,
    abrirHttps: (url: string) => `브라우저에서 ${url} 열기`,
    pendiente: (motivo: string) => `HTTPS 대기 중: ${motivo}`,
    pendienteCorto: 'HTTPS 대기 중',
    ocupado: (puerto: number, nombre: string, pid: number) =>
      `포트 ${puerto}을(를) ${nombre}(PID ${pid})에서 사용 중입니다.`,
    sinAutoridad: '인증 기관이 없습니다. 설정에서 설치하십시오.',
    pendienteAyuda:
      '사이트는 HTTP로 계속 작동합니다. 해당 프로그램을 종료하거나 설정에서 다른 HTTPS 포트를 선택하십시오.',
    sinConfianza: '인증 기관 미설치',
    sinConfianzaAyuda:
      'WolfCore Dev 인증 기관을 설치할 때까지 브라우저에 보안 경고가 표시됩니다(설정 → HTTPS).',
  },
  formSitioHttps: {
    titulo: 'HTTPS',
    https: 'HTTPS로도 제공',
    httpsAyuda: 'WolfCore Dev가 서명한 도메인 및 별칭 전용 자체 인증서를 사용합니다.',
    redirigir: 'HTTPS로 리디렉션',
    redirigirAyuda: 'http 접속을 https로 전환합니다. 공개 터널에는 영향을 주지 않습니다.',
    redirigirDeshabilitado: '먼저 HTTPS를 활성화하십시오',
    sinAutoridadTitulo: 'HTTPS 인증 기관이 설치되지 않았습니다',
    sinAutoridadTexto:
      '인증 기관이 없으면 브라우저에 보안 경고가 표시됩니다. Windows에서 설치 확인을 요청합니다.',
    instalar: '인증 기관 설치',
    instalada: 'HTTPS 인증 기관이 설치되었습니다',
    cancelado: 'Windows 확인이 취소되었습니다. 변경된 사항이 없습니다.',
    fallo: 'HTTPS 인증 기관을 설치하지 못했습니다',
  },
  terminalSitio: {
    boton: '터미널',
    ayuda: '프로젝트 폴더에서 해당 PHP 및 Composer가 PATH에 포함된 터미널을 엽니다.',
    elegir: '터미널 선택',
    predeterminada: '기본값',
  },
  editorSitio: {
    ayuda: '기본 편집기에서 프로젝트 폴더를 엽니다.',
    elegir: '다음으로 열기…',
    predeterminada: '기본값',
    sustituido: (pred: string, usado: string) =>
      '{pred}이(가) 설치되어 있지 않아 {usado}(으)로 열었습니다.'
        .replace('{pred}', pred)
        .replace('{usado}', usado),
    error: '편집기를 열지 못했습니다',
  },
  phpSitio: {
    etiqueta: 'PHP',
    compartido: (rama: string) => `공유 PHP ${rama}`,
    propio: (rama: string) => `이 사이트 전용 PHP ${rama}`,
    conXdebug: 'Xdebug 활성',
    mostrar: 'PHP 설정',
    ocultar: 'PHP 설정 숨기기',
    cargando: 'PHP 설정을 읽는 중…',
    apagadoRama: (rama: string) =>
      `PHP ${rama}이(가) 꺼져 있습니다. 이 사이트의 전용 PHP는 해당 버전과 함께 시작됩니다.`,
    ajustesTitulo: '전용 php.ini',
    ajustesAyuda: (rama: string) =>
      `이 사이트에만 PHP ${rama}의 php.ini에 추가로 적용됩니다. 설정을 하나라도 추가하거나 Xdebug를 사용하면 이 사이트는 1~2개 프로세스의 전용 PHP를 사용하며, 다른 사이트는 변경되지 않습니다.`,
    clave: '지시어',
    valor: '값',
    clavePlaceholder: 'memory_limit',
    valorPlaceholder: '512M',
    quitarAjuste: (clave: string) => `${clave || '설정'} 제거`,
    agregar: '설정 추가',
    guardarAjustes: '테스트 및 저장',
    ajustesGuardados: '사이트 PHP 설정이 적용되었습니다',
    sinAjustes: '전용 설정 없음: 공유 php.ini를 그대로 사용합니다.',
    xdebugTitulo: 'Xdebug',
    xdebugInterruptor: (dominio: string) => `${dominio}용 Xdebug`,
    xdebugAyuda:
      '이 사이트의 PHP에만 로드되며 공유 PHP에는 로드되지 않으므로 다른 사이트의 속도는 그대로 유지됩니다.',
    xdebugDescarga:
      '이 PHP 버전에 Xdebug가 설치되어 있지 않습니다. 카탈로그에서 다운로드합니다(xdebug.org, SHA-256 해시 검증).',
    modo: '모드',
    modos: {
      debug: 'debug (중단점)',
      develop: 'develop (향상된 오류 표시)',
      coverage: 'coverage (코드 커버리지)',
      profile: 'profile (프로파일링)',
      trace: 'trace (추적)',
    },
    puerto: '편집기 포트',
    inicio: '연결 시점',
    inicioTrigger: 'XDEBUG_TRIGGER 사용 시에만',
    inicioYes: '모든 요청마다',
    inicioAyuda:
      '«XDEBUG_TRIGGER 사용 시에만»을 선택하면 요청에 쿠키, GET/POST 매개변수 또는 브라우저 확장(Xdebug Helper)이 포함된 경우에만 디버깅이 시작됩니다.',
    guardarXdebug: 'Xdebug 저장',
    xdebugPuertoEnUso: (puerto: number) =>
      `포트 ${puerto}은(는) 이미 다른 PHP 또는 WolfCore Dev 서비스에서 사용 중이므로 편집기가 수신할 수 없습니다. 다른 포트를 선택하십시오(일반적으로 9003).`,
    xdebugGuardado: '사이트 Xdebug 설정이 적용되었습니다',
    quitarXdebug: 'Xdebug 제거',
    quitarXdebugTitulo: '이 사이트에서 Xdebug를 제거하시겠습니까?',
    quitarXdebugTexto:
      'Xdebug 설정이 삭제됩니다. 다른 전용 설정이 없으면 사이트가 공유 PHP로 되돌아갑니다. 프로젝트의 launch.json은 변경되지 않습니다.',
    xdebugQuitado: '사이트에서 Xdebug가 제거되었습니다',
    ide: '편집기',
    generarLaunch: 'launch.json 생성',
    launchTitulo: '프로젝트의 .vscode/launch.json',
    launchNuevo:
      '이 구성으로 .vscode/launch.json 파일이 생성됩니다(VS Code용 PHP Debug, 127.0.0.1에서만 수신).',
    launchFusion:
      'launch.json이 이미 존재합니다. WolfCore 구성만 추가(또는 업데이트)되며 기존 구성과 주석은 유지됩니다. 변경 전에 WolfCore Dev 데이터 폴더에 날짜가 포함된 백업이 저장됩니다.',
    launchSinCambios: 'launch.json에 이미 이 구성이 포함되어 있습니다.',
    launchEscribir: 'launch.json 쓰기',
    launchCreado: '.vscode에 launch.json이 생성되었습니다',
    launchActualizado: (respaldo: string) => `launch.json이 업데이트되었습니다. 이전 백업: ${respaldo}`,
    phpStorm: 'PhpStorm용 설정',
    copiarPhpStorm: 'PhpStorm 설정 복사',
    errorNginx: (salida: string) => `Nginx가 변경 사항을 수락하지 않아 이전 상태로 되돌렸습니다. ${salida}`,
  },
  nginxEditor: {
    etiqueta: 'Nginx',
    generadoResumen: '자동 생성 vhost',
    conReglas: '사용자 지정 규칙 포함',
    manualResumen: '수동 작성 vhost (자동 재생성 안 함)',
    mostrar: 'vhost 편집',
    ocultar: 'vhost 숨기기',
    cargando: 'vhost를 읽는 중…',
    reglasTitulo: '사용자 지정 규칙',
    reglasAyuda:
      '이 사이트의 server 블록 내부에 삽입됩니다. 적용 전에 전체 설정 복사본으로 nginx -t 테스트를 수행하며, 오류가 있으면 기존 설정이 유지됩니다.',
    reglasEtiqueta: 'Nginx 사용자 지정 규칙',
    reglasPlaceholder: '# 예: client_max_body_size 256m;',
    snippetsTitulo: '스니펫',
    insertar: (titulo: string) => `삽입: ${titulo}`,
    snippets: {
      cors: 'CORS',
      'cache-estaticos': '정적 파일 캐시',
      'limite-subida': '업로드 크기 제한',
      spa: 'SPA (index.html)',
      'cabeceras-seguridad': '보안 헤더',
      websocket: 'WebSocket 프록시',
      gzip: 'gzip 압축',
      ocultos: '숨김 파일 접근 차단',
    },
    aplicar: '테스트 및 적용',
    descartar: '변경 사항 취소',
    aplicado: 'vhost가 적용되고 Nginx가 다시 로드되었습니다',
    aplicadoApagado: 'vhost가 저장되었습니다. Nginx를 켜면 적용됩니다',
    fallo: 'Nginx가 변경 사항을 수락하지 않았습니다. vhost는 이전 상태로 유지됩니다',
    salidaTitulo: 'nginx -t 출력',
    desactivado:
      '설정 적용 시 이 사이트에 작성한 내용을 Nginx가 수락하지 않아 vhost에서 제외되었습니다(내용은 저장되어 있습니다). 수정한 후 다시 적용하여 사용하십시오.',
    avisoDestino: (destino: string, linea: number) =>
      `${linea}번 줄: 트래픽이 다른 컴퓨터(${destino})로 전달됩니다. 의도한 설정인지 확인하십시오.`,
    generadoTitulo: '자동 생성 vhost (읽기 전용)',
    avanzadoTitulo: '고급 모드',
    avanzadoInterruptor: '전체 vhost를 수동으로 작성',
    avanzadoAyuda:
      '자동 생성된 vhost를 대체합니다. WolfCore Dev가 더 이상 vhost를 재생성하지 않으므로 도메인, HTTPS, 포트 또는 폴더가 변경되면 직접 수정해야 합니다. 이 사이트의 도메인과 포트만 사용할 수 있습니다.',
    avanzadoActivarTitulo: 'vhost를 수동으로 작성하시겠습니까?',
    avanzadoActivarTexto:
      '현재 자동 생성된 vhost를 기반으로 시작합니다. 수동 모드가 켜져 있는 동안 사이트 변경 사항(도메인, HTTPS, PHP 등)은 vhost에 반영되지 않으므로 직접 수정해야 합니다.',
    avanzadoActivar: '수동 작성',
    manualEtiqueta: '사이트 전체 vhost',
    aplicarManual: 'vhost 테스트 및 적용',
    volverGenerado: '자동 생성 vhost로 복귀',
    volverGeneradoTitulo: '자동 생성 vhost로 되돌아가시겠습니까?',
    volverGeneradoTexto:
      '수동으로 작성한 vhost는 기록에 저장되며, WolfCore Dev가 사용자 지정 규칙을 포함해 사이트 vhost를 다시 생성합니다.',
    historial: '기록',
    historialTitulo: '이전 vhost 버전',
    historialVacio: '아직 이전 버전이 없습니다.',
    historialAyuda:
      '변경 전 최근 10개 버전이 저장됩니다. 복원 시에도 동일한 nginx -t 테스트를 거칩니다.',
    modoReglas: '규칙 포함 자동 생성',
    modoManual: '수동 작성',
    restaurar: '복원',
    restaurarTitulo: '이 버전을 복원하시겠습니까?',
    restaurarTexto: (fecha: string) =>
      `vhost가 ${fecha} 시점의 상태로 돌아갑니다. 현재 버전은 기록에 저장됩니다.`,
    restaurado: '버전이 복원되었습니다',
  },
  lan: {
    etiqueta: '로컬 네트워크',
    interruptor: (dominio: string) => `로컬 네트워크에 ${dominio} 공유`,
    apagadoAyuda: '같은 네트워크의 모바일이나 다른 컴퓨터에서 이 사이트를 열 수 있습니다.',
    sinNginx: '로컬 네트워크에 사이트를 공유하려면 Nginx를 켜십시오.',
    sinRed: '연결된 로컬 네트워크(Wi-Fi 또는 이더넷)가 없습니다.',
    activo: '로컬 네트워크에 표시 중',
    abriendo: '공유 시작 중…',
    cerrando: '공유 중지 중…',
    abrirUrl: '이 컴퓨터에서 열기',
    copiarUrl: '주소 복사',
    verQr: 'QR 표시',
    qrTitulo: (dominio: string) => `로컬 네트워크의 ${dominio}`,
    qrAviso: '같은 네트워크에 연결된 모바일로 QR 코드를 스캔하십시오.',
    confirmarTitulo: '로컬 네트워크에 공유',
    confirmarTexto: (dominio: string, ip: string) =>
      `${dominio} 사이트가 비밀번호 없이 이 컴퓨터(${ip})와 같은 네트워크에 연결된 모든 기기에 노출됩니다. 스위치를 끄거나 WolfCore Dev를 종료 또는 재시작하면 공유가 중지됩니다.`,
    ipEtiqueta: '네트워크 (이 컴퓨터의 IP)',
    https: 'HTTPS 사용',
    httpsAyuda:
      'HTTPS를 사용하려면 모바일이 WolfCore Dev CA를 신뢰해야 합니다(«모바일에 CA 설치» 버튼). 사용하지 않으면 사이트는 HTTP로 연결됩니다.',
    httpsObligatorio: '이 사이트는 HTTPS로 리디렉션되므로 HTTPS로 공유됩니다.',
    compartir: '네트워크에 공유',
    tituloError: '로컬 네트워크에 공유하지 못했습니다',
    caBoton: '모바일에 CA 설치',
    firewallTitulo: '모바일에서 열리지 않습니까?',
    datosRealesBloqueado: (dominio: string) =>
      `${dominio} 사이트에는 실제 데이터가 포함되어 있어 확인을 거치더라도 로컬 네트워크에 공유할 수 없습니다.`,
    redPublica:
      '이 네트워크는 Windows에서 공용 네트워크로 지정되어 있습니다. 방화벽이 외부 접속을 차단하며, 아래 명령은 개인 네트워크만 허용합니다. 신뢰할 수 있는 네트워크라면 개인 네트워크로 변경하십시오.',
    firewallTexto:
      'WolfCore Dev는 방화벽 설정을 변경하지 않습니다. 프로그램 전체를 허용하는 Windows 알림은 수락하지 마시고, 관리자 권한 PowerShell에서 이 포트용 명령(로컬 서브넷 및 개인 네트워크 전용)을 실행하십시오. 공용 네트워크에서는 열리지 않으며, 기존 차단 규칙이 허용 규칙보다 우선 적용됩니다.',
    copiarComando: '명령 복사',
  },
  caMovil: {
    titulo: '모바일에 CA 설치',
    intro:
      '같은 네트워크에 연결된 모바일로 QR 코드를 스캔하여 WolfCore Dev 인증 기관 인증서를 다운로드하십시오. 해당 파일만 제공되며 링크는 자동으로 닫힙니다.',
    abriendo: '링크를 여는 중…',
    expira: (minutos: number) => `링크는 ${minutos}분 후 자동으로 닫힙니다.`,
    expirado: '링크가 닫혔습니다.',
    reabrir: '다시 열기',
    android: 'Android',
    ios: 'iPhone 또는 iPad',
    pasosAndroid: [
      'QR 코드를 스캔하거나 모바일 브라우저에서 주소를 열어 파일을 다운로드하십시오.',
      '설정 > 보안 및 개인정보 보호 > 추가 보안 설정 > 암호화 및 사용자 인증 정보 > 인증서 설치 > CA 인증서를 여십시오(제조사에 따라 메뉴 이름이 다를 수 있습니다).',
      '신뢰하기 전에 모바일에 표시되는 인증서의 SHA-256 지문을 이 대화 상자의 지문과 비교하십시오. 일치하지 않으면 설치하지 마십시오.',
      '다운로드한 파일을 선택하고 경고를 수락하십시오. Android는 모든 CA 설치 시 경고를 표시합니다.',
    ],
    pasosIos: [
      'Safari에서 주소를 열고 프로파일 다운로드를 허용하십시오.',
      '설정 > 다운로드된 프로파일을 열고 세부 정보의 SHA-1 지문을 이 대화 상자의 지문과 비교하십시오. 일치하지 않으면 설치하지 마십시오. 일치하면 설치하십시오.',
      '설정 > 일반 > 정보 > 인증서 신뢰 설정을 열고 WolfCore Dev CA에 대한 전체 신뢰를 활성화하십시오.',
    ],
    aviso:
      '설치된 CA는 해당 모바일에서 서명하는 모든 항목에 신뢰를 부여합니다. 본인 소유의 기기에만 설치하고 사용이 끝나면 제거하십시오.',
    firewallAviso: (puerto: number) =>
      '모바일에서 링크에 접속하려면 포트 ' +
      puerto +
      '을(를) 열어야 합니다(로컬 서브넷 및 개인 네트워크 전용). 프로그램 전체를 허용하는 Windows 알림은 수락하지 마시고, 관리자 권한 PowerShell에서 이 명령을 실행하십시오. 공용 네트워크에서는 열리지 않으며, 기존 차단 규칙이 우선 적용됩니다.',
    huellas: '인증서 지문',
    tituloError: 'CA 링크를 열지 못했습니다',
  },
  dialogoQr: {
    descargar: 'PNG 다운로드',
    descargado: 'QR이 저장되었습니다',
    largo: '텍스트가 너무 길어 QR 코드를 생성할 수 없습니다.',
    generando: 'QR 코드를 생성하는 중…',
  },
  ftpSitio: {
    etiqueta: 'FTP',
    interruptor: (dominio: string) => `${dominio} FTP 액세스`,
    apagadoAyuda: 'FTP를 통해 이 사이트 폴더에 파일을 업로드할 수 있도록 허용합니다.',
    activoAyuda: '액세스가 활성화되었습니다.',
    soloLecturaEtiqueta: '읽기 전용',
    mostrarDatos: 'FTP 정보 표시',
    ocultarDatos: 'FTP 정보 숨기기',
    host: '서버',
    puerto: '포트',
    usuario: '사용자',
    clave: '비밀번호',
    mostrarClave: '비밀번호 표시',
    ocultarClave: '비밀번호 숨기기',
    copiarDato: (dato: string) => `${dato} 복사`,
    cargando: 'FTP 정보를 읽는 중…',
    regenerar: '비밀번호 재생성',
    regenerarTitulo: 'FTP 비밀번호를 재생성하시겠습니까?',
    regenerarTexto:
      '현재 비밀번호는 즉시 무효화되며 이 사이트의 열린 연결이 모두 종료됩니다. FTP 클라이언트에서 비밀번호를 업데이트해야 합니다.',
    regenerada: 'FTP 비밀번호가 재생성되었습니다',
    soloLectura: '읽기 전용',
    soloLecturaAyuda: '파일을 다운로드할 수 있지만 업로드, 수정 또는 삭제는 할 수 없습니다.',
    soloLecturaActivado: '이제 이 사이트의 FTP가 읽기 전용으로 설정되었습니다',
    soloLecturaDesactivado: '이제 이 사이트의 FTP에서 쓰기가 허용됩니다',
    activado: 'FTP 접근이 활성화되었습니다',
    desactivarTitulo: '이 사이트의 FTP 접근을 제거하시겠습니까?',
    desactivarTexto:
      '비밀번호가 삭제되고 열려 있는 연결이 종료됩니다. 사이트 폴더는 건드리지 않습니다.',
    desactivar: '접근 제거',
    desactivado: 'FTP 접근이 제거되었습니다',
    redLocalAviso:
      'FTP는 로컬 네트워크의 연결을 수락하며 비밀번호와 파일을 암호화하지 않고 전송합니다. 신뢰할 수 있는 네트워크에서만 사용하십시오.',
    redLocalHost: '또는 네트워크 내 이 컴퓨터의 IP',
    servidorApagado: 'FTP 서버가 꺼져 있습니다. 서버를 켜기 전까지는 아무도 연결할 수 없습니다.',
    encender: 'FTP 켜기',
    urlEtiqueta: '주소',
    urlAyuda: '주소에는 비밀번호가 포함되지 않으며 연결 시 입력하게 됩니다.',
    abrirUrl: 'FTP 클라이언트에서 열기',
    copiarUrl: 'FTP 주소 복사',
    verQr: '주소의 QR 코드 표시',
    qrTitulo: '이 사이트의 FTP 주소',
    qrAviso: '코드에는 주소만 포함되며 비밀번호는 포함되지 않습니다.',
  },
  correo: {
    descripcion:
      '메일 캐처는 프로젝트에서 발송한 이메일을 외부 인터넷으로 나가지 않도록 가로채어 확인할 수 있게 합니다. 이 컴퓨터(127.0.0.1)에서만 수신하며 한 번에 하나만 실행됩니다.',
    seccionCaptadores: '로컬 메일 캐처',
    seccionProveedores: '원격 SMTP 공급자',
    proveedores: {
      descripcion:
        '실제 SMTP 공급자는 이메일을 실제로 발송합니다. 프로젝트를 배포하기 전에 발송을 테스트할 때 사용하십시오. 비밀번호는 이 컴퓨터에 암호화되어 저장되며 절대 표시되지 않습니다.',
      agregar: '공급자 추가',
      vacio:
        '아직 추가한 공급자가 없습니다. Mailtrap, Resend, Brevo, Mailgun, SendGrid, Postmark, Amazon SES, SMTP2GO 또는 Gmail을 선택하거나 직접 입력하십시오.',
      errorLista: '공급자 목록을 불러올 수 없습니다',
      tarjeta: {
        servidor: '서버',
        usuario: '사용자',
        clave: '비밀번호',
        sinClave: '비밀번호 없음',
        claveIlegible: '저장됨 (읽을 수 없음)',
        red: '네트워크',
        redLocal: '이 컴퓨터 또는 로컬 네트워크의 서버 (확인됨)',
        editar: '편집',
        borrar: '삭제',
        borrarTitulo: (n: string) => `${n}을(를) 삭제하시겠습니까?`,
        borrarTexto:
          '공급자와 저장된 비밀번호가 삭제됩니다. 이 공급자를 사용하는 프로젝트는 로컬 메일 캐처로 되돌아가지만 .env 파일은 변경되지 않아 이 공급자의 MAIL_* 변수(및 입력한 경우 비밀번호)가 그대로 남아 있습니다. 각 .env 파일의 메일 블록을 다시 작성하십시오.',
        borrado: (n: string) => `${n}이(가) 삭제되었습니다`,
        usar: '프로젝트에서 사용',
        destino: '테스트 수신 이메일 주소',
        destinoPlaceholder: 'your-address@example.com',
        probar: '발송 테스트',
        probando: '발송 중…',
        probarAyuda:
          '검증된 암호화 연결을 통해 해당 주소로 실제 이메일을 1통 발송합니다. 최대 15초당 1회 가능합니다.',
        sinClaveParaProbar: '발송을 테스트하려면 공급자 비밀번호를 저장하십시오.',
        hostLocal: '이 서버 이름은 이 컴퓨터 또는 로컬 네트워크로 해석됩니다.',
        confirmarRed: '로컬 네트워크 확인',
        enviado: (para: string) => `${para}(으)로 이메일을 발송했습니다. 받은 편지함을 확인하십시오.`,
        fallos: {
          'correo.auth': '공급자가 사용자 또는 비밀번호를 거부했습니다.',
          'correo.conexion': '연결할 수 없습니다. 호스트와 포트를 확인하십시오.',
          'correo.tls':
            '암호화 연결이 유효하지 않습니다(인증서, 호스트명 또는 STARTTLS). 아무것도 발송되지 않았습니다.',
          'correo.rechazado':
            '서버가 메시지 또는 주소를 거부했습니다. 발신자를 확인하십시오. 많은 공급자는 인증된 발신자 또는 도메인만 허용합니다.',
          'correo.plazo': '서버가 제한 시간(20초) 내에 응답하지 않았습니다.',
        },
      },
      dialogo: {
        nuevo: 'SMTP 공급자 추가',
        editar: (n: string) => `${n} 편집`,
        preset: '공급자',
        presetOtro: '기타 (직접 입력)',
        presetAyuda: '호스트와 포트는 각 공급자의 공식 문서를 기준으로 합니다.',
        documentacion: '문서 보기',
        region: '리전',
        nombre: '이름',
        nombreObligatorio: '이름을 입력하십시오.',
        host: '서버 (호스트)',
        hostAyuda: 'smtp://나 포트 없이 호스트명 또는 IP만 입력하십시오.',
        hostObligatorio: '서버를 입력하십시오.',
        puerto: '포트',
        seguridad: '암호화',
        seguridadAyuda:
          '항상 유효한 인증서가 있는 암호화 연결이 요구되며 평문으로 낮아지지 않습니다.',
        tls: '직접 TLS (포트 465)',
        starttls: 'STARTTLS (포트 587)',
        usuario: '사용자',
        usuarioObligatorio: '사용자를 입력하십시오.',
        usuarioFijoAyuda: '이 공급자는 항상 이 사용자를 사용하며 비밀번호는 귀하의 계정 비밀번호를 사용합니다.',
        clave: 'SMTP 비밀번호',
        claveGuardada: (f: string) => `저장됨: ••••${f}`,
        claveNueva: '저장할 비밀번호를 입력하십시오',
        claveAyuda:
          '이 컴퓨터에 암호화되어 저장되며 다시 표시되지 않습니다. 변경하지 않으려면 비워 두십시오.',
        remitente: '테스트 발신자 (선택 사항)',
        remitenteAyuda:
          '많은 공급자는 인증된 발신자 또는 도메인에서만 발송을 허용합니다. 비워 두면 수신자 주소 자체가 발신자로 사용됩니다.',
        claveSinEspacios:
          '공급자가 제공한 비밀번호를 그대로 붙여넣으십시오. 내부 공백도 유지됩니다.',
        borrarClave: '비밀번호 삭제',
        borrarClaveTitulo: (n: string) => `${n}의 비밀번호를 삭제하시겠습니까?`,
        borrarClaveTexto: '저장된 비밀번호가 삭제됩니다. 공급자는 목록에 그대로 유지됩니다.',
        claveBorrada: '비밀번호가 삭제되었습니다',
        guardar: '저장',
        guardado: (n: string) => `${n}이(가) 저장되었습니다`,
        redLocalTitulo: '이 컴퓨터 또는 로컬 네트워크의 서버',
        redLocalTexto: (h: string) =>
          `${h}은(는) 이 컴퓨터 또는 로컬 네트워크를 가리킵니다. WolfCore Dev는 사용자가 확인한 경우에만 해당 서버에 연결합니다. 본인의 서버가 맞습니까?`,
        redLocalConfirmar: '예, 제 서버입니다',
        cambiaTitulo: '다른 서버로 비밀번호 전송',
        cambiaTexto: (h: string) =>
          `이 공급자에는 저장된 비밀번호가 있으며 서버 또는 사용자가 변경되었습니다. 비밀번호가 ${h}(으)로 전송됩니다. 계속하시겠습니까?`,
        cambiaConfirmar: '예, 계속',
      },
      env: {
        titulo: (n: string) => `프로젝트에서 ${n} 사용`,
        proyecto: '프로젝트',
        sinProyectos: '아직 프로젝트가 없습니다.',
        yaUsaSmtp: '이 프로젝트는 이미 SMTP 공급자를 통해 발송하고 있습니다.',
        volverCaptador: '로컬 메일 캐처로 돌아가기',
        volvio: (n: string) =>
          `${n}이(가) 다시 로컬 메일 캐처로 발송하도록 설정되었지만 .env 파일은 변경되지 않았습니다. 공급자의 MAIL_* 변수(및 입력한 경우 비밀번호)가 남아 있으므로 메일 블록을 다시 작성하십시오.`,
        incluirClave: '.env에 비밀번호도 함께 기록',
        incluirClaveAyuda: '선택하지 않으면 블록에 MAIL_PASSWORD가 포함되지 않으며 직접 추가해야 합니다.',
        sinClaveGuardada: '이 공급자에는 저장된 비밀번호가 없습니다.',
        vista: '.env 변경 사항 (비밀번호는 마스킹됨)',
        textoPlano:
          '비밀번호가 프로젝트의 .env 파일에 평문으로 저장됩니다. 해당 폴더에 접근할 수 있거나 저장소에 업로드할 경우 누구나 비밀번호를 읽을 수 있습니다.',
        claveTitulo: '.env에 비밀번호 기록',
        claveTexto:
          '비밀번호가 프로젝트의 .env 파일에 평문으로 저장됩니다. 프로젝트를 저장소에 업로드하지 않고 본인만 폴더에 접근할 수 있는 경우에만 사용하십시오.',
        claveConfirmar: '이해했습니다, 비밀번호 포함',
        agregarGitignore: '.gitignore에 .env 추가',
        gitignoreTitulo: '.gitignore 수정',
        gitignoreTexto:
          '프로젝트의 .gitignore에 .env 줄을 추가합니다(사전 백업 생성).',
        gitignoreConfirmar: '추가',
        versionadoTitulo: 'Git이 이미 .env를 추적하고 있습니다',
        versionadoTexto:
          '다음 커밋에 해당 값이 업로드됩니다. git rm --cached .env 명령으로 인덱스에서 제거하십시오.',
        desconocidoTitulo: 'git 상태를 확인할 수 없습니다',
        desconocidoTexto: 'git이 이 프로젝트의 .env를 추적하고 있는지 확인할 수 없습니다.',
        aceptarVersionado: '그래도 기록',
        aceptarTitulo: '버전 관리 중인 .env에 기록',
        aceptarTexto:
          'git이 .env를 추적 중이라면 이 변수들이 저장소에 포함될 수 있습니다. 그래도 기록하시겠습니까?',
        aceptarConfirmar: '그래도 기록',
        confirmarTitulo: '.env에 기록',
        confirmarTexto: (ruta: string) =>
          `${ruta}의 백업을 저장한 뒤 비밀번호 없이 MAIL_* 변수를 추가합니다.`,
        confirmarTextoClave: (ruta: string) =>
          `${ruta}의 백업을 저장한 뒤 비밀번호를 평문으로 포함하여 MAIL_* 변수를 추가합니다.`,
        confirmar: '기록',
        escribir: '.env에 기록',
        escrito: (n: string) => `이제 ${n}이(가) 이 공급자를 통해 발송합니다`,
      },
    },
    estado: '상태',
    smtp: 'SMTP',
    buzon: '웹 메일함',
    abrirBuzon: '메일함 열기',
    noLeidos: '읽지 않음',
    noLeidosValor: (n: number) => plural(n, '읽지 않은 메일'),
    noLeidosError: '메일함을 읽을 수 없습니다',
    actualizar: '이메일 수 다시 확인',
    actualizaSolo: '이 화면이 열려 있는 동안 15초마다 자동으로 새로고침됩니다.',
    env: 'Laravel .env용 블록',
    envAyuda: (captador: string) =>
      `프로젝트의 .env에 붙여넣으십시오. 이메일은 암호화 및 사용자 인증 없이 ${captador}에 보관됩니다.`,
    copiarEnv: '블록 복사',
    irAServicios: '서비스로 이동',
    cargando: '메일 캐처 불러오는 중…',
    errorLista: '메일 캐처 목록을 불러올 수 없습니다',
    captador: {
      opcional: '선택 사항',
      elegido: '프로젝트의 이메일 수신 중',
      noInstalado: '설치되지 않음',
      instalar: '설치',
      usar: '이 항목 사용',
      apagar: '끄기',
      iniciando: '시작 중…',
      avisoMantenimiento:
        '이 메일 캐처는 거의 유지보수되지 않습니다. Mailpit 또는 smtp4dev 사용을 권장합니다.',
    },
    notaDescartados:
      'MailHog와 MailDev는 제공되지 않습니다. MailHog는 다운로드를 검증할 해시(체크섬)를 게시하지 않으며 MailDev는 npm에만 존재합니다. 검증 가능한 해시가 없으면 다운로드하지 않습니다.',
    notaHost:
      '웹 메일함은 127.0.0.1에서만 응답하지만 메일 캐처가 켜져 있는 동안 악성 웹페이지가 메일함 읽기를 시도할 수 있습니다(DNS rebinding). smtp4dev와 Papercut은 외부 Host 헤더를 거부하며, Mailpit은 이 컴퓨터 전용 비밀 경로로 메일함을 제공합니다(WolfCore Dev가 해당 주소를 자동으로 엽니다). Inbucket에는 보호 기능이 없으므로 사용하지 않을 때는 꺼 두십시오.',
  },
  ia: {
    descripcion:
      '클라우드 AI 공급자 및 Ollama를 통한 로컬 모델입니다. 키는 이 컴퓨터에 암호화되어 저장되며 절대 표시되지 않습니다.',
    nube: {
      titulo: '클라우드 AI',
      agregar: '공급자 추가',
      vacio:
        '아직 추가한 공급자가 없습니다. OpenAI, Anthropic, Gemini, Hermes (Nous) 또는 OpenAI 호환 공급자를 추가하십시오.',
      errorLista: '공급자 목록을 불러올 수 없습니다',
    },
    local: { titulo: '로컬 AI (Ollama)' },
    tipos: {
      ollama: 'Ollama',
      hermes: 'Hermes (Nous Research)',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      anthropic: 'Anthropic Claude',
      compatible: 'OpenAI 호환',
    } as Record<string, string>,
    tarjeta: {
      clave: '키',
      sinClave: '키 없음',
      claveIlegible: '저장됨 (읽을 수 없음)',
      url: '기본 URL',
      modeloPorDefecto: '기본 모델',
      ninguno: '없음',
      probarConexion: '연결 테스트',
      probarConexionAyuda: '공급자의 모델 목록을 조회합니다. 토큰을 소모하지 않습니다.',
      probando: '테스트 중…',
      conectado: (ms: number, n: number) => `연결됨 · ${ms} ms · 모델 ${n}개`,
      verModelos: (n: number) => `모델 ${n}개 모두 보기`,
      soloGratuitos: '무료만 보기',
      fallo: '연결할 수 없습니다',
      probarMensaje: '메시지 테스트',
      probarMensajeAyuda:
        '모델이 응답하는지 확인하기 위해 짧은 고정 메시지를 보냅니다. 소량의 토큰이 소모됩니다.',
      elegirModelo: '메시지에 사용할 모델',
      sinModelo: '모델을 선택하려면 연결을 테스트하거나 기본 모델을 지정하십시오.',
      enviando: '전송 중…',
      respuesta: (ms: number) => `${ms} ms 만에 응답함`,
      tokens: (entrada: number, salida: number) =>
        `입력 ${entrada} 토큰, 출력 ${salida} 토큰`,
      usar: '프로젝트에서 사용',
      editar: '편집',
      borrar: '삭제',
      acciones: (nombre: string) => `${nombre} 작업`,
    },
    costo: {
      titulo: '메시지 테스트',
      texto: (modelo: string, proveedor: string) =>
        `${proveedor}의 ${modelo} 모델로 짧은 고정 메시지를 전송합니다. 계정의 토큰이 소모되며 응답은 16토큰으로 제한되어 보통 1센트 미만의 비용이 발생합니다.`,
      enviar: '메시지 전송',
    },
    dialogo: {
      nuevo: 'AI 공급자 추가',
      editar: (nombre: string) => `${nombre} 편집`,
      tipo: '유형',
      preset: '호환 공급자',
      presetAyuda: '이름과 URL을 자동으로 채우며 직접 수정할 수 있습니다.',
      presetOtro: '기타',
      documentacion: '문서 보기',
      nombre: '이름',
      urlBase: '기본 URL',
      urlAyuda: '비워 두면 공식 URL이 사용됩니다. https:// 또는 127.0.0.1 / [::1] 대상 http://(LM Studio)만 허용됩니다.',
      urlObligatoria: '호환 공급자의 기본 URL을 입력하십시오.',
      modelo: '기본 모델 (선택 사항)',
      modeloAyuda: '.env 블록(AI_MODEL) 및 테스트 메시지에 사용됩니다.',
      clave: 'API 키',
      claveNueva: '키를 붙여넣으십시오',
      claveGuardada: (final: string) =>
        `저장된 키가 있습니다(${final}). 교체하려는 경우에만 새 키를 입력하십시오.`,
      claveAyuda:
        '이 컴퓨터에 암호화되어 저장되며 다시 표시되지 않습니다. 마지막 4자리만 표시됩니다.',
      claveOpcional: '로컬 서버(LM Studio)의 경우 선택 사항입니다.',
      borrarClave: '키 삭제',
      guardar: '저장',
      guardado: (nombre: string) => `${nombre}이(가) 저장되었습니다`,
      urlCambiaTitulo: '키가 다른 URL로 전송됩니다',
      urlCambiaTexto: (url: string) =>
        `이 공급자에는 저장된 키가 있습니다. 앞으로 해당 키가 ${url}(으)로 전송됩니다. 신뢰할 수 있는 서버인 경우에만 확인하십시오.`,
      urlCambiaConfirmar: '새 URL로 키 전송',
    },
    borrar: {
      claveTitulo: (nombre: string) => `${nombre}의 키를 삭제하시겠습니까?`,
      claveTexto:
        '이 컴퓨터에서 키가 삭제됩니다. 키를 기록해 둔 .env 파일은 변경되지 않으므로 키를 폐기하는 경우 해당 파일에서도 변경하십시오.',
      proveedorTitulo: (nombre: string) => `${nombre}을(를) 삭제하시겠습니까?`,
      proveedorTexto:
        '공급자와 저장된 키가 삭제됩니다. 프로젝트의 .env 파일은 건드리지 않습니다.',
      respaldos: (n: number) =>
        n === 1
          ? '이 키가 평문으로 포함된 1개 프로젝트의 .env 백업도 함께 삭제'
          : `이 키가 평문으로 포함된 ${n}개 프로젝트의 .env 백업도 함께 삭제`,
      respaldosAyuda:
        'WolfCore Dev는 .env를 수정하기 전에 프로젝트 외부에 백업을 저장합니다. 삭제하면 되돌릴 수 없습니다.',
      claveBorrada: '키가 삭제되었습니다',
      proveedorBorrado: (nombre: string) => `${nombre}이(가) 삭제되었습니다`,
      respaldosBorrados: (n: number) => `${n}개 프로젝트의 .env 백업을 삭제했습니다`,
    },
    env: {
      titulo: (nombre: string) => `프로젝트에서 ${nombre} 사용`,
      proyecto: '프로젝트',
      sinProyectos: '설정된 프로젝트가 없습니다.',
      modelo: '모델 (AI_MODEL)',
      modeloAyuda: '선택 사항입니다. 목록에서 선택하거나 직접 입력하십시오.',
      vista: '.env에 기록될 블록 (키는 마스킹되어 표시됨)',
      cargando: '미리 보기 준비 중…',
      textoPlano:
        '키가 프로젝트의 .env 파일에 평문으로 저장됩니다. 해당 폴더에 접근할 수 있는 누구나 키를 읽을 수 있습니다.',
      copiaPrevia:
        '현재 .env 파일은 프로젝트 외부(WolfCore Dev 데이터 폴더)에 미리 백업됩니다.',
      sinClave: '이 공급자는 키가 필요합니다. 프로젝트에서 사용하기 전에 키를 저장하십시오.',
      gitignoreFalta: '프로젝트의 .gitignore가 .env를 제외하지 않고 있습니다.',
      gitignoreNoExiste: '프로젝트에 .gitignore가 없습니다.',
      gitignoreOk: '.gitignore가 이미 .env를 제외하고 있습니다.',
      agregarGitignore: '.gitignore에 .env 추가',
      gitignoreTitulo: '.gitignore 수정',
      gitignoreTexto:
        '사전 백업을 생성한 뒤 프로젝트의 .gitignore에 .env 줄을 추가합니다(파일이 없으면 생성합니다).',
      gitignoreConfirmar: '.gitignore에 추가',
      versionadoTitulo: 'Git이 이미 이 프로젝트의 .env를 추적하고 있습니다',
      versionadoTexto:
        '.gitignore에 있더라도 다음 커밋에 키가 업로드됩니다. 키를 기록하기 전에 인덱스에서 제거하고 커밋하십시오:',
      desconocidoTitulo: 'git이 .env를 추적하는지 확인할 수 없습니다',
      desconocidoTexto:
        'Git이 응답하지 않았습니다(설치되지 않았거나 신뢰할 수 없는 폴더입니다). .env가 이미 저장소에 있다면 다음 커밋에 키가 업로드됩니다. 다음 명령으로 확인하십시오:',
      aceptarVersionado: '위험을 이해했습니다. 그래도 키 기록',
      aceptarTitulo: 'git이 키를 업로드할 수 있음에도 기록',
      aceptarTexto:
        '.env가 저장소에 포함되어 있으면 다음 커밋과 기록에 키가 남게 됩니다. 이미 git rm --cached .env를 실행했거나 본인만 사용하는 저장소인 경우에만 진행하십시오.',
      aceptarConfirmar: '위험 감수',
      conflictoTitulo: '.env에 이 변수들이 이미 다른 값으로 정의되어 있습니다',
      reemplazar: (claves: string) => `${claves} 교체`,
      reemplazarTitulo: '.env 변수 교체',
      reemplazarTexto: (claves: string) =>
        `기존 .env에 있던 ${claves} 줄을 제거하고 WolfCore Dev 블록의 값으로 교체합니다. 기존 .env는 미리 백업됩니다.`,
      reemplazarConfirmar: '교체',
      escribir: '.env에 기록',
      confirmarTitulo: '키를 평문으로 기록',
      confirmarTexto: (carpeta: string) =>
        `키가 ${carpeta}에 암호화되지 않은 상태로 기록됩니다. 이 파일을 공유하거나 저장소에 업로드하지 마십시오.`,
      confirmar: '키 기록',
      escrito: (proyecto: string) => `${proyecto}의 .env에 AI 블록을 기록했습니다`,
      copiarComando: '명령 복사',
    },
  },
  iaLocal: {
    descripcion:
      'Ollama를 통해 이 컴퓨터에서 실행되는 언어 모델입니다. 데이터를 인터넷으로 전송하지 않고 프로젝트에서 사용할 수 있습니다.',
    sinInstalarTitulo: 'Ollama가 설치되어 있지 않습니다',
    sinInstalar: '이 컴퓨터에서 모델을 다운로드하고 사용하려면 서비스에서 설치하십시오.',
    irAServicios: '서비스로 이동',
    apagadoTitulo: 'Ollama가 꺼져 있습니다',
    apagado: '모델을 보고 다운로드하거나 테스트하려면 Ollama를 켜십시오.',
    iniciando: 'Ollama를 켜는 중…',
    errorTitulo: 'Ollama를 켤 수 없습니다',
    encender: 'Ollama 켜기',
    verServicios: '서비스에서 보기',
    modelos: '설치된 모델',
    sinModelos: '아직 모델이 없습니다. 아래에서 다운로드하십시오.',
    errorModelos: '모델 목록을 불러올 수 없습니다',
    recargar: '목록 새로고침',
    total: (n: number) => plural(n, '모델'),
    espacio: '사용 공간',
    espacioAyuda: '모든 모델이 데이터 폴더에서 차지하는 용량입니다.',
    probarDe: (modelo: string) => `${modelo} 테스트`,
    borrarDe: (modelo: string) => `${modelo} 삭제`,
    borrarTitulo: (modelo: string) => `${modelo} 모델을 삭제하시겠습니까?`,
    borrarTexto: (tamano: string) =>
      `디스크 공간 ${tamano}이(가) 확보됩니다. 다시 사용하려면 새로 다운로드해야 합니다.`,
    borrado: (modelo: string) => `${modelo} 모델이 삭제되었습니다`,
    descargar: {
      titulo: '모델 다운로드',
      campo: '모델 이름',
      placeholder: 'llama3.2, qwen2.5-coder:7b…',
      ayuda: 'Ollama에서 사용하는 이름(ollama.com/library)을 입력하거나 추천 항목을 선택하십시오.',
      sugerenciaAyuda: {
        'llama3.2': '일반 채팅, 경량',
        'qwen2.5-coder': '프로그래밍',
        mistral: '일반 채팅',
        'nomic-embed-text': '검색용 임베딩 (봇)',
      } as Record<string, string>,
      boton: '다운로드',
      invalido: '영문자, 숫자 및 . _ : / - 만 사용하십시오(예: llama3.2)',
      yaInstalado: '해당 모델은 이미 설치되어 있습니다',
      enCurso: '해당 모델은 이미 다운로드 중입니다',
      confirmarTitulo: (modelo: string) => `${modelo}을(를) 다운로드하시겠습니까?`,
      confirmarTexto:
        '모델은 보통 수 GB에 달합니다(크기에 따라 1GB에서 40GB 이상). Ollama는 시작 전에 크기를 알려 주지 않으며, 진행률 표시줄에서 확인하고 언제든지 취소할 수 있습니다.',
      confirmar: '다운로드',
    },
    progreso: {
      fases: {
        preparando: '준비 중…',
        descargando: '다운로드 중',
        verificando: '검증 중',
        guardando: '저장 중',
        listo: '완료',
      } as Record<string, string>,
      de: (hecho: string, total: string) => `${hecho} / ${total}`,
      cancelarDe: (modelo: string) => `${modelo} 다운로드 취소`,
      cancelando: '취소 중…',
      listo: (modelo: string) => `${modelo} 다운로드 완료`,
      cancelado: (modelo: string) => `${modelo} 다운로드가 취소되었습니다`,
      error: (modelo: string) => `${modelo}을(를) 다운로드할 수 없습니다`,
      descartar: '닫기',
      descartarDe: (modelo: string) => `${modelo} 알림 닫기`,
    },
    prueba: {
      titulo: '모델 테스트',
      modelo: '모델',
      elegir: '모델 선택',
      prompt: '메시지',
      placeholder: '짧은 질문을 입력하고 Enter를 누르십시오',
      enviar: '전송',
      respuesta: '응답',
      pensando: '모델이 응답하는 중입니다… 처음에는 모델을 불러오는 데 시간이 걸릴 수 있습니다.',
      vacia: '(모델이 텍스트를 반환하지 않았습니다.)',
      sinModelos: '테스트할 모델을 다운로드하십시오.',
    },
    conexion: {
      titulo: '프로젝트에서 연결',
      base: 'Ollama 기본 URL',
      openai: 'OpenAI 호환 엔드포인트',
      env: '.env 파일용 블록',
      envAyuda:
        'Laravel 또는 FastAPI 봇에서 사용할 수 있습니다. WolfCore Dev는 프로젝트 파일을 직접 수정하지 않습니다.',
      copiarEnv: '블록 복사',
      copiarDato: (dato: string) => `${dato} 복사`,
    },
    etapaB:
      'Hermes Agent, Claude Code 및 Codex는 단계 B에서 클릭 한 번으로 이 모델들에 연결할 수 있게 됩니다.',
  },
  proyectos: {
    titulo: '프로젝트',
    descripcion:
      '각 프로젝트는 .test 사이트, 설치 레시피 및 프로세스를 갖춘 폴더입니다.',
    agregar: '프로젝트 추가',
    vacioTitulo: '아직 프로젝트가 없습니다',
    vacio:
      'GitHub 저장소를 복제하거나 폴더를 선택하십시오. WolfCore Dev가 프로젝트 유형을 감지하여 단계별로 준비합니다.',
    pasos: {
      porTipo: {
        'composer-install': 'PHP 의존성 설치 (composer install)',
        'env-crear': '.env 파일 생성',
        'key-generate': '애플리케이션 키 생성',
        'bd-crear': '데이터베이스 생성',
        'bd-restaurar': '백업 복원',
        migrar: '데이터베이스 마이그레이션',
        'storage-link': 'storage 연결 (storage:link)',
        'npm-ci': 'Node 의존성 설치 (npm ci)',
        'npm-build': '에셋 빌드 (npm run build)',
        'python-venv': '가상 환경 생성 (.venv)',
        'pip-install': 'Python 의존성 설치 (pip)',
        'pgvector-activar': '데이터베이스에서 pgvector 활성화',
        'sitio-crear': '사이트 생성',
        comando: '프로젝트 명령',
      } as Record<string, string>,
      sitioCrear: (dominio: string) => (dominio ? `${dominio} 사이트 생성` : '사이트 생성'),
      bdRestaurar: (archivo: string | null) =>
        archivo ? `${archivo} 백업 복원` : '백업 복원',
      migrar: '데이터베이스 마이그레이션',
      migrarSemilla: '데이터베이스 마이그레이션 및 테스트 데이터 시딩 (--seed)',
      comando: (linea: string) => (linea ? `실행: ${linea}` : '프로젝트 명령'),
    },
    estadoPaso: {
      pendiente: '대기 중',
      corriendo: '진행 중',
      listo: '완료',
      error: '오류',
      omitido: '건너뜀',
    } as Record<string, string>,
    estadoReceta: {
      inactiva: '준비 안 됨',
      corriendo: '준비 중…',
      lista: '준비 완료',
      error: '단계 실패',
      cancelada: '준비 취소됨',
      incompleta: '준비 미완료',
    } as Record<string, string>,
    agregarDialogo: {
      titulo: '프로젝트 추가',
      pestanas: { github: 'GitHub', url: 'Git URL', carpeta: '폴더' },
      destino: '대상 폴더',
      destinoAyuda: (base: string) =>
        `${base}에 복제됩니다. 다른 위치를 원하면 "폴더 선택…"을 사용하십시오.`,
      nombreCarpeta: '폴더 이름',
      nombrePlaceholder: 'my-project',
      elegirDestino: '폴더 선택…',
      destinoPorDefecto: '프로젝트 폴더 사용',
      clonar: '복제',
      clonando: '복제 중…',
      clonado: '저장소가 복제되었습니다',
      errorClonar: '저장소를 복제할 수 없습니다',
      sinCancelar:
        '복제는 여기에서 중단할 수 없습니다. 완료될 때까지 기다려 주십시오(몇 분 정도 걸릴 수 있습니다).',
      sinGit: 'Git이 설치되어 있지 않습니다. Git(git-scm.com)을 설치한 후 이 대화 상자를 다시 여십시오.',
    },
    github: {
      estadoGh: (usuario?: string) =>
        usuario ? `GitHub CLI로 ${usuario} 계정 연결됨` : 'GitHub CLI로 연결됨',
      estadoToken: '개인 토큰으로 연결됨',
      estadoNinguna: 'GitHub에 연결되지 않음',
      ayudaNinguna:
        'GitHub CLI로 로그인하거나(권장) 콘텐츠 읽기 권한이 있는 세분화된 개인 액세스 토큰을 사용하십시오.',
      instalarGh: 'GitHub CLI 설치',
      instalandoGh: 'GitHub CLI 설치 중…',
      ghInstalado: 'GitHub CLI가 설치되었습니다. 이제 로그인하십시오.',
      iniciarSesion: '로그인',
      sesionAbierta:
        '로그인 창이 열렸습니다. 완료되면 "다시 확인"을 누르십시오.',
      comprobar: '다시 확인',
      usarToken: '토큰 사용',
      token: 'GitHub 개인 액세스 토큰',
      tokenPlaceholder: 'github_pat_…',
      tokenAyuda:
        '이 컴퓨터에 암호화되어 저장되며, 다시 표시되거나 프로젝트에 기록되지 않습니다.',
      guardarToken: '토큰 저장',
      tokenGuardado: '토큰이 저장되었습니다',
      quitarToken: '토큰 제거',
      tokenQuitado: '토큰이 제거되었습니다',
      buscar: '저장소 검색',
      cargando: '저장소 불러오는 중…',
      sinRepos: '저장소를 찾을 수 없습니다.',
      cargarMas: '더 불러오기',
      privado: '비공개',
      yaClonado: '이미 복제됨',
      yaClonadoAyuda: '이 저장소 또는 대상 폴더에 이미 프로젝트가 있습니다.',
      actualizado: (fecha: string) => `업데이트: ${fecha}`,
      elegir: '선택',
      errorRepos: '저장소 목록을 읽을 수 없습니다',
    },
    url: {
      etiqueta: '저장소 URL',
      placeholder: 'https://github.com/username/project.git',
      ayuda:
        'https://…, git@host:path 또는 username/project (GitHub). URL에 사용자 이름이나 비밀번호를 포함하지 마십시오.',
      invalida: 'https://…, git@host:path 또는 username/project 형식을 사용하십시오',
    },
    carpeta: {
      titulo: '컴퓨터에 이미 있는 프로젝트',
      texto: '폴더를 선택하면 프로젝트 유형을 감지하고 설정 레시피를 제안합니다.',
      elegir: '폴더 선택',
      manual: '레시피 없이 추가 (수동 설정)',
      yaEsProyecto: (nombre: string) => `해당 폴더는 이미 ${nombre} 프로젝트로 등록되어 있습니다.`,
      vigilarTitulo: '감시 중인 폴더',
      vigilarTexto:
        '프로젝트로 보이는 새 폴더가 나타나면 WolfCore Dev가 알려 드립니다. 저장소가 복제되는 기본 위치이기도 합니다.',
      vigilando: (carpeta: string) => `${carpeta} 감시 중`,
      sinVigilar: '감시 중인 폴더가 없습니다.',
      vigilar: '감시할 폴더 선택',
      cambiarVigilada: '변경',
      dejarDeVigilar: '감시 중지',
    },
    asistente: {
      titulo: (nombre: string) => `${nombre} 준비`,
      cargando: '프로젝트 분석 중…',
      origenYml: '이 레시피는 저장소의 wolfcore.yml 파일에서 가져왔습니다.',
      origenDefecto: '프로젝트 유형에 따라 제안된 레시피입니다.',
      deteccion: '감지된 항목',
      deteccionAyuda: '프로젝트와 일치하지 않는 항목이 있으면 수정하십시오.',
      tipo: '유형',
      php: 'PHP',
      phpNinguno: '설치된 버전 없음',
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
      versionAuto: '자동 감지된 버전',
      servicios: '서비스',
      serviciosNinguno: '없음',
      nombresServicio: {
        mysql: 'MySQL',
        mariadb: 'MariaDB',
        postgresql: 'PostgreSQL',
        mongodb: 'MongoDB',
        redis: 'Redis',
        mailpit: 'Mailpit',
      } as Record<string, string>,
      detectado: (v: string) => `감지됨: ${v}`,
      nodeInstalar: 'Node가 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      pythonInstalar: 'Python이 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      lenguajeInstalar: (nombre: string) => `${nombre}이(가) 설치되어 있지 않습니다. 서비스에서 설치하십시오.`,
      dominio: '도메인',
      puertoProxy: '로컬 포트',
      puertoPlaceholder: '8000',
      receta: '단계',
      recetaAyuda:
        '순서대로 실행됩니다. 원하지 않는 단계는 해제할 수 있으며, 선택 단계는 순서를 이동할 수 있습니다.',
      subir: '위로 이동',
      bajar: '아래로 이동',
      fijo: '이 단계는 필수입니다',
      restaurar: '백업 복원…',
      cambiarRespaldo: '백업 변경',
      quitarRespaldo: '백업 제거',
      sobrescribir: '이미 테이블이 있는 경우 데이터베이스 덮어쓰기',
      semilla: '테스트 데이터 불러오기 (--seed)',
      sinMotor:
        '데이터베이스가 없습니다. 데이터베이스를 생성하거나 백업을 복원하려면 서비스에서 엔진을 선택하십시오.',
      confio: '이 저장소를 신뢰합니다: 설치 단계 실행 허용',
      confioAyuda:
        '설치 단계는 컴퓨터에서 프로젝트의 프로그램(composer, npm, pip, 마이그레이션)을 실행합니다. 코드를 신뢰할 수 있는 경우에만 체크하십시오.',
      montar: '프로젝트 구성',
      montando: '프로젝트 구성 중…',
      reintentar: '재시도',
      omitir: '건너뛰기',
      cancelar: '취소',
      cancelando: '취소 중…',
      cerrar: '닫기',
      cerrarCorriendo: '숨기기 (백그라운드에서 계속 실행)',
      abrirSitio: '사이트 열기',
      verRegistro: '로그 보기',
      ocultarRegistro: '로그 숨기기',
      listo: '프로젝트 준비가 완료되었습니다.',
      fallo: (paso: string) => `실패: ${paso}. 재시도하거나 건너뛰기 또는 취소할 수 있으며, 기존 작업은 되돌려지지 않았습니다.`,
      cancelada: '준비가 취소되었습니다. 프로젝트 카드에서 다시 이어서 진행할 수 있습니다.',
      incompleta: '아직 실행되지 않은 단계가 남아 있습니다.',
      errorCrear: '프로젝트를 생성할 수 없습니다',
      errorReceta: '레시피를 읽을 수 없습니다',
      recetaCambio:
        '프로젝트를 신뢰한 이후 레시피(wolfcore.yml)가 변경되었습니다. 재시도하면 마지막으로 저장된 레시피를 사용합니다.',
      recargar: '새 레시피 검토',
      seguirGuardada: '저장된 레시피로 계속',
      soloLectura:
        '유형, PHP, 도메인, 버전 및 포트는 프로젝트 설정을 따릅니다. 편집에서 변경하십시오.',
    },
    tarjeta: {
      receta: '준비',
      reinstalar: '의존성 재설치',
      reinstalarTitulo: (nombre: string) => `${nombre}의 레시피를 실행하시겠습니까?`,
      reinstalarTexto:
        '마지막 준비 시 실행한 단계(마법사에서 검토한 단계)를 다시 실행합니다:',
      noRestaura: '다시 복원되지 않습니다',
      recetaCambio:
        '프로젝트를 신뢰한 이후 레시피(wolfcore.yml)가 변경되었습니다. 재설치는 저장된 레시피를 반복 실행합니다. 새 레시피를 확인하려면 "레시피 검토"를 사용하십시오.',
      revisarReceta: '레시피 검토',
      preparar: '준비…',
      ejecutar: '실행',
      verPreparacion: '준비 과정 보기',
      sinConfianza:
        '실행하려면 마법사에서 레시피를 검토하고 "이 저장소를 신뢰합니다"를 체크하십시오.',
      runtimes: '버전 알림',
      verRegistros: '로그 보기',
      abrirAgente: 'AI 에이전트 열기',
      vscode: '에디터',
      vscodeAyuda: '기본 에디터에서 프로젝트 폴더 열기',
      vscodeError: '에디터를 열 수 없습니다',
      baseDatos: '데이터베이스',
      baseDatosAyuda: (base: string) =>
        `인증된 상태로 "${base}" 데이터베이스 열기 (Adminer 또는 phpMyAdmin)`,
      baseDatosSinDetectar: '프로젝트 데이터베이스 열기 (Adminer 또는 phpMyAdmin)',
      sinBase: '프로젝트의 .env 파일에 MySQL, MariaDB 또는 PostgreSQL 데이터베이스가 선언되어 있지 않습니다.',
      adminerNoListo: 'Adminer가 준비되지 않았습니다',
      entradaAutomatica: '비밀번호를 입력하지 않고 자동으로 로그인합니다.',
      elegirBd: 'Adminer 또는 phpMyAdmin 선택',
      opcionAdminer: 'Adminer',
      opcionPhpMyAdmin: 'phpMyAdmin',
      opcionPhpMyAdminSoloMysql: 'phpMyAdmin (MySQL 및 MariaDB 전용)',
      phpMyAdminNoListo: 'phpMyAdmin이 준비되지 않았습니다',
      entroComoAdmin: (usuario: string) =>
        `이 프로젝트는 전용 사용자를 사용하지 않으므로 서버 관리자인 ${usuario}(으)로 로그인되었습니다. .env 관리자에서 "전용 사용자 사용"을 선택하면 해당 데이터베이스로 제한된 사용자가 생성됩니다.`,
      entroComoAdminSinClave: (usuario: string) =>
        `서버 관리자인 ${usuario}(으)로 로그인되었습니다. 이 프로젝트의 전용 사용자 비밀번호가 이 컴퓨터에 저장되어 있지 않습니다. .env 관리자에서 "전용 사용자 사용"을 선택하면 새 비밀번호가 생성됩니다.`,
      abrirSitio: '브라우저에서 사이트 열기',
      github: '저장소',
      abrirRemoto: (url: string) => `${url} 열기`,
      confiado: '신뢰함',
      confiadoAyuda: '이 프로젝트의 설치 단계를 실행할 수 있습니다.',
    },
    git: {
      rama: (rama: string) => rama,
      sinRama: '분리된 HEAD',
      cambios: (n: number) => plural(n, '건의 저장되지 않은 변경 사항'),
      limpio: '변경 사항 없음',
      atras: (n: number) => `가져올 커밋 ${n}개`,
      adelante: (n: number) => `푸시할 커밋 ${n}개`,
      traer: '변경 사항 가져오기',
      traerAyuda: '병합 없이 git pull을 실행합니다. 로컬 변경 사항이 있거나 브랜치가 분기된 경우 아무것도 변경하지 않습니다.',
      alDia: '이미 최신 상태입니다.',
      actualizado: '변경 사항을 가져왔습니다',
      sugeridosTitulo: '변경 사항을 가져왔습니다',
      sugeridosTexto: '변경된 내용에 따라 다음 단계를 실행하는 것이 좋습니다:',
      sugeridosNinguno: '추가로 실행할 단계가 없습니다.',
      migracionesNuevas: (n: number) => plural(n, '개의 새 마이그레이션'),
      ejecutarSugeridos: '단계 실행',
      corridaTitulo: '변경 사항 가져온 후 실행할 단계',
      corridaAyuda: '프로젝트에 저장된 레시피는 변경되지 않습니다.',
      ahoraNo: '나중에',
      errorEstado: 'Git 상태를 읽을 수 없습니다',
      commitIa: {
        boton: '커밋 메시지 제안',
        ayuda:
          '스테이징된 변경 사항(git add)에 대한 커밋 메시지를 AI로 제안하고, 승인하시면 커밋을 실행합니다.',
        titulo: '제안된 메시지로 커밋',
        proveedor: 'AI 제공업체',
        modelo: '모델',
        sinProveedores:
          '메시지를 제안받으려면 AI 화면에서 클라우드 AI 제공업체를 설정하십시오.',
        privacidad:
          '스테이징된 변경 사항의 diff만 제공업체로 전송됩니다(.env, 키, 인증서, 자격 증명 파일 및 바이너리 제외, 최대 20,000자). 토큰 소모가 적습니다.',
        sugerir: '메시지 제안',
        mensaje: '메시지 (편집 가능)',
        commit: '커밋하기',
        commitAyuda: '스테이징된 항목(git add)만 커밋합니다. 파일을 추가하거나 push하지 않습니다.',
        hecho: '스테이징된 항목으로 커밋이 완료되었습니다.',
      },
    },
    procesos: {
      titulo: '프로세스',
      /** 재시작 설정이 없는 프로세스가 종료 코드 0으로 종료되었을 때의 슈퍼바이저 메시지. */
      terminado: '오류 없이 종료됨',
      ninguno: '프로세스가 없습니다. npm run dev, queue:work, uvicorn 등을 추가하십시오…',
      agregar: '프로세스 추가',
      editar: '프로세스 편집',
      nuevo: '새 프로세스',
      interruptor: (nombre: string) => `${nombre} 켜기 또는 끄기`,
      proxy: '프록시',
      proxyAyuda: 'Nginx가 사이트 요청을 이 프로세스로 전달합니다.',
      puerto: (p: number) => `:${p}`,
      reinicios: (n: number) => plural(n, '회 재시작'),
      verLog: '로그 보기',
      ocultarLog: '로그 숨기기',
      logVacio: '아직 출력이 없습니다.',
      abrirCarpetaLog: '로그 폴더 열기',
      quitar: '프로세스 제거',
      quitarTitulo: (nombre: string) => `${nombre} 프로세스를 제거하시겠습니까?`,
      quitarTexto: '실행 중이라면 중지됩니다.',
      nombre: '이름',
      nombrePlaceholder: 'Vite',
      comando: '명령어',
      comandoPlaceholder: 'npm run dev',
      comandoAyuda: '셸 없이 프로그램과 인수를 입력하십시오. 공백이 포함된 인수는 따옴표로 감싸십시오.',
      cwd: '폴더',
      cwdPlaceholder: 'raiz',
      cwdAyuda: 'raiz 또는 프로젝트 하위 폴더(예: frontend)를 입력하십시오.',
      puertoCampo: '포트',
      puertoNinguno: '없음',
      puertoAyuda: '프로세스가 프록시 대상인 경우를 제외하면 정보 표시용입니다.',
      autoIniciar: 'WolfCore Dev 시작 시 자동 실행',
      reiniciar: '비정상 종료 시 재시작',
      esProxy: 'Nginx 프록시 대상',
      requiereReinicio:
        '프로세스가 실행 중입니다. 명령어, 폴더 또는 포트 변경 사항은 재시작 시 적용됩니다.',
      reinicieAhora: '저장되었습니다. 변경 사항을 적용하려면 프로세스를 껐다가 다시 켜십시오.',
      guardado: '프로세스가 저장되었습니다',
      errores: {
        comando: '명령어를 입력하십시오',
        puerto: '포트는 1에서 65535 사이여야 합니다',
        proxySinPuerto: '프록시 대상에는 포트가 필요합니다',
        cwd: 'raiz 또는 프로젝트 내 하위 폴더를 사용하십시오',
        repetido: '같은 이름의 프로세스가 이미 있습니다',
      },
      estados: {
        encendido: '실행 중',
        apagado: '중지됨',
        iniciando: '시작 중…',
        error: '오류',
        externo: '외부',
      } as Record<string, string>,
    },
    registros: {
      titulo: (nombre: string) => `${nombre} 로그`,
      fuente: '소스',
      ninguna: '이 프로젝트에는 아직 로그가 없습니다.',
      vacio: '로그가 비어 있습니다.',
      actualizar: '새로 고침',
      abrirCarpeta: '폴더 열기',
    },
    sugerencias: {
      titulo: (n: number) =>
        n === 1
          ? '프로젝트로 보이는 새 폴더가 1개 있습니다'
          : `프로젝트로 보이는 새 폴더가 ${n}개 있습니다`,
      montar: '준비',
      ignorar: '무시',
      tipo: (tipo: string) => tipo,
    },
  },
  inicioExtra: {
    correo: '읽지 않은 메일',
    correoApagado: 'Mailpit 중지됨',
    correoSinInstalar: 'Mailpit 미설치',
    modelos: 'AI 모델',
    iaApagada: 'Ollama 중지됨',
    iaSinInstalar: 'Ollama 미설치',
    sinLeer: '읽을 수 없음',
    sinDato: '—',
  },
  /* ───────────── 성능 패널, 로그 뷰어 및 MCP (Task 13) ───────────── */
  unidades: {
    bytes: ['B', 'KB', 'MB', 'GB', 'TB'],
    porSegundo: '/s',
    porcentaje: '%',
    segundos: '초',
    minutos: '분',
    horas: '시간',
    dias: '일',
    /** 서비스의 N번째 워커 (예: PHP 8.4 #2). */
    trabajador: (n: string) => `#${n}`,
  },
  panel: {
    titulo: '성능',
    ventana: '최근 5분',
    pausado: '창이 숨겨져 있는 동안 일시 중지됨',
    esperando: '첫 번째 샘플을 기다리는 중…',
    errorMuestreo: (detalle: string) => `성능 샘플링을 요청할 수 없습니다: ${detalle}`,
    cpu: 'CPU',
    ram: '메모리',
    disco: '데이터 디스크',
    red: '네트워크',
    deTotal: (usado: string, total: string) => `${total} 중 ${usado}`,
    libre: (libre: string) => `${libre} 사용 가능`,
    bajada: '다운로드',
    subida: '업로드',
    graficaCpu: (valor: string) => `최근 5분간 CPU 그래프, 현재 ${valor}`,
    graficaRam: (valor: string) => `최근 5분간 메모리 그래프, 현재 ${valor}`,
    graficaRed: (bajada: string, subida: string) =>
      `최근 5분간 네트워크 그래프, 다운로드 ${bajada}, 업로드 ${subida}`,
    alertas: {
      titulo: '경고',
      conflicto: (servicio: string, puerto: number, programa: string, pid: number) =>
        `${servicio}의 포트 ${puerto}을(를) 다른 프로그램(${programa}, PID ${pid})이 사용 중입니다.`,
      ramAlta: (porcentaje: number) =>
        `컴퓨터 메모리 사용량이 ${porcentaje}%입니다. 원활한 응답을 위해 사용하지 않는 항목을 종료하십시오.`,
      huerfano: (pid: number, puertos: number[]) =>
        `WolfCore Dev 소속이 아닌 php-cgi 프로세스(PID ${pid})가 ${puertos.join(', ')} 포트에서 수신 대기 중입니다. 이전 세션에서 남아 있던 프로세스입니다.`,
      finalizar: '프로세스 종료',
      finalizarTitulo: '이 프로세스를 종료하시겠습니까?',
      finalizarTexto: (nombre: string, pid: number) =>
        `${nombre}(PID ${pid})이(가) 열려 있는 내용을 저장하지 않고 즉시 종료됩니다. 해당 프로그램이 필요하지 않다고 확신하는 경우에만 사용하십시오.`,
      finalizado: (nombre: string) => `${nombre}이(가) 종료되었습니다`,
      verPuertos: '포트 보기',
      errorPuertos: '포트를 사용 중인 프로그램을 확인할 수 없습니다.',
    },
    procesos: {
      titulo: '서비스 및 프로세스',
      vacio: '실행 중인 서비스나 프로젝트 프로세스가 없습니다.',
      nombre: '이름',
      cpu: 'CPU',
      ram: 'RAM',
      pid: 'PID',
      puerto: '포트',
      encendido: '실행 시간',
      acciones: '작업',
      detener: '중지',
      registros: '로그 보기',
      servicio: '서비스',
      proyecto: '프로젝트',
      procesoDe: (proyecto: string, proceso: string) => `${proyecto}: ${proceso}`,
    },
  },
  registros: {
    titulo: '로그',
    descripcion:
      'Nginx, PHP, 서비스, 사이트, 프로젝트 프로세스 및 터널의 로그를 실시간으로 확인하십시오.',
    fuente: '소스',
    elegirFuente: '로그 선택',
    sinFuentes:
      '아직 로그가 없습니다. 서비스, 사이트 또는 프로세스가 첫 로그를 기록하면 여기에 표시됩니다.',
    buscar: '텍스트로 필터링',
    niveles: { error: 'ERROR', warning: 'WARNING', info: 'INFO' } as Record<string, string>,
    pausar: '일시 중지',
    reanudar: '재개',
    pausadoNuevas: (n: number) => `일시 중지 중 새 줄 ${n}개`,
    copiar: '표시된 내용 복사',
    copiadas: (n: number) => `${n}줄이 복사되었습니다`,
    limpiar: '지우기',
    abrirCarpeta: '폴더 열기',
    alFinal: '끝부분 자동 스크롤',
    mostrarMas: '더 보기',
    ocultas: (n: number) => `표시되지 않은 이전 줄 ${n}개`,
    vacio: '아직 줄이 없습니다. 새 로그가 기록되는 즉시 여기에 표시됩니다.',
    sinCoincidencias: '필터와 일치하는 줄이 없습니다.',
    cuenta: (visibles: number, total: number) =>
      visibles === total ? `총 ${total}줄` : `${total}줄 중 ${visibles}줄`,
    descartadas: (n: number) => `(최근 5000줄만 보관되며, 이전 ${n}줄은 삭제되었습니다)`,
    grupos: {
      nginx: 'Nginx',
      php: 'PHP',
      servicio: '서비스',
      sitio: '사이트',
      laravel: 'Laravel',
      proyecto: '프로젝트 프로세스',
      tunel: '터널',
      ci3: 'CodeIgniter 3',
    },
    fuentes: {
      nginxAcceso: 'Nginx (액세스)',
      nginxError: 'Nginx (오류)',
      php: (version: string) => `PHP ${version}`,
      servicio: (nombre: string) => nombre,
      sitioAcceso: (dominio: string) => `${dominio} (액세스)`,
      sitioError: (dominio: string) => `${dominio} (오류)`,
      tunel: (sitio: string) => `${sitio} 터널`,
      tunelSalida: (sitio: string) => `${sitio} 터널 (출력)`,
      laravel: (sitio: string) => `${sitio}: laravel.log`,
      ci3: (sitio: string) => `${sitio}: CodeIgniter`,
      proceso: (sitio: string, proceso: string) => `${sitio}: ${proceso}`,
    },
  },
  cli: {
    avisoTerminalNueva:
      '변경 사항을 적용하려면 새 터미널을 여십시오. 이미 열려 있는 터미널에는 반영되지 않습니다.',
    enPathSinCliente: 'PATH에 등록되어 있으나 명령어 파일이 없습니다',
    reparar: '복구',
    repararTitulo: 'wolf 명령어를 복구하시겠습니까?',
    repararTexto:
      'wolf가 PATH에 등록되어 있지만 파일이 완전하지 않습니다. 처음 추가할 때와 동일하게 데이터 폴더에 파일을 다시 복사하고 로컬 서버를 시작합니다.',
    titulo: '터미널: wolf 명령어',
    descripcion:
      'PowerShell, cmd 또는 Git Bash에서 WolfCore Dev를 제어합니다: wolf status, wolf use php@8.4, wolf share, wolf logs. 앱이 열려 있을 때만 작동합니다.',
    activo: 'PATH에서 사용 가능',
    enPathSinServidor: 'PATH에 등록됨, 서버 중지됨',
    inactivo: 'PATH에 없음',
    agregarBoton: 'PATH에 wolf 추가',
    quitarBoton: 'PATH에서 wolf 제거',
    agregarTitulo: '사용자 PATH에 wolf를 추가하시겠습니까?',
    agregarTexto:
      'WolfCore Dev 데이터 폴더에 wolf 명령어를 복사하고 해당 폴더를 사용자 PATH에 추가하며(기존 PATH의 백업이 저장됩니다), 시작할 때마다 변경되는 키로 wolf 요청만 처리하는 로컬 서버를 127.0.0.1에서 실행합니다. 사이트를 인터넷에 공개하거나 모든 터미널의 PHP를 변경할 때는 앱 창에서도 항상 추가 확인을 거칩니다. 언제든지 제거할 수 있습니다.',
    agregar: '추가',
    quitarTitulo: 'PATH에서 wolf를 제거하시겠습니까?',
    quitarTexto:
      '사용자 PATH에서 wolf 폴더를 제거하고 로컬 서버를 중지하며 복사된 명령어를 삭제합니다. 이미 열려 있는 터미널에는 영향을 주지 않습니다.',
    quitar: '제거',
    listoTitulo: 'wolf 명령어가 업데이트되었습니다',
    ayuda: '추가한 후 새 터미널을 여십시오. 서버는 127.0.0.1에서만 수신 대기합니다.',
    aislado: '테스트 데이터 폴더(WOLFCORE_DATOS)를 사용하는 경우 PATH는 변경되지 않습니다.',
    errorCargar: (detalle: string) => `wolf 상태를 읽을 수 없습니다: ${detalle}`,
  },
  mcp: {
    titulo: 'MCP 서버',
    descripcion:
      'Claude Code 및 기타 어시스턴트가 이 컴퓨터에서 사이트, 서비스 및 데이터베이스를 관리할 수 있도록 허용합니다. 127.0.0.1에서만 수신 대기하며 토큰이 필요합니다.',
    estado: '상태',
    activo: '실행 중',
    inactivo: '중지됨',
    activar: '활성화',
    detener: '중지',
    activado: 'MCP 서버가 활성화되었습니다',
    detenido: 'MCP 서버가 중지되었습니다',
    direccion: '주소',
    puerto: '포트',
    puertoAyuda: '1024에서 65535 사이여야 합니다. 실행 중이면 새 포트에서 재시작됩니다.',
    puertoRango: '1024에서 65535 사이의 숫자를 사용하십시오',
    puertoGuardado: (p: number) => `MCP 서버가 포트 ${p}을(를) 사용합니다`,
    copiarConfig: 'Claude Code용 설정 복사',
    copiarConfigAyuda:
      '토큰이 포함된 설정을 클립보드에 복사합니다. Claude Code에 붙여넣으십시오. 토큰은 여기에 표시되지 않습니다.',
    configCopiada: '설정이 클립보드에 복사되었습니다',
    regenerar: '토큰 재생성',
    regenerarTitulo: 'MCP 서버 토큰을 재생성하시겠습니까?',
    regenerarTexto:
      '현재 토큰은 즉시 무효화되며, 연결된 어시스턴트는 새 설정을 사용해야 합니다.',
    regenerado: '토큰이 재생성되었습니다. 설정을 다시 복사하십시오.',
    errorCargar: (detalle: string) => `MCP 서버 상태를 읽을 수 없습니다: ${detalle}`,
    confirmacion: {
      titulo: '어시스턴트가 확인을 요청합니다',
      herramienta: '도구',
      pendientes: (actual: number, total: number) => `${total}개 중 ${actual}번째`,
      aprobar: '승인',
      rechazar: '거부',
      aprobada: '작업이 승인되었습니다',
      rechazada: '작업이 거부되었습니다',
      vencida: '요청이 더 이상 대기 상태가 아닙니다.',
      descartadas: (n: number) => `외 ${n}건은 대기열 초과로 표시되지 않습니다(자동으로 만료됩니다)`,
      falloRespuesta: (detalle: string) =>
        `응답을 전송할 수 없어 요청이 대기 상태로 남아 있습니다. ${detalle}`,
      si: '예',
      no: '아니요',
      campos: {
        motor: '엔진',
        base: '데이터베이스',
        archivo: '파일',
        sobrescribir: '덮어쓰기',
        pid: 'PID',
        nombre: '프로세스',
        proyecto: '프로젝트',
        pasos: '단계',
        cantidad: '덤프 수',
      } as Record<string, string>,
    },
  },
  herramientas: {
    descripcion: '일상 개발에 유용한 도구입니다. 오프라인 및 외부 서비스 없이 작동합니다.',
    buscar: '도구 검색…',
    sinResultados: '검색과 일치하는 도구가 없습니다.',
    abrir: '열기',
    procesar: '처리 중…',
    copiar: '복사',
    copiado: '클립보드에 복사되었습니다',
    limpiar: '지우기',
    pendienteApi: '대기 중: 코어에서 아직 이 정보를 인터페이스에 제공하지 않습니다.',
    lista: {
      qr: { nombre: 'QR 생성기', descripcion: '텍스트나 터널 링크로 PNG QR 코드를 생성합니다.' },
      json: { nombre: 'JSON', descripcion: '트리 뷰와 함께 포맷팅, 유효성 검사 및 압축을 수행합니다.' },
      regex: {
        nombre: '정규식',
        descripcion: '일치 항목, 그룹 및 레퍼런스를 제공하는 테스터입니다.',
      },
      diff: {
        nombre: '텍스트 비교',
        descripcion: '텍스트 및 파일의 차이점을 나란히 비교합니다.',
      },
      tiempo: { nombre: '시간', descripcion: '시간대를 포함한 타임스탬프 ↔ 날짜 변환입니다.' },
      puertos: {
        nombre: '포트 및 프로세스',
        descripcion: '각 포트에서 수신 대기 중인 항목을 확인하고 프로세스를 종료합니다.',
      },
      bom: { nombre: 'UTF-8 BOM 정리', descripcion: '파일이나 폴더에서 BOM을 제거합니다.' },
      certificados: {
        nombre: '인증서',
        descripcion: '원하는 이름으로 WolfCore Dev CA 인증서를 발급합니다.',
      },
      cripto: {
        nombre: '암호화 도구',
        descripcion: '해시, Base64, URL, UUID, 비밀번호 및 JWT 도구입니다.',
      },
      markdown: { nombre: 'Markdown 미리보기', descripcion: '작성하면서 결과를 즉시 확인합니다.' },
      entorno: { nombre: '시스템 환경', descripcion: 'PATH, 버전 및 환경 변수를 확인합니다.' },
      buscar: {
        nombre: '검색',
        descripcion: '프로젝트, 폴더 또는 파일의 이름과 내용에서 텍스트를 검색합니다.',
      },
      infoArchivo: {
        nombre: '파일 정보',
        descripcion: '파일의 크기, 유형 및 해시를 확인합니다.',
      },
      websocket: { nombre: 'WebSocket 클라이언트', descripcion: '연결하고 메시지를 전송 및 확인합니다.' },
      contrasenas: {
        nombre: '비밀번호',
        descripcion: '비밀번호 강도를 측정하고 데이터베이스의 취약한 계정을 점검합니다.',
      },
      qrWifi: {
        nombre: 'Wi-Fi QR',
        descripcion: '다른 사람이 네트워크에 연결할 수 있는 QR 코드를 생성합니다.',
      },
      imagenes: {
        nombre: '이미지',
        descripcion: 'ICO 또는 PNG로 변환하고 JPEG 또는 WebP를 압축합니다.',
      },
      comprimir: {
        nombre: 'ZIP 및 PDF',
        descripcion: '파일과 폴더를 ZIP으로 압축하고 PDF를 최적화합니다.',
      },
      conversor: {
        nombre: '문서 변환기',
        descripcion: '이 컴퓨터 밖으로 전송하지 않고 Word, Excel, PDF, CSV 및 Markdown을 변환합니다.',
      },
    },
    errores: {
      jsonVacio: 'JSON을 입력하거나 붙여넣으십시오.',
      jsonInvalido: (linea: number, columna: number) =>
        `유효하지 않은 JSON입니다. ${linea}번째 줄, ${columna}번째 열을 확인하십시오.`,
      banderas: '유효하지 않은 플래그입니다. 중복 없이 d, g, i, m, s, u, v 또는 y만 사용하십시오.',
      regex: (detalle: string) => `유효하지 않은 정규식입니다(${detalle}).`,
      trabajador: '백그라운드에서 작업을 실행할 수 없습니다.',
      diffLento: '텍스트 차이가 너무 커서 제한 시간 내에 비교할 수 없습니다.',
      base64: '유효하지 않은 Base64입니다.',
      utf8: '디코딩된 내용이 UTF-8 텍스트가 아닙니다.',
      url: '유효하지 않은 URL 시퀀스입니다.',
      coste: (max: number) => `bcrypt 비용은 4에서 ${max} 사이여야 합니다.`,
      jwtPartes: 'JWT는 마침표로 구분된 세 부분으로 이루어져야 합니다.',
      jwtCabecera: 'JWT 헤더를 읽을 수 없습니다.',
      jwtCarga: 'JWT 페이로드를 읽을 수 없습니다.',
      longitud: '길이는 4에서 256 사이여야 합니다.',
      sinConjuntos: '문자 유형을 하나 이상 선택하십시오.',
      sinDominios: '이름 또는 IP를 하나 이상 입력하십시오.',
      muchosDominios: (max: number) => `인증서당 이름은 최대 ${max}개까지 입력할 수 있습니다.`,
    },
    qr: {
      texto: '텍스트 또는 URL',
      textoAyuda: 'QR 코드는 이 기기에서 생성되며 네트워크로 아무것도 전송되지 않습니다.',
      tunel: '프로젝트의 터널 링크',
      sinTuneles: '활성 터널이 없습니다',
      descargar: 'PNG 다운로드',
      vacio: '코드를 생성할 내용을 입력하십시오.',
      largo: '텍스트가 너무 길어 QR 코드로 생성할 수 없습니다.',
      descargado: '다운로드를 시작했습니다.',
    },
    json: {
      entrada: 'JSON',
      formatear: '포맷',
      minificar: '축소',
      validar: '검증',
      valido: '유효한 JSON입니다.',
      resultado: '결과',
      arbol: '트리',
      mas: (n: number) => `… 외 ${n}개`,
    },
    regex: {
      patron: '패턴',
      banderas: '플래그',
      texto: '테스트 텍스트',
      coincidencias: (n: number, truncado: boolean) =>
        `일치 ${n}건${truncado ? ' (처음 일부만 표시됩니다)' : ''}`,
      sinCoincidencias: '일치하는 항목이 없습니다.',
      tiempo: '표현식 실행 시간이 너무 오래 걸려 중단되었습니다(치명적 역추적 가능성).',
      grupo: (n: number) => `그룹 ${n}`,
      referencia: '빠른 참조',
      tabla: [
        ['.', '임의의 문자(s 플래그 없으면 줄 바꿈 제외)'],
        ['\\d \\w \\s', '숫자, 문자/숫자/_, 공백'],
        ['\\D \\W \\S', '위 항목의 부정'],
        ['[abc] [^abc]', '목록 중 하나 / 목록 외의 문자'],
        ['^ $', '시작과 끝(m 플래그 사용 시 각 줄의 시작과 끝)'],
        ['\\b', '단어 경계'],
        ['* + ?', '0회 이상, 1회 이상, 선택적(0회 또는 1회)'],
        ['{n,m}', 'n회 이상 m회 이하 반복'],
        ['*? +?', '지연(게으른) 버전'],
        ['(…) (?<name>…)', '캡처 그룹 및 이름 있는 캡처 그룹'],
        ['(?:…)', '비캡처 그룹'],
        ['(?=…) (?!…)', '긍정형 전방 탐색 / 부정형 전방 탐색'],
        ['a|b', '선택(OR)'],
        ['g i m s u y', '전역, 대소문자 무시, 다중 행, 단일 행(dotAll), Unicode, 고정(sticky)'],
      ] as [string, string][],
    },
    diff: {
      original: '원본',
      modificado: '수정본',
      cargarArchivo: '파일 불러오기',
      comparar: '비교',
      resumen: (mas: number, menos: number) => `+${mas} · −${menos}줄`,
      iguales: '두 텍스트가 동일합니다.',
      archivoGrande: '파일이 5 MB를 초과합니다. 더 작은 파일을 선택하십시오.',
      textoGrande: '각 텍스트는 최대 5 MB까지 입력할 수 있습니다.',
      truncado: (mostradas: number, total: number) =>
        `전체 ${total}행 중 처음 ${mostradas}행을 표시합니다.`,
    },
    tiempo: {
      timestamp: '타임스탬프(초 또는 밀리초)',
      fecha: '날짜(YYYY-MM-DD HH:mm:ss)',
      zona: '시간대',
      ahora: '현재 시각',
      segundos: '초',
      milisegundos: '밀리초',
      iso: 'ISO 8601 (UTC)',
      enZona: '선택한 시간대 기준',
      desplazamiento: '오프셋',
      relativo: '상대 시간',
      detectado: (unidad: 's' | 'ms'): string =>
        unidad === 's' ? '초 단위로 인식됨' : '밀리초 단위로 인식됨',
      timestampInvalido: '숫자만 입력하십시오(부호 포함 가능).',
      fechaInvalida: '유효한 날짜로 YYYY-MM-DD HH:mm[:ss] 형식을 사용하십시오.',
      zonaInvalida: '알 수 없는 시간대입니다.',
    },
    puertos: {
      filtro: '포트, PID 또는 이름으로 필터링',
      actualizar: '새로 고침',
      columnas: {
        puerto: '포트',
        protocolo: '프로토콜',
        proceso: '프로세스',
        pid: 'PID',
        direcciones: '주소',
        acciones: '작업',
      },
      propio: 'WolfCore Dev',
      sistema: '시스템',
      finalizar: '종료',
      noFinalizable: '시스템 프로세스와 WolfCore Dev 프로세스는 여기에서 종료할 수 없습니다.',
      confirmarTitulo: '프로세스 종료',
      confirmarTexto: (nombre: string, pid: number) =>
        `저장하지 않고 "${nombre}" (PID ${pid}) 프로세스를 종료합니다. 확인하려면 프로세스 이름을 입력하십시오:`,
      finalizado: (nombre: string) => `${nombre} 프로세스를 종료했습니다.`,
      vacio: '사용 중인 포트가 없거나 포트 정보를 읽을 수 없습니다.',
    },
    bom: {
      explicacion:
        '먼저 BOM이 포함된 파일을 표시하며, 제거 시 각 파일의 .bak-bom 사본을 저장합니다. node_modules, vendor, .git 및 바이너리 파일은 제외됩니다.',
      elegirArchivos: '파일 선택',
      elegirCarpeta: '폴더 선택',
      seleccion: (n: number) => `경로 ${n}개 선택됨`,
      analizar: '분석',
      limpiar: 'BOM 제거',
      confirmar: (n: number) =>
        `파일 ${n}개에서 BOM을 제거합니다(사본 저장). 계속하시겠습니까?`,
      conBom: (n: number) => `BOM이 포함된 파일 ${n}개`,
      sinBom: 'BOM이 포함된 파일이 없습니다.',
      limpiados: (n: number) => `파일 ${n}개를 정리했습니다.`,
      copia: '사본',
    },
    certificados: {
      explicacion:
        'WolfCore Dev의 로컬 CA로 인증서에 서명합니다. .crt 파일은 선택한 위치에 저장되며 개인 키(.key)는 같은 위치에 함께 저장됩니다. 개인 키는 절대 인터페이스를 거치지 않습니다.',
      dominios: '이름 또는 IP(공백, 쉼표 또는 줄 바꿈으로 구분)',
      ejemplo: 'miapp.test, *.miapp.test, 127.0.0.1',
      emitir: '발급 및 저장',
      guardado: '인증서를 저장했습니다',
      certificado: '인증서',
      clave: '개인 키',
    },
    cripto: {
      texto: '텍스트',
      hash: '해시',
      calcular: '계산',
      bcrypt: 'bcrypt',
      bcryptCoste: 'bcrypt 비용(Cost)',
      bcryptTrunca: 'bcrypt는 텍스트의 처음 72바이트만 사용합니다.',
      bcryptVerificar: '검증할 bcrypt 해시',
      verificar: '검증',
      coincide: '텍스트가 해시와 일치합니다.',
      noCoincide: '텍스트가 해시와 일치하지 않습니다.',
      base64: 'Base64',
      base64Url: 'URL 안전 변형',
      codificar: '인코딩',
      decodificar: '디코딩',
      url: 'URL 인코딩',
      decodificarUrl: 'URL 디코딩',
      codificarBase64: 'Base64 인코딩',
      decodificarBase64: 'Base64 디코딩',
      pestanaCodificar: 'Base64 / URL',
      pestanaGenerar: 'UUID 및 비밀번호',
      uuid: 'UUID v4',
      generar: '생성',
      generarDiez: '10개 생성',
      contrasena: '무작위 비밀번호',
      longitud: '길이',
      mayusculas: 'A-Z',
      minusculas: 'a-z',
      numeros: '0-9',
      simbolos: '기호',
      jwt: 'JWT 디코딩',
      jwtToken: '토큰',
      cabecera: '헤더',
      carga: '페이로드',
      firmaNoVerificada:
        '서명이 검증되지 않았습니다. 내용은 그대로 표시되며 변조되었을 수 있습니다.',
      vencido: '토큰이 만료되었습니다(exp).',
      vigente: '토큰이 아직 만료되지 않았습니다(exp).',
      salida: '결과',
    },
    markdown: {
      entrada: 'Markdown',
      vista: '미리 보기',
      ejemplo:
        '# 제목\n\n**굵게**, _기울임꼴_, 그리고 [링크](https://example.com)가 포함된 텍스트입니다.\n\n- 하나\n- 둘\n\n```\n코드\n```\n',
      seguro:
        '원시 HTML은 일반 텍스트로 표시되며, 위험한 링크는 제거되고 이미지는 불러오지 않습니다.',
      imagenOmitida: (alt: string) => `[이미지${alt ? `: ${alt}` : ''}]`,
    },
    entorno: {
      aplicacion: 'WolfCore Dev 버전',
      navegador: '인터페이스 엔진',
      plataforma: '플랫폼',
      idioma: '언어',
      zona: '시간대',
      nucleos: '논리 코어 수',
      actualizar: '새로 고침',
      path: 'PATH',
      pathVacio: 'PATH가 비어 있습니다.',
      herramientas: 'WolfCore Dev 도구',
      noInstalada: '설치되지 않음',
      sinRespuesta: '시간 내에 응답하지 않았습니다',
      variables: '환경 변수',
      filtro: '변수 필터링',
      enmascarada: '값이 숨겨졌습니다. 이름이 비밀 정보로 보입니다.',
    },
    busqueda: {
      explicacion:
        '링크를 따라가지 않고 바이너리 파일을 읽지 않으며 이름과 내용을 검색합니다. 기본적으로 node_modules, vendor 및 .git은 건너뜁니다.',
      origen: '검색 위치',
      proyecto: '프로젝트',
      elegirCarpeta: '폴더 선택',
      elegirArchivo: '파일 선택',
      sinOrigen: '프로젝트, 폴더 또는 파일을 선택하십시오.',
      consulta: '검색할 텍스트',
      modoNombre: '이름',
      modoContenido: '내용',
      modoAmbos: '모두',
      regex: '정규 표현식',
      mayusculas: '대소문자 구분',
      incluir: '포함할 파일만 지정(쉼표로 구분, 예: *.php)',
      excluir: '건너뛰기(쉼표로 구분)',
      buscar: '검색',
      cancelar: '취소',
      buscando: '검색 중…',
      sinResultados: '일치하는 항목이 없습니다.',
      truncado: '표시된 것보다 더 많은 결과가 있습니다. 검색 조건을 좁혀 주십시오.',
      cancelada: '검색이 취소되었습니다.',
      abrir: '편집기에서 열기',
      coincidencias: (n: number) => `일치 ${n}건`,
      resumen: (archivos: number, examinados: number) =>
        `파일 ${archivos}개에서 발견(${examinados}개 검사함)`,
    },
    infoArchivo: {
      elegir: '파일 선택',
      ayuda: '해시를 계산하기 위해 이 기기에서 파일을 읽습니다(최대 200 MB).',
      nombre: '이름',
      tamano: '크기',
      tipo: '유형',
      modificado: '수정일',
      sinTipo: '알 수 없음',
      grande: '파일이 200 MB를 초과하여 해시 없이 파일 정보만 표시합니다.',
      calculando: '해시 계산 중…',
    },
    websocket: {
      url: 'URL (ws:// 또는 wss://)',
      conectar: '연결',
      desconectar: '연결 해제',
      mensaje: '메시지',
      enviar: '전송',
      urlInvalida: 'ws:// 또는 wss://로 시작하는 URL을 입력하십시오.',
      conectando: '연결 중…',
      conectado: '연결됨',
      desconectado: '연결 끊김',
      error: '연결 오류',
      cerrado: (codigo: number, motivo: string) =>
        `연결 종료됨 (${codigo}${motivo ? `: ${motivo}` : ''})`,
      enviado: '보냄',
      recibido: '받음',
      binario: (n: number) => `[바이너리, ${n}바이트]`,
      vacio: '아직 메시지가 없습니다.',
      tope: '최근 500개의 메시지가 보관되며, 각 메시지는 최대 10 KB까지 표시됩니다.',
    },
    qrWifi: {
      ssid: '네트워크 이름(SSID)',
      clave: '비밀번호',
      seguridad: '보안',
      segWpa: 'WPA / WPA2 / WPA3',
      segWep: 'WEP',
      segNinguna: '비밀번호 없음',
      oculta: '숨겨진 네트워크',
      mostrar: '표시',
      ocultar: '숨기기',
      aviso:
        '이 QR 코드에는 비밀번호가 그대로 포함되어 있어, 코드를 보거나 촬영한 사람은 누구나 네트워크에 연결할 수 있습니다. 코드는 이 기기에서 생성되며 저장되지 않고 이 패널을 닫으면 삭제됩니다.',
      avisoPng:
        '다운로드하는 PNG 파일 안에도 비밀번호가 그대로 들어 있습니다. 본인만 볼 수 있는 안전한 곳에 보관하십시오.',
      escribala:
        '비밀번호는 사용자가 직접 입력합니다. WolfCore Dev는 시스템에 저장된 Wi-Fi 비밀번호를 절대 읽지 않습니다.',
      errorSsid: '네트워크 이름을 입력하십시오(최대 32자).',
      errorClave: '비밀번호를 입력하십시오.',
      errorClaveWpa: 'WPA 비밀번호는 8자에서 63자 사이여야 합니다.',
      vacio: '코드를 보려면 정보를 입력하십시오.',
      alt: 'Wi-Fi 네트워크 연결용 QR 코드',
      descargar: 'PNG 다운로드',
      descargado: 'QR 코드를 저장했습니다',
      largo: '데이터가 너무 길어 QR 코드로 생성할 수 없습니다.',
    },
    imagenes: {
      elegir: '이미지 선택',
      ayuda:
        '이 기기에서 처리됩니다(최대 30 MB, 한 변 최대 12000 px). 원본은 변경되지 않으며 결과는 새 파일로 저장됩니다.',
      original: '원본',
      accion: '작업 선택',
      aIco: 'ICO로 변환',
      aPng: 'PNG로 변환',
      comprimir: '압축',
      tamanos: 'ICO 크기',
      formato: '형식',
      calidad: '품질',
      ladoMax: '최대 변 길이(px, 비워 두면 원본 유지)',
      procesar: '처리',
      procesando: '처리 중…',
      guardar: '다른 이름으로 저장…',
      antes: '이전',
      despues: '이후',
      sinMejora: '결과 파일이 원본보다 작아지지 않았습니다. 다른 품질이나 형식을 시도해 보십시오.',
      errorAbrir: '이 기기에서 이미지를 열 수 없습니다.',
      errorProcesar: '이미지를 처리할 수 없습니다.',
      sufijoConvertida: '-변환',
      sufijoComprimida: '-압축',
      dimensiones: (ancho: number, alto: number) => `${ancho}×${alto} px`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% 감소`
          : porcentaje < 0
            ? `${-porcentaje}% 증가`
            : '변화 없음',
      guardado: (archivo: string) => `${archivo}에 저장했습니다.`,
    },
    comprimir: {
      zip: 'ZIP으로 압축',
      zipAyuda:
        '파일이나 폴더를 선택하십시오. 링크는 따라가지 않으며 ZIP은 새 파일로 생성되어 기존 파일을 절대 덮어쓰지 않습니다.',
      agregarArchivos: '파일 추가',
      agregarCarpeta: '폴더 추가',
      quitar: '제거',
      vacio: '아직 선택한 항목이 없습니다.',
      crearZip: 'ZIP 만들기…',
      creando: '생성 중…',
      pdf: 'PDF 최적화',
      pdfAyuda:
        '별도 스레드에서 오브젝트 스트림을 사용해 다시 저장합니다. 용량이 줄어드는 경우에만 새 파일이 생성되며, 비밀번호로 보호된 PDF는 열 수 없습니다. 원본은 변경되지 않습니다. 주의: 다시 저장하면 디지털 서명과 PDF/A 규격 준수가 손실됩니다.',
      elegirPdf: 'PDF 선택',
      optimizar: '최적화…',
      optimizando: '최적화 중…',
      antes: '이전',
      despues: '이후',
      sinMejora: '최적화해도 PDF 용량이 줄어들지 않아 새 파일을 생성하지 않았습니다.',
      sufijoOptimizado: '-최적화',
      omitidos: (n: number) =>
        `링크, 읽을 수 없는 폴더 또는 특수 파일 ${n}개는 포함되지 않았습니다.`,
      archivos: (n: number) => `파일 ${n}개`,
      ahorro: (porcentaje: number) =>
        porcentaje > 0
          ? `${porcentaje}% 감소`
          : porcentaje < 0
            ? `${-porcentaje}% 증가`
            : '변화 없음',
      guardado: (archivo: string) => `${archivo}에 저장했습니다.`,
    },
    conversor: {
      ayuda:
        '이 기기에서 변환됩니다. 문서는 어디에도 업로드되지 않습니다. 원본은 수정되지 않으며 결과는 새 파일로 저장되어 기존 파일을 절대 덮어쓰지 않습니다.',
      elegir: '문서 선택',
      tipoNoSoportado:
        '해당 파일 유형에 대한 변환 기능이 없습니다. docx, xlsx, csv, md, html, pdf(LibreOffice 설치 시 odt, pptx, doc 포함)가 지원됩니다.',
      convertirA: '변환 대상 형식',
      convertir: '변환…',
      convirtiendo: '변환 중…',
      avisoLibreOffice:
        '이 변환에는 이 기기에 이미 설치된 LibreOffice를 사용합니다. WolfCore Dev는 LibreOffice를 설치하거나 다운로드하지 않으며, 창 없이 임시 프로필로 실행합니다.',
      sinLibreOffice:
        'LibreOffice를 설치하면 odt, pptx, doc 파일도 변환할 수 있습니다(WolfCore Dev에서 설치하지는 않습니다).',
      limites:
        '보안을 위해 제한이 적용됩니다. 최대 50 MB(md 및 html은 10 MB), 120초, 200,000행, 1,000열, 500만 셀까지 허용되며, ZIP 폭탄으로 의심되거나 XML 엔티티가 포함된 파일은 거부됩니다.',
      guardado: (archivo: string) => `${archivo}에 저장했습니다.`,
    },
    contrasenas: {
      pestanaFortaleza: '강도 측정',
      pestanaAuditar: '데이터베이스 감사',
      fortaleza: {
        etiqueta: '측정할 비밀번호',
        marcador: '비밀번호를 입력하십시오',
        privacidad: '이 기기에서 바로 측정됩니다. 외부로 전송되거나 저장되지 않습니다.',
        mostrar: '표시',
        ocultar: '숨기기',
        niveles: ['매우 약함', '약함', '보통', '강함', '매우 강함'],
        sinAvisos: '특이 사항이 없습니다.',
        estimacion: '이 결과는 추정치이며 보장이 아닙니다.',
        avisos: {
          straightRow: '연속된 키보드 배열은 추측하기 쉽습니다.',
          keyPattern: '짧은 키보드 패턴은 추측하기 쉽습니다.',
          simpleRepeat: '같은 문자나 묶음을 반복해도 보안이 거의 강화되지 않습니다.',
          extendedRepeat: '반복되는 문자 묶음은 추측하기 쉽습니다.',
          sequences: 'abc나 6543 같은 연속 문자열은 추측하기 쉽습니다.',
          recentYears: '최근 연도나 본인과 관련된 날짜는 피하십시오.',
          dates: '날짜는 추측하기 쉬우므로 피하십시오.',
          topTen: '가장 많이 사용되는 상위 10개 비밀번호에 해당합니다.',
          topHundred: '가장 많이 사용되는 상위 100개 비밀번호에 해당합니다.',
          common: '매우 흔하게 사용되는 비밀번호입니다.',
          similarToCommon: '매우 흔하게 사용되는 비밀번호와 비슷합니다.',
          wordByItself: '단어 하나만 사용하면 추측하기 쉽습니다.',
          namesByThemselves: '이름이나 성만 단독으로 사용하면 추측하기 쉽습니다.',
          commonNames: '흔한 이름과 성은 추측하기 쉽습니다.',
          userInputs: '다른 사람이 알 수 있는 개인 정보는 사용하지 마십시오.',
          l33t: '예측 가능한 기호 치환(a를 @로 변경 등)은 거의 도움이 되지 않습니다.',
          reverseWords: '단어를 거꾸로 써도 거의 도움이 되지 않습니다.',
          allUppercase: '모두 대문자로 써도 거의 도움이 되지 않습니다.',
          capitalization: '첫 글자만 대문자로 써도 거의 도움이 되지 않습니다.',
          associatedYears: '본인과 관련된 연도는 피하십시오.',
          repeated: '단어와 문자의 반복을 피하십시오.',
          longerKeyboardPattern: '더 긴 키보드 패턴을 사용하고 중간에 방향을 바꾸십시오.',
          anotherWord: '단어를 한두 개 더 추가하십시오. 흔하지 않은 단어일수록 좋습니다.',
          useWords: '무작위 단어 여러 개를 조합하면 안전한 비밀번호가 됩니다.',
          noNeed: '기호나 숫자가 없어도 안전할 수 있습니다. 중요한 것은 길이입니다.',
        },
      },
      auditar: {
        limite:
          '이 기능은 매우 흔한 비밀번호만 탐지합니다. 각 해시를 약 200개의 짧은 목록과 비교할 뿐이며, 공격이나 무차별 대입 테스트가 아닙니다. 계정이 표시되지 않았다고 해서 비밀번호가 안전하다는 뜻은 아닙니다.',
        privacidad:
          '일치한 비밀번호가 무엇인지는 절대 표시되지 않으며, 읽기 전용 임시 사용자로 조회합니다(PostgreSQL의 경우 읽기 전용 세션 사용). 반드시 본인의 데이터베이스에서만 사용하십시오.',
        motor: '엔진',
        base: '데이터베이스',
        tabla: '테이블',
        columnaUsuario: '사용자 열',
        columnaHash: '해시 열',
        tablaMarcador: 'users',
        usuarioMarcador: 'email',
        hashMarcador: 'password',
        apagado: '데이터베이스를 검사하려면 데이터베이스 메뉴에서 서버를 시작하십시오.',
        sinBases: '이 서버에 데이터베이스가 없습니다.',
        sinMotores: '로컬 MySQL, MariaDB 또는 PostgreSQL 서버가 없습니다.',
        revisar: '검사',
        revisando: '검사 중…',
        resumen: (r: number, d: number) =>
          `계정 ${r}개 검사함 · 취약 ${d}개`,
        sinDebiles: '검사한 계정 중 매우 흔한 비밀번호와 일치하는 항목이 없습니다.',
        noRevisables: (n: number) =>
          `검사할 수 없는 계정 ${n}개:`,
        truncado:
          '10,000행 또는 60초 제한에 도달하여 검사가 중단되었습니다. 아직 검사되지 않은 계정이 남아 있습니다.',
        usuario: '사용자',
        motivo: '사유',
        accion: '작업',
        motivos: {
          comun: '매우 흔한 비밀번호',
          formato_debil: '취약한 형식(솔트 없는 md5 또는 sha1)',
        },
        restablecer: '재설정',
        mas: (n: number) => `외 ${n}개(처음 200개만 표시됩니다)`,
        esquema: '스키마(PostgreSQL)',
        esquemaMarcador: 'public',
        cancelar: '취소',
        cancelando: '취소 중…',
        cancelada: '감사가 취소되었습니다.',
        progreso: (a: number, b: number) => `${b}개 중 ${a}개 검사함`,
        tiposNoRevisables: {
          vacio: '빈 해시',
          md5crypt: 'md5crypt ($1$)',
          sha256crypt: 'sha256crypt ($5$)',
          sha512crypt: 'sha512crypt ($6$)',
          scrypt: 'scrypt',
          argon2: 'Argon2(이 기기에서 사용할 수 없거나 매개변수가 허용 한도를 초과함)',
          bcrypt_otro: '비용이 범위를 벗어난 bcrypt 또는 $2x$ 변형',
          pbkdf2_otro: '매개변수가 허용 한도를 초과한 PBKDF2',
          ldap: 'LDAP 형식({SHA}…)',
          otro: '알 수 없는 형식',
        },
        rlsActiva:
          '이 테이블에 행 수준 보안(RLS)이 적용되어 있습니다. 감사는 제한된 역할에 정책이 허용한 행만 조회하므로 일부 계정이 누락될 수 있습니다.',
        falsoPositivo:
          '32자 또는 40자의 16진수 값은 md5 또는 sha1로 간주되지만 다른 값(예: 토큰)일 수도 있습니다. 해당 열이 비밀번호를 저장하지 않는다면 결과는 의미가 없습니다.',
      },
      restablecer: {
        titulo: (u: string) => `${u}의 비밀번호 재설정`,
        ayuda:
          '기존 비밀번호는 복구할 수 없으며 새 비밀번호를 설정합니다. 실행 전에 데이터베이스 스냅샷을 생성하고 해당 행의 사본을 저장합니다.',
        cargando: '미리 보기 준비 중…',
        sentencia: '실행될 구문(값은 별도로 전달되며 표시되지 않습니다)',
        formatoActual: (f: string) => `현재 형식: ${f}`,
        cambiaFormato:
          '이 계정은 bcrypt로 전환됩니다. 애플리케이션이 bcrypt를 검증할 수 있어야 하며(예: password_verify), 그렇지 않으면 해당 계정으로 아무도 로그인할 수 없게 됩니다.',
        nueva: '새 비밀번호',
        generar: '자동 생성',
        mostrar: '표시',
        ocultar: '숨기기',
        anotar: '지금 바로 기록해 두십시오. 다시 표시되거나 저장되지 않습니다.',
        escribaUsuario: (u: string) => `확인하려면 사용자 이름을 입력하십시오: ${u}`,
        confirmar: '비밀번호 재설정',
        cancelar: '취소',
        cerrar: '닫기',
        hecho: '비밀번호를 재설정했습니다.',
        copiaFila: '행 사본(식별자 및 이전 해시, 30일간 보관):',
        instantanea: '이전 데이터베이스 스냅샷:',
        instantaneaAyuda: '데이터베이스 › 스냅샷에서 이전 상태로 복원할 수 있습니다.',
        aBcrypt: 'bcrypt로 전환: 애플리케이션이 password_verify 또는 동등한 방식을 사용하는 경우에만 선택하십시오',
        avisoLegado:
          '이 해시는 솔트가 없는 md5 또는 sha1이며 해당 형식이 유지됩니다. 애플리케이션이 솔트를 별도로 저장하는 경우(다른 열이나 상수) 해시를 재현할 수 없으므로 새 비밀번호로 로그인할 수 없게 됩니다.',
        datosReales: {
          titulo: '실제 데이터가 포함된 데이터베이스',
          texto:
            '이 데이터베이스는 실제 고객 데이터가 있는 것으로 표시된 사이트에 속합니다. 비밀번호를 재설정하면 실제 계정이 변경됩니다.',
          casilla: '실제 데이터임을 이해했으며 이 비밀번호를 재설정하겠습니다',
        },
        rlsActiva:
          '이 테이블에 행 수준 보안(RLS)이 적용되어 있습니다. 정책이 제한된 역할에 이 계정을 숨기는 경우 재설정할 수 없습니다.',
        copiaSinRestringir:
          '해당 사본의 접근 권한을 이 기기의 사용자로 제한할 수 없었습니다. 폴더 권한을 확인하십시오.',
      },
    },
  },
  doctor: {
    descripcion:
      '포트, 인증서, hosts 파일, PATH, Visual C++, 바이러스 백신 및 서비스를 점검하고 복구 방법을 제안합니다.',
    revisarAhora: '지금 점검',
    revisando: '점검 중…',
    sinRevision: '아직 점검 기록이 없습니다. "지금 점검"을 누르십시오.',
    sinHallazgos: '모두 정상입니다. 문제가 발견되지 않았습니다.',
    gravedades: { error: '오류', aviso: '알림', info: '정보' },
    evidencia: '확인된 내용',
    requiereAdmin: '관리자 권한 필요',
    comandoManual: '관리자 콘솔용 명령어(자동으로 실행되지 않습니다):',
    copiar: '명령어 복사',
    copiado: '명령어를 복사했습니다.',
    reparar: '복구',
    alternativa: 'WolfCore Dev 포트 변경',
    soloInforma: 'WolfCore Dev가 이 항목을 자동으로 변경하지 않습니다. 안내에 따라 직접 조치하십시오.',
    dialogo: {
      titulo: '복구 확인',
      queHara: '다음 작업이 수행됩니다:',
      admin: 'Windows에서 관리자 권한을 요청합니다.',
      puerto: (p: string | number) => `새 포트는 ${p}번입니다.`,
      aplicar: '적용',
      cancelar: '취소',
    },
    estados: {
      aplicando: '적용 중…',
      hecha: '복구를 적용했습니다.',
      fallida: '복구할 수 없었습니다.',
    },
    revisiones: {
      puertos: '포트',
      'rangos-reservados': '예약된 범위',
      ca: '인증 기관(CA)',
      certificados: '인증서',
      confianza: 'CA 신뢰 설정',
      hosts: 'hosts 파일',
      path: '사용자 PATH',
      vcredist: 'Visual C++',
      'enlazador-msvc': 'C++ 링커',
      antivirus: '바이러스 백신',
      firewall: '방화벽',
      servicios: '서비스',
    },
    reparaciones: {
      cambiar_puerto: 'WolfCore Dev의 포트를 사용 가능한 포트로 변경합니다. 다른 프로그램은 건드리지 않습니다.',
      puerto_manual:
        'WolfCore Dev의 포트를 예약된 범위 밖으로 이동합니다. 예약 범위를 해제할지는 표시된 명령어를 통해 직접 결정하십시오.',
      detener_iis:
        '포트를 확보하기 위해 IIS 서비스(W3SVC)를 중지합니다. 비활성화되지는 않으므로 Windows를 다시 시작하면 다시 실행됩니다.',
      regenerar_ca:
        '새 인증 기관을 생성하여 Windows에 신뢰 등록하고(확인 창이 표시됨), 인증서를 다시 발급한 뒤 기존 인증 기관을 제거합니다. 실행 전에 백업 사본을 저장합니다.',
      regenerar_certificados: '사이트의 인증서를 다시 발급하고 Nginx를 다시 불러옵니다.',
      hosts_reescribir:
        '이전 사본을 저장한 뒤 hosts 파일의 WolfCore Dev 블록을 UTF-8로 다시 씁니다. 다른 줄은 건드리지 않습니다.',
      hosts_solo_lectura: 'hosts 파일의 읽기 전용 속성을 제거합니다.',
      path_duplicados:
        '이전 값의 사본을 저장한 뒤 사용자 PATH에서 중복된 WolfCore Dev 항목을 제거합니다. 다른 항목은 건드리지 않습니다.',
      path_ajeno:
        '다른 도구가 PATH에서 더 앞에 위치해 있습니다. WolfCore Dev가 이를 제거하지 않으므로 필요하면 직접 순서를 변경하십시오.',
      instalar_vcredist:
        'winget으로 Visual C++ 2015+ x64를 설치합니다. Microsoft 설치 프로그램이 별도로 권한을 요청합니다.',
      instalar_build_tools:
        '표시된 명령어를 사용하여 Visual Studio Build Tools(C++ 도구 포함)를 설치하십시오. 용량이 수 GB에 달하며 관리자 권한이 필요하므로 직접 결정하여 실행하시기 바랍니다.',
      antivirus:
        '표시된 명령어를 사용하여 데이터 폴더를 바이러스 백신 예외 항목에 추가할지 직접 결정하십시오.',
      firewall:
        '표시된 명령어를 관리자 콘솔에서 실행하여 해당 규칙을 제거할지 직접 결정하십시오. WolfCore Dev는 방화벽을 절대 변경하지 않습니다.',
      reintentar_servicio: '서비스를 다시 시작합니다.',
      firefox_confianza:
        '각 Firefox 프로필의 user.js에 Windows 인증 기관을 신뢰하는 설정을 추가합니다(사전 백업 생성). prefs.js는 건드리지 않으며 열려 있는 프로필은 건너뜁니다.',
    },
    confianza: {
      titulo: 'CA 신뢰 설정',
      texto:
        'Windows는 이미 WolfCore Dev 인증 기관을 신뢰합니다. Node, Python 및 Firefox는 자체 저장소를 사용합니다.',
      sinCa: '아직 인증 기관이 없습니다. 이 섹션을 사용하려면 HTTPS에서 먼저 생성해 주세요.',
      node: {
        titulo: 'Node',
        proyectos:
          '프로젝트 프로세스와 터미널은 인증 기관이 지정된 NODE_EXTRA_CA_CERTS를 전달받습니다.',
        ajena: '이미 자체 NODE_EXTRA_CA_CERTS가 설정되어 있어 WolfCore Dev가 덮어쓰지 않습니다.',
        global: '사용자 환경 변수로도 설정 (다른 터미널 및 프로그램용)',
        confirmarActivar:
          'NODE_EXTRA_CA_CERTS가 사용자 환경 변수로 설정됩니다. 이후에 실행하는 프로그램에 적용되며, 이 옵션을 끄면 제거됩니다.',
        confirmarDesactivar: 'WolfCore Dev가 설정한 NODE_EXTRA_CA_CERTS 변수가 제거됩니다.',
      },
      python: {
        titulo: 'Python',
        texto:
          '.venv가 있는 프로젝트는 certifi(또는 Windows) 루트 인증서와 이 인증 기관을 함께 포함한 REQUESTS_CA_BUNDLE 및 SSL_CERT_FILE을 전달받습니다. 인증 기관 단독으로는 설정되지 않습니다.',
      },
      firefox: {
        titulo: 'Firefox',
        sinPerfiles: 'Firefox 프로필을 찾을 수 없습니다.',
        activo: '신뢰함',
        inactivo: '신뢰 안 함',
        abierto: '열림',
        fuera: 'Firefox 폴더 외부',
        avisoFuera: (lista: string) =>
          `다음 프로필은 Firefox 폴더 외부에 있으므로 선택하지 않는 한 변경되지 않습니다: ${lista}.`,
        incluirFuera: 'Firefox 폴더 외부의 프로필도 함께 변경',
        resultadoFuera: (n: number) =>
          `Firefox 폴더 외부 프로필 ${plural(n, '개')}는 변경되지 않았습니다.`,
        activar: 'Firefox에서 활성화',
        quitar: 'Firefox에서 제거',
        confirmarActivar:
          '각 프로필의 user.js에 WolfCore Dev 표시 사이에 security.enterprise_roots.enabled가 추가되며, etc/respaldos에 사전 백업이 저장됩니다. prefs.js는 건드리지 않습니다. Firefox가 열려 있는 프로필은 건너뛰므로 먼저 Firefox를 닫아 주세요.',
        confirmarQuitar:
          '각 프로필의 user.js에서 WolfCore Dev 블록이 제거됩니다(사전 백업 생성). 다른 설정은 그대로 유지됩니다.',
        resultadoOk: (n: number) => `프로필 ${plural(n, '개')}에 적용 완료되었습니다.`,
        resultadoAbiertos: (n: number) =>
          `Firefox가 열려 있어 프로필 ${plural(n, '개')}를 건너뛰었습니다. Firefox를 닫고 다시 시도해 주세요.`,
        resultadoError: (n: number) =>
          `프로필 ${plural(n, '개')}를 변경할 수 없었습니다.`,
      },
      confirmar: '확인',
      cancelar: '취소',
    },
  },
  php: {
    descripcion:
      '설치된 각 PHP 버전의 php.ini 및 확장 기능입니다. 저장하기 전에 diff를 표시하고 php -v로 테스트하며 날짜가 포함된 백업을 저장합니다. PHP가 다시 시작되지 않으면 이전 설정으로 복원됩니다.',
    rama: 'PHP 버전',
    sinPhp: '설치된 PHP가 없습니다. 서비스에서 설치해 주세요.',
    irServicios: '서비스로 이동',
    pestanas: { ini: 'php.ini', extensiones: '확장 기능' },
    rapidosTitulo: '빠른 설정',
    rapidosAyuda: '아래 텍스트에 적용됩니다. diff를 확인하기 전까지는 저장되지 않습니다.',
    aplicarRapidos: '텍스트에 적용',
    sinValor: '미설정',
    rapidos: {
      memory_limit: '스크립트당 메모리 (memory_limit)',
      upload_max_filesize: '최대 업로드 크기 (upload_max_filesize)',
      post_max_size: '최대 POST 크기 (post_max_size)',
      max_execution_time: '최대 실행 시간(초) (max_execution_time)',
      display_errors: '오류 표시 (display_errors)',
      error_reporting: '오류 보고 수준 (error_reporting)',
      'date.timezone': '시간대 (date.timezone)',
      'opcache.enable': 'OPcache (opcache.enable)',
    },
    editorTitulo: 'php.ini',
    editorAyuda: ';로 시작하는 줄은 주석입니다.',
    sinCambios: '저장된 내용과 비교하여 변경 사항이 없습니다.',
    descartar: '변경 사항 취소',
    revisar: '검토 및 저장',
    diffTitulo: (rama: string) => `PHP ${rama}의 php.ini 변경 사항`,
    diffAyuda:
      '날짜가 포함된 백업을 저장하고 php -v로 테스트한 뒤, PHP가 실행 중이면 재시작합니다.',
    guardar: '저장 및 적용',
    cancelar: '취소',
    guardado: (respaldo: string) => `php.ini가 저장되었습니다. 이전 백업: ${respaldo}`,
    respaldosTitulo: '날짜별 백업',
    sinRespaldos: '아직 백업이 없습니다.',
    restaurar: '복원',
    confirmarRestaurar: (nombre: string) =>
      `${nombre} 백업을 복원하시겠습니까? 현재 php.ini는 먼저 별도의 백업으로 저장됩니다.`,
    restaurado: '백업이 복원되었습니다.',
    recargar: '다시 불러오기',
    extensiones: {
      ayuda:
        '이 빌드의 ext/ 폴더에 포함된 확장 기능만 활성화됩니다. 서드파티 확장 기능은 카탈로그에서 설치할 수 있습니다(현재 빌드 변형에 맞으며 SHA-256 해시 검증 완료).',
      activa: '활성',
      inactiva: '비활성',
      falta: '파일 없음',
      catalogo: '카탈로그',
      instalar: '설치',
      instalada: (nombre: string) => `${nombre} 확장 기능이 설치 및 활성화되었습니다.`,
      cambiada: (nombre: string, activa: boolean) =>
        activa ? `${nombre} 확장 기능이 활성화되었습니다.` : `${nombre} 확장 기능이 비활성화되었습니다.`,
      buscar: '확장 기능 검색',
      vacio: '일치하는 확장 기능이 없습니다.',
    },
  },
  agentes: {
    descripcion:
      'Claude Code, Codex CLI, Hermes Agent, Opencode, Gemini CLI, Qwen Code, GitHub Copilot CLI 및 Antigravity CLI를 감지하거나 설치하고 프로젝트에서 열 수 있습니다. 지원하는 에이전트는 WolfCore Dev의 MCP에 연결됩니다. 어떤 에이전트도 자동으로 실행되지 않습니다.',
    recargar: '다시 감지',
    notaMcp:
      '등록된 MCP는 에이전트를 WolfCore Dev("프로젝트에서 열기")에서 실행할 때만 인증됩니다. 토큰은 해당 터미널의 WOLFCORE_MCP_TOKEN 변수로만 전달되며 에이전트 설정 파일에는 절대 기록되지 않습니다. 외부에서 실행하면 에이전트에 «wolfcore» 항목이 보이지만 연결할 수 없습니다.',
    sitioElegido: (nombre: string) => `${nombre}에서 열 에이전트를 선택해 주세요.`,
    instalado: '설치됨',
    noInstalado: '미설치',
    version: (v: string) => `v${v}`,
    versionDesconocida: '알 수 없는 버전',
    verVersion: '버전 보기',
    verVersionAyuda: '프로그램을 --version 옵션으로 실행합니다(화면을 열 때 자동으로 실행되지 않습니다).',
    origen: {
      propio: 'WolfCore Dev에서 설치함',
      'npm-usuario': '사용자 전역 npm',
      ejecutable: '시스템 프로그램',
    },
    mcpRegistrado: 'MCP 등록됨',
    mcpSinRegistrar: 'MCP 미등록',
    tokenEscrito:
      '에이전트 설정 파일에 MCP 토큰이 기록되어 있었습니다. 현재는 제거되었으며 이전 백업에는 마스킹(***) 처리되어 저장되었습니다. 보안을 위해 MCP 서버 토큰을 재생성하는 것을 권장합니다.',
    mcpNoSoportado:
      '공식 문서상 환경 변수에서 토큰을 읽는 기능을 지원하지 않으므로 WolfCore Dev가 MCP를 등록하지 않습니다(토큰은 파일에 절대 기록하지 않습니다).',
    instalar: '설치',
    instalando: '설치 중…',
    guia: '설치 가이드',
    soloGuia:
      'WolfCore Dev에서는 직접 설치하지 않습니다(설치 프로그램에 고정 해시가 없음). 공식 가이드를 따라 설치해 주세요.',
    registrar: 'MCP 등록',
    quitar: 'MCP 제거',
    abrir: '프로젝트에서 열기',
    confirmarInstalar: {
      titulo: (nombre: string) => `${nombre}을(를) 설치하시겠습니까?`,
      texto: (paquete: string) =>
        `WolfCore Dev의 Node를 사용하여 registry.npmjs.org에서 ${paquete}의 최신 공개 버전을 데이터 폴더에 설치합니다.`,
      aislado: '사용자의 npm 설정을 사용하지 않으며 전역 npm을 건드리지 않습니다. 몇 분 정도 걸릴 수 있습니다.',
      aceptar: '설치',
      hecho: (nombre: string) => `${nombre} 설치가 완료되었습니다.`,
    },
    confirmarRegistrar: {
      titulo: (nombre: string) => `${nombre}에 MCP를 등록하시겠습니까?`,
      texto:
        '이 파일에서 «wolfcore» 항목만 추가(또는 업데이트)되며 나머지는 그대로 유지됩니다:',
      aceptar: '등록',
      hecho: (nombre: string) => `${nombre}에 MCP가 등록되었습니다.`,
    },
    confirmarQuitar: {
      titulo: (nombre: string) => `${nombre}에서 MCP를 제거하시겠습니까?`,
      texto: '이 파일에서 «wolfcore» 항목만 제거되며 나머지는 그대로 유지됩니다:',
      aceptar: '제거',
      hecho: (nombre: string) => `${nombre}에서 MCP가 제거되었습니다.`,
    },
    copiaPrevia:
      '수정하기 전에 파일 옆에 날짜가 포함된 백업(<파일명>.wolfcore-YYYYMMDD-HHmmss.bak)을 저장하며 최신 5개가 보관됩니다. 에이전트가 열려 있다면 먼저 닫아 주세요.',
    copiaHecha: (ruta: string) => `이전 백업: ${ruta}`,
    dialogoAbrir: {
      titulo: (nombre: string) => `${nombre} 열기`,
      proyecto: '프로젝트',
      sinProyectos: '아직 프로젝트가 없습니다.',
      proveedor: 'AI 제공자',
      proveedorPropio: '에이전트에 설정된 기본값',
      proveedorAyuda:
        '제공자를 선택하면 API 키가 해당 터미널의 환경 변수로만 전달되며, 파일이나 명령줄에는 기록되지 않습니다.',
      aceptar: '터미널 열기',
      hecho: (nombre: string) => `새 터미널에서 ${nombre}이(가) 열렸습니다.`,
    },
    costo: {
      titulo: '에이전트를 열기 전에',
      texto:
        'AI 에이전트는 사용자의 제공자 계정으로 동작합니다. 각 요청은 토큰을 소비하며 비용이 발생할 수 있습니다. 또한 프로젝트 파일을 읽고 수정하거나 명령을 실행할 수 있습니다.',
      nunca:
        'WolfCore Dev는 에이전트를 임의로 실행하지 않으며 항상 사용자의 요청에 의해서만 엽니다. 이 알림은 한 번만 표시됩니다.',
      aceptar: '이해했습니다, 열기',
    },
  },
  depuracion: {
    descripcion:
      'PHP 사이트의 dump(), dd(), wd() 출력과 Python 프로세스의 wolfdump 출력을 파일 및 줄 번호와 함께 여기에서 확인합니다. 페이지 응답은 그대로 유지됩니다.',
    receptor: '덤프 캡처',
    escuchando: (direccion: string, puerto: number) => `${direccion}:${puerto}에서 수신 대기 중`,
    apagado: '꺼짐',
    memoria:
      '덤프는 메모리에만 보관되며(최근 500개) 앱을 닫으면 사라집니다. 민감한 데이터가 포함될 수 있으므로 복사 시 알려진 키는 마스킹됩니다.',
    sitios: '사이트',
    sinSitios: 'PHP 또는 FastAPI 사이트가 없습니다.',
    sinPhp: '먼저 사이트에서 PHP 버전을 선택해 주세요.',
    php: 'PHP',
    python: 'Python',
    reiniciarProcesos: 'wolfdump를 적용하려면 사이트의 프로세스를 재시작해 주세요.',
    confirmarTitulo: (sitio: string) => `${sitio}에서 캡처 활성화`,
    confirmarPhp:
      '이 사이트의 PHP는 각 요청 전에 WolfCore Dev 파일(auto_prepend_file, 이 사이트에만 적용)을 로드하여 프로젝트에 정의되지 않은 경우 dump(), dd(), wd()를 정의합니다. 프로젝트 파일에서 function_exists 확인 없이 자체 dump() 또는 dd() 함수를 선언하는 경우 PHP 오류가 발생할 수 있으므로 이때는 캡처를 비활성화해 주세요. 사이트는 자체 PHP 프로세스를 사용하도록 전환됩니다.',
    usoPhp:
      'Laravel 및 Symfony: 기존과 동일하게 dump($x) 및 dd($x)를 사용합니다. CodeIgniter 3 및 기타: wd($x)는 페이지에 아무것도 표시하지 않고 전송합니다.',
    confirmarPython:
      '이 사이트의 프로세스 PYTHONPATH에 wolfdump 모듈이 포함됩니다(프로젝트에는 아무 파일도 쓰지 않습니다). 프로세스를 다음에 시작할 때부터 적용됩니다.',
    usoPython: 'from wolfdump import dump  →  dump(값)',
    activar: '캡처 활성화',
    cancelar: '취소',
    filtroSitio: '모든 사이트',
    filtroOrigen: '모든 출처',
    buscar: '텍스트, 파일 또는 URL 검색',
    limpiar: '지우기',
    confirmarLimpiar: '메모리의 모든 덤프를 삭제하시겠습니까?',
    vacio: '아직 수신된 덤프가 없습니다.',
    vacioApagado: '시작하려면 캡처를 활성화하고 사이트를 켜 주세요.',
    elegir: '목록에서 덤프를 선택해 주세요.',
    copiar: '복사',
    copiado: '복사됨(키 마스킹 적용)',
    sinSitio: '사이트 없음',
    total: (n: number) => `메모리에 ${n}개`,
    archivo: '파일',
    url: 'URL',
    pestanaVolcados: '덤프',
    pestanaErrores: '오류',
    erroresDescripcion:
      'PHP, Nginx, laravel.log, CodeIgniter 3 및 Python 로그의 오류를 묶어서 표시합니다. 동일한 오류가 반복되면 횟수와 함께 한 번만 표시됩니다.',
    erroresVacio: '로그에 오류가 없습니다. 오류가 기록되면 즉시 여기에 표시됩니다.',
    erroresElegir: '목록에서 오류를 선택해 주세요.',
    actualizar: '새로고침',
    abrirEditor: '편집기에서 열기',
    abrirEditorSinSitio: '사이트 폴더 내의 파일만 열 수 있습니다.',
    veces: (n: number) => `${n}회`,
    primera: '최초 발생',
    ultima: '최근 발생',
    fuente: '로그',
    traza: '스택 트레이스(최근)',
    sinTraza: '스택 트레이스가 없습니다.',
  },
  contenedores: {
    descripcion:
      '이 PC의 Docker 또는 Podman 컨테이너를 조회하고 제어합니다. WolfCore Dev는 컨테이너, 이미지, 볼륨을 생성, 삭제하거나 다운로드하지 않습니다.',
    motor: '엔진',
    refrescar: '새로고침',
    detectando: 'Docker 및 Podman 검색 중…',
    sinMotorTitulo: 'Docker 및 Podman 없음',
    sinMotor:
      '이 PC에서 Docker 또는 Podman을 찾을 수 없습니다. WolfCore Dev는 이를 설치하지 않으므로, 필요하면 공식 페이지에서 설치한 후 새로고침을 눌러 주세요.',
    instalarDocker: 'Docker 설치',
    instalarPodman: 'Podman 설치',
    apagadoTitulo: (m: string) => `${m}이(가) 응답하지 않습니다`,
    apagado: (m: string) =>
      `${m}이(가) 설치되어 있지만 엔진이 응답하지 않습니다. Docker Desktop을 열거나 «podman machine start»로 Podman 머신을 시작한 뒤 새로고침을 눌러 주세요.`,
    remoto:
      '원격 연결(DOCKER_HOST, CONTAINER_HOST, 컨텍스트 또는 기본 연결)은 무시되었습니다. WolfCore Dev는 이 PC의 로컬 엔진만 사용합니다.',
    desdePath: '기본 설치 폴더가 아닌 PATH에서 발견되었습니다.',
    version: (v: string) => `버전 ${v}`,
    vacio: '컨테이너가 없습니다.',
    columnas: {
      nombre: '이름',
      imagen: '이미지',
      estado: '상태',
      puertos: '포트',
      compose: 'Compose',
      acciones: '작업',
    },
    estados: {
      corriendo: '실행 중',
      detenido: '중지됨',
      pausado: '일시 중지됨',
      otro: '기타',
    },
    codigoSalida: (n: number) => `코드 ${n}`,
    iniciar: '시작',
    detener: '중지',
    reiniciar: '재시작',
    registros: '로그',
    confirmarDetenerTitulo: '컨테이너를 중지하시겠습니까?',
    confirmarDetener: (n: string) =>
      `«${n}» 컨테이너를 중지합니다. 내부에서 실행 중인 작업이 중단됩니다(엔진이 종료될 때까지 몇 초 대기합니다). 데이터는 삭제되지 않습니다.`,
    confirmarReiniciarTitulo: '컨테이너를 재시작하시겠습니까?',
    confirmarReiniciar: (n: string) =>
      `«${n}» 컨테이너를 재시작합니다. 내부에서 실행 중인 작업이 중단된 후 다시 시작됩니다. 데이터는 삭제되지 않습니다.`,
    confirmar: '확인',
    cancelar: '취소',
    hecho: {
      iniciar: (n: string) => `«${n}» 시작됨.`,
      detener: (n: string) => `«${n}» 중지됨.`,
      reiniciar: (n: string) => `«${n}» 재시작됨.`,
    },
    registroTitulo: (n: string) => `«${n}» 로그`,
    registroEsperando: '로그 출력 대기 중…',
    registroFin: '로그가 종료되었습니다(컨테이너가 중지되었거나 엔진 연결이 끊어졌습니다).',
    cerrar: '닫기',
  },
  versiones: {
    pestana: '버전',
    pestanaServicios: '서비스',
    elegirServicio: '서비스',
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
        '각 주요 버전(8.4, 17…)은 자체 데이터 폴더와 포트를 가진 별도의 인스턴스로 동작하므로 여러 개를 동시에 켤 수 있습니다. 별표는 새 프로젝트에 사용할 기본 버전을 나타냅니다.',
      pool: '실행 중인 각 PHP 버전은 자체 PHP 프로세스를 가지며, 별표는 새 프로젝트에 사용할 기본 버전을 나타냅니다.',
      unica:
        '여러 버전을 설치할 수 있지만 동시에 하나만 실행할 수 있습니다. 다른 버전을 켜면 활성 버전이 전환됩니다.',
      ninguno:
        '따로 실행할 서비스가 없습니다. 프로젝트는 요청한 버전이나 기본 버전(별표)을 사용합니다.',
    },
    filtroRama: '버전',
    todasRamas: '모든 버전',
    rama: (r: string) => r,
    cabecera: (servicio: string, r: string) => `${servicio} ${r}`,
    mostrarTodas: '모두 표시',
    origen: {
      vivo: '온라인',
      cache: (h: number) => (h < 1 ? '1시간 미만 전 캐시' : `${h}시간 전 캐시`),
      fija: '오프라인 목록',
    },
    actualizarLista: '목록 새로고침',
    errorCarga: '버전 목록을 불러올 수 없습니다',
    vacio: '표시할 버전이 없습니다.',
    soporte: { lts: 'LTS', actual: '최신', fin: '지원 종료', preview: 'Preview' },
    finSoporte: (f: string) => `${f}까지 지원`,
    finSoportePasado: (f: string) => `${f}부로 지원 종료`,
    marcas: {
      instalada: '설치됨',
      encendida: '실행 중',
      actualizacion: (v: string) => `업데이트: ${v}`,
      bloqueada: '잠김',
      sinHuella: '게시된 해시 없음',
      huellaDebil: 'MD5 해시만 제공',
      firmada: 'PGP 서명됨',
    },
    ayudaFirmada:
      '공식 배포처에서 이 다운로드를 PGP로 서명했습니다. WolfCore Dev가 설치 전에 앱에 고정된 키로 서명을 검증합니다.',
    ayudaSinHuella:
      '공식 배포처에서 강력한 해시(SHA-256 또는 SHA-512)를 제공하지 않아 다운로드 무결성을 검증할 수 없습니다.',
    instalar: '설치',
    desinstalar: '제거',
    encender: '켜기',
    apagar: '끄기',
    actualizar: '업데이트',
    usarEsta: '이 버전 사용',
    usarEstaAyuda: (id: string) =>
      `${id} 인스턴스는 이 서비스의 다른 버전을 사용 중입니다. 데이터를 먼저 백업한 뒤 전환합니다.`,
    predeterminada: '새 프로젝트의 기본값',
    hacerPredeterminada: '새 프로젝트 기본값으로 설정',
    predeterminadaHecha: (v: string) => `${v} 버전이 기본값으로 설정되었습니다.`,
    puerto: '포트',
    puertoDe: (id: string) => `${id} 포트`,
    cambiarPuerto: '변경',
    puertoCambiado: (p: number) => `포트가 ${p}(으)로 변경되었습니다.`,
    puertoProyectosTitulo: '이전 포트를 사용하는 프로젝트',
    puertoProyectos: (viejo: number, nuevo: number, lista: string) =>
      `다음 프로젝트의 .env 파일이 여전히 이전 포트 ${viejo}을(를) 사용하고 있습니다(자동 변경되지 않음): ${lista}. 포트를 ${nuevo}(으)로 변경해 주세요.`,
    resolver: '해결',
    instalada: (v: string) => `${v} 설치가 완료되었습니다.`,
    selector: { etiqueta: '인스턴스', predeterminada: '기본값', apagada: '꺼짐' },
    dialogoSinHuella: {
      titulo: (v: string) => `해시 검증 없이 ${v} 설치`,
      riesgo:
        '이 버전은 공식 배포처에서 게시한 해시가 없습니다. WolfCore Dev는 다운로드한 파일이 원본인지 확인할 수 없습니다.',
      explicacion:
        '공식 사이트에서 HTTPS로 다운로드되지만, 해당 사이트나 연결이 침해된 경우 이를 감지할 수 없습니다. 꼭 필요한 경우에만 설치해 주세요.',
      alternativa: (v: string) => `동일한 서비스의 검증된 버전이 있습니다: ${v}.`,
      casilla: '위험을 이해했으며 검증 없이 설치하겠습니다',
      instalarVerificada: (v: string) => `${v} 설치(검증됨)`,
      instalarIgual: '검증 없이 설치',
    },
    dialogoActualizar: {
      titulo: (n: string) => `${n} 업데이트`,
      tituloRama: (v: string) => `새 버전: ${v}`,
      ninguna: '없음',
      instancia: (id: string) => `${id} 인스턴스를 업데이트합니다. 변경 전 다음 절차로 진행됩니다:`,
      pasoInstalar: (v: string) => `현재 버전(삭제되지 않음) 옆에 ${v}을(를) 새로 설치합니다.`,
      pasoVolcados: '현재 버전으로 각 데이터베이스를 덤프합니다.',
      pasoCopia: '인스턴스를 중지하고 전체 데이터 폴더를 복사합니다(콜드 백업).',
      pasoArrancar: '새 버전으로 시작하여 정상 응답하는지 확인합니다.',
      pasoVuelta:
        '시작되지 않으면 기존 데이터와 함께 이전 버전으로 되돌리며 백업은 그대로 보관됩니다.',
      datos: '데이터:',
      respaldo: '백업 경로:',
      espacio: '공간:',
      espacioLibre: (libres: string, necesarios: string) =>
        `사용 가능 ${libres} / 필요 ${necesarios}`,
      datosQuedan:
        '이전 데이터는 절대 삭제되지 않습니다. 백업과 덤프 파일은 직접 삭제하기 전까지 업데이트 백업에 보관됩니다.',
      sinEspacio: '백업을 저장할 디스크 공간이 부족합니다. 공간을 확보한 뒤 다시 시도해 주세요.',
      alLado: (v: string) =>
        `${v}이(가) 설치됩니다. 이미 설치된 다른 버전은 건드리지 않으며, 다른 버전을 지정한 프로젝트는 해당 버전을 계속 사용합니다.`,
      ramaExplicacion:
        '새 주요 버전은 이전 버전을 대체하지 않습니다. 자체 데이터 폴더와 포트를 가진 새 인스턴스가 생성되며, 기존 인스턴스는 그대로 유지됩니다.',
      copiarDesdeTitulo: '새 인스턴스 데이터',
      copiarDesde: (id: string) =>
        `${id}에서 데이터 복사(덤프 후 복원하며 원본은 건드리지 않음)`,
      vacia: '비어 있는 상태로 시작',
      ramaNota:
        '데이터베이스 사용자는 복사되지 않습니다. 프로젝트는 새 인스턴스의 포트를 가리키도록 설정해야 합니다.',
      crearInstancia: '새 인스턴스 생성',
      confirmar: '백업 후 업데이트',
      hecho: (v: string) => `${v} 업데이트가 완료되었습니다.`,
      fallo: '업데이트할 수 없습니다',
      ramaCreada: (id: string) => `${id} 인스턴스가 생성되었습니다.`,
      copiadas: (l: string) => `복사됨: ${l}.`,
      noCopiada: (b: string, m: string) => `${b} 복사 실패: ${m}`,
    },
    limpieza: {
      boton: '미사용 버전 정리…',
      titulo: '미사용 버전 정리',
      intro:
        '어디에서도 사용되지 않는 버전의 프로그램 파일(bin 폴더)만 제거합니다. 데이터베이스 데이터, 인스턴스 및 프로젝트는 절대 건드리지 않습니다.',
      cargando: '버전 검색 중…',
      vacia: '설치된 버전이 없습니다.',
      sinLibres: '설치된 모든 버전이 사용 중이므로 정리할 항목이 없습니다.',
      fallo: '정리할 수 없습니다',
      fallaLista: '버전 목록을 불러올 수 없습니다',
      bloqueada: '선택할 수 없음',
      marcadas: (n: number, tam: string) => `버전 ${n}개 · ${tam}`,
      destinoTitulo: '처리 방법',
      papelera: '휴지통으로 이동: 7일간 보관되며 그때까지 디스크 공간을 차지합니다',
      definitivo: '영구 삭제: 지금 즉시 디스크 공간을 확보하며 되돌릴 수 없습니다',
      avisoDefinitivo:
        '영구 삭제: 이 버전들을 다시 사용하려면 새로 다운로드해야 합니다.',
      instantanea:
        '영구 삭제를 선택하면 삭제 전에 환경 설정 백업이 저장됩니다. 휴지통으로 이동한 항목은 복구할 수 있습니다.',
      entiendo: '되돌릴 수 없음을 이해했습니다',
      confirmar: (n: number) => `버전 ${n}개 제거`,
      motivos: {
        predeterminada: '기본 버전으로 설정됨',
        encendida: '켜져 있거나 실행 중임',
        sitio: '프로젝트에서 사용 중임',
        instancia: '인스턴스에서 사용 중임(꺼져 있어도 포함)',
        plantilla: '템플릿에서 사용 중임',
        workspace: '워크스페이스에서 사용 중임',
        runtime: '프로젝트에서 사용 중임',
        tarea: '예약 작업이 있는 프로젝트에서 사용 중임',
        duda: '확인할 수 없어 유지됨',
        datos: '이 버전으로만 열 수 있는 데이터가 있음',
        herramienta: 'phpMyAdmin 또는 Adminer에서 사용 중임',
      },
      resultadoTitulo: '결과',
      liberadas: (tam: string) => `${tam}의 공간이 확보되었습니다.`,
      enPapelera: (tam: string) => `${tam}이(가) 휴지통에 보관 중입니다(7일 후 영구 삭제).`,
      saltada: (v: string, motivo: string) => `${v}: ${motivo}`,
      pendientes: (n: number) =>
        `버전 ${n}개는 이미 bin 폴더에서 제거되었지만 잔여 파일이 남아 있어 앱을 다시 열 때 재시도합니다.`,
      instantaneaGuardada: '삭제 전에 환경 백업이 저장되었습니다.',
      ajeno: (lista: string) =>
        `직접 설치한 항목이 포함되어 있습니다: ${lista}. 제거하면 함께 사라집니다.`,
      incluirAjeno: '해당 항목이 사라지더라도 제거',
      sinCatalogo: '카탈로그에 더 이상 없는 버전입니다. 제거하면 다시 다운로드할 수 없습니다.',
      papeleraTitulo: '휴지통',
      recuperar: '복구',
      recuperada: (v: string) => `${v} 버전이 복구되었습니다.`,
      borradaEl: (f: string) => `${f}에 삭제됨`,
      fallaRecuperar: '복구할 수 없습니다',
    },
    dialogoDesinstalar: {
      titulo: (v: string) => `${v} 제거`,
      binario: '이 버전의 프로그램 파일만 제거됩니다.',
      instancia: (id: string) =>
        `${id} 인스턴스가 이 버전을 사용 중입니다. 인스턴스를 중지하고 인스턴스 목록에서 제거합니다.`,
      datosQuedan:
        '데이터는 디스크에 남아 있으므로 이 버전을 다시 설치하면 인스턴스에서 다시 열 수 있습니다.',
      borrarDatos: '데이터도 함께 삭제',
      borrarAviso: (id: string) =>
        `${id}의 데이터 폴더와 모든 데이터베이스가 영구 삭제됩니다. 되돌릴 수 없습니다. 확인하려면 "${id}"을(를) 입력해 주세요.`,
      escriba: (id: string) => `확인하려면 ${id} 입력`,
      desinstalar: '제거',
      desinstalarYBorrar: '제거 및 데이터 삭제',
      unica:
        '현재 활성 버전입니다. 설치된 유일한 버전이라면 서비스를 끈 상태에서 제거할 수 있으며(미설치 상태가 됨), 다른 버전이 있다면 먼저 다른 버전을 활성 버전(별표)으로 선택해 주세요.',
      predeterminada: (id: string) =>
        `${id}은(는) 기본 인스턴스입니다. 데이터베이스, .env 블록 및 이 엔진을 사용하는 도구들이 다른 인스턴스(다른 포트)로 전환됩니다.`,
      hecho: (v: string) => `${v} 제거가 완료되었습니다.`,
    },
    dialogoDesbloquear: {
      titulo: (id: string) => `${id} 해결`,
      explicacion:
        '업데이트가 실패하여 이 인스턴스의 데이터를 되돌리지 못했습니다. 어떻게 처리할지 선택하기 전까지 인스턴스는 시작되지 않습니다. 어떤 데이터도 삭제되지 않습니다.',
      fallida: '변경된 데이터:',
      respaldo: '백업:',
      opciones: '처리 방법',
      devolver: (sello: string, tam: string) =>
        `백업 ${sello} (${tam}) 복원 — 현재 폴더는 삭제되지 않고 따로 보관됩니다`,
      usarActual: '현재 데이터 폴더를 그대로 사용',
      notaActual:
        '현재 폴더에 완전한 데이터가 있는 경우에만 선택하십시오. 그렇지 않으면 백업을 선택하십시오.',
      notaDevolver: '백업을 복사하고 검증한 뒤에만 원래 위치에 적용합니다.',
      escriba: (id: string) => `확인하려면 ${id}을(를) 입력하십시오`,
      elegirVersion:
        '잠금 표시를 읽을 수 없습니다. 데이터를 열 버전(업데이트 이전 버전)을 선택하십시오.',
      version: '버전',
      confirmar: '해결',
      hecho: (id: string) => `${id}의 잠금이 해제되었습니다. 이제 시작할 수 있습니다.`,
    },
    respaldos: {
      titulo: '업데이트 백업',
      descripcion:
        '업데이트 및 새 버전 설치 시 남은 복사본입니다. 각 인스턴스가 현재 사용 중인 데이터 폴더는 여기에 표시되지 않습니다.',
      vacio: '백업이 없습니다.',
      tipos: {
        respaldo: '콜드 백업',
        volcados: '데이터베이스 덤프',
        fallida: '실패한 버전의 데이터',
        restaurando: '중단된 복원',
        copia: '새 버전용 덤프',
      },
      archivos: (n: number) => `파일 ${n}개`,
      borrar: '삭제',
      borrarDe: (n: string) => `${n} 삭제`,
      confirmarTitulo: '복사본 삭제',
      confirmar: (n: string, tam: string) =>
        `${n} (${tam})을(를) 삭제합니다. 이 작업은 되돌릴 수 없습니다. 인스턴스가 사용 중인 데이터는 건드리지 않습니다.`,
      borrado: '복사본이 삭제되었습니다.',
    },
  },
  navGrupos: {
    trabajo: '작업',
    entorno: '환경',
    utilidades: '유틸리티',
  },
  avisos: {
    campana: '알림',
    campanaConNuevos: (n: number) => `알림: 읽지 않음 ${n}개`,
    titulo: '알림 센터',
    vacio:
      '알림이 없습니다. 서비스 중단, 포트 충돌, 만료 예정 인증서 등이 여기에 표시됩니다.',
    marcarTodos: '모두 읽음으로 표시',
    limpiar: '기록 지우기',
    ver: '보기',
    actualizar: '업데이트',
    verVersiones: '버전 보기',
    cerrar: '닫기',
    niveles: { info: '정보', aviso: '알림', error: '오류' },
    sinLeer: '읽지 않음',
  },
  barra: {
    paleta: '명령 검색 또는 실행',
    atajoPaleta: 'Ctrl+K',
    tema: '테마 변경',
    idioma: '언어 변경',
  },
  preferencias: {
    titulo: '모양 및 언어',
    descripcion: '변경 사항은 즉시 적용되며 이 기기에 저장됩니다.',
    tema: '테마',
    temas: { sistema: '시스템', claro: '라이트', oscuro: '다크' },
    idioma: '언어',
    idiomas: { es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano', ru: 'Русский', zh: '中文 简体', ja: '日本語', ko: '한국어', hi: 'हिन्दी', tr: 'Türkçe', id: 'Bahasa Indonesia', pl: 'Polski', nl: 'Nederlands' },
    acento: '강조 색상',
    acentos: {
      indigo: '인디고',
      azul: '파랑',
      verde: '초록',
      violeta: '보라',
      naranja: '주황',
      rosa: '분홍',
    },
    acentoPropio: (color: string) => `사용자 지정 (${color})`,
    errorGuardar: '환경설정을 저장할 수 없습니다',
    asistente: '초기 설정 마법사',
    asistenteAyuda:
      '초기 단계를 다시 진행합니다: 프로젝트 폴더, 기본 구성 요소, CA, GitHub 및 감시 폴더.',
    asistenteAbrir: '마법사 열기',
  },
  paleta: {
    titulo: '명령 팔레트',
    placeholder: '화면, 서비스, 프로젝트 또는 도구 검색…',
    sinResultados: '검색어와 일치하는 명령이 없습니다.',
    ayuda: '↑ ↓ 이동 · Enter 실행 · Esc 닫기',
    grupos: {
      navegacion: '이동',
      servicios: '서비스',
      proyectos: '프로젝트',
      herramientas: '도구',
      github: 'GitHub',
      general: '일반',
    },
    irA: (pantalla: string) => `${pantalla}(으)로 이동`,
    encender: (servicio: string) => `${servicio} 시작`,
    apagar: (servicio: string) => `${servicio} 중지`,
    iniciarTodo: '모든 서비스 시작',
    detenerTodo: '모든 서비스 중지',
    iniciarWorkspace: (n: string) => `워크스페이스 ${n} 시작`,
    detenerWorkspace: (n: string) => `워크스페이스 ${n} 중지`,
    abrirSitio: (nombre: string) => `브라우저에서 ${nombre} 열기`,
    traerCambios: (nombre: string) => `${nombre}에서 변경 사항 가져오기`,
    abrirHerramienta: (nombre: string) => `${nombre} 열기`,
    clonar: 'GitHub에서 저장소 복제',
    agregarProyecto: '프로젝트 추가',
    nuevoProyecto: '새 프로젝트 만들기',
    tema: (tema: string) => `테마: ${tema}`,
    idioma: (idioma: string) => `언어: ${idioma}`,
    asistente: '초기 설정 마법사 열기',
  },
  nuevoProyecto: {
    titulo: '새 프로젝트',
    boton: '새 프로젝트',
    descripcion:
      '처음부터 프로젝트를 만듭니다: 폴더, HTTPS 적용 사이트, 데이터베이스 및 연결 설정.',
    pasos: { tipo: '유형', datos: '정보', resumen: '요약', crear: '생성 중' },
    tipos: {
      laravel: {
        nombre: 'Laravel',
        descripcion: 'Composer 기반; 애플리케이션 키, 데이터베이스 및 마이그레이션 포함.',
      },
      codeigniter4: { nombre: 'CodeIgniter 4', descripcion: '.env가 포함된 공식 Appstarter.' },
      codeigniter3: {
        nombre: 'CodeIgniter 3',
        descripcion: 'database.php가 구성된 클래식 프레임워크.',
      },
      symfony: {
        nombre: 'Symfony',
        descripcion: '.env.local이 포함된 공식 스켈레톤(또는 webapp).',
      },
      fastapi: {
        nombre: 'FastAPI',
        descripcion: '가상 환경, requirements.txt 및 uvicorn 프로세스.',
      },
      wordpress: { nombre: 'WordPress', descripcion: 'wp-config.php가 준비된 공식 다운로드.' },
      estatico: {
        nombre: '정적 사이트',
        descripcion: '데이터베이스 없이 Nginx로 제공하는 HTML 및 CSS.',
      },
    },
    campos: {
      nombre: '프로젝트 이름',
      nombrePlaceholder: 'my-shop',
      nombreAyuda: (dominio: string) =>
        `${dominio} 주소가 됩니다: 소문자, 숫자, 하이픈만 사용하십시오.`,
      carpeta: '상위 폴더',
      elegirCarpeta: '폴더 선택…',
      cambiarCarpeta: '폴더 변경…',
      carpetaAyuda:
        '이 폴더 안에 프로젝트 이름의 새 폴더가 생성됩니다. 비어 있거나 아직 존재하지 않아야 합니다.',
      php: 'PHP 버전',
      python: 'Python 버전',
      sinInstalada: '설치된 버전이 없습니다. 서비스에서 설치하십시오.',
      conBase: '프로젝트용 데이터베이스 생성',
      sinBase: '데이터베이스 없음',
      instancia: '데이터베이스 서버',
      apagada: '중지됨',
      apagadaAyuda:
        '해당 서버가 중지되어 있습니다. 프로젝트를 만들기 전에 서비스에서 시작하십시오.',
      sinMotores: '이 프로젝트 유형에 사용할 수 있는 데이터베이스 서버가 설치되어 있지 않습니다.',
      nombreBase: '데이터베이스 이름',
      starterKit: '스타터 키트',
      starterKits: { ninguno: '없음', react: 'React', vue: 'Vue', livewire: 'Livewire' },
      symfonyWebapp: '웹 패키지(webapp) 포함',
      pgvector: 'pgvector 활성화(벡터 검색)',
    },
    huella: {
      titulo: 'WordPress는 취약한 체크섬만 제공합니다',
      riesgo:
        '게시된 해시는 더 이상 안전하지 않은 SHA-1 알고리즘이며, 아카이브 파일과 동일한 사이트에서 제공됩니다.',
      explicacion:
        '해당 사이트나 연결이 침해된 경우 변조된 다운로드 파일도 검증을 통과할 수 있습니다. 다운로드는 여전히 wordpress.org에서 HTTPS로 진행됩니다. 이 출처를 신뢰하는 경우에만 계속하십시오.',
      leyendo: '게시된 체크섬을 읽는 중…',
      noDisponible:
        '지금은 체크섬을 읽을 수 없습니다(오프라인이거나 출처가 응답하지 않음). 생성 시 다시 읽습니다.',
      fuente: '출처: wordpress.org',
      casilla: '체크섬이 취약하다는 점을 이해했으며 그래도 프로젝트를 생성합니다',
    },
    resumen: {
      titulo: '생성될 항목',
      intro: '시작하기 전에 확인하십시오.',
      tipo: '유형',
      carpeta: '폴더',
      sitio: '사이트',
      dominio: '도메인',
      https: 'HTTPS 주소',
      php: 'PHP',
      python: 'Python',
      base: '데이터베이스',
      env: '연결 정보가 기록될 파일',
      nota: '어느 단계가 실패하더라도 아무것도 삭제되지 않습니다. 생성된 항목을 확인하고 다시 시도할 수 있습니다.',
    },
    errores: {
      nombreVacio: '프로젝트 이름을 입력하십시오.',
      nombreInvalido:
        '이름에는 소문자, 숫자, 하이픈만 사용할 수 있으며(최대 40자) 하이픈으로 시작하거나 끝날 수 없습니다.',
      sinCarpeta: '프로젝트의 상위 폴더를 선택하십시오.',
      sinPhp: 'PHP 버전을 선택하십시오(없다면 서비스에서 설치하십시오).',
      sinPython: 'Python 버전을 선택하십시오(없다면 서비스에서 설치하십시오).',
      sinInstancia: '데이터베이스를 생성할 서버를 선택하거나 데이터베이스 옵션을 해제하십시오.',
      baseInvalida: '이 엔진에서는 사용할 수 없는 데이터베이스 이름입니다.',
      motorNoVale: 'WordPress에는 MySQL 또는 MariaDB가 필요합니다.',
      pgvectorMotor: 'pgvector에는 PostgreSQL이 필요합니다.',
      huellaDebil: 'WordPress의 체크섬이 취약하다는 점을 이해했는지 확인하십시오.',
    },
    acciones: {
      cambiarCarpeta: '다른 폴더 선택',
      cambiarBase: '데이터베이스 이름 변경',
      cambiarNombre: '이름 변경',
      reintentarPaso: '단계 다시 시도',
      servicios: '서비스로 이동',
      confirmarHuella: '확인 사항 검토',
    },
    botones: {
      siguiente: '다음',
      atras: '이전',
      crear: '프로젝트 생성',
      creando: '생성 중…',
      cerrar: '닫기',
      abrirEditor: '편집기에서 열기',
      verSitio: '사이트 보기',
      verProyecto: '프로젝트에서 보기',
    },
    progreso: {
      titulo: '프로젝트 생성 중',
      listo: '프로젝트가 생성되었습니다.',
      fallo: (paso: string) =>
        `"${paso}" 단계가 실패했습니다. 삭제된 항목은 없습니다. 해당 단계를 다시 시도하거나 문제를 해결한 뒤 다시 시도하십시오.`,
      quedo: (partes: string) => `생성된 항목: ${partes}.`,
      quedoCarpeta: '폴더',
      quedoBase: (nombre: string) => `데이터베이스 ${nombre}`,
      quedoSitio: '사이트',
      avisos: '알림',
      sinUsuarioPropio:
        '시스템 암호화를 사용할 수 없어 프로젝트가 데이터베이스 관리자 연결을 사용합니다. 사용 가능해지면 .env 관리자에서 "전용 사용자 사용"을 선택하십시오.',
      editorFallo: '편집기를 열 수 없습니다.',
    },
  },
  importar: {
    boton: '가져오기…',
    titulo: 'Laragon, XAMPP 또는 Herd에서 가져오기',
    intro:
      '사이트는 현재 위치 그대로 연결됩니다. 어떤 폴더도 이동, 복사 또는 수정하지 않습니다. 원하시면 데이터베이스도 함께 복사합니다. WolfCore Dev는 다른 프로그램의 설치 정보를 읽기만 합니다.',
    buscando: '설치 항목을 검색하는 중…',
    nada: '기본 폴더에서 Laragon, XAMPP 또는 Herd를 찾지 못했습니다.',
    errorVista: '가져올 수 있는 항목을 검색하지 못했습니다',
    programas: { laragon: 'Laragon', xampp: 'XAMPP', herd: 'Herd' },
    sitios: {
      titulo: '사이트',
      todos: '모두 선택',
      ninguno: '모두 해제',
      dominio: (d: string) => `도메인 ${d}`,
      dominioPropuesto: (d: string) => `도메인 ${d} (제안됨)`,
      php: (v: string) => `PHP ${v}`,
      phpSe: (de: string, a: string) => `PHP ${de} → ${a}`,
      sinPhp: 'PHP 미확인',
      base: (nombre: string, motor: string) => `데이터베이스 ${nombre} (${motor})`,
      yaVinculado: '이미 WolfCore Dev 사이트입니다',
      dominioEnUso: '다른 사이트에서 이미 사용 중인 도메인입니다',
    },
    avisos: {
      sin_dominio: '다른 프로그램에 도메인이 없어 새 도메인을 제안합니다.',
      dominio_invalido: '도메인이 유효하지 않아 새 도메인을 제안합니다.',
      sin_vhost: '전용 가상 호스트가 없어 새 도메인을 제안합니다.',
      php_desconocido: '사용 중인 PHP 버전을 알 수 없어 설치된 버전을 선택합니다.',
      base_no_local: '데이터베이스가 다른 서버에 있어 가져오지 않습니다.',
      base_nombre_invalido: '데이터베이스 이름이 유효하지 않아 가져오지 않습니다.',
      motor_no_soportado: 'MySQL 또는 MariaDB 데이터베이스가 아니므로 가져오지 않습니다.',
    },
    problemas: {
      titulo: (n: number) => `${n}개 항목이 제외되었거나 읽을 수 없었습니다`,
    },
    bases: {
      titulo: '데이터베이스',
      importarBases: '데이터베이스도 함께 가져오기',
      ayuda:
        '계속하기 전에 다른 프로그램의 데이터베이스 서버를 시작하십시오. WolfCore Dev는 외부 프로그램을 시작하거나 중지하지 않습니다. 비밀번호는 이 가져오기 작업에만 사용되며 저장되지 않습니다.',
      destino: '대상 서버',
      apagada: '중지됨',
      sinMotores:
        '설치된 MySQL 또는 MariaDB가 없습니다. 데이터베이스를 가져오려면 서비스에서 설치하십시오.',
      puerto: '원본 서버 포트',
      usuario: '사용자',
      clave: '비밀번호',
      claveAyuda: '사용자에게 비밀번호가 없으면 비워 두십시오(예: Laragon이나 XAMPP의 root).',
      existe: '대상에 이미 존재함',
      reemplazar: '덮어쓰기(사전에 백업 생성)',
      noSeToca: '선택하지 않으면 건드리지 않습니다.',
    },
    pasos: { elegir: '선택', confirmar: '확인' },
    continuar: '계속',
    volver: '뒤로',
    cancelar: '취소',
    importar: '가져오기',
    cerrar: '닫기',
    sinSeleccion: '사이트를 하나 이상 선택하십시오.',
    origenIncompleto: '원본 서버의 포트와 사용자를 입력하십시오.',
    confirmar: {
      titulo: '가져오기 확인',
      sitios: (n: number) =>
        `현재 폴더의 사이트 ${n}개를 연결합니다. 어떤 파일도 이동, 복사 또는 수정하지 않습니다.`,
      sinConfianza:
        '가져온 사이트는 사용자가 "이 저장소를 신뢰합니다"를 선택하기 전까지 레시피를 실행하지 않습니다.',
      hosts:
        'Nginx와 hosts 파일이 업데이트됩니다(Windows에서 관리자 권한을 요청할 수 있습니다).',
      basesNuevas: (nombres: string) => `복사할 데이터베이스: ${nombres}.`,
      basesReemplazo: (nombres: string) =>
        `이미 존재하는 다음 데이터베이스를 덮어씁니다: ${nombres}. 덮어쓰기 전에 각각의 백업을 저장합니다.`,
      basesSinTocar: (nombres: string) =>
        `이미 존재하는 다음 데이터베이스는 건드리지 않습니다: ${nombres}.`,
      origen: (puerto: number, usuario: string) =>
        `다른 프로그램의 서버(127.0.0.1:${puerto}, 사용자 ${usuario})에서 덤프합니다. 수정 없이 읽기만 합니다.`,
      sinBases: '가져올 데이터베이스가 없습니다.',
      proteccion:
        '각 데이터베이스의 구조를 먼저 검사하고 제한된 권한의 사용자로 데이터를 가져옵니다. 오류가 발생하면 데이터베이스는 원래 상태로 유지됩니다.',
    },
    resultado: {
      titulo: '가져오기 결과',
      importando: '가져오는 중…',
      cancelar: '가져오기 취소',
      restaurada: '원본 데이터베이스가 백업에서 자동으로 복원되어 원래 상태로 유지되었습니다.',
      sitioOk: '가져옴',
      sitioFallo: '가져오지 못함',
      baseOk: (n: string) => `데이터베이스 ${n} 가져오기 완료`,
      baseFallo: (n: string) => `데이터베이스 ${n} 가져오기 실패`,
      copiaPrevia: (ruta: string) => `이전 데이터베이스 백업: ${ruta}`,
      phpDistinto: (v: string) => `PHP ${v}을(를) 사용했습니다(원래 버전이 설치되어 있지 않음).`,
      sinAplicar:
        'Nginx 또는 hosts 파일이 최신 상태로 반영되지 않았습니다. 프로젝트의 알림을 확인하고 다시 시도하십시오.',
      resumen: (s: number, b: number) => `사이트 ${s}개, 데이터베이스 ${b}개를 가져왔습니다.`,
      errorImportar: '가져올 수 없습니다',
    },
  },
  plantillas: {
    guardarComo: '템플릿으로 저장…',
    dialogo: {
      titulo: (nombre: string) => `"${nombre}"을(를) 템플릿으로 저장`,
      intro:
        '템플릿에는 레시피, PHP 및 Nginx 설정, 확장 모듈, 데이터베이스 스키마(데이터 행을 제외한 구조만)가 저장됩니다. 비밀번호, 키, 데이터베이스 데이터는 절대 저장되지 않습니다.',
      nombre: '템플릿 이름',
      nombrePlaceholder: '내 기본 프로젝트',
      conArchivos: '프로젝트 파일도 함께 포함',
      conArchivosAyuda: '선택하지 않으면 레시피, 설정 및 스키마만 저장됩니다.',
      siempre: '항상 제외되는 항목',
      siempreLista:
        '.env 및 .env.*, vendor, node_modules, .git, .venv, 로그, 덤프 및 파일 데이터베이스(*.sql, *.dump, *.sqlite), 키 및 인증서(*.pem, *.key, *.crt…), wp-config.php 및 wolfcore.yml. 키나 비밀번호가 포함된 파일도 제외됩니다.',
      extra: '추가 제외 항목(한 줄에 하나씩)',
      extraAyuda: '프로젝트 기준 상대 경로 또는 이름(예: uploads 또는 public/build).',
      vista: '저장될 항목',
      calculando: '계산 중…',
      resumen: (archivos: number, tamano: string) => `파일 ${archivos}개 · ${tamano}`,
      fuera: (n: number) => `${n}개 제외됨`,
      sinArchivos: '파일 없이 레시피, 설정 및 스키마만 저장됩니다.',
      baseVolcado: (nombre: string, servidor: string) =>
        `데이터 행 없이 데이터베이스 ${nombre}(서버 ${servidor})의 구조만 저장됩니다.`,
      sinBase: '프로젝트에 데이터베이스가 선언되어 있지 않아 스키마는 저장되지 않습니다.',
      avisoMongodb:
        '이 프로젝트는 MongoDB를 사용하므로 스키마(컬렉션 및 인덱스)는 저장되지 않습니다.',
      incluirDeTodosModos: '그래도 포함',
      avisoIncluir: '해당 파일에 실제 키가 들어 있다면 템플릿 안에 그대로 포함됩니다.',
      guardar: '템플릿 저장',
      guardada: (nombre: string) => `템플릿 "${nombre}"이(가) 저장되었습니다.`,
      errorGuardar: '템플릿을 저장할 수 없습니다',
      errorVista: '미리보기를 계산할 수 없습니다',
      cancelar: '취소',
    },
    lista: {
      titulo: '내 템플릿',
      ayuda:
        '기존 프로젝트의 레시피, 설정 및 스키마(데이터 제외)를 사용하여 새 프로젝트를 시작하십시오.',
      vacia:
        '아직 템플릿이 없습니다. 프로젝트 카드 메뉴에서 프로젝트를 템플릿으로 저장하십시오.',
      conArchivosEtiqueta: '파일 포함',
      soloEsquema: '레시피 및 스키마',
      conBase: (motor: string) => `데이터 없는 ${motor} 데이터베이스`,
      borrarEtiqueta: (nombre: string) => `템플릿 ${nombre} 삭제`,
      borrarTitulo: (nombre: string) => `템플릿 ${nombre}을(를) 삭제하시겠습니까?`,
      borrarTexto:
        '템플릿만 삭제됩니다. 이 템플릿으로 만든 프로젝트와 원본 프로젝트는 건드리지 않습니다.',
      borrada: '템플릿이 삭제되었습니다.',
      errorBorrar: '템플릿을 삭제할 수 없습니다',
      errorLista: '템플릿 목록을 읽을 수 없습니다',
      desde: (nombre: string) => `템플릿: ${nombre}`,
      avisoSinBase: '이 템플릿에는 데이터베이스가 포함되어 있지 않습니다.',
      importadaEtiqueta: '가져옴',
      avisoImportada:
        '외부에서 가져온 템플릿입니다. 프로젝트는 신뢰하지 않음 상태로 생성되며 프로세스를 시작하지 않습니다. 사이트를 열면 해당 코드가 실행되므로 먼저 파일을 검토하십시오.',
      generadoresTitulo: '처음부터 만들기',
    },
  },
  env: {
    accion: '.env 변수…',
    titulo: (nombre: string) => `${nombre}의 .env`,
    intro:
      '비밀 값은 마스킹되어 표시됩니다. 해당 변수에서 "표시"를 눌러야 전체 값이 나타나며 30초 후 다시 숨겨집니다. 저장하기 전에 현재 .env 파일의 날짜별 백업이 생성됩니다.',
    noExiste: '이 프로젝트에는 아직 .env 파일이 없습니다. 저장할 때 생성됩니다.',
    tablaEtiqueta: '.env 변수',
    sinVariables: '.env에 변수가 없습니다.',
    secretaEtiqueta: '비밀',
    duplicadaEtiqueta: '중복',
    duplicadaAyuda:
      '이 변수는 .env에 두 번 이상 나타납니다. 마지막 항목이 표시되고 수정됩니다.',
    soloLecturaEtiqueta: '여러 줄',
    soloLecturaAyuda: '여러 줄로 구성되어 있습니다. 파일에서 직접 편집하십시오.',
    seQuitara: '저장 시 제거됨',
    valorNuevo: '새 값',
    valorNuevoDe: (clave: string) => `${clave}의 새 값`,
    valorDe: (clave: string) => `${clave}의 값`,
    vacio: '(비어 있음)',
    mostrar: '표시',
    ocultar: '숨기기',
    mostrarEtiqueta: (clave: string) => `${clave} 값 표시`,
    ocultarEtiqueta: (clave: string) => `${clave} 값 숨기기`,
    cambiar: '변경',
    deshacer: '되돌리기',
    deshacerEtiqueta: (clave: string) => `${clave} 변경 되돌리기`,
    quitar: '제거',
    quitarEtiqueta: (clave: string) => `변수 ${clave} 제거`,
    errorRevelar: '값을 표시할 수 없습니다',
    agregarTitulo: '변수 추가',
    agregarNombre: '변수명',
    agregarValor: '값',
    agregar: '추가',
    nombreInvalido:
      '숫자로 시작하지 않으면서 문자, 숫자, 밑줄 및 마침표만 사용하고, 기존에 없는 이름이어야 합니다.',
    comparar: {
      titulo: '예제 파일과 비교',
      sinEjemplo: '프로젝트에 비교할 .env.example 파일이 없습니다.',
      alDia: '.env에 예제 파일과 동일한 변수가 모두 있습니다.',
      faltan: (n: number) => `누락됨 ${n}개:`,
      sobran: (n: number) => `추가됨 ${n}개(예제 파일에 없음):`,
      distintas: (n: number) => `예제와 값이 다름 ${n}개:`,
      agregarFaltantes: '누락된 항목 추가',
    },
    bloques: {
      titulo: '변수 블록 추가',
      ayuda:
        '해당 주제에서 .env에 없는 변수만 추가합니다(이미 있는 변수는 건드리지 않음). 비밀번호나 키는 비워 두므로 나중에 표에서 입력하십시오.',
      bd: '데이터베이스',
      correo: '메일',
      ia: 'AI',
      redis: 'Redis',
    },
    usuarioPropio: {
      titulo: '전용 사용자 사용',
      ayuda:
        '이 프로젝트 전용 데이터베이스 사용자(관리자 권한 없이 해당 데이터베이스에만 권한 부여)를 생성하고 .env에 기록합니다. 현재 WolfCore Dev의 MySQL 및 MariaDB에서 지원됩니다.',
      confirmarTitulo: '데이터베이스에 전용 사용자를 사용하시겠습니까?',
      confirmarTexto:
        '이 프로젝트의 데이터베이스에만 권한이 있는 새 사용자를 무작위 비밀번호로 생성하고, .env의 연결 사용자와 비밀번호를 변경합니다. 변경 전에 현재 .env 백업을 저장하며, 새 비밀번호는 프로젝트의 .env와 WolfCore Dev에 암호화되어 저장됩니다.',
      confirmar: '생성 및 사용',
      hecho: (usuario: string) => `이제 프로젝트에서 사용자 ${usuario}을(를) 사용합니다.`,
      compartirTitulo: '다른 프로젝트의 사용자를 공유하시겠습니까?',
      compartirTexto: (base: string, proyecto: string) =>
        `데이터베이스 ${base}은(는) ${proyecto}에서도 사용 중입니다. 해당 사용자를 공유하시겠습니까? 이 프로젝트가 동일한 사용자와 비밀번호를 사용하며 비밀번호는 변경되지 않으므로 ${proyecto}의 연결도 유지됩니다.`,
      compartir: '사용자 공유',
      error: '데이터베이스 사용자를 변경할 수 없습니다',
    },
    copias: {
      titulo: '백업으로 되돌리기',
      ninguna: '이 .env의 백업이 아직 없습니다.',
      volver: '이 백업으로 되돌리기',
      confirmarTitulo: '.env 백업으로 되돌리시겠습니까?',
      confirmarTexto: (fecha: string) =>
        `현재 .env 파일이 ${fecha} 백업으로 대체됩니다. 교체 전에 현재 파일의 백업을 하나 더 저장하므로 이 작업도 되돌릴 수 있습니다.`,
      hecho: '백업으로 되돌렸습니다.',
      error: '백업으로 되돌릴 수 없습니다',
    },
    cambiosPendientes: (n: number) => `저장되지 않은 변경 사항 ${n}개`,
    descartar: '변경 사항 버리기',
    guardar: '검토 및 저장…',
    cerrar: '닫기',
    cerrarTitulo: '저장하지 않고 닫으시겠습니까?',
    cerrarTexto: (n: number) => `저장되지 않은 변경 사항이 ${n}개 있습니다. 닫으면 모두 사라집니다.`,
    cerrarDescartar: '닫고 버리기',
    seguirEditando: '계속 편집',
    confirmar: {
      titulo: '.env 변경 사항 저장',
      texto:
        '변경될 내용은 다음과 같습니다. 비밀 값은 마스킹되어 표시됩니다. 현재 .env의 날짜별 백업을 저장한 뒤 파일을 한 번에 기록합니다.',
      sinCambios: '저장할 변경 사항이 없습니다.',
      agregarGitignore: '프로젝트의 .gitignore에 .env 추가',
      aceptarVersionado: '위험을 이해했으며 그래도 저장합니다',
      guardar: '변경 사항 저장',
      versionado:
        'Git이 이미 이 프로젝트의 .env를 추적하고 있습니다. .gitignore에 추가하더라도 다음 커밋에 값이 올라갑니다. git rm --cached .env 명령으로 인덱스에서 제거하십시오.',
      versionadoDesconocido:
        'Git이 이 프로젝트의 .env를 추적하는지 확인할 수 없습니다. 저장하려면 별도로 확인해 주십시오.',
    },
    errorVistaPrevia: '미리보기를 준비할 수 없습니다',
    errorGuardar: '.env를 저장할 수 없습니다',
    guardado: '.env가 저장되었습니다.',
    guardadoConCopia: '.env가 저장되었으며 이전 버전이 백업으로 보관되었습니다.',
  },
  asistenteInicio: {
    titulo: 'WolfCore Dev에 오신 것을 환영합니다',
    subtitulo:
      '다섯 단계로 개발 환경을 준비합니다. 각 단계의 버튼을 누르기 전까지 아무것도 설치하거나 변경하지 않습니다.',
    paso: (n: number, total: number) => `${total}단계 중 ${n}단계`,
    anterior: '이전',
    siguiente: '다음',
    omitirTodo: '마법사 건너뛰기',
    terminar: '완료',
    hecho: '완료',
    reabrir: '설정에서 언제든 다시 열 수 있습니다.',
    pasos: {
      carpeta: {
        titulo: '프로젝트 폴더',
        texto:
          '프로젝트를 저장할 위치입니다. 새 저장소가 이곳에 복제되며 마지막 단계에서 감시할 폴더가 됩니다.',
        elegir: '폴더 선택',
        actual: (ruta: string) => `선택된 폴더: ${ruta}`,
        guardada: (ruta: string) => `현재 폴더: ${ruta}`,
        ninguna: '선택 안 함: C:\\Proyectos가 존재하면 해당 폴더를 사용합니다.',
      },
      basicos: {
        titulo: '기본 구성 요소 설치',
        texto:
          '공식 출처에서 해시 검증을 거쳐 Nginx, PHP 8.4, Composer, Node LTS를 설치합니다. 각 항목은 해당 버튼을 눌렀을 때만 설치됩니다.',
        instalado: '설치됨',
        instalar: (version: string) => `${version} 설치`,
        sinVersion: '카탈로그에 버전 없음',
        cargando: '버전 검색 중…',
        nombres: { nginx: 'Nginx', php: 'PHP 8.4', composer: 'Composer', node: 'Node LTS' },
      },
      ca: {
        titulo: '로컬 인증 기관 신뢰',
        texto:
          '.test 사이트가 알림 없이 HTTPS로 열리려면 Windows가 WolfCore Dev의 인증 기관을 신뢰해야 합니다. Windows에서 확인을 요청합니다.',
        confiar: 'CA 신뢰',
        confiada: 'Windows가 이미 로컬 인증 기관을 신뢰하고 있습니다.',
      },
      github: {
        titulo: 'GitHub 연결',
        texto:
          '리포지토리를 확인하고 한 번의 클릭으로 클론할 수 있습니다. GitHub CLI 세션이나 개인 토큰을 사용하며, 토큰은 이 컴퓨터에 암호화되어 저장됩니다.',
      },
      vigilar: {
        titulo: '폴더 감시',
        texto:
          '프로젝트 폴더에 새 폴더가 나타날 때마다 WolfCore Dev가 사이트 연결을 제안합니다. 사용자의 확인 없이는 아무것도 연결되지 않습니다.',
        activar: '이 폴더 감시',
        activa: (ruta: string) => `${ruta} 감시 중`,
        sinCarpeta: '먼저 프로젝트 폴더를 선택하십시오(1단계).',
      },
    },
  },
  /** 프로필 가져오기 또는 내보내기 결과 (D26). */
  perfiles: {
    pantalla: {
      titulo: '백업 및 프로필',
      descripcion:
        '프로필을 사용하면 사이트, 버전, 인스턴스, 템플릿, 설정 등 개발 환경을 다른 컴퓨터로 옮길 수 있습니다. 키, 토큰, 비밀번호는 절대 포함되지 않습니다.',
      aislado: {
        titulo: '테스트 폴더',
        texto: (ruta: string) =>
          `WolfCore Dev가 테스트 데이터 폴더(${ruta})를 사용 중입니다. 여기에서 수행하는 작업은 실제 폴더나 컴퓨터에 영향을 주지 않으며, hosts 파일을 수정하거나 인증서를 설치하지 않습니다.`,
      },
      exportar: {
        titulo: '환경 내보내기',
        texto:
          '사이트, 버전, 인스턴스, 템플릿, 설정이 담긴 .wolfperfil 파일을 저장합니다.',
        bases: '데이터베이스 포함',
        basesAyuda:
          '전체 덤프(고객 데이터 포함)는 암호 구문으로 암호화되어 저장됩니다.',
        ca: '인증 기관(CA) 포함',
        caAyuda: '암호 구문으로 암호화됩니다. 반드시 본인의 컴퓨터에만 가져오십시오.',
        certificados: '사이트 인증서 포함',
        certificadosAyuda: 'CA와 함께 묶여 암호화되어 포함됩니다.',
        frase: '암호 구문',
        fraseRepetir: '암호 구문 다시 입력',
        fraseAyuda: (minimo: number) =>
          `최소 ${minimo}자 이상이어야 합니다. 이 암호 구문이 없으면 데이터베이스와 CA를 복구할 수 없으며, 어디에도 저장되지 않습니다.`,
        problemas: {
          frase_corta: (minimo: number) => `암호 구문은 최소 ${minimo}자 이상이어야 합니다.`,
          frase_distinta: '두 암호 구문이 일치하지 않습니다.',
          certificados_sin_ca: '인증서는 CA와 함께만 포함할 수 있습니다.',
        },
        exportar: '프로필 내보내기…',
        nota: '프로필에는 키, 토큰, 비밀번호, 스냅샷, 휴지통, 백업 및 data 폴더가 절대 포함되지 않습니다.',
        listo: '프로필 내보내기 완료',
        guardado: (archivo: string, tamano: string) => `${archivo}에 저장되었습니다(${tamano}).`,
      },
      importar: {
        titulo: '프로필 가져오기',
        texto:
          '.wolfperfil 파일을 선택하십시오. 변경이 적용되기 전에 교체되거나 제외되거나 보류되는 항목을 모두 확인할 수 있으며, 교체되는 항목은 미리 백업됩니다.',
        boton: '프로필 가져오기…',
      },
      instantaneas: {
        titulo: '환경 스냅샷',
        texto:
          'PHP 또는 Nginx를 업데이트하기 전과 프로필을 가져오기 전에 WolfCore Dev가 키와 데이터 없이 사용자 전용으로 설정, Nginx 및 php.ini 사본을 저장합니다. 최근 10개가 보관됩니다.',
        compartidas:
          '10개의 보관 한도는 모든 사유에 공통으로 적용됩니다. 새 스냅샷을 만들면 수동으로 만든 것을 포함해 가장 오래된 스냅샷이 교체됩니다.',
        tomar: '지금 스냅샷 생성',
        tomada: '스냅샷이 저장되었습니다.',
        sinNada: '아직 복사할 항목이 없습니다.',
        vacia: '아직 스냅샷이 없습니다.',
        motivos: {
          actualizar: '업데이트 전',
          'importar-perfil': '프로필 가져오기 전',
          'limpiar-versiones': '버전 정리 전',
          manual: '수동 생성',
        },
      },
    },
    reasignar: {
      titulo: '사이트 폴더',
      texto:
        '다른 컴퓨터에서 가져온 폴더입니다. 이 컴퓨터의 해당 위치를 찾거나 사이트를 보류 상태로 가져오십시오. 폴더를 선택할 때까지 폴더가 비어 있는 상태로 유지됩니다.',
      sitio: '사이트',
      origen: '프로필의 폴더',
      destino: '이 컴퓨터의 폴더',
      existe: '존재함',
      noExiste: '이 컴퓨터에 없음',
      buscar: '폴더 찾기…',
      cambiar: '변경',
      comoPendiente: '보류 상태로 가져오기',
      prefijo: (viejo: string, nuevo: string) =>
        `나머지 항목에도 같은 경로 변경 적용 (${viejo} → ${nuevo})`,
      omitido: '가져오지 않음',
    },
    asistente: {
      titulo: '프로필 가져오기',
      pasos: {
        archivo: '파일',
        revisar: '검토',
        confirmar: '확인',
        resultado: '결과',
      },
      archivo: {
        texto:
          '.wolfperfil 파일을 선택하십시오. 아직 아무것도 변경되지 않으며, 교체되거나 제외되거나 보류될 항목을 먼저 확인할 수 있습니다.',
        elegir: '파일 선택…',
        cambiar: '다른 파일 선택',
        ninguno: '선택된 파일 없음',
        leyendo: '프로필을 읽는 중…',
        error: '프로필을 읽을 수 없습니다',
      },
      origen: (fecha: string, sistema: string) => `${fecha}에 ${sistema}에서 생성되었습니다.`,
      ignoradas: (n: number) => `파일의 ${n}개 항목은 프로필 데이터가 아니므로 무시됩니다.`,
      reemplaza: {
        titulo: '교체되는 항목',
        ninguno: '이 폴더에 기존 데이터가 없어 새로 설치된 환경으로 가져옵니다.',
        copia:
          '교체 전에 respaldos/pre-perfil-… 경로에 백업하고 환경 스냅샷을 생성하며, 교체되는 각 데이터베이스에도 별도의 스냅샷이 생성됩니다. data 폴더는 절대 삭제되지 않습니다.',
        config: '설정 파일(config.json)',
        sitio: (id: string) => `사이트 ${id}`,
        base: (instancia: string, base: string) => `데이터베이스 ${base} (${instancia})`,
        plantilla: (id: string) => `템플릿 ${id}`,
        ca: '이 컴퓨터의 인증 기관(CA)',
      },
      versiones: {
        titulo: '버전',
        ninguna: '프로필에 버전이 포함되어 있지 않습니다.',
        instalada: '이미 설치됨',
        descargar: '해시 검증 후 다운로드 예정',
        pendienteDebil: '보류: 강력한 해시가 없으므로 수동으로 설치하십시오',
        pendienteFuera: '보류: 카탈로그에 더 이상 없음',
        huellas: {
          fuerte: 'SHA-256 또는 SHA-512 해시',
          firmada: '서명됨',
          debil: '약한 해시',
          ninguna: '해시 없음',
        },
        descargas: (n: number) =>
          `공식 사이트에서 ${n}개 버전을 다운로드하며, 각 버전은 해시 또는 서명이 검증됩니다.`,
      },
      instancias: {
        titulo: '데이터베이스 인스턴스',
        existente: '이미 존재함: 기존 포트와 버전 유지',
        nueva: (puerto: number) => `포트 ${puerto}에 새 자격 증명으로 생성됩니다`,
        reasignada: (de: number, a: number) => `포트 ${de}이(가) 사용 중이므로 포트 ${a}을(를) 사용합니다`,
      },
      bases: {
        titulo: '데이터베이스',
        ninguna: '프로필에 데이터베이스가 포함되어 있지 않습니다.',
        texto:
          '각 데이터베이스로 권한이 제한된 사용자와 허용된 구문만 사용하여 복원됩니다. 이미 존재하는 데이터베이스는 복원 전에 백업됩니다.',
        omitir: '데이터베이스 제외하고 가져오기',
      },
      plantillas: {
        titulo: '템플릿',
        existe: '이미 존재함: 교체됨',
        nueva: '신규',
      },
      workspaces: {
        titulo: '워크스페이스',
        texto:
          '데이터베이스와 서비스에 대한 참조만 포함됩니다(프로젝트 프로세스는 포함되지 않습니다). 이 컴퓨터에 존재하는 항목을 기준으로 검증되며 자동으로 시작되지 않습니다.',
        existe: '동일한 ID의 워크스페이스가 이미 존재함: 기존 항목 유지',
        nuevo: '신규',
        elementos: (n: number) => `항목 ${n}개`,
        invalidos: (n: number) => `프로필의 ${n}개 항목이 유효하지 않아 가져오지 않습니다.`,
      },
      quitado: {
        titulo: '설정에서 제외되는 항목',
        texto:
          '이 데이터 폴더는 초기 상태이므로 프로필에서 이 컴퓨터 외부를 가리키는 항목은 가져오지 않습니다.',
      },
      puertos: {
        titulo: '사용 중인 포트',
        texto: (lista: string) =>
          `프로필의 다음 포트가 이 컴퓨터의 다른 프로그램에서 이미 사용 중입니다: ${lista}. 가져오기 완료 후 서비스에서 포트를 변경하십시오.`,
      },
      ca: {
        titulo: '인증 기관(CA)',
        texto:
          '프로필에 암호화된 CA가 포함되어 있습니다. 반드시 본인의 CA인 경우에만 가져오십시오. 가져오면 이 컴퓨터가 해당 CA로 서명된 인증서를 신뢰하게 됩니다.',
        huella: '프로필 CA의 SHA-256 지문',
        comparar: '수락하기 전에 원본 컴퓨터의 지문과 반드시 비교하십시오.',
        importar: '프로필의 CA 가져오기',
        noImportar: '가져오지 않으면 이 컴퓨터의 현재 CA를 사용하거나 새로 생성합니다.',
        ajena:
          '이 CA에는 WolfCore Dev용이 아닌 이름 제약 조건이 설정되어 있어 가져올 수 없습니다.',
        sinRestricciones:
          '이 CA에는 이름 제약 조건이 없습니다. 은행이나 이메일을 포함한 모든 웹사이트의 인증서에 서명할 수 있습니다. 반드시 본인의 CA이고 지문이 일치하는 경우에만 가져오십시오.',
        aceptarSin: '위험을 이해했으며 본인의 CA이고 지문이 일치합니다',
        reemplazaLocal:
          '이 컴퓨터에 이미 CA가 있습니다. 프로필의 CA를 가져오면 기존 CA가 교체됩니다(기존 CA는 사전 백업에 보관됩니다).',
        reemplazar: '이 컴퓨터의 CA 교체',
        noSeInstala: 'CA는 시스템 인증서 저장소에 자동으로 설치되지 않습니다.',
      },
      frase: {
        titulo: '프로필 암호 구문',
        texto: '프로필에 암호화된 데이터베이스 또는 CA가 포함되어 있습니다. 내보낼 때 설정한 암호 구문을 입력하십시오.',
        campo: '암호 구문',
        omitirBases: '데이터베이스 제외하고 가져오기',
        nota: '암호 구문은 이 창에서만 사용되며 저장되지 않고, 작업 완료 또는 창을 닫을 때 삭제됩니다.',
      },
      env: {
        titulo: '프로젝트 연결',
        texto:
          '해당 데이터베이스의 새 전용 사용자를 가리키도록 .env를 수정할 프로젝트를 선택하십시오(기존 .env는 미리 백업됩니다). 선택하지 않은 프로젝트는 수정되지 않으며 안내만 표시됩니다.',
      },
      confirmar: {
        titulo: '가져오기 확인',
        resumen: (sitios: number, versiones: number, bases: number) =>
          `사이트 ${sitios}개, 버전 ${versiones}개, 데이터베이스 ${bases}개를 가져옵니다.`,
        importar: '가져오기',
        revisar: '검토',
        volver: '뒤로',
        bloqueos: {
          sitios_sin_carpeta:
            '각 사이트의 폴더를 선택하거나 보류 상태로 가져오도록 표시하십시오.',
          frase_requerida: '프로필 암호 구문을 입력하거나 데이터베이스를 제외하고 가져오십시오.',
          ca_ajena: '프로필의 CA는 가져올 수 없습니다.',
          ca_sin_restricciones: '제약 조건이 없는 CA를 가져오려면 별도로 확인해야 합니다.',
          reemplazar_ca: '이 컴퓨터의 CA를 교체하려면 별도로 확인해야 합니다.',
        },
      },
      progreso: '프로필을 가져오는 중… 창을 닫지 마십시오. 데이터베이스 복원이나 다운로드가 있으면 시간이 걸릴 수 있습니다.',
      fases: {
        copia: '교체 대상 백업 중',
        versiones: '버전 설치 중',
        configuracion: '설정 및 사이트 저장 중',
        plantillas: '템플릿 복사 중',
        ca: 'CA 및 인증서 준비 중',
        bases: '데이터베이스 복원 중',
        env: '.env 파일 다시 쓰는 중',
      },
      avance: (paso: number, de: number) => `${de}단계 중 ${paso}단계`,
      resultado: {
        titulo: '가져오기 결과',
        resumen: (importados: number, pendientes: number, omitidos: number, errores: number) =>
          `가져옴 ${importados}개, 보류 ${pendientes}개, 건너뜀 ${omitidos}개, 오류 ${errores}개입니다.`,
        respaldo: (ruta: string) => `교체된 항목의 백업 위치: ${ruta}`,
        pendientes: '보류된 항목은 수동으로 완료할 수 있습니다.',
        error: '프로필을 가져올 수 없습니다',
        secciones: {
          sitios: '사이트',
          versiones: '버전',
          instancias: '인스턴스',
          bases: '데이터베이스',
          plantillas: '템플릿',
          workspaces: '워크스페이스',
          env: '.env 파일',
          ca: 'CA',
        },
        estados: {
          importado: '가져옴',
          pendiente: '보류',
          omitido: '건너뜀',
          error: '오류',
          instalada: '설치됨',
          ya_instalada: '이미 설치됨',
          creada: '생성됨',
          existente: '이미 존재함',
          puerto_reasignado: '포트 재할당됨',
          reescrito: '다시 쓰임',
          sin_marcar: '선택 안 함',
        },
        ca: {
          importada: 'CA 가져옴',
          nueva: '새 CA 생성됨',
          sin_cambios: 'CA 변경 없음',
        },
        quitarCa: {
          boton: '이전 CA 제거…',
          titulo: '신뢰 목록에서 이전 CA 제거',
          texto:
            '이 컴퓨터에 있던 이전 CA를 시스템 인증서 저장소에서 제거합니다. Windows에서 확인을 요청할 수 있습니다. 새 CA는 자동으로 설치되지 않습니다.',
          si: '제거',
          hecho: '이전 CA가 신뢰 목록에서 제거되었습니다.',
        },
        descartadosWorkspace: (lista: string) => `이 컴퓨터에 없어 제거됨: ${lista}`,
        workspacesInvalidos: (n: number) => `유효하지 않은 워크스페이스 ${n}개는 가져오지 않았습니다.`,
        puerto: (de: number, a: number) => `포트 ${de} → ${a}`,
        copiaEnv: (ruta: string) => `.env 백업: ${ruta}`,
      },
    },
    /** 미리보기 강력 경고: 프로필의 CA에 이름 제약 조건이 없습니다. */
    caSinRestricciones:
      '이 CA는 모든 웹사이트의 인증서에 서명할 수 있습니다. 반드시 본인의 CA인 경우에만 지문을 비교한 뒤 가져오십시오.',
    motivos: {
      procesos_quitados: '프로세스(다른 컴퓨터의 명령)는 가져오지 않았습니다.',
      tareas_quitadas:
        '예약 작업(다른 컴퓨터의 명령)은 가져오지 않았습니다. 다시 생성하거나 wolfcore.yml에서 적용하십시오.',
      tunel_con_nombre: '이름이 지정된 터널은 옮겨지지 않아 빠른 터널로 전환됩니다.',
      php_ini: '일부 php.ini 설정은 가져오지 않았습니다.',
      xdebug: 'Xdebug 설정이 유효하지 않아 제거되었습니다.',
      nginx_desactivado:
        'Nginx 규칙은 저장되었으나 적용되지 않았습니다. 편집기에서 확인하십시오.',
      carpeta_no_existe: '해당 폴더가 이 컴퓨터에 존재하지 않습니다. 직접 찾아 지정하십시오.',
      correo_sin_proveedor: 'SMTP 공급자는 가져오지 않아 메일 수집기를 사용합니다.',
      sitio_invalido: '유효하지 않은 사이트입니다.',
      dominio_invalido: '도메인이 유효하지 않습니다(.test로 끝나야 합니다).',
      ruta_protegida: '시스템 폴더 또는 WolfCore Dev 폴더이므로 가져오지 않습니다.',
      dominio_en_uso: '이 컴퓨터의 다른 사이트가 이미 해당 도메인을 사용 중입니다.',
      sitio_repetido: '프로필에 사이트가 중복되어 있습니다.',
      no_disponible: '해당 버전은 더 이상 카탈로그에 없습니다.',
      huella_debil: '해당 버전에 강력한 해시가 없습니다. 버전 메뉴에서 수동으로 설치하십시오.',
      tope_descargas:
        '동시에 너무 많은 다운로드를 방지하기 위해 다운로드하지 않았습니다. 버전 메뉴에서 설치하십시오.',
      instancia_pendiente: '인스턴스가 보류 상태로 남았습니다.',
      motor_no_soportado: '해당 엔진은 프로필에서 가져올 수 없습니다.',
      version_pendiente: '엔진 버전이 보류 상태로 남았습니다.',
      danada: '프로필 내 파일이 손상되었습니다.',
      bases_omitidas: '데이터베이스를 제외하고 가져왔습니다.',
      instancia_apagada: '인스턴스를 시작할 수 없습니다.',
      sin_copia_previa: '사전 스냅샷을 생성할 수 없어 데이터베이스를 교체하지 않았습니다.',
      sin_base: '.env가 로컬 데이터베이스를 가리키지 않습니다.',
      base_no_resuelta: '해당 데이터베이스가 어느 인스턴스에 속하는지 확인할 수 없습니다.',
      error_inesperado: '오류가 발생했습니다.',
    },
    avisos: {
      ca_reemplazada:
        '이 컴퓨터의 이전 CA가 시스템 신뢰 저장소에 남아 있으며 더 이상 사용되지 않습니다. 여기에서 제거할 수 있습니다.',
      base_no_incluida: '데이터베이스 {base}({instancia})가 포함되지 않았습니다.',
      sin_ca: '이 컴퓨터에 CA가 없어 CA 없이 프로필을 내보냅니다.',
      ca_no_importada: '프로필의 CA를 가져오지 않았습니다. 이 컴퓨터의 기존 CA 또는 새 CA를 사용합니다.',
      certificados: '인증서를 준비할 수 없습니다: {detalle}',
      aplicar:
        '가져온 사이트가 완전히 적용되지 않았습니다(Nginx: {nginx}; hosts: {hosts}).',
    },
    quitado: {
      ia: 'AI 공급자 {id}: 사용자 지정 URL을 사용합니다.',
      smtp: 'SMTP 공급자 {id}: 알려진 공급자의 호스트가 아니거나 사용자 정보가 누락되었습니다.',
      puerto: '{id}의 포트: 허용 범위를 벗어나 기본 포트로 되돌아갑니다.',
      carpeta_vigilada: '감시 중인 폴더가 다른 컴퓨터의 경로입니다.',
    },
  },
};
