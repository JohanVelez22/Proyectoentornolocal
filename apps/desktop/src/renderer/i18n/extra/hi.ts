import type { TextosParciales } from '../es';

const plural = (n: number, ek: string, anek: string): string => `${n} ${n === 1 ? ek : anek}`;

/**
 * Claves añadidas después de la traducción inicial (D47 en adelante), en este idioma. Se fusionan
 * sobre el diccionario principal al cargar (ver `i18n/index.ts`); lo que falte sale en inglés.
 * Las claves pendientes las lista `node scripts/i18n-faltantes.mjs`.
 */
export const hiExtra: TextosParciales = {
  app: { lema: 'आपका लोकल स्टैक, काम के लिए तैयार' },
  resumenGlobal: {
    cortoApagado: 'सब बंद',
    cortoEncendidos: (n) => `${n} चालू`,
    cortoErrores: (n) => plural(n, 'में त्रुटि', 'में त्रुटि'),
    cortoCargando: 'जुड़ रहा…',
    cortoSinConexion: 'ऑफ़लाइन',
    irAServicios: 'सेवाएँ खोलें',
  },
  acciones: { copiarCompleto: 'पूरा पाठ कॉपी करें' },
  errores: {
    codigos: {
      'servicios.no_encendio': '{nombre} शुरू नहीं हो सका। सेवाएँ और उसके लॉग देखें।',
      'tuneles.sitio_no_confiable':
        '{dominio} पर अभी तक भरोसा नहीं किया गया है: प्रकाशित करने से पहले प्रोजेक्ट में «मैं इस रिपॉज़िटरी पर भरोसा करता हूँ» चुनें।',
      'clientehttp.peticion_invalida': 'अनुरोध में अमान्य डेटा: {campo}।',
      'clientehttp.variable_sin_definir': 'वेरिएबल “{nombre}” सक्रिय परिवेश में परिभाषित नहीं है।',
      'clientehttp.secreto_faltante':
        'सहेजा गया एक गोपनीय मान गायब है: उसे फिर से लिखें और अनुरोध या परिवेश को सहेजें।',
      'clientehttp.secreto_no_guardado':
        'एक गोपनीय मान सहेजा नहीं जा सका: उसमें नई पंक्तियाँ नहीं हो सकतीं, वह 16 KB से बड़ा नहीं हो सकता, और सिस्टम एन्क्रिप्शन उपलब्ध होना चाहिए।',
      'clientehttp.url_invalida': 'URL मान्य नहीं है।',
      'clientehttp.url_con_credenciales':
        'URL में उपयोगकर्ता या पासवर्ड नहीं हो सकता: प्रमाणीकरण टैब का उपयोग करें।',
      'clientehttp.protocolo': 'केवल http:// और https:// URL स्वीकार किए जाते हैं।',
      'clientehttp.cabecera_invalida': 'हेडर “{nombre}” मान्य नहीं है।',
      'clientehttp.cuerpo_grande': 'अनुरोध की बॉडी 1 MB से बड़ी है।',
      'clientehttp.plazo': 'अनुरोध {segundos} s की समय-सीमा से अधिक चला।',
      'clientehttp.cancelado': 'अनुरोध रद्द किया गया।',
      'clientehttp.sin_conexion':
        'कनेक्ट नहीं हो सका ({motivo})। पता, पोर्ट और सर्वर के चालू होने की जाँच करें।',
      'clientehttp.certificado': 'सर्वर का प्रमाणपत्र सत्यापित नहीं किया जा सका ({motivo})।',
      'clientehttp.demasiadas_redirecciones': 'लगातार {max} से अधिक रीडायरेक्ट।',
      'clientehttp.curl_invalido': 'यह पाठ मान्य curl कमांड नहीं है।',
      'clientehttp.curl_grande': 'curl पाठ बहुत बड़ा है (अधिकतम 64 KB)।',
      'clientehttp.no_existe': 'यह आइटम अब मौजूद नहीं है।',
      'clientehttp.limite': 'सहेजे जा सकने वाले आइटमों की सीमा पूरी हो गई।',
      'ejemplohttp.no_arranca': 'उदाहरण सर्वर शुरू नहीं हो सका।',
      'laboratoriogit.sin_git': 'इस कंप्यूटर पर Git इंस्टॉल नहीं है।',
      'laboratoriogit.orden_invalida': 'यह कमांड लैब की सूची में नहीं है।',
      'laboratoriogit.nombre_invalido':
        'नाम में केवल अक्षर, अंक, हाइफ़न और अंडरस्कोर हो सकते हैं (अधिकतम 30 वर्ण)।',
      'laboratoriogit.mensaje_invalido':
        'संदेश एक पंक्ति का, अधिकतम 200 वर्णों का होना चाहिए और “-” से शुरू नहीं होना चाहिए।',
      'laboratoriogit.archivo_invalido': 'यह फ़ाइल अभ्यास फ़ाइलों में से नहीं है।',
      'laboratoriogit.contenido_invalido': 'सामग्री अधिकतम 2000 वर्णों का पाठ होनी चाहिए।',
      'laboratoriogit.ruta_insegura': 'लैब फ़ोल्डर अपेक्षित फ़ोल्डर नहीं है, इसलिए उसे छुआ नहीं गया।',
      'laboratoriogit.fallo_sistema':
        'सिस्टम ने लैब फ़ोल्डर को तैयार करने या उपयोग करने की अनुमति नहीं दी। «लैब रीसेट करें» आज़माएँ।',
      'buscar.ruta_vetada': 'इस फ़ोल्डर में WolfCore Dev का डेटा है: इसमें खोज नहीं की जाती।',
      'buscar.resultado_caducado': 'यह परिणाम अब उपलब्ध नहीं है: फिर से खोजें।',
      'buscar.resultado_invalido': 'यह परिणाम खोला नहीं जा सकता।',
      'diff.raiz_invalida': 'ऐसे दो फ़ोल्डर चुनें जो मौजूद हों और लिंक न हों।',
      'diff.ruta_vetada': 'इस फ़ोल्डर में WolfCore Dev का डेटा है: इसकी तुलना नहीं की जाती।',
      'diff.cancelado': 'तुलना रद्द की गई।',
      'diff.plazo': 'तुलना में {segundos} s से अधिक समय लगा और उसे रद्द कर दिया गया।',
      'diff.memoria': 'तुलना के लिए बहुत अधिक मेमोरी चाहिए ({maximo} से अधिक) और उसे रद्द कर दिया गया।',
      'diff.ocupado': 'एक तुलना पहले से चल रही है: उसे रद्द करें या प्रतीक्षा करें।',
      'diff.caducado': 'यह तुलना अब उपलब्ध नहीं है: फिर से तुलना करें।',
      'diff.archivo_invalido': 'इस फ़ाइल की अब तुलना नहीं की जा सकती: वह बदल गई या हट गई।',
      'diff.fallo': 'तुलना विफल रही।',
      'compartir.confirmacion_requerida':
        'इंटरनेट पर साझा करने की पुष्टि WolfCore Dev विंडो में करनी होगी।',
      'compartir.ocupado': 'कुछ पहले से साझा है: पहले साझा करना रोकें।',
      'compartir.ruta_invalida': 'ऐसा फ़ोल्डर या फ़ाइल चुनें जो मौजूद हो।',
      'compartir.duracion_invalida': '15 मिनट, 1 घंटा या 4 घंटे चुनें।',
      'compartir.proveedor_invalido': 'यह टनल समर्थित नहीं है: Cloudflare या ngrok का उपयोग करें।',
      'compartir.raiz_unidad': 'ड्राइव का रूट साझा नहीं किया जाता। उसके भीतर का कोई फ़ोल्डर चुनें।',
      'compartir.carpeta_usuario':
        'पूरा व्यक्तिगत फ़ोल्डर (या वह फ़ोल्डर जिसमें वह शामिल हो) साझा नहीं किया जाता। कोई उपफ़ोल्डर चुनें।',
      'compartir.carpeta_datos': 'WolfCore Dev का डेटा फ़ोल्डर साझा नहीं किया जाता।',
      'compartir.sitio_datos_reales': 'वास्तविक डेटा वाली साइट (या उसके भीतर कुछ भी) साझा नहीं की जाती।',
      'compartir.carpeta_secretos':
        'इस फ़ोल्डर में कुंजियाँ हैं (.ssh, .aws, .git…) और इसे साझा नहीं किया जाता।',
      'compartir.carpeta_sistema': 'सिस्टम फ़ोल्डर साझा नहीं किए जाते।',
      'compartir.archivo_sensible':
        'यह फ़ाइल गोपनीय या वास्तविक डेटा वाली लगती है और साझा नहीं की जाती।',
      'compartir.carpeta_perfil':
        'उपयोगकर्ता के प्रोग्रामों का डेटा (AppData, .claude, .config…) साझा नहीं किया जाता।',
      'compartir.archivo_grande':
        'यह फ़ाइल जाँचने के लिए बहुत बड़ी है और मीडिया फ़ाइल या पैकेज नहीं है: इसे साझा नहीं किया जाता।',
      'compartir.tunel_sin_url': 'टनल ने {segundos} s में अपना पता नहीं दिया। फिर से प्रयास करें।',
      'compartir.tunel_cerrado': 'टनल पूरी तरह खुलने से पहले ही बंद हो गया।',
      'compartir.fallo': 'साझा नहीं किया जा सका।',
      'disco.raiz_invalida': 'ऐसा फ़ोल्डर या ड्राइव चुनें जो मौजूद हो और पढ़ा जा सके।',
      'disco.cancelado': 'विश्लेषण रद्द किया गया।',
      'disco.plazo': 'विश्लेषण में {minutos} मिनट से अधिक समय लगा और उसे रद्द कर दिया गया।',
      'disco.memoria': 'विश्लेषण के लिए बहुत अधिक मेमोरी चाहिए ({maximo} से अधिक)।',
      'disco.ocupado': 'एक विश्लेषण पहले से चल रहा है: उसे रद्द करें या प्रतीक्षा करें।',
      'disco.caducado': 'यह विश्लेषण अब उपलब्ध नहीं है: फिर से विश्लेषण करें।',
      'disco.entrada_invalida': 'यह फ़ोल्डर अब मौजूद नहीं है या बदल गया है: फिर से विश्लेषण करें।',
      'disco.fallo': 'विश्लेषण विफल रहा।',
      'reverb.no_laravel': 'Reverb केवल Laravel प्रोजेक्ट्स में उपलब्ध है।',
      'reverb.no_confiado': 'Reverb चालू करने के लिए प्रोजेक्ट में “मैं इस रिपॉज़िटरी पर भरोसा करता हूँ” चुनें।',
      'reverb.sin_paquete':
        'laravel/reverb पैकेज गायब है: composer require laravel/reverb से उसे इंस्टॉल करें।',
      'reverb.sin_confirmar': 'पुष्टि करें कि आप Reverb चालू करना चाहते हैं।',
      'reverb.sin_activar': 'पहले प्रोजेक्ट में Reverb चालू करें।',
      'env.meilisearch_no_disponible': 'Meilisearch इंस्टॉल नहीं है: उसे सेवाएँ में इंस्टॉल करें।',
      'bd.lentas_confirmar':
        'धीमी क्वेरी लॉगिंग बदलने का असर पूरे सर्वर पर पड़ता है: इसकी पुष्टि करनी होगी। कुछ भी नहीं बदला गया।',
      'bd.lentas_umbral_invalido': 'समय 0.1 से 60 सेकंड के बीच होना चाहिए।',
      'bd.lentas_motor_no_soportado':
        'धीमी क्वेरी केवल WolfCore Dev द्वारा प्रबंधित MySQL, MariaDB और PostgreSQL पर बदली जा सकती हैं।',
      'bd.lentas_literal_no_permitido':
        'SQL को उसके मानों के साथ नहीं दिखाया जाता: डेटाबेस में वास्तविक डेटा है या क्वेरी को किसी ज्ञात डेटाबेस से नहीं जोड़ा जा सकता।',
      'bd.lentas_entrada_no_existe': 'यह क्वेरी अब लॉग में नहीं है। इसे फिर से पढ़ें।',
      'bd.lentas_fallo': 'धीमी क्वेरी लॉग पढ़ा या बदला नहीं जा सका। जाँचें कि सर्वर चालू है।',
      'bd.esquema_base_no_existe': 'यह डेटाबेस उस सर्वर पर मौजूद नहीं है।',
      'bd.esquema_motor_no_soportado': 'स्कीमा व्यूअर MySQL, MariaDB और PostgreSQL के लिए है।',
      'bd.esquema_lectura_fallo': 'डेटाबेस का स्कीमा पढ़ा नहीं जा सका। जाँचें कि सर्वर चालू है।',
      'captura.atajo_invalido':
        'यह शॉर्टकट मान्य नहीं है: Ctrl, Alt, Shift या Super के साथ कोई अक्षर, अंक या F कुंजी इस्तेमाल करें।',
      'captura.atajo_no_permitido':
        'यह शॉर्टकट अनुमत नहीं है: Ctrl या Super के साथ कोई और मॉडिफ़ायर इस्तेमाल करें (Shift के बिना Ctrl+Alt दरअसल AltGr है और @ लिखना बिगाड़ देता है) और Ctrl+C या Alt+F4 जैसे आम शॉर्टकट से बचें।',
      'captura.atajo_ocupado': 'शॉर्टकट {atajo} किसी अन्य प्रोग्राम द्वारा पहले से इस्तेमाल किया जा रहा है।',
      'captura.no_disponible': 'इस कंप्यूटर पर स्क्रीन कैप्चर उपलब्ध नहीं है।',
      'captura.permiso_denegado': 'स्क्रीन रिकॉर्डिंग की अनुमति नहीं है।',
      'captura.sin_imagen': 'कैप्चर करने के लिए कोई छवि नहीं है।',
      'captura.imagen_invalida': 'कैप्चर की गई छवि मान्य नहीं है।',
      'disco.sin_confirmar': 'आगे बढ़ने से पहले डायलॉग में सफ़ाई की पुष्टि करें।',
      'disco.categoria_invalida': 'यह सफ़ाई श्रेणी मौजूद नहीं है।',
      'disco.ruta_vetada':
        'इस श्रेणी का एक संरक्षित पथ से संबंध है (डेटा, बैकअप, प्रोजेक्ट्स या FlyEnv); कुछ भी साफ़ नहीं किया गया।',
      'disco.sin_analisis':
        'साफ़ करने से पहले फिर से विश्लेषण करें: विश्लेषण की अवधि समाप्त हो गई है या वह मौजूद नहीं है।',
      'disco.ocupada': 'एक विश्लेषण या सफ़ाई पहले से चल रही है।',
      'disco.sin_registro': 'सफ़ाई का लॉग नहीं बनाया जा सका; कुछ भी नहीं हटाया गया।',
      'editor.sin_confirmar': 'आगे बढ़ने से पहले सहेजने की पुष्टि करें।',
      'editor.confirmacion_reforzada':
        'यह फ़ाइल गोपनीय जानकारी वाली लगती है या वास्तविक डेटा वाली साइट की है: इसे सहेजने के लिए अतिरिक्त जाँच के साथ पुष्टि करें।',
      'editor.ruta_invalida': 'फ़ाइल का पथ मान्य नहीं है।',
      'editor.no_existe': 'फ़ाइल मौजूद नहीं है।',
      'editor.no_regular': 'केवल सामान्य फ़ाइलें संपादित की जा सकती हैं।',
      'editor.ruta_vetada':
        'यह फ़ाइल WolfCore Dev के डेटा फ़ोल्डर के भीतर है: इसे एडिटर से खोला या सहेजा नहीं जा सकता।',
      'editor.archivo_env': '.env फ़ाइलें प्रोजेक्ट के वेरिएबल से प्रबंधित होती हैं, एडिटर से नहीं।',
      'editor.demasiado_grande': 'फ़ाइल एडिटर के लिए बहुत बड़ी है (अधिकतम {maximo})।',
      'editor.binario': 'फ़ाइल पाठ नहीं है (बाइनरी है): इसे यहाँ संपादित नहीं किया जा सकता।',
      'editor.codificacion': 'फ़ाइल UTF-8 में नहीं है: उसे नुकसान से बचाने के लिए एडिटर उसे नहीं खोलता।',
      'editor.no_abierto': 'यह फ़ाइल एडिटर में खोली नहीं गई थी (या उसका संस्करण बदल गया): इसे फिर से खोलें।',
      'editor.eol_mixto':
        'फ़ाइल में पंक्ति-अंत के अलग-अलग प्रकार मिले हुए हैं: सहेजने के लिए उन्हें एक समान करने की पुष्टि करें।',
      'editor.contenido_invalido': 'सामग्री मान्य पाठ नहीं है।',
      'editor.huella_invalida': 'खुली फ़ाइल की फ़िंगरप्रिंट गायब है: इसे फिर से खोलें।',
      'editor.archivo_cambiado':
        'फ़ाइल खुलने के बाद एडिटर के बाहर बदल गई है। उसे फिर से लोड करें या ओवरराइट करने की पुष्टि करें।',
      'editor.copia_fallo': 'बैकअप प्रति नहीं बनाई जा सकी ({codigo}); कुछ भी सहेजा नहीं गया।',
      'editor.lectura_fallo': 'फ़ाइल पढ़ी नहीं जा सकी ({codigo})।',
      'editor.escritura_fallo': 'फ़ाइल सहेजी नहीं जा सकी ({codigo})। मूल फ़ाइल को छुआ नहीं गया।',
      'memoria.sin_confirmar': 'आगे बढ़ने से पहले डायलॉग में क्रिया की पुष्टि करें।',
      'memoria.modo_invalido': 'यह ऑप्टिमाइज़ेशन मोड मौजूद नहीं है।',
      'memoria.plan_caducado':
        'सूची की अवधि समाप्त हो गई है या अब वर्तमान नहीं है। लागू करने से पहले उसे फिर से दिखाएँ।',
      'memoria.no_disponible': 'मेमोरी ऑप्टिमाइज़र यहाँ उपलब्ध नहीं है या सिस्टम को पढ़ नहीं सका।',
      'conversor.ocupado':
        'एक रूपांतरण पहले से चल रहा है और दूसरा प्रतीक्षा में है: उसके पूरा होने तक प्रतीक्षा करें।',
      'doctor.firewall_reglas_acotadas':
        'WolfCore Dev के प्रोग्रामों के लिए {cantidad} नियम हैं जो लोकल नेटवर्क तक सीमित हैं (केवल निजी प्रोफ़ाइल, लोकल सबनेट और विशिष्ट पोर्ट), ठीक वैसे ही जैसे ऐप स्वयं साइट साझा करने के लिए सुझाता है। वे केवल दिखाए जाते हैं: यहाँ से हटाए नहीं जाते।',
      'doctor.firewall_almacen_inseguro':
        'नियमों की सुरक्षित प्रति पर भरोसा नहीं किया जा सकता (अनुमतियाँ या सामग्री उससे अलग है जो दिखाई गई थी): कोई नियम बनाया या बदला नहीं गया।',
      'doctor.firewall_quitadas':
        'WolfCore Dev ने पहले {cantidad} फ़ायरवॉल नियम हटाए थे और उनकी एक प्रति रखी है: ज़रूरत हो तो आप उन्हें फिर से बना सकते हैं।',
      'doctor.firewall_parcial':
        'कुछ नियम हटा दिए गए, पर कुछ नहीं: सूची दिखाए जाने के बाद वे बदल गए, WolfCore Dev के नहीं थे, या Windows ने उन्हें हटाने नहीं दिया। सूची जाँचें।',
      'doctor.firewall_sin_cambios':
        'कोई नियम नहीं बदला गया: वे अब उससे मेल नहीं खाते जो दिखाया गया था, या उन्हें बदला नहीं जा सका।',
      'doctor.firewall_registro_fallido':
        'नियमों की प्रति सुरक्षित रजिस्ट्री कुंजी HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos में सहेजी नहीं जा सकी: कुछ भी नहीं बदला गया।',
      'catalogo.paquete_invalido':
        'डाउनलोड किया गया पैकेज सुरक्षित नहीं है (फ़ोल्डर के बाहर के पथ, लिंक या अत्यधिक आकार)।',
      'catalogo.extraccion_fallo': 'डाउनलोड किया गया .7z पैकेज पढ़ा या एक्सट्रैक्ट नहीं किया जा सका।',
      'runtimes.falta_runtime': 'इस प्रोजेक्ट के लिए {nombre} इंस्टॉल नहीं है: उसे सेवाएँ से इंस्टॉल करें।',
      'runtimes.falta_jdk': 'इस प्रोजेक्ट के लिए कोई JDK इंस्टॉल नहीं है: Java को सेवाएँ से इंस्टॉल करें।',
      'runtimes.instalacion_incompleta': '{nombre} का इंस्टॉलेशन अधूरा है: उसे सेवाएँ से फिर से इंस्टॉल करें।',
      'procesos.escucha_publica':
        'प्रोसेस {direccion}:{puerto} ({programa}) पर सुन रही है, जो नेटवर्क के लिए खुला है। उसे रोक दिया गया: वह केवल 127.0.0.1 पर सुन सकती है।',
      'procesos.escucha_publica_livereload':
        'प्रोसेस {direccion}:{puerto} ({programa}) पर सुन रही है, जो नेटवर्क के लिए खुला है। उसे रोक दिया गया: वह केवल 127.0.0.1 पर सुन सकती है। यह Spring DevTools LiveReload है: इसे spring.devtools.livereload.enabled=false से बंद करें।',
      'procesos.escucha_publica_inspector':
        'प्रोसेस {direccion}:{puerto} ({programa}) पर सुन रही है, जो नेटवर्क के लिए खुला है। उसे रोक दिया गया: वह केवल 127.0.0.1 पर सुन सकती है। यह Node इंस्पेक्टर है: --inspect=127.0.0.1 का उपयोग करें।',
    },
  },
  inicio: {
    servicios: { irA: (nombre) => `${nombre} सेवा पर जाएँ` },
    tuneles: { irA: (nombre) => `प्रोजेक्ट ${nombre} पर जाएँ` },
  },
  servicios: {
    sinParaEncender: 'शुरू करने के लिए कोई इंस्टॉल की गई सेवा नहीं है',
    franjaExternos: {
      texto: 'आपने अभी तक वेब सर्वर या PHP इंस्टॉल नहीं किया है। बाहरी इंजन अपने-आप पहचाने गए।',
      accion: 'Nginx और PHP इंस्टॉल करें',
    },
    externos: {
      titulo: 'आपके कंप्यूटर पर मिले',
      ayuda: 'इन्हें कोई अन्य प्रोग्राम प्रबंधित करता है; WolfCore Dev केवल इन्हें दिखाता है।',
    },
    borrarDatos: { que: { meilisearch: 'Meilisearch के सभी इंडेक्स' } },
    ftp: {
      redLocalAyuda:
        'बंद होने पर केवल यही कंप्यूटर कनेक्ट कर सकता है (127.0.0.1)। प्रत्येक प्रोजेक्ट अपनी पहुँच प्रोजेक्ट्स में चालू करता है।',
      compartir: {
        enlace: 'फ़ोल्डर या फ़ाइल साझा करें…',
        ayuda:
          'FTP को टनल से साझा नहीं किया जाता: वह एन्क्रिप्टेड नहीं है और टनल केवल HTTP ले जाता है। इंटरनेट पर कुछ प्रकाशित करने के लिए “फ़ोल्डर या फ़ाइल साझा करें” (HTTP, केवल पढ़ने के लिए) का उपयोग करें; FTP लोकल नेटवर्क पर ही रहता है।',
      },
    },
    datosConexion: 'कनेक्शन विवरण',
  },
  bd: {
    dialogoConexion: {
      tituloServicio: 'Meilisearch से कनेक्शन',
      notaMeilisearch:
        'प्रोजेक्ट में उपयोग करने के लिए: वेरिएबल (.env) → ब्लॉक जोड़ें → Meilisearch। कुंजी छिपाकर एक पूर्वावलोकन दिखाया जाता है और पुष्टि आवश्यक है। यह कुंजी केवल इसी कंप्यूटर की है।',
    },
  },
  instalar: {
    servicios: {
      meilisearch: {
        nombre: 'Meilisearch',
        detalle: 'Laravel Scout के लिए खोज (github.com/meilisearch)',
      },
    },
  },
  sitios: {
    tipos: {
      rails: 'Rails (लोकल पोर्ट)',
      springboot: 'Spring Boot (लोकल पोर्ट)',
      aspnet: 'ASP.NET Core (लोकल पोर्ट)',
    },
    tiposCortos: { rails: 'Rails', springboot: 'Spring Boot', aspnet: 'ASP.NET' },
  },
  tunel: {
    sinConfianza:
      'इस प्रोजेक्ट पर भरोसा नहीं किया गया है: इसे प्रकाशित करने के लिए «मैं इस रिपॉज़िटरी पर भरोसा करता हूँ» चुनें।',
  },
  tuneles: {
    irAProyectos: 'प्रोजेक्ट्स पर जाएँ',
    compartir: {
      enlace: 'फ़ोल्डर या फ़ाइल साझा करें…',
      ayuda: 'साइट की ज़रूरत के बिना कोई फ़ोल्डर या एक अकेली फ़ाइल (केवल पढ़ने के लिए) प्रकाशित करता है।',
    },
  },
  reverb: {
    titulo: 'Reverb',
    modificado:
      'इस प्रोजेक्ट की Reverb प्रोसेस में WolfCore Dev की कमांड नहीं है (अन्य होस्ट, प्रोग्राम या पोर्ट)। उसे चालू करने पर वह मानक प्रोसेस से बदल जाती है, जो केवल 127.0.0.1 पर सुनती है।',
    ayuda: 'Laravel WebSockets, केवल 127.0.0.1 पर।',
    puerto: (p) => 'पोर्ट {p}'.replace('{p}', String(p)),
    interruptor: (dominio) => '{d} के लिए Reverb चालू या बंद करें'.replace('{d}', dominio),
    activarTitulo: 'Reverb चालू करें?',
    activarTexto: (dominio) =>
      '{d} में “php artisan reverb:start” चलेगा, जो किसी खाली पोर्ट पर केवल 127.0.0.1 पर सुनेगा। प्रोजेक्ट का कोड उसके अपने PHP के साथ चलता है।'.replace(
        '{d}',
        dominio,
      ),
    desactivarTitulo: 'Reverb बंद करें?',
    desactivarTexto:
      'प्रोसेस रुक जाती है और प्रोजेक्ट से हटा दी जाती है। .env में REVERB_* वेरिएबल को छुआ नहीं जाता।',
    activar: 'चालू करें',
    desactivar: 'बंद करें',
    proponer: 'REVERB_* वेरिएबल सुझाएँ',
    tituloError: 'Reverb',
    estados: { apagado: 'रुका हुआ', iniciando: 'शुरू हो रहा है', encendido: 'चालू', error: 'विफल' },
  },
  ftpSitio: {
    compartirNota:
      'FTP केवल लोकल नेटवर्क के लिए है: उसे इंटरनेट टनल से साझा नहीं किया जाता क्योंकि वह पासवर्ड और फ़ाइलें बिना एन्क्रिप्शन के भेजता है।',
    compartirIr: 'किसी फ़ोल्डर या फ़ाइल को अस्थायी लिंक से साझा करें',
  },
  ia: { pestanas: { etiqueta: 'AI अनुभाग', agentes: 'एजेंट्स', nube: 'क्लाउड', local: 'लोकल मॉडल' } },
  iaLocal: {
    compat: {
      sugerenciaVram: 'आपके कंप्यूटर के लिए: लगभग {b}B तक के मॉडल, जो ग्राफ़िक्स कार्ड की मेमोरी में आ जाते हैं।',
      sugerenciaRam: 'आपके कंप्यूटर के लिए: लगभग {b}B तक के मॉडल, जो RAM में चलते हैं।',
      sugerenciaPequena: 'आपके कंप्यूटर के लिए: केवल बहुत छोटे मॉडल (1B से कम)।',
      sugerenciaDesconocida: 'आपके कंप्यूटर का हार्डवेयर पढ़ा नहीं जा सका, इसलिए कोई सुझाव नहीं है।',
      aviso: 'यह केवल मार्गदर्शन है: आप कोई भी मॉडल डाउनलोड कर सकते हैं।',
      comprobando: 'आपके कंप्यूटर की जाँच हो रही है…',
      niveles: {
        recomendado: 'अनुशंसित',
        lento: 'धीमा हो सकता है',
        'no-cabe': 'नहीं आता',
        desconocido: 'कोई डेटा नहीं',
      } as Record<string, string>,
      motivos: {
        'cabe-vram':
          'ग्राफ़िक्स कार्ड की मेमोरी में आराम से आ जाता है (≈{necesario} चाहिए, {disponible} उपलब्ध)।',
        'justo-vram':
          'ग्राफ़िक्स कार्ड में आ जाता है, पर बस किसी तरह (≈{necesario} चाहिए, {disponible} उपलब्ध)।',
        'solo-ram':
          'ग्राफ़िक्स कार्ड में नहीं आता और RAM में चलेगा (≈{necesario} चाहिए, {disponible} उपयोग योग्य): धीमा।',
        'cabe-ram': 'RAM में आराम से आ जाता है (≈{necesario} चाहिए, {disponible} उपयोग योग्य)।',
        'ram-justo':
          'RAM में आ जाता है, पर बस किसी तरह (≈{necesario} चाहिए, {disponible} उपयोग योग्य): धीमा हो सकता है।',
        'sin-memoria': '≈{necesario} मेमोरी चाहिए और आपके कंप्यूटर में ≈{disponible} है।',
        'sin-disco': 'डाउनलोड के लिए डिस्क पर पर्याप्त खाली जगह नहीं है ({disponible} बचे हैं)।',
        'tamano-desconocido': 'मॉडल का आकार जाँचा नहीं जा सका (Ollama रजिस्ट्री से कनेक्शन नहीं)।',
        'equipo-desconocido': 'आपके कंप्यूटर की मेमोरी पढ़ी नहीं जा सकी।',
      } as Record<string, string>,
    },
    descargar: {
      confirmarTexto:
        'आप डाउनलोड को किसी भी समय रद्द कर सकते हैं; जो हिस्सा पहले डाउनलोड हो चुका है, वह हटा दिया जाता है।',
      tamano: (t) => `डाउनलोड का आकार: ${t}।`,
      tamanoDesconocido:
        'आकार की जाँच नहीं हो सकी (Ollama रजिस्ट्री से कनेक्शन नहीं है)। मॉडल आमतौर पर 1 से 40 GB से अधिक के होते हैं।',
      libre: (l) => `मॉडल डिस्क पर खाली जगह: ${l}।`,
      libreDesconocido: 'डिस्क की खाली जगह नापी नहीं जा सकी।',
      sinEspacio: (t, l) =>
        `पर्याप्त जगह नहीं है: मॉडल ${t} लेता है और केवल ${l} खाली है। कुछ जगह खाली करें या छोटा मॉडल चुनें।`,
    },
  },
  proyectos: {
    asistente: { ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    tarjeta: { verEnBases: 'डेटाबेस में देखें' },
  },
  panel: {
    insignias: { memoriaAlta: 'अधिक मेमोरी' },
    discos: {
      titulo: 'डिस्क स्थान',
      leyendo: 'डिस्क पढ़ी जा रही हैं…',
      sistema: 'सिस्टम',
      datos: 'WolfCore डेटा',
      ambos: 'सिस्टम और WolfCore डेटा',
      libre: (unidad, libre, pct) => `${unidad} · ${libre} खाली (${pct} %)`,
      poco: 'खाली जगह कम है',
      casiLleno: 'जगह लगभग खत्म',
      liberar: 'जगह खाली करें',
      versiones: 'अनुपयोगी संस्करण साफ़ करें',
      temporales: 'WolfCore की अस्थायी फ़ाइलें और कैश साफ़ करें',
      ocupaMas: 'देखें कि सबसे अधिक जगह क्या लेता है',
    },
    alertas: {
      grupo: (n) => `मिली समस्याएँ (${n})`,
      verTodos: (n) => `सभी ${n} दिखाएँ`,
      verMenos: 'कम दिखाएँ',
      masAcciones: 'अधिक क्रियाएँ',
    },
    procesos: { resto: 'अन्य सेवाएँ' },
  },
  captura: {
    barra: 'ड्रॉइंग टूल',
    herramientas: {
      recuadro: 'बॉक्स',
      flecha: 'तीर',
      linea: 'रेखा',
      resaltador: 'हाइलाइटर',
      texto: 'पाठ',
      pixelar: 'पिक्सेलेट',
      pixelarAyuda: 'पिक्सेलेट (संवेदनशील डेटा के लिए सुरक्षित नहीं: छिपाएँ का उपयोग करें)',
      ocultar: 'छिपाएँ',
      ocultarAyuda: 'ठोस रंग से छिपाएँ (संवेदनशील डेटा के लिए अनुशंसित)',
    },
    deshacer: 'पूर्ववत करें',
    rehacer: 'फिर से करें',
    copiar: 'कॉपी करें',
    copiarAyuda:
      'क्लिपबोर्ड पर कॉपी करें। Windows क्लिपबोर्ड उसे अपने इतिहास में रख सकता है या अन्य डिवाइस से सिंक कर सकता है।',
    guardar: 'सहेजें…',
    alConversor: 'इमेज कन्वर्टर को भेजें',
    cerrar: 'रद्द करें (Esc)',
    nuevaSeleccion: 'नया चयन',
    color: 'रंग',
    grosor: 'मोटाई',
    formato: 'फ़ॉर्मेट',
    cargando: 'कैप्चर तैयार हो रहा है…',
    guiaRegion: 'क्षेत्र चुनने के लिए खींचें। Esc रद्द करता है।',
    guiaVentana: 'वह विंडो चुनें जिसे आप कैप्चर करना चाहते हैं। Esc रद्द करता है।',
    sinVentanas: 'कैप्चर की जा सकने वाली कोई विंडो नहीं है।',
    textoPlaceholder: 'लिखें और Enter दबाएँ',
    copiada: 'क्लिपबोर्ड पर कॉपी किया गया',
    guardada: (archivo) => `${archivo} में सहेजा गया`,
    errorCargar: 'कैप्चर खोला नहीं जा सका।',
    errorCopiar: 'छवि कॉपी नहीं की जा सकी।',
    errorGuardar: 'छवि सहेजी नहीं जा सकी।',
    errorConversor: 'छवि कन्वर्टर को नहीं भेजी जा सकी।',
    errorVentana: 'वह विंडो कैप्चर नहीं की जा सकी।',
    dimensiones: (ancho, alto) => `${ancho}×${alto} px`,
    panel: {
      ayuda:
        'सब कुछ इसी कंप्यूटर पर होता है: कैप्चर किसी सेवा पर अपलोड नहीं होता और आपके सहेजने तक डिस्क पर सहेजा नहीं जाता। WolfCore Dev की विंडो कुछ क्षण के लिए छिप जाती हैं ताकि वे छवि में न आएँ।',
      region: 'क्षेत्र',
      regionAyuda: 'क्षेत्र चुनने के लिए स्क्रीन पर खींचें।',
      ventana: 'विंडो',
      ventanaAyuda: 'खुली विंडो में से कोई एक चुनें।',
      pantalla: 'पूरी स्क्रीन',
      pantallaAyuda: 'वह स्क्रीन जहाँ कर्सर है।',
      atajoActivo: (atajo) => `ग्लोबल शॉर्टकट चालू है: ${atajo} (क्षेत्र)।`,
      atajoInactivo: 'कोई ग्लोबल शॉर्टकट नहीं है। इसे सेटिंग्स में चालू करें।',
      noDisponible: 'इस कंप्यूटर पर स्क्रीन कैप्चर उपलब्ध नहीं है।',
      permisoDenegado: 'स्क्रीन रिकॉर्डिंग की अनुमति नहीं है। इसे सिस्टम सेटिंग्स में WolfCore Dev के लिए चालू करें।',
      ocupada: 'एक कैप्चर पहले से चल रहा है।',
    },
    ajustes: {
      titulo: 'स्क्रीन कैप्चर',
      descripcion:
        'क्षेत्र, विंडो या पूरी स्क्रीन, एक त्वरित एडिटर के साथ। यह 100% लोकल है: जब तक आप तय न करें, कुछ भी अपलोड या सहेजा नहीं जाता।',
      activar: 'ग्लोबल शॉर्टकट',
      activarAyuda:
        'डिफ़ॉल्ट रूप से बंद। चालू करने पर वह तभी पंजीकृत होता है जब उसे कोई अन्य प्रोग्राम इस्तेमाल न करता हो, और WolfCore Dev बंद होने पर वह मुक्त हो जाता है।',
      atajo: 'संयोजन',
      grabar: 'बदलें',
      grabando: 'संयोजन दबाएँ…',
      grabandoAyuda:
        'Ctrl या Super के साथ कोई अन्य मॉडिफ़ायर (जैसे Ctrl+Alt+Shift) और कोई अक्षर, अंक या F कुंजी इस्तेमाल करें। Ctrl+C जैसे आम शॉर्टकट से बचें।',
      formato: 'सहेजते समय फ़ॉर्मेट',
      activado: (atajo) => `शॉर्टकट ${atajo} चालू किया गया।`,
      desactivado: 'शॉर्टकट बंद किया गया।',
      ocupado: (atajo) =>
        `शॉर्टकट ${atajo} किसी अन्य प्रोग्राम द्वारा पहले से इस्तेमाल किया जा रहा है और कुछ भी नहीं बदला गया। कोई दूसरा संयोजन आज़माएँ।`,
      ocupadoInicio:
        'सहेजा गया शॉर्टकट किसी अन्य प्रोग्राम द्वारा पहले से इस्तेमाल किया जा रहा है और पंजीकृत नहीं हुआ। कोई दूसरा संयोजन चुनें।',
      sinPermiso: 'macOS पर स्क्रीन रिकॉर्डिंग की अनुमति आवश्यक है; पहली बार कैप्चर करते समय आपसे पूछा जाएगा।',
      formatoGuardado: 'फ़ॉर्मेट सहेजा गया।',
    },
  },
  herramientas: {
    entorno: {
      equipo: {
        titulo: 'मेरा कंप्यूटर',
        copiarResumen: 'सारांश कॉपी करें',
        resumenCopiado: 'सारांश कॉपी हो गया',
        privacidad: 'सारांश में क्रमांक या अद्वितीय पहचानकर्ता शामिल नहीं हैं।',
        desconocido: 'अज्ञात',
        sinGpu: 'कोई नहीं मिला',
        so: 'ऑपरेटिंग सिस्टम',
        cpu: 'प्रोसेसर',
        ram: 'मेमोरी (RAM)',
        gpu: 'ग्राफ़िक्स कार्ड',
        placa: 'मदरबोर्ड',
        disco: 'ड्राइव {u}',
        compilacion: 'बिल्ड {n}',
        nucleosHilos: '{n} कोर, {h} थ्रेड',
        ramDetalle: 'कुल {total}, खाली {libre}',
        vram: '{v} VRAM',
        discoDetalle: '{total} में से {libre} खाली',
        ssd: 'SSD',
        hdd: 'HDD',
        resumenTitulo: 'कंप्यूटर का सारांश · WolfCore Dev {v}',
        resumenTituloSinVersion: 'कंप्यूटर का सारांश · WolfCore Dev',
      },
    },
    chmod: {
      permisos: 'अनुमतियाँ',
      propietario: 'स्वामी',
      grupo: 'समूह',
      otros: 'अन्य',
      leer: 'पढ़ना (r)',
      escribir: 'लिखना (w)',
      ejecutar: 'चलाना (x)',
      especiales: 'विशेष बिट',
      setuid: 'setuid: स्वामी की अनुमतियों के साथ चलता है',
      setgid: 'setgid: समूह की अनुमतियों के साथ चलता है',
      sticky: 'sticky: फ़ोल्डर में केवल स्वामी ही हटा सकता है',
      habituales: 'सामान्य मान',
      octal: 'ऑक्टल (8-आधारी)',
      simbolico: 'प्रतीकात्मक',
      octalInvalido: '0 से 7 तक के 3 या 4 अंक दर्ज करें (जैसे 755)।',
      simbolicoInvalido: 'rwxr-xr-x जैसे 9 अक्षर दर्ज करें।',
      ejemplo: 'उदाहरण',
      archivo: 'फ़ाइल का नाम',
      nota: 'Windows पर लागू नहीं होता; यह Linux और macOS सर्वरों के लिए है।',
      avisoOtros: 'सर्वर का कोई भी उपयोगकर्ता इसे बदल सकता है: «अन्य» को लिखने की अनुमति देने से बचें।',
    },
    lista: {
      chmod: {
        nombre: 'chmod अनुमतियाँ',
        descripcion: 'चेकबॉक्स, ऑक्टल और प्रतीकात्मक रूप, Linux और macOS सर्वरों के लिए।',
      },
      clienteHttp: {
        nombre: 'HTTP क्लाइंट',
        descripcion: 'API आज़माएँ: अनुरोध, परिवेश, कलेक्शन और इतिहास।',
      },
      captura: {
        nombre: 'स्क्रीन कैप्चर',
        descripcion: 'क्षेत्र, विंडो या पूरी स्क्रीन, एक त्वरित एडिटर के साथ।',
      },
      guiaTuneles: {
        nombre: 'टनल गाइड',
        descripcion: 'Cloudflare और ngrok चरण-दर-चरण, कॉपी करने योग्य कमांड के साथ।',
      },
      guiaHttp: { nombre: 'HTTP गाइड', descripcion: 'स्टेटस कोड और मेथड, खोज और उदाहरणों के साथ।' },
      guiaGit: {
        nombre: 'Git और GitHub गाइड',
        descripcion: 'कमांड और वर्कफ़्लो, सुरक्षित अभ्यास के लिए एक लैब के साथ।',
      },
      limpiezaDisco: {
        nombre: 'डिस्क सफ़ाई',
        descripcion:
          'अस्थायी फ़ाइलों और दोबारा बन सकने वाले कैश का विश्लेषण करें और हटाएँ, पूर्वावलोकन और पुष्टि के साथ।',
      },
      editor: {
        nombre: 'कोड एडिटर',
        descripcion: 'टेक्स्ट फ़ाइलें हाइलाइटिंग, बैकअप प्रति और पुष्टि के साथ सहेजने की सुविधा के साथ संपादित करें।',
      },
      compartir: {
        nombre: 'फ़ोल्डर या फ़ाइल साझा करें',
        descripcion: 'किसी फ़ोल्डर या फ़ाइल को अस्थायी, केवल पढ़ने योग्य लिंक से इंटरनेट पर प्रकाशित करें।',
      },
      usoDisco: {
        nombre: 'डिस्क उपयोग',
        descripcion: 'ड्राइव या फ़ोल्डर में जगह कौन लेता है: ट्री, सबसे बड़ी फ़ाइलें और फ़ोल्डर, एक्सटेंशन के अनुसार।',
      },
      diffCarpetas: {
        nombre: 'फ़ोल्डर तुलना',
        descripcion:
          'दो फ़ोल्डरों की तुलना करता है: केवल एक में, केवल दूसरे में और भिन्न, प्रत्येक फ़ाइल के अंतर के साथ।',
      },
      grabarPantalla: {
        nombre: 'स्क्रीन रिकॉर्ड करें',
        descripcion: 'आपके सिस्टम में पहले से मौजूद रिकॉर्डर खोलता है।',
      },
    },
    secciones: {
      codigo: 'कोड',
      red: 'नेटवर्क',
      seguridad: 'सुरक्षा',
      archivos: 'फ़ाइलें और मीडिया',
      sistema: 'सिस्टम',
    },
    tarjetas: {
      comparar: { nombre: 'तुलना', descripcion: 'पाठ और फ़ोल्डर: अंतर आमने-सामने।' },
      qr: { nombre: 'QR', descripcion: 'किसी पाठ या लिंक से, या ताकि दूसरे आपके Wi-Fi से जुड़ सकें।' },
      guias: {
        nombre: 'गाइड',
        descripcion: 'HTTP, टनल और Git, उदाहरणों और कॉपी करने योग्य कमांड के साथ।',
      },
    },
    pestanas: {
      diff: 'पाठ',
      diffCarpetas: 'फ़ोल्डर',
      qr: 'QR',
      qrWifi: 'Wi-Fi',
      guiaHttp: 'HTTP',
      guiaTuneles: 'टनल',
      guiaGit: 'Git',
    },
    grabar: {
      ayuda:
        'WolfCore Dev का अपना कोई रिकॉर्डर नहीं है: वह आपके सिस्टम में पहले से मौजूद रिकॉर्डर खोलता है। वीडियो वहीं सहेजा जाता है जहाँ वह टूल सहेजता है।',
      abrir: 'रिकॉर्डर खोलें',
      abierta: 'Snipping Tool खुल गया। स्क्रीन का क्षेत्र चुनें और Start दबाएँ।',
      noSePudo: 'Snipping Tool यहाँ से नहीं खोला जा सका। गाइड में दिए शॉर्टकट में से किसी एक का उपयोग करें।',
      guiaTitulo: 'अपने सिस्टम पर रिकॉर्ड कैसे करें',
      guias: {
        windows: {
          titulo: 'Windows',
          pasos: [
            'Snipping Tool से रिकॉर्ड करने के लिए Win + Shift + R दबाएँ।',
            'यदि आपका Snipping Tool अपडेट नहीं है, तो Xbox Game Bar से रिकॉर्ड करने के लिए Win + Alt + R दबाएँ।',
            'ऊपर दिखने वाली बार के बटन से रिकॉर्डिंग रोकें।',
          ],
        },
        macos: {
          titulo: 'macOS',
          pasos: [
            'कैप्चर बार खोलने के लिए Cmd + Shift + 5 दबाएँ।',
            'पूरी स्क्रीन या चुने हुए हिस्से की रिकॉर्डिंग चुनें।',
            'Record दबाएँ और समाप्त करने के लिए मेनू बार में रोकने का बटन दबाएँ।',
          ],
        },
        linux: {
          titulo: 'Linux',
          pasos: [
            'हर डेस्कटॉप में एक रिकॉर्डर होता है: GNOME में Ctrl + Alt + Shift + R; KDE में Spectacle।',
            'यदि कोई नहीं है, तो अपने पैकेज मैनेजर से OBS Studio या SimpleScreenRecorder इंस्टॉल करें।',
          ],
        },
      },
    },
    errores: {
      regex: (detalle) => (detalle ? `अमान्य एक्सप्रेशन: ${detalle}` : 'अमान्य एक्सप्रेशन।'),
      regexDetalle: {
        corchete: 'एक ब्रैकेट “[” बंद नहीं किया गया है।',
        parentesis: 'एक कोष्ठक “(” बंद नहीं किया गया है।',
        parentesisSobra: 'एक बंद करने वाले कोष्ठक “)” का कोई खुलने वाला कोष्ठक नहीं है।',
        nadaQueRepetir: 'एक क्वांटिफ़ायर (“*”, “+”, “?” या “{}”) के पास दोहराने के लिए कुछ नहीं है।',
        barraAlFinal: 'पैटर्न बैकस्लैश पर समाप्त नहीं हो सकता।',
        rangoInvertido: 'कैरेक्टर क्लास में एक रेंज उलटी है (उदाहरण के लिए “z-a”)।',
        cuantificador: '“{}” क्वांटिफ़ायर अधूरा है या उसकी संख्याएँ उलटी हैं।',
        grupo: 'ग्रुप का नाम या रूप मान्य नहीं है।',
        escape: 'बैकस्लैश एस्केप अनुक्रम मान्य नहीं है।',
      },
    },
    busqueda: {
      excluir: 'इन्हें भी छोड़ें (अल्पविराम से अलग करें)',
      incluirPesadas: 'भारी फ़ोल्डर शामिल करें (node_modules, vendor, .git…)',
      contexto: 'संदर्भ पंक्तियाँ',
      grupoNombres: (n) => `नाम से (${n})`,
      grupoContenido: (n) => `सामग्री से (${n})`,
      carpeta: 'फ़ोल्डर',
      listaAria: 'खोज परिणाम',
      atajos: '↑ ↓ से आगे बढ़ें, एडिटर में खोलने के लिए Enter, रद्द करने या पाठ पर लौटने के लिए Esc।',
      sensible: (n) => `संवेदनशील फ़ाइल: पंक्ति ${n} पर मिलान (उसकी सामग्री नहीं दिखाई जाती)।`,
      mostrarMas: (n) => `${n} और दिखाएँ`,
      linea: (n) => `पंक्ति ${n}`,
      sinGrupo: 'इस समूह में कोई परिणाम नहीं।',
      topeBytes: 'पढ़ने की सीमा पूरी हो गई: खोज को सीमित करें।',
    },
    compartir: {
      explicacion:
        'इस कंप्यूटर के किसी फ़ोल्डर या फ़ाइल को अस्थायी लिंक के साथ इंटरनेट पर प्रकाशित करता है। यह केवल पढ़ने के लिए है: लिंक वाला कोई भी व्यक्ति देख और डाउनलोड कर सकता है, पर अपलोड या कुछ बदल नहीं सकता। लिंक में एक गोपनीय कोड होता है, वह आपके चुने समय पर समाप्त हो जाता है और WolfCore Dev बंद करने पर बंद हो जाता है। .env फ़ाइलें, कुंजियाँ, .git फ़ोल्डर और वास्तविक डेटा वाली साइटें कभी साझा नहीं की जातीं।',
      eleccion: 'क्या साझा करें',
      elegirCarpeta: 'फ़ोल्डर चुनें…',
      elegirArchivo: 'फ़ाइल चुनें…',
      elegido: 'चुना गया',
      duracion: 'साझा करना रोकें',
      duraciones: { m15: '15 मिनट', h1: '1 घंटा', h4: '4 घंटे' },
      tunel: 'टनल',
      tuneles: {
        'cloudflare-rapido': 'Cloudflare (त्वरित, बिना खाते के)',
        ngrok: 'ngrok (आपके टोकन के साथ)',
      },
      ngrokSinToken: 'ngrok को आपका टोकन चाहिए: उसे किसी साइट के टनल विकल्पों में सहेजें।',
      compartir: 'साझा करें…',
      sinFtp: 'FTP को टनल से साझा नहीं किया जाता: वह एन्क्रिप्टेड नहीं है और टनल केवल HTTP ले जाता है।',
      vacio: {
        titulo: 'कुछ भी साझा नहीं है',
        texto:
          'अस्थायी सार्वजनिक लिंक पाने के लिए कोई फ़ोल्डर या फ़ाइल चुनें। आपके पुष्टि करने तक कुछ भी प्रकाशित नहीं होता।',
      },
      grandes:
        '8 MB से बड़ी टेक्स्ट फ़ाइलें या अज्ञात प्रकार की फ़ाइलें साझा नहीं की जातीं, क्योंकि उनकी पूरी जाँच नहीं हो सकती; छवियाँ, ऑडियो, वीडियो और पैकेज (zip, 7z, gz, pdf) साझा की जाती हैं। वे सूची में चिह्नित दिखती हैं।',
      comprimidos:
        'संपीड़ित फ़ाइल (.zip, .7z, .gz) जैसी है वैसी ही साझा की जाती है, भीतर देखे बिना: यदि उसमें .env फ़ाइल या कुंजियाँ हैं, तो वे प्रकाशित हो जाती हैं।',
      confirmar: {
        titulo: 'इंटरनेट पर साझा करें',
        pregunta: 'इसे इंटरनेट पर प्रकाशित करें?',
        rutaReal: 'वास्तविक पथ (लिंक हल किए गए)',
        ruta: 'सटीक पथ',
        aviso: (dur) =>
          `लिंक तैयार होने के क्षण से यह ${dur} के लिए इंटरनेट पर सार्वजनिक रहेगा। लिंक वाला कोई भी व्यक्ति साझा की गई सामग्री को देख और डाउनलोड कर सकेगा।`,
        boton: 'इंटरनेट पर साझा करें',
      },
      abriendo: 'टनल खुल रहा है…',
      activa: 'साझा हो रहा है',
      enlace: 'सार्वजनिक लिंक',
      copiar: 'लिंक कॉपी करें',
      qr: 'लिंक का QR कोड',
      vence: (hasta, restan) => `${hasta} पर समाप्त (${restan})`,
      restan: (min) => (min <= 1 ? '1 मिनट से कम' : `${min} मिनट`),
      dejar: 'साझा करना रोकें',
      fin: {
        vencio: 'समय समाप्त: सर्वर और टनल बंद कर दिए गए।',
        tunel: 'टनल बंद हो गया और साझा करना रुक गया।',
      },
      registro: {
        titulo: 'पहुँच',
        ayuda: 'नवीनतम 200, केवल मेमोरी में। वे लिंक का गोपनीय कोड कभी नहीं दिखाते।',
        vacioTitulo: 'अभी तक कोई पहुँच नहीं',
        vacioTexto: 'जब भी कोई लिंक खोलेगा, वह यहाँ दिखेगा।',
        col: { hora: 'समय', ip: 'IP', ruta: 'पथ', codigo: 'कोड' },
        sinPermiso: '(सही कोड के बिना)',
      },
    },
    usoDisco: {
      explicacion:
        'दिखाता है कि ड्राइव या फ़ोल्डर में जगह क्या लेता है। वह केवल नाम और आकार पढ़ता है (सामग्री कभी नहीं), लिंक या जंक्शन का अनुसरण नहीं करता और अलग प्रोसेस में चलता है। वह कुछ भी हटाता, हिलाता या बदलता नहीं है।',
      unidades: 'ड्राइव',
      unidad: (ruta, etiqueta) => (etiqueta ? `${ruta} ${etiqueta}` : ruta),
      espacioUnidad: (libre, total) => `${total} में से ${libre} खाली`,
      sinUnidades: 'ड्राइव की सूची पढ़ी नहीं जा सकी। आप कोई फ़ोल्डर चुन सकते हैं।',
      elegirCarpeta: 'फ़ोल्डर चुनें…',
      analizando: 'विश्लेषण हो रहा है…',
      leyendo: 'पढ़ा जा रहा है',
      progreso: (archivos, carpetas, bytes) => `${archivos} फ़ाइलें · ${carpetas} फ़ोल्डर · ${bytes}`,
      cancelar: 'रद्द करें',
      cancelado: 'विश्लेषण रद्द किया गया।',
      resumen: (total, archivos, carpetas) => `${archivos} फ़ाइलों और ${carpetas} फ़ोल्डरों में ${total}`,
      duracion: (segundos) => `इसमें ${segundos} s लगे।`,
      vistas: { arbol: 'ट्री', carpetas: 'फ़ोल्डर', archivos: 'फ़ाइलें', extensiones: 'एक्सटेंशन' },
      arbolAyuda:
        'आकार के अनुसार क्रमबद्ध। केवल वे फ़ोल्डर और फ़ाइलें दिखाई जाती हैं जिनका वज़न कुल का कम से कम 0.5% है; बाकी “अन्य” में जोड़ दिया जाता है।',
      carpetasAyuda:
        'अपने स्वयं के सबसे अधिक वज़न वाले 50 फ़ोल्डर: उनमें सीधे मौजूद फ़ाइलों का वज़न, उपफ़ोल्डरों को छोड़कर।',
      archivosAyuda: 'सबसे बड़ी 50 फ़ाइलें।',
      extensionesAyuda: 'सबसे अधिक जगह लेने वाले 20 एक्सटेंशन; बाकी “अन्य एक्सटेंशन” में जाते हैं।',
      col: {
        nombre: 'नाम',
        tamano: 'आकार',
        porcentaje: 'कुल का',
        archivos: 'फ़ाइलें',
        ruta: 'पथ',
        extension: 'एक्सटेंशन',
      },
      otros: (n) => `अन्य (${n} छोटी फ़ाइलें)`,
      sinExtension: '(बिना एक्सटेंशन)',
      otrasExtensiones: 'अन्य एक्सटेंशन',
      expandir: (nombre) => `${nombre} को फैलाएँ`,
      contraer: (nombre) => `${nombre} को समेटें`,
      abrir: 'Explorer में खोलें',
      copiar: 'पथ कॉपी करें',
      denegada: 'पढ़ा नहीं जा सका',
      avisos: {
        enlaces: (n) => `${n} लिंक या जंक्शन का अनुसरण नहीं किया गया और उन्हें 0 गिना गया है।`,
        denegados: (n) =>
          `${n} आइटम पढ़े नहीं जा सके (अनुमति नहीं थी, या विश्लेषण के दौरान बदल गए)। एडमिनिस्ट्रेटर अधिकारों के बिना कुछ सिस्टम फ़ोल्डर नहीं पढ़े जा सकते: यह टूल उन्हें नहीं माँगता।`,
        enlacesDuros: (n) => `हार्ड-लिंक वाली फ़ाइलों के ${n} अतिरिक्त नाम दो बार नहीं गिने गए।`,
        enlacesDurosIncompleto:
          'हार्ड लिंक इतने अधिक थे कि रजिस्ट्री भर गई: कुल में कोई फ़ाइल दो बार गिनी जा सकती है।',
        truncado: 'अधिकतम गहराई पूरी हो गई: कुछ फ़ोल्डर गिने नहीं गए।',
        tamanoLogico:
          'आकार तार्किक हैं (प्रत्येक फ़ाइल जो बताती है), डिस्क पर उपयोग की गई जगह नहीं: केवल-ऑनलाइन OneDrive फ़ाइलें, संपीड़ित फ़ाइलें और स्पार्स फ़ाइलें अलग हो सकती हैं।',
        verEnlaces: 'जिन लिंक का अनुसरण नहीं किया गया उन्हें दिखाएँ',
      },
      limpieza: {
        titulo: 'जगह खाली करें',
        texto:
          'यह टूल केवल नापता है। अस्थायी फ़ाइलें और दोबारा बन सकने वाले कैश, या अनुपयोगी सेवा संस्करण हटाने के लिए, पहले से मौजूद इन विकल्पों का उपयोग करें:',
        temporales: 'डिस्क सफ़ाई',
        versiones: 'अनुपयोगी संस्करण (सेवाएँ)',
      },
      vacio: {
        titulo: 'अभी कोई विश्लेषण नहीं',
        texto: 'यह देखने के लिए कि जगह क्या लेता है, कोई ड्राइव या फ़ोल्डर चुनें। कुछ भी बदला नहीं जाता।',
      },
      sinContenido: {
        titulo: 'गिनने के लिए कुछ नहीं',
        texto: 'इस फ़ोल्डर में कोई पढ़ी जा सकने वाली फ़ाइल नहीं है।',
      },
    },
    diffCarpetas: {
      explicacion:
        'दो फ़ोल्डरों की तुलना करता है, उनमें कुछ भी बदले बिना: क्या केवल एक में है, केवल दूसरे में है और क्या भिन्न है। वह लिंक का अनुसरण नहीं करता और अलग प्रोसेस में चलता है।',
      carpetaA: 'फ़ोल्डर A',
      carpetaB: 'फ़ोल्डर B',
      elegir: 'फ़ोल्डर चुनें',
      sinElegir: 'चुना नहीं गया',
      comparar: 'तुलना करें',
      comparando: 'तुलना हो रही है…',
      cancelar: 'रद्द करें',
      cancelada: 'तुलना रद्द की गई।',
      iguales: 'दोनों फ़ोल्डर समान हैं।',
      grupoSoloA: 'केवल A में',
      grupoSoloB: 'केवल B में',
      grupoDistintos: 'भिन्न',
      grupo: (nombre, n) => `${nombre} (${n})`,
      vacio: 'कोई नहीं',
      resumen: (a, b, iguales) => `A: ${a} फ़ाइलें · B: ${b} फ़ाइलें · ${iguales} समान`,
      truncado: 'एक सीमा पूरी हो गई (फ़ाइलें, गहराई या आकार): सूची पूरी नहीं है।',
      recortado: (mostrados, total) => `दिखाई गई फ़ाइलों से अधिक फ़ाइलें हैं (${total} में से ${mostrados})।`,
      sinComparar: (n) => `समान आकार वाली ${n} बड़ी फ़ाइलों की सामग्री से तुलना नहीं की गई।`,
      omitidos: (n) => `${n} लिंक, जंक्शन या विशेष आइटम छोड़े गए।`,
      motivoTamano: 'भिन्न आकार',
      motivoContenido: 'समान आकार, भिन्न सामग्री',
      tamano: (a, b) => `A: ${a} · B: ${b}`,
      elegirArchivo: 'उसका अंतर देखने के लिए सूची से कोई “भिन्न” फ़ाइल चुनें।',
      soloEnUno: (lado) => `यह फ़ाइल केवल ${lado} में मौजूद है।`,
      cargando: 'फ़ाइलें पढ़ी जा रही हैं…',
      binario: 'फ़ाइलें भिन्न हैं, पर वे पाठ नहीं हैं: अंतर नहीं दिखाया जाता।',
      sensible:
        'संवेदनशील फ़ाइल (.env, कुंजियाँ या वास्तविक डेटा): वह भिन्न है, पर उसकी सामग्री नहीं दिखाई जाती। आप उसे एडिटर में खोल सकते हैं, जो सुदृढ़ पुष्टि माँगता है।',
      tope: (kb) => `फ़ाइलें भिन्न हैं, पर वे ${kb} KB से बड़ी हैं: पाठ का अंतर नहीं दिखाया जाता।`,
      demasiadoDistinto: 'फ़ाइलें इतनी अलग हैं कि पंक्ति-दर-पंक्ति अंतर नहीं दिखाया जाता।',
      saltos: { lf: 'LF', crlf: 'CRLF', mixto: 'मिश्रित पंक्ति-अंत', ninguno: 'पंक्ति-अंत नहीं' },
      saltosDistintos: (a, b) => `पंक्ति-अंत: A में ${a} है और B में ${b}।`,
      soloSaltos: 'पंक्तियों का पाठ समान है: केवल पंक्ति-अंत (फ़ाइल के अंत वाले सहित) या BOM बदला है।',
      resumenArchivo: (agregadas, quitadas) => `${agregadas} पंक्तियाँ जोड़ी गईं, ${quitadas} हटाई गईं`,
      truncadoArchivo: 'केवल पहली पंक्तियाँ दिखाई गई हैं।',
      lineasIguales: (n) => `… ${n} समान पंक्तियाँ …`,
      abrirA: 'A को एडिटर में खोलें',
      abrirB: 'B को एडिटर में खोलें',
      atajos: '↑ ↓ से आगे बढ़ें, अंतर देखने के लिए Enter, रद्द करने के लिए Esc।',
      listaAria: (grupo) => `फ़ाइलें: ${grupo}`,
      detalleAria: 'फ़ाइल के अंतर',
    },
    clienteHttp: {
      pestanas: {
        etiqueta: 'HTTP क्लाइंट के अनुभाग',
        peticion: 'अनुरोध',
        coleccion: 'कलेक्शन',
        historial: 'इतिहास',
        entornos: 'परिवेश',
      },
      entorno: 'परिवेश',
      sinEntorno: 'कोई परिवेश नहीं',
      metodo: 'मेथड',
      url: 'URL',
      urlPlaceholder: 'https://api.example.test/path या {{base}}/path',
      enviar: 'भेजें',
      enviarAtajo: 'भेजें (Ctrl+Enter)',
      cancelar: 'रद्द करें',
      nueva: 'नया',
      guardar: 'कलेक्शन में सहेजें',
      nombre: 'नाम',
      nombrePlaceholder: 'अनुरोध का नाम',
      guardada: 'अनुरोध सहेजा गया',
      ayudaVariables: 'चुने हुए परिवेश से मान लेने के लिए {{variable}} का उपयोग करें।',
      secciones: {
        params: 'पैरामीटर',
        cabeceras: 'हेडर',
        cuerpo: 'बॉडी',
        auth: 'प्रमाणीकरण',
        opciones: 'विकल्प',
      },
      par: {
        clave: 'नाम',
        valor: 'मान',
        agregar: 'पंक्ति जोड़ें',
        quitar: 'पंक्ति हटाएँ',
        activa: 'पंक्ति चालू',
        falta: 'गोपनीय मान गायब है: भेजने के लिए उसे लिखें।',
      },
      cuerpo: {
        tipo: 'बॉडी का प्रकार',
        ninguno: 'कोई नहीं',
        json: 'JSON',
        form: 'फ़ॉर्म (urlencoded)',
        multipart: 'Multipart (केवल पाठ)',
        raw: 'कच्चा पाठ',
        tipoContenido: 'Content-Type',
        texto: 'सामग्री',
        multipartAyuda: 'केवल पाठ फ़ील्ड: डिस्क की कोई फ़ाइल नहीं भेजी जाती।',
      },
      auth: {
        tipo: 'प्रकार',
        ninguna: 'कोई नहीं',
        bearer: 'Bearer',
        basic: 'Basic',
        apikey: 'API कुंजी',
        token: 'टोकन',
        usuario: 'उपयोगकर्ता',
        clave: 'पासवर्ड',
        nombre: 'हेडर या पैरामीटर का नाम',
        en: 'यहाँ भेजें',
        cabecera: 'हेडर',
        query: 'क्वेरी स्ट्रिंग',
        ayuda:
          'मान सिस्टम द्वारा एन्क्रिप्ट करके रखा जाता है; कलेक्शन, इतिहास और परिवेश केवल उसका संदर्भ रखते हैं।',
      },
      secreto: {
        guardado: 'सहेजा गया (एन्क्रिप्टेड)। बदलने के लिए लिखें।',
        mostrar: 'दिखाएँ',
        ocultar: 'छिपाएँ',
        quitar: 'हटाएँ',
        valor: 'सहेजा गया मान',
        porNombre: 'इसे एन्क्रिप्ट करके सहेजा जाएगा क्योंकि नाम किसी गोपनीय मान जैसा लगता है।',
      },
      opciones: {
        plazo: 'समय-सीमा (सेकंड)',
        plazoAyuda: '1 से 120 सेकंड तक।',
        ignorarCert: 'इस अनुरोध के लिए प्रमाणपत्र की त्रुटियाँ अनदेखी करें',
        ignorarAviso:
          'खतरनाक: कनेक्शन का सत्यापन नहीं होता। यह केवल इस अनुरोध और उसके होस्ट पर लागू होता है। WolfCore की .test साइटें पहले से अपनी CA से सत्यापित हैं।',
        limites:
          'अधिकतम 10 MB का उत्तर और अधिकतम 10 रीडायरेक्ट। कोई सहेजी गई कुकी नहीं और कोई सिस्टम प्रॉक्सी नहीं।',
      },
      respuesta: {
        enviando: 'भेजा जा रहा है…',
        estado: 'स्थिति',
        tiempo: 'समय',
        tamano: 'आकार',
        cuerpo: 'बॉडी',
        cabeceras: 'हेडर',
        redirecciones: 'रीडायरेक्ट',
        vacioTitulo: 'अभी कोई उत्तर नहीं',
        vacioTexto: 'URL लिखें और भेजें दबाएँ। अनुरोध WolfCore Dev से निकलता है।',
        binario: (bytes, tipo) => `${bytes} बाइट का बाइनरी, प्रकार ${tipo || 'अज्ञात'}।`,
        sinCuerpo: 'उत्तर में कोई बॉडी नहीं है।',
        truncada: 'उत्तर 10 MB से अधिक था: उसे काट दिया गया और वह अधूरा है।',
        parcial: (mostrados) => `पहले ${mostrados} वर्ण दिखाए जा रहे हैं।`,
        sinRedirecciones: 'कोई रीडायरेक्ट नहीं हुआ।',
        salto: (n) => `छलाँग ${n}`,
        urlFinal: 'अंतिम URL',
        certIgnorado: 'इस अनुरोध के लिए प्रमाणपत्र की त्रुटियाँ अनदेखी की गईं।',
        caWolf: 'WolfCore Dev की CA से सत्यापित।',
        copiar: 'बॉडी कॉपी करें',
        copiado: 'बॉडी कॉपी की गई',
        formato: 'फ़ॉर्मेट किया गया JSON',
        crudo: 'मूल पाठ',
      },
      curl: {
        copiar: 'curl के रूप में कॉपी करें',
        incluir: 'क्रेडेंशियल शामिल करें',
        incluirAyuda:
          'अचयनित होने पर गोपनीय मान <secreto> के रूप में निकलते हैं। चयनित होने पर कमांड में वास्तविक क्रेडेंशियल होते हैं।',
        copiado: 'curl कमांड कॉपी की गई',
        importar: 'curl इम्पोर्ट करें',
        importarTitulo: 'curl कमांड इम्पोर्ट करें',
        importarAyuda:
          'curl कमांड पेस्ट करें। उसे केवल पाठ के रूप में पढ़ा जाता है: कुछ भी चलाया नहीं जाता। क्रेडेंशियल एन्क्रिप्टेड स्टोर में जाते हैं।',
        importarPlaceholder:
          "curl -X POST https://api.example.test/path -H 'Accept: application/json'",
        importarBoton: 'इम्पोर्ट करें',
        importada: 'अनुरोध कलेक्शन में इम्पोर्ट किया गया',
        avisos: {
          opcion_ignorada: (d) => `विकल्प अनदेखा किया गया: ${d}`,
          archivo_ignorado: (d) => `डिस्क की फ़ाइलें नहीं पढ़ी जातीं: ${d}`,
          inseguro_ignorado:
            '-k/--insecure को अनदेखा किया गया। यदि आपको इसकी ज़रूरत है, तो «प्रमाणपत्र की त्रुटियाँ अनदेखी करें» को हाथ से चालू करें।',
          comando_cortado: 'शेल ऑपरेटर (|, ;, &, >) के बाद का सब कुछ अनदेखा किया गया।',
          sin_evaluar:
            'पाठ में $(…), बैकटिक या शेल वेरिएबल थे: उनका मूल्यांकन नहीं किया जाता और वे पाठ ही रहते हैं।',
          url_sin_esquema: 'URL में स्कीम नहीं थी: http:// का उपयोग किया गया।',
          varias_urls: (d) => `एक अतिरिक्त आर्गुमेंट अनदेखा किया गया: ${d}`,
          cabecera_invalida: (d) => `एक अमान्य हेडर अनदेखा किया गया: ${d}`,
          secretos_guardados:
            'इम्पोर्ट किए गए क्रेडेंशियल एन्क्रिप्ट करके सहेजे गए; कलेक्शन केवल उनका संदर्भ रखता है।',
        },
      },
      coleccion: {
        vacioTitulo: 'कलेक्शन खाली है',
        vacioTexto: 'किसी अनुरोध को हाथ के पास रखने के लिए उसे सहेजें या कोई curl कमांड इम्पोर्ट करें।',
        abrir: 'खोलें',
        borrar: 'हटाएँ',
        borrada: 'अनुरोध हटाया गया',
      },
      historial: {
        vacioTitulo: 'कोई इतिहास नहीं',
        vacioTexto: 'अंतिम 100 अनुरोध यहाँ क्रेडेंशियल के बिना रहते हैं: संवेदनशील हेडर *** के रूप में दिखते हैं।',
        abrir: 'खोलें',
        limpiar: 'इतिहास साफ़ करें',
        sinRespuesta: 'कोई उत्तर नहीं',
      },
      entornos: {
        vacioTitulo: 'कोई परिवेश नहीं',
        vacioTexto:
          'परिवेश {{base}} या {{token}} जैसे वेरिएबल परिभाषित करता है। गोपनीय चिह्नित वेरिएबल एन्क्रिप्ट करके सहेजे जाते हैं।',
        nuevo: 'नया परिवेश',
        nombre: 'परिवेश का नाम',
        variable: 'वेरिएबल',
        valor: 'मान',
        secreta: 'गोपनीय',
        agregar: 'वेरिएबल जोड़ें',
        quitar: 'वेरिएबल हटाएँ',
        guardar: 'परिवेश सहेजें',
        guardado: 'परिवेश सहेजा गया',
        borrar: 'परिवेश हटाएँ',
        borrado: 'परिवेश हटाया गया',
        usar: 'इस परिवेश का उपयोग करें',
        activo: 'सक्रिय',
        sinNombre: 'परिवेश के लिए एक नाम लिखें।',
      },
    },
    imagenes: { nombreCaptura: 'screenshot' },
  },
  doctor: {
    evidencias: {
      texto: '{texto}',
      puerto_dueno: 'पोर्ट {puerto}: {proceso} (PID {pid})',
      puerto_dueno_exe: 'पोर्ट {puerto}: {proceso} (PID {pid}) — {ejecutable}',
      rango_reservado: 'आरक्षित रेंज {desde}-{hasta} ({puerto} सहित)',
      ca_vencida: 'CA की अवधि {dias} दिन पहले समाप्त हो गई',
      ca_por_vencer: 'CA की अवधि {dias} दिनों में समाप्त होगी',
      certificado_vencido: '{dominio} के प्रमाणपत्र की अवधि {dias} दिन पहले समाप्त हो गई',
      certificado_por_vencer: '{dominio} के प्रमाणपत्र की अवधि {dias} दिनों में समाप्त होगी',
      firefox_perfiles: 'भरोसे के बिना Firefox प्रोफ़ाइल:',
      firefox_perfil: '{perfil}',
      firefox_perfil_abierto: '{perfil} (खुला है)',
      firefox_perfil_fuera: '{perfil} (Firefox फ़ोल्डर के बाहर)',
      hosts_ilegible: '{ruta}: पढ़ा नहीं जा सका ({motivo})',
      hosts_codificacion: '{ruta}: {codificacion} एन्कोडिंग',
      hosts_bloques: '{ruta}: WolfCore Dev के {bloques} ब्लॉक',
      hosts_sin_cierre: '{ruta}: WolfCore Dev के एक ब्लॉक में समापन चिह्न नहीं है',
      hosts_faltan: 'hosts में गायब: {dominios}',
      hosts_solo_lectura: '{ruta}: केवल-पठन विशेषता',
      path_repetidas: 'दोहराए गए: {entradas}',
      path_delante: '{entrada} WolfCore Dev के टूल से पहले आता है और उसमें {programa} भी है',
      antivirus_sin_leer: 'एंटीवायरस सक्रिय है; उसके अपवाद पढ़े नहीं जा सके (एडमिनिस्ट्रेटर चाहिए)।',
      antivirus_sin_exclusion: 'एंटीवायरस सक्रिय है और WolfCore Dev का डेटा फ़ोल्डर अपवाद में नहीं है।',
      enlazador_ausente: 'Visual Studio Build Tools के C++ टूल नहीं मिले।',
      vcredist_ausente: 'Microsoft Visual C++ 2015-2022 (x64) इंस्टॉल नहीं है।',
      firewall_no_comprobado: 'फ़ायरवॉल नियम पढ़े नहीं जा सके (एडमिनिस्ट्रेटर की ज़रूरत हो सकती है)।',
      firewall_reglas: 'WolfCore Dev: {propias} · WolfCore परीक्षणों के बचे हुए: {pruebas}',
      firewall_acotadas: 'लोकल नेटवर्क तक सीमित नियम:',
      firewall_ajenas: 'अन्य प्रोग्रामों के नियम:',
      firewall_quitadas: 'हटाए गए नियम जिन्हें बहाल किया जा सकता है:',
    },
    ver: 'देखें',
    verPuertos: 'पोर्ट देखें',
    dialogo: {
      reglas: 'प्रभावित नियम: जिन्हें आप छूना नहीं चाहते उनका चयन हटाएँ।',
      sinSeleccion: 'आगे बढ़ने के लिए कम से कम एक नियम चुनें।',
      reglasNota:
        'आपकी पुष्टि और एडमिनिस्ट्रेटर अनुमति के बिना कुछ नहीं बदलता। यदि कोई नियम दिखाए जाने के बाद बदल गया हो, तो उसे छोड़ दिया जाता है।',
    },
    reparaciones: {
      firewall:
        'उन इनबाउंड फ़ायरवॉल नियमों को एक-एक करके और उनके सटीक नाम से हटाएँ। पहले सुरक्षित रजिस्ट्री कुंजी HKLM\\SOFTWARE\\WolfCoreDev\\Cortafuegos में एक प्रति सहेजी जाती है ताकि उन्हें फिर से बनाया जा सके। अन्य प्रोग्रामों के नियमों को कभी नहीं छुआ जाता।',
      firewall_restaurar:
        'आपके चुने नियमों को सुरक्षित प्रति से (etc/ की फ़ाइल से नहीं) उसी प्रोग्राम, प्रोफ़ाइल, प्रोटोकॉल, पोर्ट और पतों के साथ फिर से बनाएँ जो दिखाए गए हैं। वे प्रोग्राम फिर से नेटवर्क कनेक्शन स्वीकार कर सकेंगे।',
    },
  },
  versiones: {
    avisoMaven:
      'WolfCore Dev Maven को सीधे JDK के साथ चलाता है और सुरक्षा के लिए .mvn/jvm.config या MAVEN_OPTS वेरिएबल नहीं पढ़ता। यदि आपके प्रोजेक्ट को उनकी ज़रूरत है, तो Maven को टर्मिनल से चलाएँ।',
    avisoRuby:
      'Ruby, Devkit (MSYS2) के बिना और आपके PATH या Windows रजिस्ट्री को छुए बिना इंस्टॉल होता है: कोई इंस्टॉलर नहीं है। जिन नेटिव एक्सटेंशन वाले gem का पहले से बना बाइनरी नहीं है, उन्हें Devkit चाहिए। यह एक मैन्युअल चरण है: प्रोजेक्ट से टर्मिनल खोलें और "ridk install" चलाएँ (यह आपके कंप्यूटर पर MSYS2 इंस्टॉल करता है और इंटरनेट से डाउनलोड करता है)।',
    avisoJdk:
      'Maven और Gradle WolfCore Dev के JDK से चलते हैं, और अभी कोई इंस्टॉल नहीं है। सेवाओं की सूची से Java (Temurin) इंस्टॉल करें।',
    avisoMeilisearch:
      'Meilisearch के प्रत्येक माइनर संस्करण का अपना डेटा होता है। यदि आप किसी दूसरे माइनर संस्करण पर जाते हैं (उदाहरण के लिए 1.58 से 1.59), तो उसके इंडेक्स और MEILISEARCH_KEY नए होंगे: आपको दोबारा इंडेक्स करना होगा और अपने प्रोजेक्ट्स का .env अपडेट करना होगा।',
    servicios: { meilisearch: 'Meilisearch', ruby: 'Ruby', maven: 'Maven', gradle: 'Gradle' },
    anteriores: (n) => `पहले के पैच (${n})`,
  },
  memoria: {
    boton: 'मेमोरी',
    tituloBoton: 'मेमोरी ऑप्टिमाइज़ करें',
    titulo: 'मेमोरी ऑप्टिमाइज़र',
    intro:
      'कोई मोड चुनें और सूची देखें। आपकी पुष्टि तक कुछ भी बंद या रोका नहीं जाता, और वह अपने-आप कभी नहीं चलता।',
    modo: 'मोड',
    modos: { liviano: 'हल्का', moderado: 'मध्यम', profundo: 'गहरा' },
    descripciones: {
      liviano: 'ऐप का कैश साफ़ करता है। यह डिस्क की जगह खाली करता है; कुछ भी बंद या रोकता नहीं।',
      moderado:
        'साथ ही केवल एक PHP वर्कर रखने और बिना गतिविधि या कनेक्शन वाली WolfCore Dev सेवाओं को रोकने का सुझाव देता है। सेवाएँ अचयनित रूप से शुरू होती हैं।',
      profundo:
        'साथ ही आपके अपने अधिक मेमोरी लेने वाले प्रोग्राम सूचीबद्ध करता है ताकि आप उनसे उनकी विंडो बंद करने को कह सकें। वे अचयनित रूप से शुरू होते हैं।',
    },
    ver: 'सूची दिखाएँ',
    revisando: 'जाँच हो रही है…',
    vacio: 'इस मोड में खाली करने के लिए कुछ नहीं है।',
    tipos: {
      'cache-app': 'कैश साफ़ करें',
      'reducir-pool': 'केवल एक वर्कर रखें',
      'detener-inactivo': 'रोकें (निष्क्रिय)',
      'cerrar-programa': 'विंडो बंद करने को कहें',
    },
    caches: { sesion: 'ऐप सत्र का HTTP कैश' },
    estimado: (cantidad) => `लगभग ${cantidad} RAM खाली होगी`,
    estimadoDisco: (cantidad) => `साथ ही लगभग ${cantidad} डिस्क (कैश RAM नहीं है)`,
    marcadas: (n, total) => `${total} में से ${n} चयनित`,
    sinDatos:
      'सेवाएँ रोकने या PHP घटाने का सुझाव देने के लिए अभी पर्याप्त गतिविधि डेटा नहीं है। होम को कुछ मिनट खुला रखें और फिर देखें।',
    listadoFallido: 'खुले प्रोग्रामों की सूची पढ़ी नहीं जा सकी: यह सूची अधूरी हो सकती है। फिर से प्रयास करें।',
    avisoDetener:
      'निष्क्रिय सेवाएँ अचयनित रूप से शुरू होती हैं: किसी सेवा को रोकने से वह सब कट जाता है जो उसका उपयोग करता है। केवल वही सूचीबद्ध हैं जिनका अभी कोई कनेक्शन नहीं है।',
    avisoCerrar:
      'प्रोग्रामों से केवल उनकी विंडो बंद करने को कहा जाता है, जैसे X पर क्लिक करना: वे पूछ सकते हैं कि सहेजना है या नहीं। किसी प्रोग्राम को कभी बलपूर्वक बंद नहीं किया जाता।',
    protegidos:
      'सिस्टम प्रोग्राम, Windows सेवाएँ, उच्चाधिकार वाले प्रोग्राम, अन्य उपयोगकर्ता, FlyEnv, PhpWebStudy और WolfCore Dev (या उनके द्वारा शुरू की गई कोई भी चीज़) कभी सूची में नहीं आते।',
    aplicar: 'चयनित लागू करें',
    confirmarTitulo: 'ये क्रियाएँ लागू करें?',
    confirmarTexto: (n) => (n === 1 ? 'सूची की 1 क्रिया चलेगी।' : `सूची की ${n} क्रियाएँ चलेंगी।`),
    confirmarCerrar: (nombres) => `इन प्रोग्रामों से उनकी विंडो बंद करने को कहा जाएगा: ${nombres}।`,
    confirmarDetener: (nombres) => `ये सेवाएँ रोकी जाएँगी: ${nombres}।`,
    confirmar: 'हाँ, लागू करें',
    cancelar: 'रद्द करें',
    resultadoTitulo: 'परिणाम',
    liberado: (cantidad) => `अनुमानित: लगभग ${cantidad} RAM खाली हुई`,
    liberadoDisco: (cantidad) => `साथ ही लगभग ${cantidad} डिस्क`,
    notaPedido:
      'आपकी प्रतीक्षा में: विंडो बंद करने को कहा गया और प्रोग्राम अब भी खुला है (शायद वह पूछ रहा है कि सहेजना है या नहीं)। इसे खाली हुआ नहीं गिना जाता।',
    estados: { hecho: 'हो गया', pedido: 'आपकी प्रतीक्षा में', saltado: 'छोड़ा गया', error: 'विफल' },
    motivos: {
      no_en_plan: 'यह सूची में नहीं था',
      protegido: 'यह एक संरक्षित प्रोग्राम है',
      cambio: 'सूची दिखाए जाने के बाद यह बदल गया',
      sin_ventana: 'इसके पास अब बंद करने के लिए कोई विंडो नहीं है',
      ya_apagado: 'घटाने के लिए कुछ बचा नहीं था',
      ocupado: 'यह व्यस्त था (इसके कनेक्शन हैं)',
      no_se_pudo: 'बंद करने का अनुरोध नहीं भेजा जा सका (प्रोग्राम उच्चाधिकारों के साथ चल रहा है)',
    },
    otraVez: 'फिर से शुरू करें',
  },
  guias: {
    tuneles: { titulo: 'टनल गाइड', copiar: 'कमांड कॉपी करें' },
    http: {
      buscar: 'संख्या, नाम या पाठ से खोजें',
      familia: 'परिवार',
      todas: 'सभी',
      verMetodos: 'मेथड',
      verCodigos: 'स्टेटस कोड',
      resultados: (n) => `${n} परिणाम`,
      vacio: 'खोज से कुछ मेल नहीं खाता।',
      seguro: 'सुरक्षित',
      noSeguro: 'असुरक्षित',
      idempotente: 'इडेम्पोटेंट',
      noIdempotente: 'गैर-इडेम्पोटेंट',
      noEstandar: 'गैर-मानक',
      broma: 'मज़ाकिया कोड (RFC 2324)',
      causas: 'आम कारण',
      solucion: 'इसे कैसे ठीक करें',
      ejemplo: 'उदाहरण',
      copiarEjemplo: 'उदाहरण कॉपी करें',
      probar: 'आज़माएँ',
      probarTitulo: 'इस उदाहरण को HTTP क्लाइंट में आज़माएँ (आपके भेजें दबाने तक कुछ नहीं भेजा जाता)',
      servidorActivo: (puerto) =>
        `जब तक आप गाइड या HTTP क्लाइंट का उपयोग करते हैं, उदाहरण सर्वर 127.0.0.1:${puerto} पर चल रहा है। वह केवल इसी कंप्यूटर से पहुँचने योग्य है और आपके बाहर निकलने पर या 10 मिनट अनुपयोग के बाद रुक जाता है।`,
      sinTraduccion: 'इस भाषा में अनुवादित नहीं है: अंग्रेज़ी में दिखाया गया है।',
      familias: {
        '1xx': '1xx सूचनात्मक',
        '2xx': '2xx सफलता',
        '3xx': '3xx रीडायरेक्शन',
        '4xx': '4xx क्लाइंट त्रुटि',
        '5xx': '5xx सर्वर त्रुटि',
      },
    },
    git: {
      buscar: 'कोई विषय या कमांड खोजें',
      verGuia: 'गाइड',
      verLaboratorio: 'लैब',
      todos: 'सभी',
      grupos: {
        basico: 'बुनियादी बातें',
        ramas: 'ब्रांच',
        deshacer: 'पूर्ववत करना',
        remotos: 'रिमोट और टैग',
        github: 'GitHub',
      },
      resultados: (n) => `${n} विषय`,
      vacio: 'खोज से कुछ मेल नहीं खाता।',
      ejemplo: 'उदाहरण',
      errores: 'आम गलतियाँ',
      copiarEjemplo: 'उदाहरण कॉपी करें',
      peligroso: 'खतरनाक',
      sinTraduccion: 'इस भाषा में अनुवादित नहीं है: अंग्रेज़ी में दिखाया गया है।',
      avisoGithub:
        'यह भाग केवल स्पष्टीकरण है: WolfCore Dev इस गाइड से खाते नहीं बनाता, GitHub में साइन इन नहीं करता और टोकन का उपयोग नहीं करता। उदाहरणों में दिए नाम और मान काल्पनिक हैं।',
      irLaboratorio: 'लैब में अभ्यास करें',
      lab: {
        intro:
          'एक अभ्यास रिपॉज़िटरी और एक लोकल “रिमोट”, WolfCore Dev के अपने फ़ोल्डर में। यह इंटरनेट या GitHub का उपयोग नहीं करता, और आपके प्रोजेक्ट्स या आपकी git सेटिंग्स को नहीं छूता।',
        sinGit: {
          titulo: 'Git इंस्टॉल नहीं है',
          texto:
            'लैब आपके सिस्टम के git का उपयोग करती है और उसके बिना नहीं खुल सकती। Git इंस्टॉल करें और यह टैब फिर से खोलें; WolfCore Dev आपके लिए कुछ इंस्टॉल नहीं करता।',
        },
        cargando: 'लैब तैयार हो रही है…',
        reiniciar: 'लैब रीसेट करें',
        reiniciarAyuda: 'केवल अभ्यास फ़ोल्डर हटाता है और उसे नया जैसा छोड़ देता है।',
        reiniciado: 'लैब रीसेट हो गई।',
        version: (v) => `git ${v}`,
        ordenes: 'कमांड',
        mensaje: 'commit संदेश',
        mensajePorDefecto: 'अभ्यास बदलाव',
        rama: 'ब्रांच',
        etiqueta: 'टैग',
        archivo: 'फ़ाइल',
        grupos: {
          basico: 'बुनियादी बातें',
          ramas: 'ब्रांच',
          guardar: 'सहेजना और पूर्ववत करना',
          remoto: 'लोकल रिमोट',
        },
        archivos: {
          titulo: 'अभ्यास फ़ाइलें',
          ayuda: 'केवल इन फ़ाइलों को संपादित किया जा सकता है, अधिकतम 2000 वर्णों के पाठ के साथ।',
          guardar: 'फ़ाइल सहेजें',
          guardado: 'फ़ाइल सहेजी गई।',
          areaTexto: (n) => `${n} की सामग्री`,
        },
        salida: 'आउटपुट',
        salidaVacia: 'git का उत्तर यहाँ देखने के लिए कोई कमांड दबाएँ।',
        codigo: (n) => (n === 0 ? 'ठीक से पूरा हुआ' : `कोड ${n} के साथ समाप्त हुआ`),
        truncada: 'आउटपुट बीच में काट दिया गया।',
        historial: 'इतिहास',
        historialVacio: 'अभी तक कोई commit नहीं है: git init, git add और git commit चलाएँ।',
        conflicto: {
          titulo: 'निर्देशित अभ्यास: एक टकराव',
          intro: 'दो ब्रांच एक ही पंक्ति बदलती हैं। आप देखेंगे कि टकराव कैसे दिखता है और उसे कैसे सुलझाया जाता है।',
          paso: (n, total) => `चरण ${n} / ${total}`,
          ejecutar: 'यह चरण चलाएँ',
          hecho: 'हो गया',
          reempezar: 'फिर से शुरू करें',
          esperado: 'Git ने टकराव की सूचना दी: इस चरण में यह अपेक्षित है।',
          elegir: { mia: 'main वाली रखें (हरी)', otra: 'rama-a वाली रखें (लाल)', ambas: 'दोनों रखें' },
          final: 'हो गया: आपने एक टकराव सुलझा लिया। इतिहास देखें।',
          pasos: [
            {
              titulo: 'लैब तैयार करें',
              texto: 'लैब रीसेट होती है और colores.txt (“color: azul”) के साथ पहला commit बनता है।',
            },
            {
              titulo: 'rama-a पर पंक्ति बदलें',
              texto: 'rama-a ब्रांच बनती है, पंक्ति “color: rojo” हो जाती है और उसका commit किया जाता है।',
            },
            {
              titulo: 'main पर वही पंक्ति बदलें',
              texto:
                'main पर लौटा जाता है, पंक्ति “color: verde” हो जाती है और उसका commit किया जाता है।',
            },
            {
              titulo: 'मर्ज आज़माएँ',
              texto:
                'rama-a को main में मर्ज किया जाता है। Git तय नहीं कर पाता कि कौन-सी पंक्ति रखे और एक टकराव छोड़ देता है।',
            },
            {
              titulo: 'एक संस्करण चुनें',
              texto: 'चुनें कि पंक्ति का कौन-सा संस्करण रखना है। colores.txt में अब टकराव के चिह्न हैं।',
            },
            {
              titulo: 'समाधान की पुष्टि करें',
              texto: 'colores.txt स्टेज की जाती है (add) और मर्ज को पूरा करने वाला commit बनता है।',
            },
          ],
        },
      },
    },
  },
  editorCodigo: {
    intro: (mb) =>
      `टेक्स्ट फ़ाइलों के लिए हाइलाइटिंग वाला एक हल्का एडिटर, ${mb} MB तक की फ़ाइलों के लिए। फ़ाइल को सिस्टम डायलॉग में चुनें; सहेजते समय हमेशा पुष्टि माँगी जाती है और पहले WolfCore Dev के डेटा फ़ोल्डर में एक प्रति रखी जाती है।`,
    abrir: 'फ़ाइल खोलें…',
    abriendo: 'खुल रही है…',
    guardar: 'सहेजें',
    guardando: 'सहेजा जा रहा है…',
    recargar: 'डिस्क से फिर लोड करें',
    vacio: 'संपादन शुरू करने के लिए कोई फ़ाइल खोलें।',
    sinCambios: 'कोई बदलाव नहीं',
    conCambios: 'बिना सहेजे बदलाव',
    posicion: (linea, columna) => `पंक्ति ${linea}, स्तंभ ${columna}`,
    areaTexto: (nombre) => `कोड एडिटर: ${nombre}`,
    salirTeclado: 'कीबोर्ड से एडिटर से बाहर निकलने के लिए Esc और फिर Tab दबाएँ।',
    guardado: 'फ़ाइल सहेजी गई।',
    copiaPrevia: (ruta) => `बैकअप प्रति: ${ruta}`,
    cancelar: 'रद्द करें',
    enlaceDuro:
      'डिस्क पर इस फ़ाइल के एक से अधिक नाम हैं (हार्ड लिंक)। उसे सहेजने से वह लिंक टूट जाता है: बाकी नाम पुरानी सामग्री ही रखते हैं।',
    saltosMixtos: {
      aviso: 'इस फ़ाइल में पंक्ति-अंत मिले हुए हैं। सहेजने पर वे सभी LF में एक समान हो जाते हैं।',
      aceptar: 'मैं पंक्ति-अंत को एक समान करना स्वीकार करता हूँ',
    },
    envGestor: {
      aviso:
        '.env फ़ाइलें प्रोजेक्ट के वेरिएबल में, उनके गोपनीय मानों वाले प्रवाह के साथ संपादित होती हैं। यह बटन प्रोजेक्ट के रूट की .env खोलता है, जो वह फ़ाइल नहीं हो सकती जिसे आपने खोलने की कोशिश की थी।',
      boton: 'प्रोजेक्ट के रूट की .env खोलें',
    },
    huellaPerdida: 'सहेजा गया, पर नई फ़िंगरप्रिंट पढ़ी नहीं जा सकी: फ़ाइल फिर से लोड की गई।',
    confirmarGuardar: {
      titulo: 'बदलाव सहेजें',
      texto: (nombre) =>
        `${nombre} लिखी जाने वाली है। पहले, डिस्क पर अभी जो है उसकी एक प्रति WolfCore Dev के डेटा फ़ोल्डर में सहेजी जाती है।`,
      boton: 'बैकअप प्रति के साथ सहेजें',
    },
    refuerzo: {
      abrirTitulo: 'संवेदनशील फ़ाइल',
      guardarTitulo: 'संवेदनशील फ़ाइल सहेजें',
      secreto:
        'यह फ़ाइल गोपनीय जानकारी (निजी कुंजियाँ, टोकन या क्रेडेंशियल) वाली लगती है। उसकी सामग्री स्क्रीन पर दिखाई जाएगी।',
      datosReales:
        'यह फ़ाइल उस साइट की है जिसे वास्तविक डेटा वाली चिह्नित किया गया है। कोई गलत बदलाव वास्तविक जानकारी को प्रभावित कर सकता है।',
      instruccion: (nombre) => `आगे बढ़ने के लिए फ़ाइल का नाम लिखें: ${nombre}`,
      etiqueta: 'फ़ाइल का नाम',
      abrirBoton: 'फिर भी खोलें',
      guardarBoton: 'फिर भी सहेजें',
    },
    cambioExterno: {
      titulo: 'फ़ाइल एडिटर के बाहर बदल गई',
      texto:
        'आपके खोलने के बाद किसी अन्य प्रोग्राम ने उसे बदला है, इसलिए कुछ भी सहेजा नहीं गया। आप उसे फिर से लोड कर सकते हैं (आपके बदलाव खो जाएँगे) या यहाँ जो आपके पास है उससे उसे ओवरराइट कर सकते हैं।',
      recargar: 'फिर लोड करें और मेरे बदलाव छोड़ दें',
      sobrescribir: 'ओवरराइट करें…',
      sobrescribirTitulo: 'फ़ाइल ओवरराइट करें',
      sobrescribirTexto:
        'दूसरे प्रोग्राम द्वारा किए गए बदलाव खो जाएँगे। उसकी वर्तमान सामग्री बैकअप प्रति में रहेगी।',
      sobrescribirBoton: 'हाँ, ओवरराइट करें',
      volver: 'वापस जाएँ',
    },
    descartar: {
      titulo: 'बिना सहेजे बदलाव',
      texto: 'एडिटर में बिना सहेजे बदलाव हैं। यदि आप आगे बढ़ते हैं, तो वे खो जाएँगे।',
      confirmar: 'बदलाव छोड़ें',
      seguir: 'संपादन जारी रखें',
    },
    cm: {
      'Control character': 'नियंत्रण वर्ण',
      'Selection deleted': 'चयन हटाया गया',
      'Go to line': 'पंक्ति पर जाएँ',
      go: 'जाएँ',
      Find: 'खोजें',
      Replace: 'बदलें',
      next: 'अगला',
      previous: 'पिछला',
      all: 'सभी',
      'match case': 'अक्षर-भेद मिलाएँ',
      regexp: 'रेगुलर एक्सप्रेशन',
      'by word': 'पूरे शब्द से',
      replace: 'बदलें',
      'replace all': 'सभी बदलें',
      close: 'बंद करें',
      'current match': 'वर्तमान मिलान',
      'on line': 'पंक्ति पर',
      'replaced match on line $': 'पंक्ति $ पर मिलान बदला गया',
      'replaced $ matches': '$ मिलान बदले गए',
      'folded code': 'समेटा हुआ कोड',
      unfold: 'फैलाएँ',
      to: 'से',
    },
  },
  limpiezaDisco: {
    intro:
      'पहले यह विश्लेषण करता है और दिखाता है कि प्रत्येक आइटम कितना लेता है। आपकी पुष्टि तक कुछ भी हटाया नहीं जाता, और वह कभी अपने-आप या बैकग्राउंड में नहीं चलता।',
    analizar: 'विश्लेषण करें',
    analizando: 'विश्लेषण हो रहा है…',
    cancelarAnalisis: 'रद्द करें',
    vacio: 'साफ़ करने के लिए कुछ नहीं है।',
    categorias: {
      temp: {
        nombre: 'अस्थायी फ़ाइलें',
        ayuda:
          'आपके TEMP फ़ोल्डर की 24 घंटे से पुरानी फ़ाइलें। स्थायी रूप से हटाई जाती हैं; वे अपने-आप फिर बन जाती हैं।',
      },
      'cache-chrome': {
        nombre: 'Google Chrome कैश',
        ayuda: 'केवल प्रत्येक प्रोफ़ाइल के कैश फ़ोल्डर; कुकी, पासवर्ड या इतिहास कभी नहीं।',
      },
      'cache-edge': {
        nombre: 'Microsoft Edge कैश',
        ayuda: 'केवल प्रत्येक प्रोफ़ाइल के कैश फ़ोल्डर; कुकी, पासवर्ड या इतिहास कभी नहीं।',
      },
      'cache-brave': {
        nombre: 'Brave कैश',
        ayuda: 'केवल प्रत्येक प्रोफ़ाइल के कैश फ़ोल्डर; कुकी, पासवर्ड या इतिहास कभी नहीं।',
      },
      'cache-firefox': {
        nombre: 'Firefox कैश',
        ayuda: 'केवल प्रत्येक प्रोफ़ाइल का cache2 फ़ोल्डर; कुकी, पासवर्ड या इतिहास कभी नहीं।',
      },
      'wolfcore-descargas': {
        nombre: 'WolfCore Dev के कैश किए हुए डाउनलोड',
        ayuda: 'बिखरे हुए आर्काइव जो अब उपयोग में नहीं हैं। रीसायकल बिन में भेजे जाते हैं।',
      },
      'wolfcore-registros': {
        nombre: 'WolfCore Dev के लॉग',
        ayuda: '30 दिन से पुराने लॉग। रीसायकल बिन में भेजे जाते हैं।',
      },
      prefetch: {
        nombre: 'Windows Prefetch',
        ayuda:
          'वैकल्पिक। Windows इसे फिर बना लेता है, पर इसके लिए WolfCore Dev का एडमिनिस्ट्रेटर के रूप में चलना ज़रूरी है।',
      },
    },
    bloqueos: {
      'navegador-abierto':
        'ब्राउज़र खुला है या बैकग्राउंड में चल रहा है: उसका कैश साफ़ करने के लिए उसे पूरी तरह बंद करें (Edge में स्टार्टअप बूस्ट और बैकग्राउंड एक्सटेंशन भी बंद करें)',
      'requiere-admin': 'WolfCore Dev को एडमिनिस्ट्रेटर के रूप में चलाना आवश्यक है',
      'ruta-vetada': 'संरक्षित पथ: साफ़ नहीं किया गया',
      'temp-no-seguro':
        'TEMP वेरिएबल ऐसे फ़ोल्डर की ओर इशारा करता है जो उपयोगकर्ता का अस्थायी फ़ोल्डर नहीं है (दस्तावेज़, पूरी ड्राइव, नेटवर्क पथ…): साफ़ नहीं किया गया',
    },
    borradoDefinitivo: 'स्थायी रूप से हटाया जाता है (वे अपने-आप फिर बन जाते हैं)',
    borradoPapelera: 'सिस्टम के रीसायकल बिन में भेजा जाता है',
    archivos: (n) => (n === 1 ? '1 फ़ाइल' : `${n} फ़ाइलें`),
    carpetas: 'फ़ोल्डर के अनुसार',
    truncado: 'विश्लेषण फ़ाइल सीमा पर रुक गया: दिखाए गए से अधिक हैं।',
    marcadas: (n, t) => `${t} में से ${n} श्रेणियाँ चयनित`,
    total: (b) => `लगभग ${b} खाली होगा`,
    limpiar: 'चयनित साफ़ करें',
    confirmarTitulo: 'इन श्रेणियों को साफ़ करें?',
    confirmarTexto: (n) => `${n} श्रेणियाँ साफ़ की जाएँगी।`,
    confirmarDefinitivo: 'TEMP और कैश स्थायी रूप से हटाए जाते हैं (वे अपने-आप फिर बन जाते हैं)।',
    confirmarPapelera: 'WolfCore Dev के लॉग और डाउनलोड रीसायकल बिन में जाते हैं।',
    confirmarPrefetch:
      'Prefetch: Windows इसे फिर बना लेता है, पर प्रोग्रामों की पहली शुरुआतें थोड़ी धीमी हो सकती हैं।',
    confirmar: 'हाँ, साफ़ करें',
    cancelar: 'रद्द करें',
    detener: 'सफ़ाई रोकें',
    resultadoTitulo: 'परिणाम',
    liberado: (b) => `खाली किया गया: ${b}`,
    enPapelera: (b) => `इसमें से ${b} रीसायकल बिन में है (उसे खाली करने पर जगह वापस मिलती है)।`,
    saltados: (n) => `${n} फ़ाइलें छोड़ी गईं`,
    cancelado: 'सफ़ाई रद्द की गई: जो पहले हट चुका है वह हटा ही रहता है।',
    topeEjecucion: 'प्रति-रन फ़ाइल सीमा पूरी हो गई: जारी रखने के लिए फिर से विश्लेषण करें और साफ़ करें।',
    registroFallido:
      'सफ़ाई का लॉग अब लिखा नहीं जा सका, इसलिए सफ़ाई रुक गई: जो हटाया गया उसका लॉग उस बिंदु तक दर्ज है।',
    motivos: {
      'en-uso': 'उपयोग में है',
      enlace: 'लिंक या रीपार्स पॉइंट (अनुसरण नहीं किया गया)',
      protegido: 'संरक्षित (.env, FlyEnv या समान)',
      cambio: 'विश्लेषण के बाद बदल गया',
      'sin-papelera': 'रीसायकल बिन उपलब्ध नहीं है',
      ilegible: 'पढ़ा नहीं जा सका',
      error: 'हटाते समय त्रुटि',
    },
    verRegistros: 'लॉग देखें',
    registroEn: (r) => `इस सफ़ाई का लॉग: ${r}`,
    otraVez: 'फिर से शुरू करें',
    protegidas:
      'इन्हें कभी नहीं छुआ जाता: डेटा, बैकअप, प्रोजेक्ट्स, डेटाबेस या .env फ़ाइलें। लिंक का अनुसरण नहीं किया जाता और इस सूची के पथों के बाहर कुछ नहीं छुआ जाता।',
  },
  preferencias: {
    asistente: 'स्वागत टूर',
    asistenteAyuda: 'मुख्य स्क्रीनों का टूर फिर से देखें: सेवाएँ, प्रोजेक्ट्स, डेटाबेस, टूल और Doctor।',
    asistenteAbrir: 'टूर देखें',
    avanzadas: 'उन्नत अनुभाग दिखाएँ',
    avanzadasAyuda: 'साइडबार में कम उपयोग होने वाली स्क्रीनें जोड़ता है, जैसे कंटेनर। वे Ctrl+K से भी पहुँच में हैं।',
  },
  paleta: {
    irAServicio: (nombre) => `${nombre} सेवा पर जाएँ`,
    irAProyecto: (nombre) => `प्रोजेक्ट ${nombre} पर जाएँ`,
    versionesDe: (nombre) => `${nombre} के संस्करण`,
    asistente: 'स्वागत टूर देखें',
  },
  env: { bloques: { meilisearch: 'Meilisearch (अपनी कुंजी के साथ)' } },
  estadosVacios: {
    basesSinMotor: {
      titulo: 'अभी कोई डेटाबेस इंजन नहीं',
      texto:
        'अपने प्रोजेक्ट्स के डेटाबेस बनाने और प्रबंधित करने के लिए सेवाएँ से MySQL, MariaDB, PostgreSQL या MongoDB इंस्टॉल करें।',
      accion: 'सेवाएँ पर जाएँ',
    },
    serviciosVacio: {
      titulo: 'अभी कोई सेवा इंस्टॉल नहीं है',
      texto:
        'सेवाएँ (Nginx, PHP, डेटाबेस…) ही आपकी साइटों को चलाती हैं। Nginx और PHP से, या किसी डेटाबेस से शुरुआत करें।',
      accion: 'सेवा इंस्टॉल करें',
    },
    registrosSinFuentes: {
      titulo: 'अभी कोई लॉग नहीं',
      texto:
        'जैसे ही कोई सेवा, साइट या प्रोसेस अपनी पहली पंक्ति लिखती है, लॉग यहाँ दिखने लगते हैं। कोई सेवा चालू करें और लौट आएँ।',
      accion: 'सेवाएँ पर जाएँ',
    },
    registrosElegir: {
      titulo: 'कोई लॉग चुनें',
      texto: 'उसकी पंक्तियाँ लाइव देखने के लिए ऊपर के चयनकर्ता में कोई स्रोत चुनें।',
      accion: '',
    },
    depuracionVacio: {
      titulo: 'अभी कोई डंप नहीं आया',
      texto:
        'जब कोई साइट dump(), dd() या wd() चलाती है, तो डंप तुरंत यहाँ दिखता है। अपनी साइट खोलें और वह कोड चलाएँ।',
      accion: '',
    },
    depuracionApagado: {
      titulo: 'कैप्चर बंद है',
      texto:
        'कैप्चर चालू होने पर आपकी साइटों के dump() और dd() कॉल ब्राउज़र को छुए बिना यहाँ पहुँचते हैं। इसे चालू करें और कोई साइट शुरू करें।',
      accion: 'कैप्चर चालू करें',
    },
    depuracionElegir: {
      titulo: 'कोई डंप चुनें',
      texto: 'उसकी सामग्री, फ़ाइल और स्रोत URL देखने के लिए सूची से कोई डंप चुनें।',
      accion: '',
    },
    erroresVacio: {
      titulo: 'लॉग में कोई त्रुटि नहीं',
      texto:
        'PHP, Nginx और प्रोजेक्ट की त्रुटियाँ लिखे जाते ही यहाँ समूहबद्ध होकर दिखती हैं। खाली सूची अच्छी खबर है।',
      accion: '',
    },
    erroresElegir: {
      titulo: 'कोई त्रुटि चुनें',
      texto: 'उसका ट्रेस देखने और फ़ाइल को एडिटर में खोलने के लिए सूची से कोई त्रुटि चुनें।',
      accion: '',
    },
    doctorSinRevision: {
      titulo: 'अभी कोई जाँच नहीं चली',
      texto:
        'Doctor पोर्ट, होस्ट, प्रमाणपत्र और संस्करण जाँचता है और बताता है कि जो विफल हो उसे कैसे ठीक करें। पहली जाँच चलाएँ।',
      accion: 'अभी जाँचें',
    },
    doctorSinHallazgos: {
      titulo: 'सब ठीक है',
      texto: 'पिछली जाँच में कोई समस्या नहीं मिली। यदि कुछ जवाब देना बंद कर दे तो फिर जाँचें।',
      accion: 'फिर जाँचें',
    },
    contenedoresVacio: {
      titulo: 'कोई कंटेनर नहीं',
      texto:
        'इस कंप्यूटर के Docker या Podman कंटेनर यहाँ दिखते हैं। docker run या docker compose से एक बनाएँ और रीफ़्रेश दबाएँ।',
      accion: 'रीफ़्रेश करें',
    },
    avisos: {
      titulo: 'कोई सूचना नहीं',
      texto: 'सेवाओं का बंद होना, व्यस्त पोर्ट और समाप्त होने वाले प्रमाणपत्र यहाँ दिखेंगे।',
      accion: '',
    },
    instantaneas: {
      titulo: 'अभी कोई स्नैपशॉट नहीं',
      texto:
        'स्नैपशॉट इस डेटाबेस की स्थिति सहेजता है ताकि कुछ गलत होने पर आप पीछे लौट सकें। ऊपर के बटन से पहला स्नैपशॉट लें।',
      accion: '',
    },
    basesSinBases: {
      titulo: 'इस सर्वर पर अपना कोई डेटाबेस नहीं है',
      texto: 'अपने प्रोजेक्ट के लिए डेटाबेस बनाएँ या कोई मौजूदा डंप इम्पोर्ट करें।',
      accion: 'डेटाबेस बनाएँ',
    },
    iaNube: {
      titulo: 'अभी कोई AI प्रदाता नहीं',
      texto:
        'प्रदाता (OpenAI, Anthropic, OpenRouter और अन्य) आपके एजेंट्स को क्लाउड मॉडल उपयोग करने देता है। कुंजी इस कंप्यूटर पर एन्क्रिप्ट करके रखी जाती है।',
      accion: 'प्रदाता जोड़ें',
    },
    iaSinModelos: {
      titulo: 'अभी कोई लोकल मॉडल नहीं',
      texto: 'ऑफ़लाइन उपयोग के लिए नीचे की सूची से कोई मॉडल डाउनलोड करें।',
      accion: '',
    },
    versiones: {
      titulo: 'दिखाने के लिए कोई संस्करण नहीं',
      texto: 'सूची आधिकारिक कैटलॉग से डाउनलोड होती है। अपना कनेक्शन जाँचें और सूची रीफ़्रेश करें।',
      accion: 'सूची रीफ़्रेश करें',
    },
    buscar: {
      titulo: 'कोई मिलान नहीं',
      texto:
        'फ़ोल्डर में कुछ भी आपकी खोज से मेल नहीं खाता। दूसरे शब्द आज़माएँ, “अक्षर-भेद मिलाएँ” का चयन हटाएँ या फ़ाइल फ़िल्टर देखें।',
      accion: '',
    },
  },
  asistenteInicio: {
    titulo: 'स्वागत टूर',
    saltar: 'छोड़ें',
    terminar: 'शुरू करें',
    cerrar: 'टूर बंद करें',
    reabrir: 'बाहर निकलने के लिए Esc दबाएँ। आप इसे सेटिंग्स › दिखावट से फिर देख सकते हैं।',
    ir: (destino) => `${destino} पर जाएँ`,
    pasos: {
      bienvenida: {
        titulo: 'WolfCore Dev में आपका स्वागत है',
        texto:
          'आपका लोकल डेवलपमेंट परिवेश एक ही विंडो में: सेवाएँ, HTTPS वाली .test साइटें, डेटाबेस, मेल और टूल। इस टूर में एक मिनट लगता है और यह आपके कंप्यूटर पर कुछ नहीं बदलता।',
      },
      servicios: {
        titulo: 'सेवाएँ',
        texto:
          'यहाँ एक स्विच से Nginx, PHP और डेटाबेस चालू करें। यदि वे अभी इंस्टॉल नहीं हैं, तो संस्करण टैब उन्हें सत्यापित चेकसम के साथ डाउनलोड करता है।',
      },
      proyectos: {
        titulo: 'प्रोजेक्ट्स',
        texto:
          'नया प्रोजेक्ट बनाएँ या कोई फ़ोल्डर या रिपॉज़िटरी इम्पोर्ट करें। हर साइट को HTTPS के साथ अपना .test पता मिलता है।',
      },
      bases: {
        titulo: 'डेटाबेस',
        texto: 'ऐप छोड़े बिना डेटाबेस बनाएँ, डंप इम्पोर्ट और एक्सपोर्ट करें, और बैकअप लें व बहाल करें।',
      },
      herramientas: {
        titulo: 'टूल और Ctrl+K',
        texto:
          'एडिटर, खोज, तुलना, पासवर्ड, छवियाँ और बहुत कुछ, अनुभाग के अनुसार समूहबद्ध। किसी भी स्क्रीन पर अपनी ज़रूरत तक पहुँचने के लिए Ctrl+K दबाएँ।',
      },
      doctor: {
        titulo: 'Doctor',
        texto:
          'यह पोर्ट, होस्ट, प्रमाणपत्र और संस्करण जाँचता है और सुझाता है कि जो विफल हो उसे कैसे ठीक करें। जब कुछ जवाब न दे तब इसे खोलें।',
      },
      listo: {
        titulo: 'सब तैयार है',
        texto:
          'कोई सेवा चालू करके या अपना पहला प्रोजेक्ट बनाकर शुरुआत करें। आप इस टूर को सेटिंग्स › दिखावट से फिर देख सकते हैं।',
      },
    },
  },
  perfiles: {
    asistente: {
      versiones: { sustituida: (v) => `यह अब कैटलॉग में नहीं है: इसके बदले ${v} इंस्टॉल किया जाएगा।` },
      resultado: { sustituida: (v) => `प्रोफ़ाइल के संस्करण के बदले ${v} इंस्टॉल किया गया।` },
    },
    motivos: {
      version_sustituida:
        'वह संस्करण अब कैटलॉग में नहीं है: उसी माइनर संस्करण (उदाहरण के लिए 8.3) का सबसे नया संस्करण इंस्टॉल किया गया।',
    },
  },
  consultasLentas: {
    boton: 'धीमी क्वेरी',
    titulo: (motor) => `${motor} पर धीमी क्वेरी`,
    descripcion: 'वे क्वेरी जो आपके चुने समय से अधिक लेती हैं, सबसे धीमी से सबसे तेज़ तक।',
    cargando: 'धीमी क्वेरी लोड हो रही हैं…',
    estadoTitulo: 'लॉग की स्थिति',
    estadoActivo: (s) => `लॉगिंग चालू है: ${s} s से अधिक की क्वेरी दर्ज होती हैं।`,
    estadoApagado: 'लॉगिंग बंद है।',
    noGestionada:
      'WolfCore Dev इस सर्वर को प्रबंधित नहीं करता (उदाहरण के लिए, जिसे किसी अन्य प्रोग्राम ने शुरू किया हो): आप इसे यहाँ केवल देख सकते हैं, बदल नहीं सकते।',
    umbral: 'इनसे अधिक की क्वेरी दर्ज करें (सेकंड)',
    activar: 'लॉगिंग चालू करें',
    aplicarUmbral: 'समय बदलें',
    desactivar: 'लॉगिंग बंद करें',
    actualizar: 'लॉग फिर से पढ़ें',
    confirmarTitulo: 'धीमी क्वेरी लॉगिंग बदलें',
    confirmarActivar: (motor, s) =>
      `पूरे ${motor} सर्वर के लिए लॉगिंग चालू की जाएगी (${s} s से अधिक की क्वेरी) और उसके कॉन्फ़िगरेशन में सहेजी जाएगी। इसका असर उसके सभी डेटाबेस पर पड़ता है।`,
    confirmarDesactivar: (motor) =>
      `पूरे ${motor} सर्वर के लिए लॉगिंग बंद की जाएगी और उसके कॉन्फ़िगरेशन में सहेजी जाएगी। जो पहले दर्ज हो चुका है, वह रखा जाता है।`,
    confirmarBoton: 'बदलाव की पुष्टि करें',
    cancelar: 'रद्द करें',
    activado: 'धीमी क्वेरी लॉगिंग चालू की गई',
    desactivado: 'धीमी क्वेरी लॉगिंग बंद की गई',
    privacidad:
      'SQL उसके मानों को “?” से बदलकर दिखाया जाता है, क्योंकि उसमें ग्राहकों का वास्तविक डेटा हो सकता है। इसमें से कुछ भी इस कंप्यूटर से बाहर नहीं जाता और ऐप के लॉग में नहीं लिखा जाता।',
    columnas: {
      duracion: 'अवधि',
      filas: 'जाँची गई पंक्तियाँ',
      base: 'डेटाबेस',
      fecha: 'तिथि',
      sql: 'क्वेरी',
      acciones: 'क्रियाएँ',
    },
    sinBase: 'किसी से संबद्ध नहीं',
    verLiteral: 'मूल पाठ दिखाएँ',
    ocultarLiteral: 'मूल पाठ छिपाएँ',
    literalAviso: 'SQL जैसी है वैसी, अपने मानों के साथ',
    sqlOculto: 'SQL छिपी है',
    sqlOcultoAyuda:
      'वास्तविक डेटा को जोखिम में डाले बिना यह क्वेरी नहीं दिखाई जा सकती: इस सर्वर पर वास्तविक डेटा वाले डेटाबेस हैं या क्वेरी को सुरक्षित रूप से किसी डेटाबेस से नहीं जोड़ा जा सकता।',
    copiar: 'कॉपी करें',
    copiado: 'क्वेरी कॉपी की गई',
    truncado: (n) => `लॉग के अंत (अंतिम 5 MB) से अधिकतम ${n} सबसे धीमी क्वेरी दिखाई गई हैं।`,
    vacioTitulo: 'अभी कोई धीमी क्वेरी दर्ज नहीं हुई',
    vacioTextoApagado:
      'लॉगिंग चालू करें और अपनी साइटें उपयोग करें: चुने गए समय से अधिक लेने वाली क्वेरी यहाँ दिखेंगी।',
    vacioTextoActivo:
      'अब तक कोई क्वेरी चुने गए समय से अधिक नहीं लगी। अपनी साइटें उपयोग करें और लॉग फिर से पढ़ें।',
  },
  esquemaBd: {
    boton: 'स्कीमा देखें',
    titulo: (base) => `${base} का स्कीमा`,
    descripcion: 'केवल पढ़ने के लिए: टेबल, कॉलम, कुंजियाँ और संबंध। आपकी टेबलों का कोई डेटा नहीं पढ़ा जाता।',
    cargando: 'स्कीमा पढ़ा जा रहा है…',
    error: 'डेटाबेस का स्कीमा पढ़ा नहीं जा सका।',
    reintentar: 'फिर से प्रयास करें',
    buscar: 'कोई टेबल खोजें',
    tablas: (n) => plural(n, 'टेबल', 'टेबल'),
    vista: 'व्यू',
    truncado: (n) => `सूची ${n} टेबल तक काट दी गई: डेटाबेस में और हैं।`,
    sinResultados: 'कोई टेबल खोज से मेल नहीं खाती।',
    elegir: 'उसके कॉलम, कुंजियाँ और संबंध देखने के लिए सूची से कोई टेबल चुनें।',
    columnas: 'कॉलम',
    indices: 'इंडेक्स',
    sinIndices: 'इस टेबल में कोई इंडेक्स नहीं है।',
    relaciones: 'संबंध',
    sinRelaciones: 'इस टेबल का दूसरों से कोई संबंध नहीं है।',
    salientes: 'संदर्भित करता है',
    entrantes: 'इनके द्वारा संदर्भित',
    alBorrar: 'हटाने पर:',
    alActualizar: 'अपडेट पर:',
    irA: (tabla) => `टेबल ${tabla} पर जाएँ`,
    col: { nombre: 'कॉलम', tipo: 'प्रकार', nulo: 'NULL संभव', defecto: 'डिफ़ॉल्ट', clave: 'कुंजी' },
    si: 'हाँ',
    no: 'नहीं',
    pk: 'PK',
    unico: 'अद्वितीय',
    vacioTitulo: 'इस डेटाबेस में कोई टेबल नहीं है',
    vacioTexto: 'जब आप टेबल बनाएँगे (उदाहरण के लिए, अपने प्रोजेक्ट के माइग्रेशन से), वे यहाँ दिखेंगी।',
  },
};
