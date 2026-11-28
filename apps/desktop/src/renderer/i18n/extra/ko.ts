import type { TextosParciales } from '../es';

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const koExtra: TextosParciales = {
  app: { lema: '로컬 환경을 바로 사용할 수 있도록' },
  resumenGlobal: {
    cortoApagado: '모두 꺼짐',
    cortoEncendidos: (n) => `${n}개 실행 중`,
    cortoErrores: (n) => `${n}개 오류`,
    cortoCargando: '연결 중…',
    cortoSinConexion: '오프라인',
    irAServicios: '서비스 열기',
  },
  acciones: { copiarCompleto: '전체 텍스트 복사' },
  errores: {
    uacHuerfano: 'Windows 권한 창이 나타나면 취소하셔도 됩니다. 더 이상 아무 작업도 하지 않습니다.',
    codigos: {
      'asistentes.no_existe': '이 어시스턴트는 지원되지 않습니다.',
      'asistentes.no_instalado': '{asistente}이(가) 설치되어 있지 않습니다.',
      'asistentes.no_compatible': '{asistente}은(는) 아직 연결할 수 없습니다.',
      'asistentes.enlace_rechazado':
        '{archivo}은(는) 링크(심볼릭 링크 또는 정션)이므로 수정하지 않았습니다.',
      'asistentes.vista_desfasada':
        '미리 보기 이후 파일이 변경되었습니다. 미리 보기를 다시 확인해 주십시오.',
      'asistentes.sin_carpeta': '{asistente}의 설정 폴더가 없습니다.',
      'asistentes.entrada_no_editable':
        '{archivo}의 wolfcore 항목은 안전하게 편집할 수 없는 형식입니다. 직접 편집해 주십시오.',
      'discos.sin_lectura': '디스크 상태를 읽을 수 없습니다. 다시 시도해 주십시오.',
      'discos.sin_eventos': '디스크 이벤트를 읽을 수 없습니다.',
      'discos.admin_cancelado': '관리자 권한 요청이 취소되었습니다. 아무것도 읽지 않았습니다.',
      'discos.admin_tiempo':
        '관리자 권한 승인에 제때 응답하지 않았습니다. 아무것도 읽지 않았습니다.',
      'discos.admin_fallo': '관리자 권한으로 디스크 상태를 읽을 수 없습니다.',
      'doctor.disco_atencion': '디스크 {modelo}에 주의가 필요합니다.',
      'doctor.disco_critico':
        '디스크 {modelo}이(가) 위험한 상태입니다. 가능한 한 빨리 백업하십시오.',
      'servicios.no_encendio':
        '{nombre}을(를) 시작하지 못했습니다. 서비스와 해당 로그를 확인하십시오.',
      'tuneles.sitio_no_confiable':
        '{dominio}은(는) 아직 신뢰할 수 없습니다. 게시하기 전에 프로젝트에서 "이 저장소를 신뢰합니다"를 선택하십시오.',
      'clientehttp.peticion_invalida': '요청의 데이터가 올바르지 않습니다: {campo}.',
      'clientehttp.variable_sin_definir':
        '변수 "{nombre}"이(가) 현재 환경에 정의되어 있지 않습니다.',
      'clientehttp.secreto_faltante':
        '저장된 비밀 값이 없습니다. 다시 입력한 후 요청 또는 환경을 저장하십시오.',
      'clientehttp.secreto_no_guardado':
        '비밀 값을 저장하지 못했습니다. 줄 바꿈을 포함할 수 없고 16 KB를 넘을 수 없으며, 시스템 암호화를 사용할 수 있어야 합니다.',
      'clientehttp.url_invalida': 'URL이 올바르지 않습니다.',
      'clientehttp.url_con_credenciales':
        'URL에 사용자 이름이나 비밀번호를 포함할 수 없습니다. 인증 탭을 사용하십시오.',
      'clientehttp.protocolo': 'http:// 및 https:// URL만 사용할 수 있습니다.',
      'clientehttp.cabecera_invalida': '헤더 "{nombre}"이(가) 올바르지 않습니다.',
      'clientehttp.cuerpo_grande': '요청 본문이 1 MB보다 큽니다.',
      'clientehttp.plazo': '요청이 제한 시간 {segundos}초를 초과했습니다.',
      'clientehttp.cancelado': '요청이 취소되었습니다.',
      'clientehttp.sin_conexion':
        '연결할 수 없습니다({motivo}). 주소와 포트를 확인하고 서버가 실행 중인지 확인하십시오.',
      'clientehttp.certificado': '서버 인증서를 확인할 수 없습니다({motivo}).',
      'clientehttp.demasiadas_redirecciones': '리디렉션이 {max}회를 넘게 연속되었습니다.',
      'clientehttp.curl_invalido': '이 텍스트는 올바른 curl 명령이 아닙니다.',
      'clientehttp.curl_grande': 'curl 텍스트가 너무 큽니다(최대 64 KB).',
      'clientehttp.no_existe': '해당 항목이 더 이상 존재하지 않습니다.',
      'clientehttp.limite': '저장할 수 있는 항목 수의 한도에 도달했습니다.',
      'ejemplohttp.no_arranca': '예제 서버를 시작할 수 없습니다.',
      'laboratoriogit.sin_git': '이 컴퓨터에 Git이 설치되어 있지 않습니다.',
      'laboratoriogit.orden_invalida': '해당 명령은 실습 목록에 없습니다.',
      'laboratoriogit.nombre_invalido':
        '이름에는 영문자, 숫자, 하이픈, 밑줄만 사용할 수 있습니다(최대 30자).',
      'laboratoriogit.mensaje_invalido':
        '메시지는 한 줄이어야 하며 200자 이내여야 하고 "-"로 시작할 수 없습니다.',
      'laboratoriogit.archivo_invalido': '해당 파일은 연습용 파일이 아닙니다.',
      'laboratoriogit.contenido_invalido': '내용은 2000자 이내의 텍스트여야 합니다.',
      'laboratoriogit.ruta_insegura': '실습 폴더가 예상된 폴더가 아니므로 건드리지 않습니다.',
      'laboratoriogit.fallo_sistema':
        '시스템에서 실습 폴더를 준비하거나 사용하도록 허용하지 않았습니다. "실습 초기화"를 시도하십시오.',
      'buscar.ruta_vetada': '해당 폴더에는 WolfCore Dev 데이터가 있어 검색하지 않습니다.',
      'buscar.resultado_caducado': '해당 결과를 더 이상 사용할 수 없습니다. 다시 검색하십시오.',
      'buscar.resultado_invalido': '해당 결과를 열 수 없습니다.',
      'diff.raiz_invalida': '존재하며 링크가 아닌 폴더 두 개를 선택하십시오.',
      'diff.ruta_vetada': '해당 폴더에는 WolfCore Dev 데이터가 있어 비교하지 않습니다.',
      'diff.cancelado': '비교가 취소되었습니다.',
      'diff.plazo': '비교에 {segundos}초보다 오래 걸려 취소되었습니다.',
      'diff.memoria': '비교에 메모리가 너무 많이 필요하여({maximo} 초과) 취소되었습니다.',
      'diff.ocupado': '이미 비교가 실행 중입니다. 취소하거나 끝날 때까지 기다리십시오.',
      'diff.caducado': '해당 비교를 더 이상 사용할 수 없습니다. 다시 비교하십시오.',
      'diff.archivo_invalido': '해당 파일은 더 이상 비교할 수 없습니다. 변경되었거나 사라졌습니다.',
      'diff.fallo': '비교에 실패했습니다.',
      'red.sin_confirmar': '계속하기 전에 대화 상자에서 작업을 확인해 주십시오.',
      'red.rango_no_permitido':
        '최대 254대의 개인 네트워크(10.x, 172.16~172.31, 192.168.x)만 탐색합니다.',
      'red.sin_adaptador': '탐색할 수 있는 사용 중인 네트워크가 없습니다.',
      'red.red_publica': '공용 네트워크에서는 다른 장치를 탐색하지 않습니다.',
      'red.perfil_desconocido':
        '네트워크가 개인용인지 공용인지 확인할 수 없어 다른 장치를 탐색하지 않습니다.',
      'red.ocupado': '내 네트워크의 다른 작업이 이미 진행 중입니다. 끝날 때까지 기다려 주십시오.',
      'red.equipo_no_valido': '로컬 네트워크의 개인 IPv4 주소만 사용할 수 있습니다.',
      'red.equipo_desconocido': '해당 장치가 목록에 없습니다. 네트워크를 다시 읽어 주십시오.',
      'red.recurso_no_valido': '해당 리소스가 장치의 목록에 없습니다.',
      'red.carpeta_no_valida': '해당 공유 폴더는 여기에서 제거할 수 없습니다.',
      'red.lectura_fallo': '이 컴퓨터의 네트워크를 읽을 수 없습니다.',
      'red.quitar_fallo': '폴더 공유를 중지할 수 없습니다.',
      'red.velocidad_fallo': '속도를 측정할 수 없습니다. 연결을 확인해 주십시오.',
      'compartir.confirmacion_requerida': '인터넷 공유는 WolfCore Dev 창에서 확인해야 합니다.',
      'compartir.ocupado': '이미 공유 중인 항목이 있습니다. 먼저 공유를 중지하십시오.',
      'compartir.ruta_invalida': '존재하는 폴더 또는 파일을 선택하십시오.',
      'compartir.duracion_invalida': '15분, 1시간 또는 4시간 중에서 선택하십시오.',
      'compartir.proveedor_invalido':
        '지원하지 않는 터널입니다. Cloudflare 또는 ngrok을 사용하십시오.',
      'compartir.raiz_unidad': '드라이브의 루트는 공유하지 않습니다. 그 안의 폴더를 선택하십시오.',
      'compartir.carpeta_usuario':
        '개인 폴더 전체(또는 이를 포함하는 폴더)는 공유하지 않습니다. 하위 폴더를 선택하십시오.',
      'compartir.carpeta_datos': 'WolfCore Dev 데이터 폴더는 공유하지 않습니다.',
      'compartir.sitio_datos_reales':
        '실제 데이터가 있는 사이트(또는 그 안의 모든 것)는 공유하지 않습니다.',
      'compartir.carpeta_secretos':
        '해당 폴더에는 키(.ssh, .aws, .git 등)가 있어 공유하지 않습니다.',
      'compartir.carpeta_sistema': '시스템 폴더는 공유하지 않습니다.',
      'compartir.archivo_sensible':
        '해당 파일에는 비밀 또는 실제 데이터가 있는 것으로 보여 공유하지 않습니다.',
      'compartir.carpeta_perfil':
        '사용자 프로그램의 데이터(AppData, .claude, .config 등)는 공유하지 않습니다.',
      'compartir.archivo_grande':
        '해당 파일은 너무 커서 검사할 수 없고 미디어 파일이나 패키지도 아니므로 공유하지 않습니다.',
      'compartir.tunel_sin_url':
        '터널이 {segundos}초 안에 주소를 제공하지 않았습니다. 다시 시도하십시오.',
      'compartir.tunel_cerrado': '터널이 열리기 전에 닫혔습니다.',
      'compartir.fallo': '공유할 수 없습니다.',
      'disco.raiz_invalida': '존재하며 읽을 수 있는 폴더 또는 드라이브를 선택하십시오.',
      'disco.cancelado': '분석이 취소되었습니다.',
      'info.ruta_invalida': '경로가 올바르지 않습니다. 절대 경로이면서 로컬 경로여야 합니다.',
      'info.no_existe': '파일 또는 폴더가 없습니다.',
      'info.sin_ruta':
        '이 항목은 디스크에 있는 파일이 아닙니다(예: 첨부 파일이나 zip 안의 항목). 먼저 폴더에 저장해 주십시오.',
      'info.enlace': '링크입니다. 대신 대상 파일이나 폴더를 선택해 주세요.',
      'info.hash_grande': '파일이 {maximo}MB를 넘어 해시를 계산하지 않습니다.',
      'disco.plazo': '분석에 {minutos}분보다 오래 걸려 취소되었습니다.',
      'disco.memoria': '분석에 메모리가 너무 많이 필요합니다({maximo} 초과).',
      'disco.ocupado': '이미 분석이 실행 중입니다. 취소하거나 끝날 때까지 기다리십시오.',
      'disco.caducado': '해당 분석을 더 이상 사용할 수 없습니다. 다시 분석하십시오.',
      'disco.entrada_invalida':
        '해당 폴더가 더 이상 존재하지 않거나 변경되었습니다. 다시 분석하십시오.',
      'disco.fallo': '분석에 실패했습니다.',
      'reverb.no_laravel': 'Reverb는 Laravel 프로젝트에서만 사용할 수 있습니다.',
      'reverb.no_confiado': 'Reverb를 켜려면 프로젝트에서 "이 저장소를 신뢰합니다"를 선택하십시오.',
      'reverb.sin_paquete':
        'laravel/reverb 패키지가 없습니다. composer require laravel/reverb로 설치하십시오.',
      'reverb.sin_confirmar': 'Reverb를 켜려는 것이 맞는지 확인하십시오.',
      'reverb.sin_activar': '먼저 프로젝트에서 Reverb를 켜십시오.',
      'env.meilisearch_no_disponible':
        'Meilisearch가 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'bd.lentas_confirmar':
        '느린 쿼리 로그를 변경하면 서버 전체에 영향을 주므로 확인이 필요합니다. 아무것도 변경되지 않았습니다.',
      'bd.lentas_umbral_invalido': '시간은 0.1초에서 60초 사이여야 합니다.',
      'bd.lentas_motor_no_soportado':
        '느린 쿼리는 WolfCore Dev가 관리하는 MySQL, MariaDB, PostgreSQL에서만 변경할 수 있습니다.',
      'bd.lentas_literal_no_permitido':
        'SQL을 값과 함께 표시하지 않습니다. 데이터베이스에 실제 데이터가 있거나 쿼리를 알려진 데이터베이스에 연결할 수 없습니다.',
      'bd.lentas_entrada_no_existe': '해당 쿼리가 더 이상 로그에 없습니다. 다시 읽으십시오.',
      'bd.lentas_fallo':
        '느린 쿼리 로그를 읽거나 변경할 수 없습니다. 서버가 실행 중인지 확인하십시오.',
      'bd.esquema_base_no_existe': '해당 서버에 데이터베이스가 없습니다.',
      'bd.esquema_motor_no_soportado': '스키마 뷰어는 MySQL, MariaDB, PostgreSQL용입니다.',
      'bd.esquema_lectura_fallo':
        '데이터베이스 스키마를 읽을 수 없습니다. 서버가 실행 중인지 확인하십시오.',
      'captura.atajo_invalido':
        '해당 단축키는 올바르지 않습니다. Ctrl, Alt, Shift 또는 Super를 문자, 숫자 또는 F 키와 함께 사용하십시오.',
      'captura.atajo_no_permitido':
        '해당 단축키는 사용할 수 없습니다. Ctrl 또는 Super를 다른 수정 키와 함께 사용하십시오(Shift 없는 Ctrl+Alt는 AltGr이므로 @ 입력에 문제가 생깁니다). Ctrl+C나 Alt+F4 같은 일반적인 단축키는 피하십시오.',
      'captura.atajo_ocupado': '단축키 {atajo}은(는) 이미 다른 프로그램에서 사용 중입니다.',
      'captura.no_disponible': '이 컴퓨터에서는 화면 캡처를 사용할 수 없습니다.',
      'captura.permiso_denegado': '화면 녹화 권한이 없습니다.',
      'captura.sin_imagen': '캡처할 이미지가 없습니다.',
      'captura.imagen_invalida': '캡처 이미지가 올바르지 않습니다.',
      'disco.sin_confirmar': '계속하기 전에 대화 상자에서 정리를 확인하십시오.',
      'disco.categoria_invalida': '해당 정리 범주가 없습니다.',
      'disco.ruta_vetada':
        '해당 범주는 보호된 경로(데이터, 백업, 프로젝트 또는 FlyEnv)에 접근하므로 아무것도 정리하지 않았습니다.',
      'disco.sin_analisis': '정리하기 전에 다시 분석하십시오. 분석이 만료되었거나 없습니다.',
      'disco.ocupada': '이미 분석 또는 정리가 실행 중입니다.',
      'disco.sin_registro': '정리 로그를 만들 수 없어 아무것도 삭제하지 않았습니다.',
      'editor.sin_confirmar': '계속하기 전에 저장을 확인하십시오.',
      'editor.confirmacion_reforzada':
        '이 파일에는 비밀이 있거나 실제 데이터가 있는 사이트에 속하는 것으로 보입니다. 저장하려면 추가 확인을 진행하십시오.',
      'editor.ruta_invalida': '파일 경로가 올바르지 않습니다.',
      'editor.no_existe': '파일이 없습니다.',
      'editor.no_regular': '일반 파일만 편집할 수 있습니다.',
      'editor.ruta_vetada':
        '해당 파일은 WolfCore Dev 데이터 폴더 안에 있어 편집기에서 열거나 저장할 수 없습니다.',
      'editor.archivo_env': '.env 파일은 편집기가 아니라 프로젝트 변수에서 관리합니다.',
      'editor.demasiado_grande': '파일이 편집기에서 열기에는 너무 큽니다(최대 {maximo}).',
      'editor.binario': '파일이 텍스트가 아니라 바이너리이므로 여기서 편집할 수 없습니다.',
      'editor.codificacion': '파일이 UTF-8이 아니므로, 손상을 막기 위해 편집기에서 열지 않습니다.',
      'editor.no_abierto':
        '해당 파일이 편집기에서 열려 있지 않습니다(또는 버전이 바뀌었습니다). 다시 여십시오.',
      'editor.eol_mixto': '파일에 줄 끝 문자가 섞여 있습니다. 저장하려면 정규화를 확인하십시오.',
      'editor.contenido_invalido': '내용이 올바른 텍스트가 아닙니다.',
      'editor.huella_invalida': '열려 있는 파일의 지문이 없습니다. 다시 여십시오.',
      'editor.archivo_cambiado':
        '파일을 연 이후 편집기 밖에서 변경되었습니다. 다시 불러오거나 덮어쓰기를 확인하십시오.',
      'editor.copia_fallo': '백업 사본을 만들 수 없어({codigo}) 아무것도 저장하지 않았습니다.',
      'editor.lectura_fallo': '파일을 읽을 수 없습니다({codigo}).',
      'editor.escritura_fallo': '파일을 저장할 수 없습니다({codigo}). 원본은 건드리지 않았습니다.',
      'memoria.sin_confirmar': '계속하기 전에 대화 상자에서 작업을 확인하십시오.',
      'memoria.modo_invalido': '해당 확보 단계가 없습니다.',
      'memoria.no_disponible':
        '여기서는 메모리 확보 기능을 사용할 수 없거나 시스템을 읽을 수 없습니다.',
      'conversor.ocupado':
        '이미 변환이 실행 중이고 다른 하나가 대기 중입니다. 끝날 때까지 기다리십시오.',
      'doctor.firewall_reglas_acotadas':
        'WolfCore Dev 프로그램용 규칙 {cantidad}개가 로컬 네트워크로 제한되어 있습니다(개인 프로필만, 로컬 서브넷, 특정 포트). 사이트를 공유하기 위해 앱이 직접 권장하는 규칙과 같습니다. 표시만 되며 여기서 삭제되지 않습니다.',
      'doctor.firewall_almacen_inseguro':
        '규칙의 보호된 사본을 신뢰할 수 없습니다(권한 또는 내용이 표시된 것과 다릅니다). 규칙이 만들어지거나 변경되지 않았습니다.',
      'doctor.firewall_quitadas':
        'WolfCore Dev가 이전에 방화벽 규칙 {cantidad}개를 삭제하고 사본을 보관했습니다. 필요하면 다시 만들 수 있습니다.',
      'doctor.firewall_parcial':
        '일부 규칙은 삭제되었지만 다른 규칙은 삭제되지 않았습니다. 목록이 표시된 이후 변경되었거나, WolfCore Dev의 규칙이 아니거나, Windows에서 삭제를 허용하지 않았습니다. 목록을 확인하십시오.',
      'doctor.firewall_sin_cambios':
        '변경된 규칙이 없습니다. 표시된 내용과 더 이상 일치하지 않거나 변경할 수 없었습니다.',
      'doctor.firewall_registro_fallido':
        '규칙 사본을 보호된 레지스트리 키 HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos에 저장할 수 없어 아무것도 변경하지 않았습니다.',
      'catalogo.paquete_invalido':
        '다운로드한 패키지가 안전하지 않습니다(폴더 밖 경로, 링크 또는 과도한 크기).',
      'catalogo.extraccion_fallo': '다운로드한 .7z 패키지를 읽거나 압축 해제할 수 없습니다.',
      'runtimes.falta_runtime':
        '이 프로젝트에 {nombre}이(가) 설치되어 있지 않습니다. 서비스에서 설치하십시오.',
      'runtimes.falta_jdk':
        '이 프로젝트에 JDK가 설치되어 있지 않습니다. 서비스에서 Java를 설치하십시오.',
      'runtimes.instalacion_incompleta':
        '{nombre} 설치가 완전하지 않습니다. 서비스에서 다시 설치하십시오.',
      'procesos.escucha_publica':
        '이 프로세스가 {direccion}:{puerto}({programa})에서 수신 대기 중이며 네트워크에 열려 있습니다. 127.0.0.1에서만 수신 대기할 수 있으므로 중지했습니다.',
      'procesos.escucha_publica_livereload':
        '이 프로세스가 {direccion}:{puerto}({programa})에서 수신 대기 중이며 네트워크에 열려 있습니다. 127.0.0.1에서만 수신 대기할 수 있으므로 중지했습니다. Spring DevTools LiveReload입니다. spring.devtools.livereload.enabled=false로 끄십시오.',
      'procesos.escucha_publica_inspector':
        '이 프로세스가 {direccion}:{puerto}({programa})에서 수신 대기 중이며 네트워크에 열려 있습니다. 127.0.0.1에서만 수신 대기할 수 있으므로 중지했습니다. Node 인스펙터입니다. --inspect=127.0.0.1을 사용하십시오.',
    },
  },
  inicio: {
    servicios: { irA: (nombre) => `${nombre} 서비스로 이동` },
    tuneles: { irA: (nombre) => `${nombre} 프로젝트로 이동` },
  },
  servicios: {
    sinParaEncender: '시작할 수 있는 설치된 서비스가 없습니다',
    franjaExternos: {
      texto: '웹 서버와 PHP를 아직 설치하지 않았습니다. 외부 엔진을 자동으로 감지했습니다.',
      accion: 'Nginx와 PHP 설치',
    },
    externos: {
      titulo: '이 컴퓨터에서 감지됨',
      ayuda: '다른 프로그램이 관리하므로 WolfCore Dev는 표시만 합니다.',
    },
    borrarDatos: { que: { meilisearch: '모든 Meilisearch 인덱스' } },
    ftp: {
      redLocalAyuda:
        '꺼져 있으면 이 컴퓨터에서만 연결할 수 있습니다(127.0.0.1). 각 프로젝트의 접근은 프로젝트 화면에서 켭니다.',
      compartir: {
        enlace: '폴더 또는 파일 공유…',
        ayuda:
          'FTP는 터널로 공유되지 않습니다. 암호화되지 않았고 터널은 HTTP만 전달하기 때문입니다. 인터넷에 게시하려면 "폴더 또는 파일 공유"(HTTP, 읽기 전용)를 사용하십시오. FTP는 로컬 네트워크에서만 사용합니다.',
      },
    },
    datosConexion: '연결 정보',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Meilisearch 연결',
      notaMeilisearch:
        '프로젝트에서 사용하려면 변수(.env) → 블록 추가 → Meilisearch를 선택하십시오. 키를 가린 미리보기가 표시되며 확인이 필요합니다. 이 키는 이 컴퓨터에서만 사용됩니다.',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Laravel Scout용 검색(github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails(로컬 포트)',
      springboot: 'Spring Boot(로컬 포트)',
      aspnet: 'ASP.NET Core(로컬 포트)',
    },
    tiposCortos: { rails: 'Rails', springboot: 'Spring Boot', aspnet: 'ASP.NET' },
  },
  tunel: {
    sinConfianza:
      '이 프로젝트는 신뢰되지 않았습니다. 게시하려면 "이 저장소를 신뢰합니다"를 선택하십시오.',
  },
  tuneles: {
    irAProyectos: '프로젝트로 이동',
    compartir: {
      enlace: '폴더 또는 파일 공유…',
      ayuda: '사이트 없이 폴더 또는 파일 하나를 게시합니다(읽기 전용).',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      '이 프로젝트의 Reverb 프로세스에 WolfCore Dev의 명령이 없습니다(다른 호스트, 프로그램 또는 포트). 켜면 127.0.0.1에서만 수신 대기하는 표준 프로세스로 교체됩니다.',
    ayuda: 'Laravel WebSockets, 127.0.0.1에서만.',
    puerto: (p) => `포트 ${p}`,
    interruptor: (dominio) => `${dominio}의 Reverb 켜기 또는 끄기`,
    activarTitulo: 'Reverb를 켜시겠습니까?',
    activarTexto: (dominio) =>
      `${dominio}에서 "php artisan reverb:start"가 실행되며, 사용 가능한 포트의 127.0.0.1에서만 수신 대기합니다. 프로젝트의 코드는 해당 프로젝트의 PHP로 실행됩니다.`,
    desactivarTitulo: 'Reverb를 끄시겠습니까?',
    desactivarTexto:
      '프로세스가 중지되고 프로젝트에서 제거됩니다. .env의 REVERB_* 변수는 건드리지 않습니다.',
    activar: '켜기',
    desactivar: '끄기',
    proponer: 'REVERB_* 변수 제안',
    tituloError: 'Reverb',
    estados: { apagado: '중지됨', iniciando: '시작 중', encendido: '실행 중', error: '실패' },
  },
  ftpSitio: {
    compartirNota:
      'FTP는 로컬 네트워크 전용입니다. 비밀번호와 파일을 암호화하지 않고 전송하므로 인터넷 터널로 공유하지 않습니다.',
    compartirIr: '임시 링크로 폴더 또는 파일 공유',
  },
  ia: {
    pestanas: { etiqueta: 'AI 섹션', agentes: '에이전트', nube: '클라우드', local: '로컬 모델' },
  },
  iaLocal: {
    compat: {
      sugerenciaVram:
        '사용 중인 컴퓨터에는 약 {b}B까지의 모델을 권장합니다. 그래픽 카드 메모리에 들어갑니다.',
      sugerenciaRam: '사용 중인 컴퓨터에는 약 {b}B까지의 모델을 권장합니다. RAM에서 실행됩니다.',
      sugerenciaPequena: '사용 중인 컴퓨터에는 매우 작은 모델(1B 미만)만 권장합니다.',
      sugerenciaDesconocida: '컴퓨터의 하드웨어를 읽지 못하여 권장 사항이 없습니다.',
      aviso: '참고용 안내일 뿐이며, 어떤 모델이든 다운로드할 수 있습니다.',
      comprobando: '컴퓨터를 확인하는 중…',
      niveles: {
        recomendado: '권장',
        lento: '느릴 수 있음',
        'no-cabe': '들어가지 않음',
        desconocido: '데이터 없음',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          '그래픽 카드 메모리에 여유 있게 들어갑니다(필요 약 {necesario}, 사용 가능 {disponible}).',
        'justo-vram':
          '그래픽 카드에 들어가지만 빠듯합니다(필요 약 {necesario}, 사용 가능 {disponible}).',
        'solo-ram':
          '그래픽 카드에 들어가지 않아 RAM에서 실행됩니다(필요 약 {necesario}, 사용 가능 {disponible}). 더 느립니다.',
        'cabe-ram': 'RAM에 여유 있게 들어갑니다(필요 약 {necesario}, 사용 가능 {disponible}).',
        'ram-justo':
          'RAM에 들어가지만 빠듯합니다(필요 약 {necesario}, 사용 가능 {disponible}). 느릴 수 있습니다.',
        'sin-memoria':
          '메모리가 약 {necesario} 필요하지만 컴퓨터에는 약 {disponible}이(가) 있습니다.',
        'sin-disco': '다운로드할 디스크 여유 공간이 부족합니다({disponible} 남음).',
        'tamano-desconocido':
          '모델 크기를 확인하지 못했습니다(Ollama 레지스트리에 연결할 수 없음).',
        'equipo-desconocido': '컴퓨터의 메모리를 읽지 못했습니다.',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto: '다운로드는 언제든지 취소할 수 있으며, 이미 받은 부분은 삭제됩니다.',
      tamano: (t) => `다운로드 크기: ${t}.`,
      tamanoDesconocido:
        '크기를 확인할 수 없습니다(Ollama 레지스트리에 연결할 수 없음). 모델은 보통 1 GB에서 40 GB 이상입니다.',
      libre: (l) => `모델 디스크의 여유 공간: ${l}.`,
      libreDesconocido: '디스크의 여유 공간을 확인할 수 없습니다.',
      sinEspacio: (t, l) =>
        `공간이 부족합니다. 모델에 ${t}이(가) 필요하지만 여유 공간은 ${l}뿐입니다. 공간을 확보하거나 더 작은 모델을 선택하십시오.`,
    },
  },
  proyectos: {
    asistente: { ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    tarjeta: { verEnBases: '데이터베이스에서 보기' },
  },
  panel: {
    insignias: { memoriaAlta: '메모리 사용량 높음' },
    discos: {
      titulo: '디스크 공간',
      leyendo: '디스크를 읽는 중…',
      sistema: '시스템',
      datos: 'WolfCore 데이터',
      ambos: '시스템 및 WolfCore 데이터',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} 여유(${pct} %)`,
      poco: '여유 공간 부족',
      casiLleno: '공간이 거의 없음',
      liberar: '공간 확보',
      versiones: '사용하지 않는 버전 정리',
      temporales: 'WolfCore 임시 파일 및 캐시 정리',
      ocupaMas: '공간을 가장 많이 차지하는 항목 보기',
    },
    alertas: {
      grupo: (n) => `발견된 문제(${n})`,
      verTodos: (n) => `${n}개 모두 표시`,
      verMenos: '간략히 보기',
      masAcciones: '추가 작업',
    },
    procesos: { resto: '기타 서비스' },
  },
  captura: {
    barra: '그리기 도구',
    herramientas: {
      recuadro: '사각형',
      flecha: '화살표',
      linea: '선',
      resaltador: '형광펜',
      texto: '텍스트',
      pixelar: '모자이크',
      pixelarAyuda: '모자이크(민감한 데이터에는 안전하지 않습니다. "가리기"를 사용하십시오)',
      ocultar: '가리기',
      ocultarAyuda: '단색으로 채워 가리기(민감한 데이터에 권장)',
    },
    deshacer: '실행 취소',
    rehacer: '다시 실행',
    copiar: '복사',
    copiarAyuda:
      '클립보드에 복사합니다. Windows 클립보드는 이를 기록에 보관하거나 다른 기기와 동기화할 수 있습니다.',
    guardar: '저장…',
    alConversor: '이미지 변환기로 보내기',
    cerrar: '취소(Esc)',
    nuevaSeleccion: '다시 선택',
    color: '색상',
    grosor: '두께',
    formato: '형식',
    cargando: '캡처를 준비하는 중…',
    guiaRegion: '드래그하여 영역을 선택하십시오. Esc를 누르면 취소됩니다.',
    guiaVentana: '캡처할 창을 선택하십시오. Esc를 누르면 취소됩니다.',
    sinVentanas: '캡처할 수 있는 창이 없습니다.',
    textoPlaceholder: '입력한 후 Enter를 누르십시오',
    copiada: '클립보드에 복사했습니다',
    guardada: (archivo) => `${archivo}에 저장했습니다`,
    errorCargar: '캡처를 열 수 없습니다.',
    errorCopiar: '이미지를 복사할 수 없습니다.',
    errorGuardar: '이미지를 저장할 수 없습니다.',
    errorConversor: '이미지를 변환기로 보낼 수 없습니다.',
    errorVentana: '해당 창을 캡처할 수 없습니다.',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        '모든 작업은 이 컴퓨터에서 이루어집니다. 캡처는 어떤 서비스에도 업로드되지 않으며, 저장하기 전에는 디스크에 기록되지 않습니다. WolfCore Dev 창은 이미지에 나타나지 않도록 잠시 숨겨집니다.',
      region: '영역',
      regionAyuda: '화면에서 드래그하여 영역을 선택합니다.',
      ventana: '창',
      ventanaAyuda: '열려 있는 창 중 하나를 선택합니다.',
      pantalla: '전체 화면',
      pantallaAyuda: '커서가 있는 화면입니다.',
      atajoActivo: (atajo) => `전역 단축키 사용 중: ${atajo}(영역).`,
      atajoInactivo: '전역 단축키가 없습니다. 설정에서 켜십시오.',
      noDisponible: '이 컴퓨터에서는 화면 캡처를 사용할 수 없습니다.',
      permisoDenegado: '화면 녹화 권한이 없습니다. 시스템 설정에서 WolfCore Dev에 대해 켜십시오.',
      ocupada: '이미 캡처가 진행 중입니다.',
    },
    ajustes: {
      titulo: '화면 캡처',
      descripcion:
        '간단한 편집기로 영역, 창 또는 전체 화면을 캡처합니다. 완전히 로컬에서 동작하며, 사용자가 결정하기 전에는 아무것도 업로드하거나 저장하지 않습니다.',
      activar: '전역 단축키',
      activarAyuda:
        '기본값은 꺼짐입니다. 켜면 다른 프로그램이 사용하지 않을 때만 등록되며, WolfCore Dev를 닫으면 해제됩니다.',
      atajo: '조합',
      grabar: '변경',
      grabando: '조합을 누르십시오…',
      grabandoAyuda:
        'Ctrl 또는 Super를 다른 수정 키(예: Ctrl+Alt+Shift) 및 문자, 숫자 또는 F 키와 함께 사용하십시오. Ctrl+C 같은 일반적인 단축키는 피하십시오.',
      formato: '저장 시 형식',
      activado: (atajo) => `단축키 ${atajo}을(를) 켰습니다.`,
      desactivado: '단축키를 껐습니다.',
      ocupado: (atajo) =>
        `단축키 ${atajo}은(는) 이미 다른 프로그램에서 사용 중이므로 아무것도 변경하지 않았습니다. 다른 조합을 시도하십시오.`,
      ocupadoInicio:
        '저장된 단축키가 이미 다른 프로그램에서 사용 중이어서 등록되지 않았습니다. 다른 조합을 선택하십시오.',
      sinPermiso: 'macOS에서는 화면 녹화 권한이 필요하며, 처음 캡처할 때 요청됩니다.',
      formatoGuardado: '형식을 저장했습니다.',
    },
  },
  ajustes: {
    avisos: {
      tipos: {
        'salud-disco': '디스크 상태 알림',
      },
    },
  },
  avisos: {
    hacerRespaldo: '지금 백업',
  },
  herramientas: {
    entorno: {
      discos: {
        titulo: '디스크 상태',
        intro:
          'Windows가 보고하는 각 디스크의 상태를 아무것도 설치하지 않고 보여 드립니다. 읽기 전용이며 디스크의 내용은 전혀 변경되지 않습니다.',
        actualizar: '새로 고침',
        leerAdmin: '관리자 권한으로 읽기',
        leerAdminAyuda:
          '이 버튼을 누를 때에만 Windows가 허락(UAC)을 요청합니다. 데이터를 읽기만 하며 저절로 실행되는 일은 없습니다.',
        sinDiscos: 'Windows가 물리 디스크를 보고하지 않았습니다.',
        numeroDisco: '디스크 {n}',
        unidades: '드라이브: {u}',
        sinUnidades: '드라이브 문자 없음',
        datosWolf: 'WolfCore Dev 데이터',
        proyectos: '프로젝트',
        tipoDesconocido: '유형 미확인',
        veredictos: {
          bien: '양호',
          atencion: '주의',
          critico: '위험',
          no_disponible: '사용 불가',
        },
        motivos: {
          estado_warning: 'Windows가 「Warning」(경고) 상태를 보고했습니다.',
          estado_unhealthy: 'Windows가 「Unhealthy」(결함) 상태를 보고했습니다.',
          estado_operacional: '작동 상태가 오류를 나타냅니다({estado}).',
          errores_sin_corregir:
            '수정되지 않은 오류가 있습니다(읽기: {lectura}, 쓰기: {escritura}).',
          prediccion_fallo: '디스크가 고장을 예측하고 있습니다(SMART).',
          desgaste: '마모도 {desgaste}%(기준: {umbral}%).',
          temperatura: '온도 {temperatura} °C(한계: {limite} °C).',
          errores_corregidos_suben: '수정된 읽기 오류가 이전 측정보다 늘었습니다(총 {cantidad}건).',
        },
        contadores: {
          temperatura: '온도',
          desgaste: '마모도',
          lecturaCorregidos: '수정된 읽기 오류',
          lecturaNoCorregidos: '수정되지 않은 읽기 오류',
          escrituraCorregidos: '수정된 쓰기 오류',
          escrituraNoCorregidos: '수정되지 않은 쓰기 오류',
          horas: '전원 켜진 시간',
          prediccion: '고장 예측',
        },
        noDisponible: '사용 불가',
        noDisponibleMotivo: '사용 불가({motivo})',
        motivoSin: {
          admin: '관리자 권한이 필요합니다',
          bus: '이러한 연결 방식(USB 또는 RAID)은 카운터를 제공하지 않습니다',
          no_soportado: '디스크나 컨트롤러가 지원하지 않습니다',
          no_leidos: 'Windows가 값을 반환하지 않았습니다',
        },
        prediccionSin: {
          sin_acceso: '관리자 권한이 필요합니다',
          no_disponible: '이 컴퓨터에서는 제공되지 않습니다',
        },
        prediccionSinFallo: '예상되는 고장 없음',
        prediccionFallo: '고장이 예상됨',
        bienSoloEstado: '양호(Windows가 보고한 상태만 해당)',
        noAplicaHdd: '해당 없음(HDD)',
        ultimoDatoAdmin: '관리자 권한으로 읽은 마지막 데이터: {fecha}',
        ultimoDatoContadores: '카운터의 마지막 데이터: {fecha}',
        horasValor: '{n}시간',
        criterios: {
          titulo: '판정은 어떻게 결정되나요?',
          critico:
            '위험: Windows가 Warning 또는 Unhealthy 상태나 작동 오류를 보고했거나, 수정되지 않은 오류가 있거나, 디스크가 고장을 예측하는 경우.',
          atencion:
            '주의: 마모도가 {desgaste}% 이상이거나, 온도가 제조업체 최대값을 넘거나(최대값이 없으면 SSD와 NVMe는 {ssd} °C 이상, HDD는 {hdd} °C 이상), 수정된 읽기 오류가 이전 측정보다 늘어난 경우.',
          bien: '양호: Healthy 상태이며 위 항목에 해당하지 않는 경우.',
          noDisponible: '사용 불가: Windows가 해당 디스크의 데이터를 충분히 제공하지 않은 경우.',
        },
        leidoAdmin: '관리자 권한으로 데이터를 읽었습니다.',
        requiereAdminAviso:
          '일부 데이터는 관리자 권한이 필요합니다. 위 버튼으로 읽을 수 있으며, 그때에만 Windows가 허락을 요청합니다.',
        nota: '이 결과는 참고용이며 보장이 아닙니다. 좋은 신호라고 해서 고장을 막을 수는 없습니다. 중요한 자료는 백업해 두십시오.',
        privacidad: '일련번호와 고유 식별자는 읽지도 표시하지도 않습니다.',
      },
      eventosDisco: {
        titulo: '디스크 이벤트',
        intro: '최근 {dias}일 동안 Windows System 로그에 기록된 디스크 관련 항목입니다. 읽기 전용.',
        actualizar: '이벤트 새로 고침',
        copiar: '이벤트 복사',
        copiado: '이벤트를 복사했습니다',
        vacio: '최근 {dias}일 동안 디스크 이벤트가 없습니다.',
        sinDisco: '디스크 미확인',
        disco: '디스크 {n}',
        unidad: '드라이브 {u}',
        gravedad: {
          info: '정보',
          aviso: '경고',
          critico: '위험',
        },
        explicaciones: {
          disco_7: '디스크에 불량 블록이 있습니다.',
          disco_11: '컨트롤러가 디스크 오류를 감지했습니다.',
          disco_51: '페이징 작업 중 디스크에서 오류가 발생했습니다.',
          disco_52: '디스크가 곧 고장 날 것으로 예측하고 있습니다.',
          disco_55: '드라이브의 파일 시스템에서 손상이 감지되었습니다.',
          disco_129: '디스크 컨트롤러가 응답하지 않아 Windows가 재설정했습니다.',
          disco_98: 'Windows가 볼륨을 검사했으며 상태가 양호합니다.',
          disco_140:
            '시스템이 볼륨의 트랜잭션 로그에 데이터를 기록하지 못했습니다. 손상이 발생할 수 있습니다.',
          disco_153: '디스크 작업이 실패하여 다시 시도되었습니다.',
          disco_157: '디스크가 예기치 않게 분리되었습니다.',
        },
        tope: '이벤트는 최대 {n}건까지 표시됩니다.',
        cabeceraCopia: '디스크 이벤트(최근 {dias}일)',
      },
      equipo: {
        titulo: '내 컴퓨터',
        copiarResumen: '요약 복사',
        resumenCopiado: '요약을 복사했습니다',
        privacidad: '요약에는 일련번호나 고유 식별자가 포함되지 않습니다.',
        desconocido: '알 수 없음',
        sinGpu: '감지되지 않음',
        so: '운영 체제',
        cpu: '프로세서',
        ram: '메모리 (RAM)',
        gpu: '그래픽 카드',
        placa: '메인보드',
        disco: '드라이브 {u}',
        compilacion: '빌드 {n}',
        nucleosHilos: '코어 {n}개, 스레드 {h}개',
        ramDetalle: '전체 {total}, 사용 가능 {libre}',
        vram: 'VRAM {v}',
        discoDetalle: '{total} 중 {libre} 사용 가능',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: '컴퓨터 요약 · WolfCore Dev {v}',
        resumenTituloSinVersion: '컴퓨터 요약 · WolfCore Dev',
      },
    },
    infoArchivo: {
      zona: '파일이나 폴더를 여기에 놓으면 정보를 확인할 수 있습니다. 읽기만 하며 아무것도 변경하지 않습니다.',
      soltarEnVentana: '놓으면 정보를 표시합니다',
      ruta: '경로',
      mime: 'MIME 유형',
      creado: '만든 날짜',
      accedido: '마지막 액세스',
      atributos: '특성',
      soloLectura: '읽기 전용',
      oculto: '숨김',
      ninguno: '없음',
      dimensiones: '크기(픽셀)',
      sensible: '민감한 파일입니다. 세부 정보는 표시하지만 내용은 표시하지 않습니다.',
      esArchivo: '파일',
      esCarpeta: '폴더',
      tamanoTotal: '전체 크기',
      archivos: '파일 수',
      carpetas: '하위 폴더 수',
      analizando: '폴더를 분석하는 중…',
      cancelar: '취소',
      cancelado: '분석이 취소되었습니다.',
      abrirDisco: '디스크 사용량에서 열기',
      incompleto: '일부 항목은 집계되지 않았습니다(링크, 접근 거부, 너무 큰 폴더).',
      raizUnidadTitulo: '드라이브 전체를 분석하시겠습니까?',
      raizUnidadTexto:
        '{ruta} 드라이브 전체를 분석하려고 합니다. 모든 내용을 살펴보므로 시간이 오래 걸릴 수 있습니다. 계속하시겠습니까?',
      raizUnidadAnalizar: '분석',
    },
    chmod: {
      permisos: '권한',
      propietario: '소유자',
      grupo: '그룹',
      otros: '기타 사용자',
      leer: '읽기 (r)',
      escribir: '쓰기 (w)',
      ejecutar: '실행 (x)',
      especiales: '특수 비트',
      setuid: 'setuid: 소유자의 권한으로 실행됩니다',
      setgid:
        'setgid: 그룹의 권한으로 실행됩니다. 폴더에서는 그 안에 새로 만드는 항목이 그룹을 물려받습니다',
      sticky: 'sticky: 폴더 안에서는 소유자만 삭제할 수 있습니다',
      habituales: '자주 쓰는 값',
      octal: '8진수',
      simbolico: '기호 표기',
      octalInvalido: '0에서 7 사이의 숫자 3자리 또는 4자리를 입력하십시오(예: 755).',
      simbolicoInvalido: 'rwxr-xr-x와 같은 9자를 입력하십시오.',
      ejemplo: '예시',
      archivo: '파일 이름',
      archivoPorDefecto: '파일',
      nota: 'Windows에서는 적용되지 않으며, Linux 및 macOS 서버용입니다.',
      avisoOtros:
        '서버의 모든 사용자가 수정할 수 있습니다. 「기타 사용자」에게 쓰기 권한을 주지 마십시오.',
    },
    lista: {
      chmod: {
        nombre: 'chmod 권한',
        descripcion: '체크박스, 8진수, 기호 표기. Linux 및 macOS 서버용.',
      },
      clienteHttp: {
        nombre: 'HTTP 클라이언트',
        descripcion: 'API를 시험해 보십시오. 요청, 환경, 컬렉션 및 기록.',
      },
      captura: {
        nombre: '화면 캡처',
        descripcion: '영역, 창 또는 전체 화면을 간단한 편집기로 캡처합니다.',
      },
      guiaTuneles: {
        nombre: '터널 가이드',
        descripcion: 'Cloudflare와 ngrok을 단계별로 안내하며, 복사할 수 있는 명령을 제공합니다.',
      },
      guiaHttp: {
        nombre: 'HTTP 가이드',
        descripcion: '상태 코드와 메서드를 검색과 예제와 함께 제공합니다.',
      },
      guiaGit: {
        nombre: 'Git 및 GitHub 가이드',
        descripcion: '명령과 워크플로를 안전하게 연습할 수 있는 실습과 함께 제공합니다.',
      },
      limpiezaDisco: {
        nombre: '디스크 정리',
        descripcion:
          '임시 파일과 재생성 가능한 캐시를 분석하고 삭제합니다. 미리보기와 확인을 제공합니다.',
      },
      editor: {
        nombre: '코드 편집기',
        descripcion: '텍스트 파일을 편집합니다. 구문 강조, 백업 사본, 확인 후 저장을 지원합니다.',
      },
      compartir: {
        nombre: '폴더 또는 파일 공유',
        descripcion: '읽기 전용 임시 링크로 폴더 또는 파일을 인터넷에 게시합니다.',
      },
      miRed: {
        nombre: '내 네트워크',
        descripcion:
          '이 컴퓨터가 공유하는 폴더, 로컬 네트워크의 장치, 속도 테스트. 원격 제어는 없습니다.',
      },
      usoDisco: {
        nombre: '디스크 사용량',
        descripcion:
          '드라이브나 폴더에서 공간을 차지하는 항목: 트리, 가장 큰 파일과 폴더, 확장자별.',
      },
      diffCarpetas: {
        nombre: '폴더 비교',
        descripcion:
          '두 폴더를 비교합니다. 한쪽에만 있는 항목, 다른 쪽에만 있는 항목, 서로 다른 항목을 파일별 차이와 함께 보여 줍니다.',
      },
      grabarPantalla: {
        nombre: '화면 녹화',
        descripcion: '시스템에 기본 포함된 녹화 도구를 엽니다.',
      },
    },
    secciones: {
      codigo: '코드',
      red: '네트워크',
      seguridad: '보안',
      archivos: '파일 및 미디어',
      sistema: '시스템',
    },
    tarjetas: {
      comparar: { nombre: '비교', descripcion: '텍스트와 폴더: 차이점을 나란히 보여 줍니다.' },
      qr: {
        nombre: 'QR',
        descripcion: '텍스트나 링크로 만들거나, 다른 사람이 내 Wi-Fi에 접속할 수 있게 합니다.',
      },
      guias: {
        nombre: '가이드',
        descripcion: 'HTTP, 터널, Git을 예제와 복사할 수 있는 명령과 함께 제공합니다.',
      },
    },
    pestanas: {
      diff: '텍스트',
      diffCarpetas: '폴더',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: '터널',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev에는 자체 녹화 도구가 없으며, 시스템에 기본 포함된 도구를 엽니다. 동영상은 해당 도구가 저장하는 위치에 저장됩니다.',
      abrir: '녹화 도구 열기',
      abierta: '캡처 도구를 열었습니다. 화면 영역을 선택하고 시작을 누르십시오.',
      noSePudo: '여기서는 캡처 도구를 열 수 없습니다. 가이드의 단축키 중 하나를 사용하십시오.',
      guiaTitulo: '시스템에서 녹화하는 방법',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Win + Shift + R을 눌러 캡처 도구로 녹화합니다.',
            '캡처 도구가 최신 버전이 아니면 Win + Alt + R을 눌러 Xbox Game Bar로 녹화합니다.',
            '위쪽에 나타나는 막대의 버튼으로 녹화를 중지합니다.',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'Cmd + Shift + 5를 눌러 캡처 막대를 엽니다.',
            '전체 화면 또는 선택한 부분 중 녹화할 대상을 선택합니다.',
            '녹화를 누르고, 끝낼 때는 메뉴 막대의 중지 버튼을 누릅니다.',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            '각 데스크톱에는 녹화 도구가 포함되어 있습니다. GNOME에서는 Ctrl + Alt + Shift + R, KDE에서는 Spectacle을 사용합니다.',
            '없는 경우 패키지 관리자에서 OBS Studio 또는 SimpleScreenRecorder를 설치하십시오.',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `잘못된 식입니다: ${detalle}` : '잘못된 식입니다.'),
      regexDetalle: {
        corchete: '대괄호 "["가 닫히지 않았습니다.',
        parentesis: '괄호 "("가 닫히지 않았습니다.',
        parentesisSobra: '닫는 괄호 ")"에 대응하는 여는 괄호가 없습니다.',
        nadaQueRepetir: '수량자("*", "+", "?" 또는 "{}") 앞에 반복할 대상이 없습니다.',
        barraAlFinal: '패턴은 백슬래시로 끝날 수 없습니다.',
        rangoInvertido: '문자 클래스의 범위가 거꾸로 되어 있습니다(예: "z-a").',
        cuantificador: '수량자 "{}"가 완전하지 않거나 숫자 순서가 거꾸로 되어 있습니다.',
        grupo: '그룹의 이름 또는 형식이 올바르지 않습니다.',
        escape: '백슬래시 이스케이프 시퀀스가 올바르지 않습니다.',
      },
    },
    busqueda: {
      excluir: '추가로 건너뛰기(쉼표로 구분)',
      incluirPesadas: '무거운 폴더 포함(node_modules, vendor, .git 등)',
      contexto: '앞뒤 줄 수',
      grupoNombres: (n) => `이름 기준(${n})`,
      grupoContenido: (n) => `내용 기준(${n})`,
      carpeta: '폴더',
      listaAria: '검색 결과',
      atajos: '↑ ↓ 이동, Enter 편집기에서 열기, Esc 취소 또는 텍스트로 돌아가기.',
      sensible: (n) =>
        `민감한 파일: ${n}번째 줄에서 일치 항목이 있습니다(내용은 표시하지 않습니다).`,
      mostrarMas: (n) => `${n}개 더 표시`,
      linea: (n) => `${n}번째 줄`,
      sinGrupo: '이 그룹에는 결과가 없습니다.',
      topeBytes: '읽기 한도에 도달했습니다. 검색 범위를 좁히십시오.',
    },
    compartir: {
      explicacion:
        '이 컴퓨터의 폴더 또는 파일을 임시 링크로 인터넷에 게시합니다. 읽기 전용이므로 링크가 있는 사람은 누구나 보고 다운로드할 수 있지만 업로드하거나 변경할 수는 없습니다. 링크에는 비밀 코드가 포함되며, 선택한 시간에 만료되고 WolfCore Dev를 종료하면 닫힙니다. .env 파일, 키, .git 폴더, 실제 데이터가 있는 사이트는 공유하지 않습니다.',
      eleccion: '공유할 항목',
      elegirCarpeta: '폴더 선택…',
      elegirArchivo: '파일 선택…',
      elegido: '선택됨',
      duracion: '공유 중지 시간',
      duraciones: { m15: '15분', h1: '1시간', h4: '4시간' },
      tunel: '터널',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare(빠른 방식, 계정 불필요)',
        ngrok: 'ngrok(내 토큰 사용)',
      },
      ngrokSinToken: 'ngrok에는 내 토큰이 필요합니다. 사이트의 터널 옵션에서 저장하십시오.',
      compartir: '공유…',
      sinFtp:
        'FTP는 터널로 공유되지 않습니다. 암호화되지 않았고 터널은 HTTP만 전달하기 때문입니다.',
      vacio: {
        titulo: '공유 중인 항목이 없습니다',
        texto:
          '폴더 또는 파일을 선택하면 임시 공개 링크를 받을 수 있습니다. 확인하기 전에는 아무것도 게시되지 않습니다.',
      },
      grandes:
        '8 MB보다 큰 텍스트 파일이나 종류를 알 수 없는 파일은 완전히 검사할 수 없으므로 공유하지 않습니다. 이미지, 오디오, 동영상, 패키지(zip, 7z, gz, pdf)는 공유됩니다. 목록에 표시가 나타납니다.',
      comprimidos:
        '압축 파일(.zip, .7z, .gz)은 내부를 확인하지 않고 그대로 공유됩니다. .env 파일이나 키가 들어 있으면 함께 게시됩니다.',
      confirmar: {
        titulo: '인터넷에서 공유',
        pregunta: '이 항목을 인터넷에 게시하시겠습니까?',
        rutaReal: '실제 경로(링크 확인됨)',
        ruta: '정확한 경로',
        aviso: (dur) =>
          `링크가 준비된 시점부터 ${dur} 동안 인터넷에 공개됩니다. 링크가 있는 사람은 누구나 공유된 내용을 보고 다운로드할 수 있습니다.`,
        boton: '인터넷에서 공유',
      },
      abriendo: '터널을 여는 중…',
      activa: '공유 중',
      enlace: '공개 링크',
      copiar: '링크 복사',
      qr: '링크의 QR 코드',
      vence: (hasta, restan) => `${hasta}에 만료(${restan})`,
      restan: (min) => (min <= 1 ? '1분 미만 남음' : `${min}분 남음`),
      dejar: '공유 중지',
      fin: {
        vencio: '시간이 다 되어 서버와 터널을 닫았습니다.',
        tunel: '터널이 닫혀 공유가 중지되었습니다.',
      },
      registro: {
        titulo: '접속 기록',
        ayuda: '최근 200건이며 메모리에만 보관됩니다. 링크의 비밀 코드는 표시되지 않습니다.',
        vacioTitulo: '아직 접속 기록이 없습니다',
        vacioTexto: '누군가 링크를 열 때마다 여기에 표시됩니다.',
        col: { hora: '시간', ip: 'IP', ruta: '경로', codigo: '코드' },
        sinPermiso: '(올바른 코드 없음)',
      },
    },
    miRed: {
      explicacion:
        '장치를 제어하지 않고 네트워크를 확인하실 수 있습니다. 이 컴퓨터가 공유하는 폴더, 로컬 네트워크의 장치, 속도 테스트를 보여 드립니다. 읽기와 조회만 하며, 원격 제어, 원격 데스크톱, 다른 장치에서의 실행은 없습니다.',
      carpetas: {
        titulo: '이 컴퓨터의 공유 폴더',
        ayuda:
          '네트워크의 다른 장치가 이 컴퓨터에서 열 수 있는 항목입니다. Windows 관리 공유(C$, ADMIN$, IPC$)는 숨겨져 있으며 여기에서 제거할 수 없습니다.',
        mostrarAdministrativas: '관리 공유 표시',
        administrativa: '관리용',
        col: {
          nombre: '이름',
          ruta: '폴더',
          descripcion: '설명',
          usuarios: '연결 수',
          acciones: '작업',
        },
        dejar: '공유 중지',
        vacioTitulo: '공유 중인 폴더가 없습니다',
        vacioTexto: '이 컴퓨터의 폴더가 네트워크에서 공유되고 있지 않습니다.',
        confirmar: {
          titulo: '폴더 공유 중지',
          pregunta: (nombre: string) => `“${nombre}” 공유를 중지하시겠습니까?`,
          efecto:
            '다른 장치에서 이 폴더가 더 이상 보이지 않습니다. 폴더의 파일은 삭제되거나 이동되지 않습니다.',
          uac: '관리자 권한이 필요합니다. Windows에서 사용자 계정 컨트롤(UAC) 알림이 표시되며, 직접 허용하셔야 합니다. 취소하시거나 제때 응답하지 않으시면 아무것도 변경되지 않습니다.',
          entiendo: '관리자 권한이 요청되며 폴더 공유가 중지된다는 점을 이해합니다.',
          boton: '계속',
        },
        resultado: {
          quitada: (nombre: string) => `“${nombre}” 폴더는 더 이상 공유되지 않습니다.`,
          cancelado: 'Windows 알림이 취소되었습니다. 아무것도 변경되지 않았습니다.',
          tiempo: 'Windows 알림을 허용할 시간이 지났습니다. 아무것도 변경되지 않았습니다.',
        },
      },
      equipos: {
        titulo: '로컬 네트워크의 장치',
        ayuda:
          '이 컴퓨터의 ARP 테이블(이미 통신한 적이 있는 장치)을 읽습니다. 즉시 완료되며 네트워크로는 아무것도 보내지 않습니다.',
        leer: '네트워크 읽기',
        redActiva: '사용 중인 네트워크',
        perfil: {
          privado: '개인 네트워크',
          publico: '공용 네트워크',
          dominio: '도메인 네트워크',
          desconocido: '프로필 알 수 없음',
        },
        publica:
          '공용 네트워크에서는 다른 장치를 탐색하지 않습니다. Windows에서 네트워크를 개인용으로 바꾸려면 설정 › 네트워크 및 인터넷 › 속성 › 네트워크 프로필에서 변경해 주십시오.',
        tunel: '사용 중인 네트워크가 VPN 또는 터널이므로 다른 장치를 탐색하지 않습니다.',
        ipEsteEquipo: '이 장치의 IP',
        perfilDesconocido:
          '네트워크가 개인용인지 공용인지 확인할 수 없어 다른 장치를 탐색하지 않습니다.',
        sinRed: '탐색할 수 있는 사용 중인 개인 네트워크가 없습니다.',
        escanear: '장치 찾기',
        progreso: (hechos: number, total: number) =>
          `주소 ${total}개 중 ${hechos}개를 확인했습니다…`,
        escaneoListo: (cantidad: number, red: string) =>
          `${red}에서 검색을 마쳤습니다. 목록에 장치 ${cantidad}대가 있습니다.`,
        escaneoCancelado: (hechos: number, total: number) =>
          `주소 ${total}개 중 ${hechos}개를 확인한 후 검색이 취소되었습니다.`,
        vacioTitulo: '표시할 장치가 없습니다',
        vacioTexto:
          '“네트워크 읽기”를 누르시면 네트워크로 아무것도 보내지 않고 이 컴퓨터가 이미 알고 있는 장치를 보여 드립니다. 이미 읽으셨다면 “장치 찾기”를 사용해 보십시오.',
        col: {
          ip: 'IP 주소',
          nombre: '이름',
          mac: 'MAC',
          fabricante: '제조업체',
          ping: '마지막 ping',
        },
        ping: 'ping 실행',
        verCarpetas: '폴더 보기',
        confirmar: {
          titulo: '네트워크에서 장치 찾기',
          texto: (red: string, cantidad: number) =>
            `장치를 찾기 위해 ${red}의 주소 ${cantidad}개 각각에 속도를 제한하여 차례로 ping을 보냅니다.`,
          adaptador: (nombre: string) => `네트워크 어댑터: ${nombre}`,
          limites:
            '사용 중인 개인 네트워크만 탐색합니다(최대 주소 254개). 포트를 검사하지 않으며 어떤 장치에도 접속하지 않습니다. 언제든지 취소하실 수 있습니다.',
          boton: '장치 찾기',
        },
      },
      ping: {
        resultado: (recibidos: number, enviados: number, media: number) =>
          `${enviados}회 중 ${recibidos}회 응답 · 평균 ${media}ms`,
        sinRespuesta: (enviados: number) => `${enviados}회 중 0회 · 응답 없음`,
      },
      recursos: {
        titulo: (ip: string) => `${ip}의 공유 폴더`,
        vacio: '이 장치는 표시되는 폴더를 공유하지 않습니다.',
        ayuda:
          '파일 탐색기에서 열립니다. 장치가 사용자 이름과 암호를 요구하는 경우, 이 애플리케이션이 아니라 Windows에서 요청합니다.',
        abrir: '열기',
        fallo: {
          denegado: '자격 증명이 없으면 이 장치의 폴더를 볼 수 없습니다.',
          inaccesible: '장치에 연결할 수 없습니다.',
          error: '이 장치의 폴더를 조회할 수 없습니다.',
        },
      },
      velocidad: {
        titulo: '속도 테스트',
        ayuda: (mb: number) =>
          `인터넷 연결의 지연 시간, 다운로드 속도, 업로드 속도를 측정합니다. 약 ${mb}MB의 데이터를 사용합니다.`,
        medir: '속도 측정',
        fases: {
          latencia: '지연 시간을 측정하는 중…',
          bajada: '다운로드 속도를 측정하는 중…',
          subida: '업로드 속도를 측정하는 중…',
        },
        latencia: '지연 시간',
        bajada: '다운로드',
        subida: '업로드',
        cancelada: '측정이 취소되었습니다. 그때까지 측정된 결과를 표시합니다.',
        incompleta: '측정 중 하나가 제한 시간에 도달했습니다. 해당 값은 근삿값입니다.',
        confirmar: {
          titulo: '속도 측정',
          texto: (bajada: number, subida: number, total: number) =>
            `Cloudflare(speed.cloudflare.com)에서 약 ${bajada}MB를 내려받고 약 ${subida}MB를 올립니다. 총 약 ${total}MB의 데이터를 사용합니다. 데이터 사용량 제한이 있는 연결이라면 이 사용량을 고려하십시오.`,
          privacidad:
            '회원님의 데이터는 전송되지 않습니다. 업로드되는 것은 0으로 채워진 데이터뿐입니다. 언제든지 취소하실 수 있습니다.',
          boton: '측정',
        },
      },
    },
    usoDisco: {
      explicacion:
        '드라이브 또는 폴더에서 공간을 차지하는 항목을 보여 줍니다. 이름과 크기만 읽고(내용은 읽지 않음), 링크나 정션을 따라가지 않으며, 별도의 프로세스에서 동작합니다. 아무것도 삭제, 이동 또는 변경하지 않습니다.',
      unidades: '드라이브',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${total} 중 ${libre} 여유`,
      sinUnidades: '드라이브 목록을 읽을 수 없습니다. 폴더를 선택할 수 있습니다.',
      elegirCarpeta: '폴더 선택…',
      analizando: '분석 중…',
      leyendo: '읽는 중',
      progreso: (archivos, carpetas, bytes) => `파일 ${archivos}개 · 폴더 ${carpetas}개 · ${bytes}`,
      cancelar: '취소',
      cancelado: '분석이 취소되었습니다.',
      resumen: (total, archivos, carpetas) => `${total}(파일 ${archivos}개, 폴더 ${carpetas}개)`,
      duracion: (segundos) => `${segundos}초 걸렸습니다.`,
      vistas: { arbol: '트리', carpetas: '폴더', archivos: '파일', extensiones: '확장자' },
      arbolAyuda:
        '크기순으로 정렬되어 있습니다. 전체의 0.5% 이상을 차지하는 폴더와 파일만 표시하며, 나머지는 "기타"에 합산됩니다.',
      carpetasAyuda:
        '자체 크기가 가장 큰 폴더 50개입니다. 하위 폴더를 제외하고 직접 포함한 파일의 크기입니다.',
      archivosAyuda: '가장 큰 파일 50개입니다.',
      extensionesAyuda:
        '공간을 가장 많이 차지하는 확장자 20개이며, 나머지는 "기타 확장자"에 포함됩니다.',
      col: {
        nombre: '이름',
        tamano: '크기',
        porcentaje: '전체 대비',
        archivos: '파일 수',
        ruta: '경로',
        extension: '확장자',
      },
      otros: (n) => `기타(작은 파일 ${n}개)`,
      sinExtension: '(확장자 없음)',
      otrasExtensiones: '기타 확장자',
      expandir: (nombre) => `${nombre} 펼치기`,
      contraer: (nombre) => `${nombre} 접기`,
      abrir: '탐색기에서 열기',
      copiar: '경로 복사',
      denegada: '읽을 수 없음',
      avisos: {
        enlaces: (n) => `링크 또는 정션 ${n}개는 따라가지 않았으며 0으로 계산됩니다.`,
        denegados: (n) =>
          `항목 ${n}개를 읽을 수 없습니다(권한이 없거나 분석 중에 변경됨). 관리자 권한이 없으면 일부 시스템 폴더를 읽을 수 없으며, 이 도구는 관리자 권한을 요청하지 않습니다.`,
        enlacesDuros: (n) => `하드 링크된 파일의 추가 이름 ${n}개는 중복 계산하지 않았습니다.`,
        enlacesDurosIncompleto:
          '하드 링크가 너무 많아 등록부가 가득 찼습니다. 합계에서 일부 파일이 중복 계산되었을 수 있습니다.',
        truncado: '최대 깊이에 도달했습니다. 일부 폴더는 계산되지 않았습니다.',
        tamanoLogico:
          '크기는 각 파일이 보고하는 논리 크기이며 디스크에서 실제로 사용하는 공간이 아닙니다. 온라인 전용 OneDrive 파일, 압축 파일, 스파스 파일은 다를 수 있습니다.',
        verEnlaces: '따라가지 않은 링크 표시',
      },
      limpieza: {
        titulo: '공간 확보',
        texto:
          '이 도구는 측정만 합니다. 임시 파일과 재생성 가능한 캐시, 사용하지 않는 서비스 버전을 삭제하려면 이미 있는 기능을 사용하십시오.',
        temporales: '디스크 정리',
        versiones: '사용하지 않는 버전(서비스)',
      },
      vacio: {
        titulo: '아직 분석이 없습니다',
        texto:
          '드라이브 또는 폴더를 선택하면 공간을 차지하는 항목을 볼 수 있습니다. 아무것도 변경되지 않습니다.',
      },
      sinContenido: {
        titulo: '계산할 항목이 없습니다',
        texto: '해당 폴더에는 읽을 수 있는 파일이 없습니다.',
      },
    },
    diffCarpetas: {
      explicacion:
        '두 폴더를 내용을 변경하지 않고 비교합니다. 한쪽에만 있는 항목, 다른 쪽에만 있는 항목, 서로 다른 항목을 보여 줍니다. 링크를 따라가지 않으며 별도의 프로세스에서 동작합니다.',
      carpetaA: '폴더 A',
      carpetaB: '폴더 B',
      elegir: '폴더 선택',
      sinElegir: '선택 안 됨',
      comparar: '비교',
      comparando: '비교하는 중…',
      cancelar: '취소',
      cancelada: '비교가 취소되었습니다.',
      iguales: '두 폴더가 같습니다.',
      grupoSoloA: 'A에만 있음',
      grupoSoloB: 'B에만 있음',
      grupoDistintos: '다름',
      grupo: (nombre, n) => `${nombre}(${n})`,
      vacio: '없음',
      resumen: (a, b, iguales) => `A: 파일 ${a}개 · B: 파일 ${b}개 · ${iguales}개 동일`,
      truncado: '한도(파일 수, 깊이 또는 크기)에 도달했습니다. 목록이 완전하지 않습니다.',
      recortado: (mostrados, total) =>
        `표시된 것보다 더 많은 파일이 있습니다(${total}개 중 ${mostrados}개).`,
      sinComparar: (n) => `크기가 같은 큰 파일 ${n}개는 내용을 비교하지 않았습니다.`,
      omitidos: (n) => `링크, 정션 또는 특수 항목 ${n}개를 건너뛰었습니다.`,
      motivoTamano: '크기가 다름',
      motivoContenido: '크기는 같고 내용이 다름',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: '목록에서 "다름" 파일을 선택하면 차이점을 볼 수 있습니다.',
      soloEnUno: (lado) => `이 파일은 ${lado}에만 있습니다.`,
      cargando: '파일을 읽는 중…',
      binario: '파일이 다르지만 텍스트가 아니므로 차이점을 표시하지 않습니다.',
      sensible:
        '민감한 파일(.env, 키 또는 실제 데이터)입니다. 내용이 다르지만 표시하지 않습니다. 편집기에서 열 수 있으며, 이때 강화된 확인을 요청합니다.',
      tope: (kb) => `파일이 다르지만 ${kb} KB를 초과하므로 텍스트 차이점을 표시하지 않습니다.`,
      demasiadoDistinto: '파일이 너무 많이 달라서 줄 단위 차이점을 표시하지 않습니다.',
      saltos: { lf: 'LF', crlf: 'CRLF', mixto: '줄 끝 문자 혼합', ninguno: '줄 끝 문자 없음' },
      saltosDistintos: (a, b) => `줄 끝 문자: A는 ${a}, B는 ${b}을(를) 사용합니다.`,
      soloSaltos: '각 줄의 텍스트는 같습니다. 줄 끝 문자(파일 끝의 것 포함) 또는 BOM만 다릅니다.',
      resumenArchivo: (agregadas, quitadas) => `${agregadas}줄 추가, ${quitadas}줄 삭제`,
      truncadoArchivo: '처음 몇 줄만 표시합니다.',
      lineasIguales: (n) => `… 동일한 ${n}줄 …`,
      abrirA: 'A를 편집기에서 열기',
      abrirB: 'B를 편집기에서 열기',
      atajos: '↑ ↓ 이동, Enter 차이점 보기, Esc 취소.',
      listaAria: (grupo) => `파일: ${grupo}`,
      detalleAria: '파일 차이점',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'HTTP 클라이언트 섹션',
        peticion: '요청',
        coleccion: '컬렉션',
        historial: '기록',
        entornos: '환경',
      },
      entorno: '환경',
      sinEntorno: '환경 없음',
      metodo: '메서드',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path 또는 {{base}}/path',
      enviar: '보내기',
      enviarAtajo: '보내기(Ctrl+Enter)',
      cancelar: '취소',
      nueva: '새로 만들기',
      guardar: '컬렉션에 저장',
      nombre: '이름',
      nombrePlaceholder: '요청 이름',
      guardada: '요청을 저장했습니다',
      ayudaVariables: '{{variable}}을 사용하면 선택한 환경의 값을 가져옵니다.',
      secciones: {
        params: '매개변수',
        cabeceras: '헤더',
        cuerpo: '본문',
        auth: '인증',
        opciones: '옵션',
      },
      par: {
        clave: '이름',
        valor: '값',
        agregar: '행 추가',
        quitar: '행 삭제',
        activa: '행 사용',
        falta: '비밀 값이 없습니다. 보내려면 입력하십시오.',
      },
      cuerpo: {
        tipo: '본문 유형',
        ninguno: '없음',
        json: 'JSON',
        form: '폼(urlencoded)',
        multipart: 'Multipart(텍스트만)',
        raw: '일반 텍스트',
        tipoContenido: 'Content-Type',
        texto: '내용',
        multipartAyuda: '텍스트 필드만 해당됩니다. 디스크의 파일은 전송되지 않습니다.',
      },
      auth: {
        tipo: '유형',
        ninguna: '없음',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API 키',
        token: '토큰',
        usuario: '사용자',
        clave: '비밀번호',
        nombre: '헤더 또는 매개변수 이름',
        en: '전송 위치',
        cabecera: '헤더',
        query: '쿼리 문자열',
        ayuda: '값은 시스템에서 암호화하여 저장합니다. 컬렉션, 기록, 환경에는 참조만 남습니다.',
      },
      secreto: {
        guardado: '저장됨(암호화). 입력하면 교체됩니다.',
        mostrar: '표시',
        ocultar: '숨기기',
        quitar: '제거',
        valor: '저장된 값',
        porNombre: '이름이 비밀처럼 보이므로 암호화하여 저장됩니다.',
      },
      opciones: {
        plazo: '제한 시간(초)',
        plazoAyuda: '1초에서 120초까지입니다.',
        ignorarCert: '이 요청에서 인증서 오류 무시',
        ignorarAviso:
          '위험: 연결이 더 이상 검증되지 않습니다. 이 요청과 해당 호스트에만 적용됩니다. WolfCore의 .test 사이트는 자체 CA로 이미 검증됩니다.',
        limites:
          '응답은 최대 10 MB, 리디렉션은 최대 10회입니다. 쿠키를 저장하지 않으며 시스템 프록시를 사용하지 않습니다.',
      },
      respuesta: {
        enviando: '보내는 중…',
        estado: '상태',
        tiempo: '소요 시간',
        tamano: '크기',
        cuerpo: '본문',
        cabeceras: '헤더',
        redirecciones: '리디렉션',
        vacioTitulo: '아직 응답이 없습니다',
        vacioTexto: 'URL을 입력하고 보내기를 누르십시오. 요청은 WolfCore Dev에서 전송됩니다.',
        binario: (bytes, tipo) => `${bytes}바이트의 바이너리, 유형: ${tipo || '알 수 없음'}.`,
        sinCuerpo: '응답에 본문이 없습니다.',
        truncada: '응답이 10 MB를 초과하여 잘렸으며 불완전합니다.',
        parcial: (mostrados) => `처음 ${mostrados}자를 표시합니다.`,
        sinRedirecciones: '리디렉션이 없었습니다.',
        salto: (n) => `${n}번째 이동`,
        urlFinal: '최종 URL',
        certIgnorado: '이 요청에서는 인증서 오류를 무시했습니다.',
        caWolf: 'WolfCore Dev CA로 검증되었습니다.',
        copiar: '본문 복사',
        copiado: '본문을 복사했습니다',
        formato: '서식이 적용된 JSON',
        crudo: '원본 텍스트',
      },
      curl: {
        copiar: 'curl로 복사',
        incluir: '자격 증명 포함',
        incluirAyuda:
          '선택하지 않으면 비밀 값이 <secreto>로 나옵니다. 선택하면 명령에 실제 자격 증명이 포함됩니다.',
        copiado: 'curl 명령을 복사했습니다',
        importar: 'curl 가져오기',
        importarTitulo: 'curl 명령 가져오기',
        importarAyuda:
          'curl 명령을 붙여넣으십시오. 텍스트로만 읽으며 아무것도 실행하지 않습니다. 자격 증명은 암호화된 저장소에 보관됩니다.',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: '가져오기',
        importada: '요청을 컬렉션으로 가져왔습니다',
        avisos: {
          opcion_ignorada: (d) => `무시한 옵션: ${d}`,
          archivo_ignorado: (d) => `디스크의 파일은 읽지 않습니다: ${d}`,
          inseguro_ignorado:
            '-k/--insecure를 무시했습니다. 필요하면 "인증서 오류 무시"를 직접 켜십시오.',
          comando_cortado: '셸 연산자(|, ;, &, >) 뒤의 내용은 무시했습니다.',
          sin_evaluar:
            '텍스트에 $(…), 백틱 또는 셸 변수가 있었습니다. 평가되지 않고 텍스트로 유지됩니다.',
          url_sin_esquema: 'URL에 스킴이 없어 http://를 사용했습니다.',
          varias_urls: (d) => `추가 인수를 무시했습니다: ${d}`,
          cabecera_invalida: (d) => `올바르지 않은 헤더를 무시했습니다: ${d}`,
          secretos_guardados:
            '가져온 자격 증명을 암호화하여 저장했습니다. 컬렉션에는 참조만 남습니다.',
        },
      },
      coleccion: {
        vacioTitulo: '컬렉션이 비어 있습니다',
        vacioTexto: '요청을 저장하거나 curl 명령을 가져와 가까이에 두십시오.',
        abrir: '열기',
        borrar: '삭제',
        borrada: '요청을 삭제했습니다',
      },
      historial: {
        vacioTitulo: '기록이 없습니다',
        vacioTexto:
          '최근 요청 100개가 자격 증명 없이 여기에 남습니다. 민감한 헤더는 ***로 표시됩니다.',
        abrir: '열기',
        limpiar: '기록 지우기',
        sinRespuesta: '응답 없음',
      },
      entornos: {
        vacioTitulo: '환경이 없습니다',
        vacioTexto:
          '환경은 {{base}} 또는 {{token}} 같은 변수를 정의합니다. 비밀로 표시한 변수는 암호화하여 저장됩니다.',
        nuevo: '새 환경',
        nombre: '환경 이름',
        variable: '변수',
        valor: '값',
        secreta: '비밀',
        agregar: '변수 추가',
        quitar: '변수 제거',
        guardar: '환경 저장',
        guardado: '환경을 저장했습니다',
        borrar: '환경 삭제',
        borrado: '환경을 삭제했습니다',
        usar: '이 환경 사용',
        activo: '사용 중',
        sinNombre: '환경 이름을 입력하십시오.',
      },
    },
    imagenes: { nombreCaptura: '스크린샷' },
  },
  doctor: {
    revisiones: {
      discos: '디스크 상태',
    },
    evidencias: {
      disco_modelo: '{modelo}(디스크 {numero})',
      disco_estado: 'Windows가 {estado} 상태를 보고했습니다.',
      disco_operacional: '작동 상태: {estado}.',
      disco_errores: '수정되지 않은 오류: 읽기 {lectura}건, 쓰기 {escritura}건.',
      disco_prediccion: '디스크가 고장을 예측하고 있습니다(SMART).',
      disco_desgaste: '마모도 {desgaste}%(기준: {umbral}%).',
      disco_temperatura: '온도 {temperatura} °C(한계: {limite} °C).',
      disco_corregidos: '수정된 읽기 오류가 늘었습니다(총 {cantidad}건).',
      texto: '{texto}',
      puerto_dueno: '포트 {puerto}: {proceso}(PID {pid})',
      puerto_dueno_exe: '포트 {puerto}: {proceso}(PID {pid}) — {ejecutable}',
      rango_reservado: '예약된 범위 {desde}-{hasta}({puerto} 포함)',
      ca_vencida: 'CA가 {dias}일 전에 만료되었습니다',
      ca_por_vencer: 'CA가 {dias}일 후에 만료됩니다',
      certificado_vencido: '{dominio}의 인증서가 {dias}일 전에 만료되었습니다',
      certificado_por_vencer: '{dominio}의 인증서가 {dias}일 후에 만료됩니다',
      firefox_perfiles: '신뢰가 설정되지 않은 Firefox 프로필:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil}(열려 있음)',
      firefox_perfil_fuera: '{perfil}(Firefox 폴더 밖)',
      hosts_ilegible: '{ruta}: 읽을 수 없습니다({motivo})',
      hosts_codificacion: '{ruta}: {codificacion} 인코딩',
      hosts_bloques: '{ruta}: WolfCore Dev 블록 {bloques}개',
      hosts_sin_cierre: '{ruta}: WolfCore Dev 블록에 닫는 표시가 없습니다',
      hosts_faltan: 'hosts에 없는 항목: {dominios}',
      hosts_solo_lectura: '{ruta}: 읽기 전용 특성',
      path_repetidas: '중복: {entradas}',
      path_delante:
        '{entrada}이(가) WolfCore Dev 도구보다 앞에 있으며 {programa}도 포함하고 있습니다',
      antivirus_sin_leer:
        '백신이 활성화되어 있습니다. 제외 항목을 읽을 수 없습니다(관리자 권한 필요).',
      antivirus_sin_exclusion:
        '백신이 활성화되어 있고 WolfCore Dev 데이터 폴더가 제외되어 있지 않습니다.',
      enlazador_ausente: 'Visual Studio Build Tools의 C++ 도구를 찾을 수 없습니다.',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022(x64)가 설치되어 있지 않습니다.',
      firewall_no_comprobado: '방화벽 규칙을 읽을 수 없습니다(관리자 권한이 필요할 수 있음).',
      firewall_reglas: 'WolfCore Dev: {propias} · WolfCore 테스트 잔여분: {pruebas}',
      firewall_acotadas: '로컬 네트워크로 제한된 규칙:',
      firewall_ajenas: '다른 프로그램의 규칙:',
      firewall_quitadas: '복원할 수 있는 삭제된 규칙:',
    },
    ver: '보기',
    verPuertos: '포트 보기',
    dialogo: {
      reglas: '영향받는 규칙: 건드리지 않으려는 규칙은 선택을 해제하십시오.',
      sinSeleccion: '계속하려면 규칙을 하나 이상 선택하십시오.',
      reglasNota:
        '확인과 관리자 권한 없이는 아무것도 변경되지 않습니다. 표시된 이후 변경된 규칙은 건너뜁니다.',
    },
    reparaciones: {
      firewall:
        '해당 인바운드 방화벽 규칙을 정확한 이름으로 하나씩 삭제합니다. 다시 만들 수 있도록 먼저 보호된 레지스트리 키 HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos에 사본을 저장합니다. 다른 프로그램의 규칙은 절대 건드리지 않습니다.',
      firewall_restaurar:
        '선택한 규칙을 보호된 사본(etc/의 파일이 아님)에서, 표시된 것과 같은 프로그램, 프로필, 프로토콜, 포트, 주소로 다시 만듭니다. 해당 프로그램이 다시 네트워크 연결을 받을 수 있게 됩니다.',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev는 JDK로 Maven을 직접 실행하며, 보안을 위해 .mvn/jvm.config 또는 MAVEN_OPTS 변수를 읽지 않습니다. 프로젝트에 필요하면 터미널에서 Maven을 실행하십시오.',
    avisoRuby:
      'Ruby는 Devkit(MSYS2) 없이 설치되며 PATH나 Windows 레지스트리를 건드리지 않습니다. 설치 프로그램은 없습니다. 미리 컴파일된 바이너리가 없는 네이티브 확장 gem에는 Devkit이 필요합니다. 이는 수동 단계입니다. 프로젝트에서 터미널을 열고 "ridk install"을 실행하십시오(컴퓨터에 MSYS2를 설치하며 인터넷에서 다운로드합니다).',
    avisoJdk:
      'Maven과 Gradle은 WolfCore Dev JDK로 실행되며 아직 설치되어 있지 않습니다. 서비스 목록에서 Java(Temurin)를 설치하십시오.',
    avisoMeilisearch:
      'Meilisearch는 마이너 버전마다 고유한 데이터를 가집니다. 다른 마이너 버전으로 전환하면(예: 1.58에서 1.59) 인덱스와 MEILISEARCH_KEY가 새로 만들어집니다. 다시 인덱싱하고 프로젝트의 .env를 업데이트해야 합니다.',
    servicios: { meilisearch: 'Meilisearch', ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    anteriores: (n) => `이전 패치(${n})`,
  },
  memoria: {
    etiqueta: '메모리 확보',
    tituloEtiqueta: 'RAM 메모리 확보',
    liberando: '확보하는 중…',
    niveles: {
      liviano: '가벼움',
      moderado: '보통',
      profundo: '깊음',
    },
    queHace: {
      liviano:
        'WolfCore Dev와 그 서비스의 작업 집합을 줄입니다. Windows가 필요할 때 다시 불러옵니다.',
      moderado:
        '위 내용에 더해, 열려 있는 비핵심 프로그램의 작업 집합도 줄입니다. Windows가 필요할 때 다시 불러옵니다. 어떤 프로그램도 닫지 않습니다.',
      profundo: '위 내용에 더해, Windows의 파일 캐시와 대기 목록을 비웁니다.',
    },
    requiereAdmin: '관리자 권한 승인 필요',
    calculando: '계산하는 중…',
    noDisponible: '사용할 수 없음',
    sugerencia:
      '단계 위에 마우스를 올리거나 포커스를 두면 수행 내용과 확보할 수 있는 양을 볼 수 있습니다.',
    liberaria: (cantidad: string) => `확보 예상량 ≈ ${cantidad}`,
    liberariaHasta: (cantidad: string) => `최대 ≈ ${cantidad} 확보 가능`,
    procesosCifra: (cantidad: string) => `프로세스에서 ≈ ${cantidad}`,
    procesosCifraHasta: (cantidad: string) => `프로세스에서 최대 ≈ ${cantidad}`,
    listaEsperaCifra: (cantidad: string) => `대기 목록(${cantidad})이 여유 메모리가 됩니다`,
    avisoPantallaTitulo: '전체 화면이 감지되었습니다',
    avisoPantalla:
      '게임 또는 앱이 전체 화면으로 실행 중입니다. 메모리를 확보하면 끊김이 생길 수 있습니다.',
    notaEstimacion:
      '현재 메모리를 기준으로 한 추정치이며 실제 값은 다를 수 있습니다. 프로그램은 닫히지 않으며 아무것도 손실되지 않습니다.',
    notaProfundo:
      '다음에 사용할 때 프로그램이 필요한 항목을 다시 불러오느라 응답이 잠시 느려질 수 있습니다.',
    profundoTitulo: '깊음 모드로 메모리 확보',
    profundoTexto:
      '프로세스 메모리, 대기 목록, Windows 파일 캐시를 비웁니다. 프로그램은 닫히지 않으며 아무것도 손실되지 않습니다.',
    confirmarUac:
      'Windows에서 관리자 권한 창(UAC)이 표시되며, 계속하려면 승인하셔야 합니다. 취소하시면 프로세스만 비워집니다.',
    continuar: '계속',
    cancelar: '취소',
    aumentoTitulo: '지금 측정한 증가량',
    nivelAplicado: (nivel: string) => `적용된 단계: ${nivel}.`,
    antes: '이전 사용 가능 메모리',
    despues: '이후 사용 가능 메모리',
    aumentoDisponible: '사용 가능 메모리 증가량',
    aumentoLibre: '여유 메모리 증가량',
    procesos: (vaciados: number, omitidos: number) =>
      `비운 프로세스: ${vaciados}. 건너뜀: ${omitidos}.`,
    purga: {
      hecha: '대기 목록과 파일 캐시를 비웠습니다.',
      cancelada: '관리자 권한 승인이 취소되었습니다. 프로세스만 비웠습니다.',
      tiempo: '관리자 권한 승인에 제때 응답하지 않았습니다. 프로세스만 비웠습니다.',
      sinCache: '대기 목록은 비웠지만 Windows가 파일 캐시를 비우지 못했습니다.',
      error: '대기 목록을 비우지 못했습니다. 프로세스만 비웠습니다.',
    },
    notaResultado:
      '“사용 가능”은 여유 메모리에 Windows 대기 목록을 더한 값입니다. 지금 측정한 값이며, Windows가 이 메모리를 곧바로 다시 사용하므로 다른 프로그램이 요청하면 다시 줄어들 수 있습니다.',
    cerrar: '닫기',
  },
  guias: {
    tuneles: { titulo: '터널 가이드', copiar: '명령 복사' },
    http: {
      buscar: '번호, 이름 또는 텍스트로 검색',
      familia: '분류',
      todas: '전체',
      verMetodos: '메서드',
      verCodigos: '상태 코드',
      resultados: (n) => `결과 ${n}개`,
      vacio: '검색과 일치하는 항목이 없습니다.',
      seguro: '안전',
      noSeguro: '안전하지 않음',
      idempotente: '멱등',
      noIdempotente: '멱등 아님',
      noEstandar: '비표준',
      broma: '농담 코드(RFC 2324)',
      causas: '일반적인 원인',
      solucion: '해결 방법',
      ejemplo: '예제',
      copiarEjemplo: '예제 복사',
      probar: '시험해 보기',
      probarTitulo:
        'HTTP 클라이언트에서 이 예제를 시험해 보기(보내기를 누르기 전에는 아무것도 전송되지 않습니다)',
      servidorActivo: (puerto) =>
        `가이드나 HTTP 클라이언트를 사용하는 동안 예제 서버가 127.0.0.1:${puerto}에서 실행됩니다. 이 컴퓨터에서만 접근할 수 있으며, 화면을 벗어나거나 10분간 사용하지 않으면 중지됩니다.`,
      sinTraduccion: '이 언어로 번역되지 않았습니다. 영어로 표시됩니다.',
      familias: {
        '1xx': '1xx 정보 응답',
        '2xx': '2xx 성공',
        '3xx': '3xx 리디렉션',
        '4xx': '4xx 클라이언트 오류',
        '5xx': '5xx 서버 오류',
      },
    },
    git: {
      buscar: '주제 또는 명령 검색',
      verGuia: '가이드',
      verLaboratorio: '실습',
      todos: '전체',
      grupos: {
        basico: '기본',
        ramas: '브랜치',
        deshacer: '되돌리기',
        remotos: '원격 저장소와 태그',
        github: 'GitHub',
      },
      resultados: (n) => `주제 ${n}개`,
      vacio: '검색과 일치하는 항목이 없습니다.',
      ejemplo: '예제',
      errores: '흔한 실수',
      copiarEjemplo: '예제 복사',
      peligroso: '위험',
      sinTraduccion: '이 언어로 번역되지 않았습니다. 영어로 표시됩니다.',
      avisoGithub:
        '이 부분은 설명일 뿐입니다. WolfCore Dev는 이 가이드에서 계정을 만들거나 GitHub에 로그인하거나 토큰을 사용하지 않습니다. 예제의 이름과 값은 가상의 것입니다.',
      irLaboratorio: '실습에서 연습하기',
      lab: {
        intro:
          'WolfCore Dev의 폴더 안에 연습용 저장소와 로컬 "원격 저장소"를 만듭니다. 인터넷이나 GitHub를 사용하지 않으며, 프로젝트나 git 설정을 건드리지 않습니다.',
        sinGit: {
          titulo: 'Git이 설치되어 있지 않습니다',
          texto:
            '실습은 시스템의 git을 사용하므로 git이 없으면 열 수 없습니다. Git을 설치한 후 이 탭을 다시 여십시오. WolfCore Dev가 대신 설치하지는 않습니다.',
        },
        cargando: '실습을 준비하는 중…',
        reiniciar: '실습 초기화',
        reiniciarAyuda: '연습 폴더만 삭제하고 새것처럼 되돌립니다.',
        reiniciado: '실습을 초기화했습니다.',
        version: (v) => `git ${v}`,
        ordenes: '명령',
        mensaje: '커밋 메시지',
        mensajePorDefecto: '연습용 변경',
        rama: '브랜치',
        etiqueta: '태그',
        archivo: '파일',
        grupos: {
          basico: '기본',
          ramas: '브랜치',
          guardar: '저장과 되돌리기',
          remoto: '로컬 원격 저장소',
        },
        archivos: {
          titulo: '연습용 파일',
          ayuda: '이 파일만 편집할 수 있으며, 텍스트는 2000자까지입니다.',
          guardar: '파일 저장',
          guardado: '파일을 저장했습니다.',
          areaTexto: (n) => `${n}의 내용`,
        },
        salida: '출력',
        salidaVacia: '명령을 누르면 git의 응답이 여기에 표시됩니다.',
        codigo: (n) => (n === 0 ? '정상적으로 끝났습니다' : `코드 ${n}(으)로 끝났습니다`),
        truncada: '출력이 잘렸습니다.',
        historial: '기록',
        historialVacio: '아직 커밋이 없습니다. git init, git add, git commit을 실행하십시오.',
        conflicto: {
          titulo: '안내 실습: 충돌',
          intro:
            '두 브랜치가 같은 줄을 변경합니다. 충돌이 어떻게 나타나고 어떻게 해결하는지 확인합니다.',
          paso: (n, total) => `${total}단계 중 ${n}단계`,
          ejecutar: '이 단계 실행',
          hecho: '완료',
          reempezar: '처음부터 다시',
          esperado: 'Git이 충돌을 알렸습니다. 이 단계에서는 예상된 결과입니다.',
          elegir: {
            mia: 'main의 것을 유지(녹색)',
            otra: 'rama-a의 것을 유지(빨간색)',
            ambas: '둘 다 유지',
          },
          final: '완료: 충돌을 해결했습니다. 기록을 확인해 보십시오.',
          pasos: [
            {
              titulo: '실습 준비',
              texto: '실습을 초기화하고 colores.txt("color: azul")로 첫 커밋을 만듭니다.',
            },
            {
              titulo: 'rama-a에서 줄 변경',
              texto: 'rama-a 브랜치를 만들고 줄을 "color: rojo"로 바꾼 뒤 커밋합니다.',
            },
            {
              titulo: 'main에서 같은 줄 변경',
              texto: 'main으로 돌아가 줄을 "color: verde"로 바꾼 뒤 커밋합니다.',
            },
            {
              titulo: '병합 시도',
              texto:
                'rama-a를 main에 병합합니다. Git은 어느 줄을 유지해야 할지 알 수 없어 충돌을 남깁니다.',
            },
            {
              titulo: '버전 선택',
              texto:
                '줄의 어느 버전을 유지할지 선택합니다. 이제 colores.txt에 충돌 표시가 들어 있습니다.',
            },
            {
              titulo: '해결 확인',
              texto: 'colores.txt를 스테이징(add)하고 병합을 마무리하는 커밋을 만듭니다.',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `최대 ${mb} MB의 텍스트 파일을 구문 강조와 함께 편집하는 가벼운 편집기입니다. 파일은 시스템 대화 상자에서 선택하며, 저장할 때는 항상 확인을 요청하고 먼저 WolfCore Dev 데이터 폴더에 사본을 남깁니다.`,
    abrir: '파일 열기…',
    abriendo: '여는 중…',
    guardar: '저장',
    guardando: '저장하는 중…',
    recargar: '디스크에서 다시 불러오기',
    vacio: '파일을 열면 편집을 시작할 수 있습니다.',
    sinCambios: '변경 사항 없음',
    conCambios: '저장되지 않은 변경 사항',
    posicion: (linea, columna) => `${linea}행 ${columna}열`,
    areaTexto: (nombre) => `코드 편집기: ${nombre}`,
    salirTeclado: '키보드로 편집기를 벗어나려면 Esc를 누른 다음 Tab을 누르십시오.',
    guardado: '파일을 저장했습니다.',
    copiaPrevia: (ruta) => `백업 사본: ${ruta}`,
    cancelar: '취소',
    enlaceDuro:
      '이 파일은 디스크에서 이름이 둘 이상입니다(하드 링크). 저장하면 해당 링크가 끊어지고, 다른 이름에는 이전 내용이 남습니다.',
    saltosMixtos: {
      aviso: '이 파일에는 줄 끝 문자가 섞여 있습니다. 저장하면 모두 LF로 통일됩니다.',
      aceptar: '줄 끝 문자를 통일하는 것에 동의합니다',
    },
    envGestor: {
      aviso:
        '.env 파일은 비밀 처리 절차가 있는 프로젝트 변수에서 편집합니다. 이 버튼은 프로젝트 루트의 .env를 여는데, 열려고 했던 파일과 다를 수 있습니다.',
      boton: '프로젝트 루트의 .env 열기',
    },
    huellaPerdida: '저장했지만 새 지문을 읽을 수 없어 파일을 다시 불러왔습니다.',
    confirmarGuardar: {
      titulo: '변경 사항 저장',
      texto: (nombre) =>
        `${nombre}을(를) 기록하려고 합니다. 먼저 디스크에 있는 현재 내용의 사본을 WolfCore Dev 데이터 폴더에 저장합니다.`,
      boton: '백업 사본을 만들고 저장',
    },
    refuerzo: {
      abrirTitulo: '민감한 파일',
      guardarTitulo: '민감한 파일 저장',
      secreto:
        '이 파일에는 비밀(개인 키, 토큰 또는 자격 증명)이 들어 있는 것으로 보입니다. 내용이 화면에 표시됩니다.',
      datosReales:
        '이 파일은 실제 데이터가 있다고 표시된 사이트에 속합니다. 잘못 변경하면 실제 정보에 영향을 줄 수 있습니다.',
      instruccion: (nombre) => `계속하려면 파일 이름을 입력하십시오: ${nombre}`,
      etiqueta: '파일 이름',
      abrirBoton: '그래도 열기',
      guardarBoton: '그래도 저장',
    },
    cambioExterno: {
      titulo: '파일이 편집기 밖에서 변경되었습니다',
      texto:
        '파일을 연 이후 다른 프로그램이 수정했으므로 아무것도 저장하지 않았습니다. 다시 불러오거나(변경 사항이 사라집니다) 여기 있는 내용으로 덮어쓸 수 있습니다.',
      recargar: '다시 불러오고 내 변경 사항 취소',
      sobrescribir: '덮어쓰기…',
      sobrescribirTitulo: '파일 덮어쓰기',
      sobrescribirTexto:
        '다른 프로그램이 한 변경 사항이 사라집니다. 현재 내용은 백업 사본에 남습니다.',
      sobrescribirBoton: '예, 덮어쓰기',
      volver: '돌아가기',
    },
    descartar: {
      titulo: '저장되지 않은 변경 사항',
      texto: '편집기에 저장되지 않은 변경 사항이 있습니다. 계속하면 사라집니다.',
      confirmar: '변경 사항 취소',
      seguir: '계속 편집',
    },
    cm: {
      'Control character': '제어 문자',
      'Selection deleted': '선택 영역이 삭제되었습니다',
      'Go to line': '줄로 이동',
      go: '이동',
      Find: '찾기',
      Replace: '바꾸기',
      next: '다음',
      previous: '이전',
      all: '모두',
      'match case': '대/소문자 구분',
      regexp: '정규식',
      'by word': '단어 단위',
      replace: '바꾸기',
      'replace all': '모두 바꾸기',
      close: '닫기',
      'current match': '현재 일치 항목',
      'on line': '줄',
      'replaced match on line $': '$번째 줄의 일치 항목을 바꿨습니다',
      'replaced $ matches': '일치 항목 $개를 바꿨습니다',
      'folded code': '접힌 코드',
      unfold: '펼치기',
      to: '~',
    },
  },
  limpiezaDisco: {
    intro:
      '먼저 각 항목이 차지하는 크기를 분석하여 보여 줍니다. 확인하기 전에는 아무것도 삭제하지 않으며, 자동으로 또는 백그라운드에서 실행되지도 않습니다.',
    analizar: '분석',
    analizando: '분석하는 중…',
    cancelarAnalisis: '취소',
    vacio: '정리할 항목이 없습니다.',
    categorias: {
      temp: {
        nombre: '임시 파일',
        ayuda: 'TEMP 폴더에서 24시간이 지난 파일입니다. 영구 삭제되며 저절로 다시 생성됩니다.',
      },
      'cache-chrome': {
        nombre: 'Google Chrome 캐시',
        ayuda: '각 프로필의 캐시 폴더만 해당하며, 쿠키, 비밀번호, 기록은 건드리지 않습니다.',
      },
      'cache-edge': {
        nombre: 'Microsoft Edge 캐시',
        ayuda: '각 프로필의 캐시 폴더만 해당하며, 쿠키, 비밀번호, 기록은 건드리지 않습니다.',
      },
      'cache-brave': {
        nombre: 'Brave 캐시',
        ayuda: '각 프로필의 캐시 폴더만 해당하며, 쿠키, 비밀번호, 기록은 건드리지 않습니다.',
      },
      'cache-firefox': {
        nombre: 'Firefox 캐시',
        ayuda: '각 프로필의 cache2 폴더만 해당하며, 쿠키, 비밀번호, 기록은 건드리지 않습니다.',
      },
      'wolfcore-descargas': {
        nombre: 'WolfCore Dev 다운로드 캐시',
        ayuda: '더 이상 사용하지 않는 개별 압축 파일입니다. 휴지통으로 이동합니다.',
      },
      'wolfcore-registros': {
        nombre: 'WolfCore Dev 로그',
        ayuda: '30일이 지난 로그입니다. 휴지통으로 이동합니다.',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          '선택 사항입니다. Windows가 다시 생성하지만 WolfCore Dev를 관리자 권한으로 실행해야 합니다.',
      },
    },
    bloqueos: {
      'navegador-abierto':
        '브라우저가 열려 있거나 백그라운드에서 실행 중입니다. 캐시를 정리하려면 완전히 종료하십시오(Edge에서는 시작 부스트와 백그라운드 확장 프로그램도 끄십시오)',
      'requiere-admin': 'WolfCore Dev를 관리자 권한으로 실행해야 합니다',
      'ruta-vetada': '보호된 경로이므로 정리하지 않습니다',
      'temp-no-seguro':
        'TEMP 변수가 사용자 임시 폴더가 아닌 폴더(문서, 드라이브 전체, 네트워크 경로 등)를 가리키므로 정리하지 않습니다',
    },
    borradoDefinitivo: '영구 삭제됩니다(저절로 다시 생성됩니다)',
    borradoPapelera: '시스템 휴지통으로 이동합니다',
    archivos: (n) => `파일 ${n}개`,
    carpetas: '폴더별',
    truncado: '분석이 파일 수 한도에서 중단되었습니다. 표시된 것보다 더 많이 있습니다.',
    marcadas: (n, t) => `범주 ${t}개 중 ${n}개 선택됨`,
    total: (b) => `약 ${b}이(가) 확보됩니다`,
    limpiar: '선택 항목 정리',
    confirmarTitulo: '이 범주를 정리하시겠습니까?',
    confirmarTexto: (n) => `범주 ${n}개를 정리합니다.`,
    confirmarDefinitivo: 'TEMP와 캐시는 영구 삭제됩니다(저절로 다시 생성됩니다).',
    confirmarPapelera: 'WolfCore Dev 로그와 다운로드는 휴지통으로 이동합니다.',
    confirmarPrefetch:
      'Prefetch: Windows가 다시 생성하지만, 처음 몇 번은 프로그램 실행이 조금 느려질 수 있습니다.',
    confirmar: '예, 정리',
    cancelar: '취소',
    detener: '정리 중지',
    resultadoTitulo: '결과',
    liberado: (b) => `확보됨: ${b}`,
    enPapelera: (b) => `이 중 ${b}은(는) 휴지통에 있습니다(휴지통을 비우면 공간이 반환됩니다).`,
    saltados: (n) => `파일 ${n}개를 건너뛰었습니다`,
    cancelado: '정리가 취소되었습니다. 이미 삭제된 항목은 복구되지 않습니다.',
    topeEjecucion: '1회 실행당 파일 수 한도에 도달했습니다. 계속하려면 다시 분석하고 정리하십시오.',
    registroFallido:
      '정리 로그에 더 이상 기록할 수 없어 정리를 중단했습니다. 삭제된 항목은 그 시점까지 로그에 기록되어 있습니다.',
    motivos: {
      'en-uso': '사용 중',
      enlace: '링크 또는 재분석 지점(따라가지 않음)',
      protegido: '보호됨(.env, FlyEnv 등)',
      cambio: '분석 이후 변경됨',
      'sin-papelera': '사용할 수 있는 휴지통이 없음',
      ilegible: '읽을 수 없음',
      error: '삭제 중 오류',
    },
    verRegistros: '로그 보기',
    registroEn: (r) => `이번 정리의 로그: ${r}`,
    otraVez: '처음부터 다시',
    protegidas:
      '데이터, 백업, 프로젝트, 데이터베이스, .env 파일은 절대 건드리지 않습니다. 링크를 따라가지 않으며, 이 목록의 경로 밖은 건드리지 않습니다.',
  },
  preferencias: {
    asistente: '시작 투어',
    asistenteAyuda: '주요 화면(서비스, 프로젝트, 데이터베이스, 도구, Doctor)의 투어를 다시 봅니다.',
    asistenteAbrir: '투어 보기',
    avanzadas: '고급 섹션 표시',
    avanzadasAyuda:
      '컨테이너처럼 자주 쓰지 않는 화면을 사이드바에 추가합니다. Ctrl+K로도 열 수 있습니다.',
    animacionInicio: '시작 애니메이션',
    animacionInicioAyuda:
      '앱을 열 때 로고를 빛나는 선으로 그립니다. 클릭하거나 Esc를 누르면 건너뜁니다. Windows에서 동작 줄이기를 요청한 경우에는 짧은 페이드만 표시됩니다.',
  },
  paleta: {
    irAServicio: (nombre) => `${nombre} 서비스로 이동`,
    irAProyecto: (nombre) => `${nombre} 프로젝트로 이동`,
    versionesDe: (nombre) => `${nombre} 버전`,
    asistente: '시작 투어 보기',
  },
  env: { bloques: { meilisearch: 'Meilisearch(키 포함)' } },
  estadosVacios: {
    basesSinMotor: {
      titulo: '아직 데이터베이스 엔진이 없습니다',
      texto:
        '서비스에서 MySQL, MariaDB, PostgreSQL 또는 MongoDB를 설치하면 프로젝트의 데이터베이스를 만들고 관리할 수 있습니다.',
      accion: '서비스로 이동',
    },
    serviciosVacio: {
      titulo: '설치된 서비스가 없습니다',
      texto:
        '서비스(Nginx, PHP, 데이터베이스 등)가 사이트를 실행하게 해 줍니다. Nginx와 PHP 또는 데이터베이스부터 시작하십시오.',
      accion: '서비스 설치',
    },
    registrosSinFuentes: {
      titulo: '아직 로그가 없습니다',
      texto:
        '서비스, 사이트 또는 프로세스가 첫 줄을 기록하는 즉시 로그가 나타납니다. 서비스를 켜고 다시 오십시오.',
      accion: '서비스로 이동',
    },
    registrosElegir: {
      titulo: '로그 선택',
      texto: '위의 선택기에서 소스를 선택하면 해당 내용을 실시간으로 따라갈 수 있습니다.',
      accion: '',
    },
    depuracionVacio: {
      titulo: '아직 도착한 덤프가 없습니다',
      texto:
        '사이트에서 dump(), dd() 또는 wd()가 실행되면 덤프가 즉시 여기에 표시됩니다. 사이트를 열고 해당 코드를 실행하십시오.',
      accion: '',
    },
    depuracionApagado: {
      titulo: '캡처가 꺼져 있습니다',
      texto:
        '캡처를 켜면 사이트의 dump() 및 dd() 호출이 브라우저를 거치지 않고 여기로 전달됩니다. 캡처를 켜고 사이트를 시작하십시오.',
      accion: '캡처 켜기',
    },
    depuracionElegir: {
      titulo: '덤프 선택',
      texto: '목록에서 덤프를 선택하면 내용, 파일, 원본 URL을 볼 수 있습니다.',
      accion: '',
    },
    erroresVacio: {
      titulo: '로그에 오류가 없습니다',
      texto:
        'PHP, Nginx, 프로젝트의 오류는 기록되는 즉시 그룹으로 묶여 여기에 표시됩니다. 목록이 비어 있으면 좋은 소식입니다.',
      accion: '',
    },
    erroresElegir: {
      titulo: '오류 선택',
      texto: '목록에서 오류를 선택하면 스택 트레이스를 보고 편집기에서 파일을 열 수 있습니다.',
      accion: '',
    },
    doctorSinRevision: {
      titulo: '아직 실행한 검사가 없습니다',
      texto:
        'Doctor는 포트, hosts, 인증서, 버전을 검사하고 문제를 해결하는 방법을 알려 줍니다. 첫 검사를 실행하십시오.',
      accion: '지금 검사',
    },
    doctorSinHallazgos: {
      titulo: '모두 정상입니다',
      texto:
        '마지막 검사에서 문제가 발견되지 않았습니다. 응답하지 않는 항목이 있으면 다시 검사하십시오.',
      accion: '다시 검사',
    },
    contenedoresVacio: {
      titulo: '컨테이너가 없습니다',
      texto:
        '이 컴퓨터의 Docker 또는 Podman 컨테이너가 여기에 표시됩니다. docker run 또는 docker compose로 만든 후 새로 고침을 누르십시오.',
      accion: '새로 고침',
    },
    avisos: {
      titulo: '알림이 없습니다',
      texto: '서비스 중단, 사용 중인 포트, 만료가 임박한 인증서 등이 여기에 표시됩니다.',
      accion: '',
    },
    instantaneas: {
      titulo: '아직 스냅샷이 없습니다',
      texto:
        '스냅샷은 이 데이터베이스의 상태를 저장하여 문제가 생겼을 때 되돌릴 수 있게 합니다. 위의 버튼으로 첫 스냅샷을 만드십시오.',
      accion: '',
    },
    basesSinBases: {
      titulo: '이 서버에는 자체 데이터베이스가 없습니다',
      texto: '프로젝트용 데이터베이스를 만들거나 기존 덤프를 가져오십시오.',
      accion: '데이터베이스 만들기',
    },
    iaNube: {
      titulo: '아직 AI 공급자가 없습니다',
      texto:
        '공급자(OpenAI, Anthropic, OpenRouter 등)를 추가하면 에이전트가 클라우드 모델을 사용할 수 있습니다. 키는 이 컴퓨터에 암호화되어 저장됩니다.',
      accion: '공급자 추가',
    },
    iaSinModelos: {
      titulo: '아직 로컬 모델이 없습니다',
      texto: '아래 목록에서 모델을 다운로드하면 오프라인으로 사용할 수 있습니다.',
      accion: '',
    },
    versiones: {
      titulo: '표시할 버전이 없습니다',
      texto: '목록은 공식 카탈로그에서 다운로드됩니다. 연결을 확인하고 목록을 새로 고치십시오.',
      accion: '목록 새로 고침',
    },
    buscar: {
      titulo: '일치하는 항목이 없습니다',
      texto:
        '폴더에 검색과 일치하는 항목이 없습니다. 다른 단어를 시도하거나, "대/소문자 구분"의 선택을 해제하거나, 파일 필터를 확인하십시오.',
      accion: '',
    },
  },
  asistenteInicio: {
    animacionNota: '앱을 열 때 로고 애니메이션이 필요하지 않으시면 설정 › 모양에서 끄십시오.',
    titulo: '시작 투어',
    saltar: '건너뛰기',
    terminar: '시작하기',
    cerrar: '투어 닫기',
    reabrir: 'Esc를 누르면 나갑니다. 설정 › 모양에서 다시 볼 수 있습니다.',
    ir: (destino) => `${destino}(으)로 이동`,
    pasos: {
      bienvenida: {
        titulo: 'WolfCore Dev에 오신 것을 환영합니다',
        texto:
          '로컬 개발 환경을 하나의 창에 모았습니다. 서비스, HTTPS를 지원하는 .test 사이트, 데이터베이스, 메일, 도구를 다룰 수 있습니다. 이 투어는 1분 정도 걸리며 컴퓨터에는 아무것도 변경하지 않습니다.',
      },
      servicios: {
        titulo: '서비스',
        texto:
          '여기에서 스위치로 Nginx, PHP, 데이터베이스를 켭니다. 아직 설치되어 있지 않으면 버전 탭에서 체크섬을 검증하며 다운로드합니다.',
      },
      proyectos: {
        titulo: '프로젝트',
        texto:
          '새 프로젝트를 만들거나 폴더 또는 저장소를 가져옵니다. 각 사이트는 HTTPS를 지원하는 고유한 .test 주소를 받습니다.',
      },
      bases: {
        titulo: '데이터베이스',
        texto:
          '데이터베이스를 만들고, 덤프를 가져오고 내보내고, 앱을 벗어나지 않고 백업하고 복원합니다.',
      },
      herramientas: {
        titulo: '도구와 Ctrl+K',
        texto:
          '편집기, 검색, 비교, 비밀번호, 이미지 등을 섹션별로 모았습니다. 어느 화면에서든 Ctrl+K를 누르면 필요한 곳으로 바로 이동합니다.',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          '포트, hosts, 인증서, 버전을 검사하고 문제를 해결하는 방법을 제안합니다. 응답하지 않는 항목이 있을 때 여십시오.',
      },
      listo: {
        titulo: '준비 완료',
        texto:
          '서비스를 켜거나 첫 프로젝트를 만들어 시작하십시오. 이 투어는 설정 › 모양에서 다시 볼 수 있습니다.',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: { sustituida: (v) => `카탈로그에 더 이상 없으므로 대신 ${v}을(를) 설치합니다.` },
      resultado: { sustituida: (v) => `프로필의 버전 대신 ${v}을(를) 설치했습니다.` },
    },
    motivos: {
      version_sustituida:
        '해당 버전이 더 이상 카탈로그에 없어, 같은 마이너 버전(예: 8.3)의 최신 버전을 설치했습니다.',
    },
  },
  consultasLentas: {
    boton: '느린 쿼리',
    titulo: (motor) => `${motor}의 느린 쿼리`,
    descripcion: '선택한 시간보다 오래 걸린 쿼리를 느린 순서대로 보여 줍니다.',
    cargando: '느린 쿼리를 불러오는 중…',
    estadoTitulo: '로그 상태',
    estadoActivo: (s) => `로그 기록이 켜져 있습니다. ${s}초를 넘는 쿼리를 기록합니다.`,
    estadoApagado: '로그 기록이 꺼져 있습니다.',
    noGestionada:
      'WolfCore Dev가 관리하지 않는 서버입니다(예: 다른 프로그램이 시작한 서버). 여기서는 볼 수만 있고 변경할 수 없습니다.',
    umbral: '기록할 쿼리 시간(초)',
    activar: '로그 기록 켜기',
    aplicarUmbral: '시간 변경',
    desactivar: '로그 기록 끄기',
    actualizar: '로그 다시 읽기',
    confirmarTitulo: '느린 쿼리 로그 변경',
    confirmarActivar: (motor, s) =>
      `${motor} 서버 전체에서 로그 기록을 켜고(${s}초를 넘는 쿼리) 설정에 저장합니다. 서버의 모든 데이터베이스에 영향을 줍니다.`,
    confirmarDesactivar: (motor) =>
      `${motor} 서버 전체에서 로그 기록을 끄고 설정에 저장합니다. 이미 기록된 내용은 유지됩니다.`,
    confirmarBoton: '변경 확인',
    cancelar: '취소',
    activado: '느린 쿼리 로그 기록을 켰습니다',
    desactivado: '느린 쿼리 로그 기록을 껐습니다',
    privacidad:
      'SQL은 실제 고객 데이터가 들어 있을 수 있으므로 값을 "?"로 바꾸어 표시합니다. 이 내용은 이 컴퓨터 밖으로 나가지 않으며 애플리케이션 로그에도 기록되지 않습니다.',
    columnas: {
      duracion: '소요 시간',
      filas: '검사한 행',
      base: '데이터베이스',
      fecha: '날짜',
      sql: '쿼리',
      acciones: '작업',
    },
    sinBase: '연결되지 않음',
    verLiteral: '리터럴 표시',
    ocultarLiteral: '리터럴 숨기기',
    literalAviso: '값이 포함된 원본 SQL',
    sqlOculto: 'SQL 숨김',
    sqlOcultoAyuda:
      '실제 데이터를 위험에 빠뜨리지 않고는 이 쿼리를 표시할 수 없습니다. 이 서버에 실제 데이터가 있는 데이터베이스가 있거나 쿼리를 데이터베이스에 안전하게 연결할 수 없습니다.',
    copiar: '복사',
    copiado: '쿼리를 복사했습니다',
    truncado: (n) => `로그 끝부분(마지막 5 MB)에서 가장 느린 쿼리를 최대 ${n}개까지 표시합니다.`,
    vacioTitulo: '아직 기록된 느린 쿼리가 없습니다',
    vacioTextoApagado:
      '로그 기록을 켜고 사이트를 사용하면 선택한 시간보다 오래 걸린 쿼리가 여기에 표시됩니다.',
    vacioTextoActivo:
      '지금까지 선택한 시간을 넘은 쿼리가 없습니다. 사이트를 사용한 후 로그를 다시 읽으십시오.',
  },
  esquemaBd: {
    boton: '스키마 보기',
    titulo: (base) => `${base}의 스키마`,
    descripcion: '읽기 전용: 테이블, 열, 키, 관계를 보여 줍니다. 테이블의 데이터는 읽지 않습니다.',
    cargando: '스키마를 읽는 중…',
    error: '데이터베이스 스키마를 읽을 수 없습니다.',
    reintentar: '다시 시도',
    buscar: '테이블 검색',
    tablas: (n) => `테이블 ${n}개`,
    vista: '뷰',
    truncado: (n) => `목록을 테이블 ${n}개로 줄였습니다. 데이터베이스에는 더 있습니다.`,
    sinResultados: '검색과 일치하는 테이블이 없습니다.',
    elegir: '목록에서 테이블을 선택하면 열, 키, 관계를 볼 수 있습니다.',
    columnas: '열',
    indices: '인덱스',
    sinIndices: '이 테이블에는 인덱스가 없습니다.',
    relaciones: '관계',
    sinRelaciones: '이 테이블에는 다른 테이블과의 관계가 없습니다.',
    salientes: '참조함',
    entrantes: '참조됨',
    alBorrar: '삭제 시:',
    alActualizar: '업데이트 시:',
    irA: (tabla) => `${tabla} 테이블로 이동`,
    col: { nombre: '열', tipo: '유형', nulo: 'NULL 허용', defecto: '기본값', clave: '키' },
    si: '예',
    no: '아니요',
    pk: 'PK',
    unico: '고유',
    vacioTitulo: '이 데이터베이스에는 테이블이 없습니다',
    vacioTexto: '테이블을 만들면(예: 프로젝트 마이그레이션으로) 여기에 표시됩니다.',
  },
  asistentes: {
    pestana: '어시스턴트 연결',
    explicacion:
      '연결하면 고객님의 AI 어시스턴트(Claude, Codex 등)가 WolfCore Dev 서비스를 확인하고 관리할 수 있습니다. 중요한 작업은 항상 고객님의 확인을 요청합니다.',
    alcance:
      'WolfCore Dev는 각 프로그램의 설정에 자체 항목인 "wolfcore"만 추가하거나 제거하며, 먼저 날짜가 표시된 사본을 저장하고 토큰을 해당 파일에 절대 기록하지 않습니다.',
    notaVariable:
      '작동하려면 WolfCore Dev에서 어시스턴트를 실행해 주십시오(AI › 에이전트 › "프로젝트에서 열기").',
    recargar: '다시 감지',
    conectado: '연결됨: WolfCore Dev(AI › 에이전트)에서 실행해 주십시오',
    conectadoAppGrafica: '연결될 수 있도록 WolfCore Dev(AI › 에이전트)에서 실행해 주십시오',
    noSePudoLeer: '읽을 수 없음',
    instalado: '설치됨, 연결되지 않음',
    noInstalado: '설치되지 않음',
    noCompatible: '아직 지원되지 않음',
    motivoLocales:
      '토큰을 평문으로 저장해야 하므로 지원하지 않습니다. 안전한 연결 방식이 준비되면 지원할 예정입니다.',
    motivoAppGrafica:
      '그래픽 애플리케이션이며 AI › 에이전트에서 아직 토큰과 함께 실행할 수 없습니다. 가능해질 때까지 "연결"은 비활성화됩니다.',
    motivoIlegible: {
      invalido:
        '설정이 올바르지 않아 WolfCore Dev는 건드리지 않습니다. 수정하거나 복사본에서 복원해 주십시오.',
      demasiado_grande:
        '파일이 5 MB를 넘고 설정 파일로 보이지 않아 WolfCore Dev는 건드리지 않습니다.',
      sin_acceso: '파일을 열 수 없습니다(권한이 없거나 일반 파일이 아닙니다).',
    },
    conectar: '연결',
    quitar: '제거',
    copiar: '설정 복사',
    carpeta: '설정 폴더 열기',
    archivo: '설정 파일',
    cambios: '파일에서 다음 내용이 바뀝니다.',
    omitidas: (n: number) => `… 변경 없는 ${n}줄 …`,
    titulo: (n: string) => `${n} 연결`,
    tituloQuitar: (n: string) => `${n} 연결 제거`,
    aceptarConectar: '연결',
    aceptarQuitar: '연결 제거',
    preparando: '미리 보기를 준비하고 있습니다…',
    archivoNuevo: '파일이 아직 없습니다. 새로 만들어집니다.',
    sinCambios: '바꿀 내용이 없습니다. 이미 이 상태입니다.',
    copiaPrevia: '기록하기 전에 날짜가 표시된 사본을 파일 옆에 저장합니다(최근 5개를 보관합니다).',
    comentarios:
      '주의: "wolfcore" 항목 안의 주석이 사라집니다. 파일의 나머지 부분은 바뀌지 않습니다.',
    finalesMezclados:
      '주의: 파일에 줄 바꿈 형식(CRLF와 LF)이 섞여 있으며, 파일 전체를 다시 쓰면 하나로 통일됩니다.',
    hConectado: (n: string) => `${n}을(를) 연결했습니다.`,
    hQuitado: (n: string) => `${n}의 연결을 제거했습니다.`,
    hSinCambios: '바뀐 내용이 없습니다.',
    hCopia: (n: string) => `사본을 저장했습니다: ${n}`,
    hTokenEscrito:
      '파일에 토큰이 평문으로 기록되어 있었습니다. 사본에서는 가려지고 파일에서는 삭제되었습니다.',
    hTokenSigue: (donde: string) =>
      `토큰이 파일의 다른 위치("${donde}")에 평문으로 남아 있으며 건드리지 않았습니다. 직접 삭제해 주십시오. 이전 복사본에는 가려진 상태(***)로 저장됩니다.`,
    hCopiada: '설정을 복사했습니다(토큰 제외).',
  },
};
